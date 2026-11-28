import { pathToFileURL } from 'node:url';
import publicationCatalog from '../publications-data.js';
import { loadCrossrefPublications, loadPubMedPublications } from './publication-sources.mjs';

const doiPattern = /^10\.\d{4,9}\/\S+$/i;
const pmidPattern = /^\d+$/;
const kciPattern = /^https:\/\/(?:www\.)?kci\.go\.kr\//i;
const citationFields = ['title', 'authors', 'journal', 'year', 'volume', 'issue', 'pages', 'doi', 'pmid', 'kciUrl', 'url'];
const revisionFields = ['title', 'journal', 'year', 'volume', 'issue', 'pages', 'doi', 'pmid', 'kciUrl'];

function identifiers(paper) {
  const kciUrl = paper.kciUrl || paper.url || '';
  return {
    doi: typeof paper.doi === 'string' ? paper.doi.toLowerCase() : undefined,
    pmid: paper.pmid,
    kci: kciPattern.test(kciUrl) ? kciUrl.match(/\bART\d+\b/i)?.[0].toUpperCase() : undefined,
  };
}

function matchingIdentifiers(left, right) {
  return Object.keys(left).some(type => left[type] && left[type] === right[type]);
}

function conflictingIdentifiers(left, right) {
  return Object.keys(left).some(type => left[type] && right[type] && left[type] !== right[type]);
}

function normalizedTitle(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function isPublicUrl(value) {
  return typeof value === 'string' && URL.canParse(value) && new URL(value).protocol === 'https:';
}

function citationIssues(paper) {
  const issues = ['title', 'authors', 'journal'].filter(key => typeof paper[key] !== 'string' || !paper[key].trim());
  if (!Number.isInteger(paper.year) || paper.year < 1900) issues.push('year');
  if (paper.doi !== undefined && (typeof paper.doi !== 'string' || !doiPattern.test(paper.doi))) issues.push('doi');
  if (paper.pmid !== undefined && (typeof paper.pmid !== 'string' || !pmidPattern.test(paper.pmid))) issues.push('pmid');
  if (paper.url !== undefined && !isPublicUrl(paper.url)) issues.push('url');
  if (paper.kciUrl !== undefined && (!isPublicUrl(paper.kciUrl) || !kciPattern.test(paper.kciUrl) || !identifiers(paper).kci)) {
    issues.push('kciUrl');
  }
  if (!paper.doi && !paper.pmid && !paper.kciUrl && !paper.url) issues.push('public identifier or URL');
  return issues;
}

export function validateCatalog(catalog) {
  if (!Array.isArray(catalog) || !catalog.length) throw new Error('The publication catalog is empty.');
  const knownIds = new Map();
  for (const paper of catalog) {
    if (!paper || typeof paper !== 'object') throw new Error('Invalid publication record.');
    const issues = citationIssues(paper);
    if (issues.length) throw new Error(`${paper.title || '(untitled)'}: invalid ${issues.join(', ')}`);

    for (const [type, id] of Object.entries(identifiers(paper))) {
      if (!id) continue;
      const key = `${type}:${id}`;
      if (knownIds.has(key)) throw new Error(`Duplicate ${key}: ${knownIds.get(key)} / ${paper.title}`);
      knownIds.set(key, paper.title);
    }
  }
  return catalog.length;
}

export function reconcileCandidates(catalog, sources) {
  const candidates = [];
  for (const { name, records = [] } of sources) {
    for (const { paper, evidence } of records) {
      const citation = { ...paper, title: paper.title?.replace(/<\/?[a-z][^>]*>/gi, '').trim() };
      const observed = { source: name, evidence };
      const ids = identifiers(citation);
      const matches = candidates.filter(entry => matchingIdentifiers(ids, identifiers(entry.paper)));
      if (matches.length === 1 && !conflictingIdentifiers(ids, identifiers(matches[0].paper))) {
        const match = matches[0];
        for (const field of citationFields) match.paper[field] ||= citation[field];
        match.observed.push(observed);
      } else {
        candidates.push({ paper: citation, observed: [observed] });
      }
    }
  }

  const additions = [];
  const changes = [];
  const review = [];
  for (const candidate of candidates) {
    const { paper, observed } = candidate;
    const ids = identifiers(paper);
    const matches = catalog.filter(current => matchingIdentifiers(ids, identifiers(current)));
    const candidateConflicts = candidates.filter(other => other !== candidate && matchingIdentifiers(ids, identifiers(other.paper)));
    if (matches.length > 1 || candidateConflicts.length || matches.some(current => conflictingIdentifiers(ids, identifiers(current)))) {
      review.push({ ...candidate, reason: 'identifier-conflict', current: matches, otherCandidates: candidateConflicts.map(entry => entry.paper) });
      continue;
    }

    if (matches.length === 1) {
      const [current] = matches;
      const fields = revisionFields.filter(field => paper[field] && normalizedTitle(paper[field]) !== normalizedTitle(current[field]));
      if (fields.length) changes.push({ ...candidate, current, fields });
      continue;
    }

    const title = normalizedTitle(paper.title);
    const similarRecords = [...catalog, ...candidates.filter(other => other !== candidate).map(entry => entry.paper)]
      .filter(record => title && normalizedTitle(record.title) === title);
    const issues = citationIssues(paper);
    if (similarRecords.length) {
      review.push({ ...candidate, reason: 'title-match-without-shared-identifier', similarRecords });
    } else if (issues.length) {
      review.push({ ...candidate, reason: 'incomplete-metadata', fields: issues });
    } else if (observed.every(item => item.evidence === 'name-only')) {
      review.push({ ...candidate, reason: 'author-needs-verification' });
    } else {
      additions.push(candidate);
    }
  }

  return {
    catalogCount: catalog.length,
    sources: sources.map(({ name, records, error }) => error ? { name, error } : { name, count: records.length }),
    additions,
    changes,
    review,
  };
}

async function run() {
  const [command] = process.argv.slice(2);
  const count = validateCatalog(publicationCatalog);
  if (command === 'check') {
    console.log(`Publication catalog validated: ${count} records.`);
    return;
  }
  if (command !== 'collect') throw new Error('Usage: node scripts/publications.mjs check|collect');

  const sources = [
    { name: 'PubMed (Europe PMC)', load: loadPubMedPublications },
    { name: 'Crossref', load: loadCrossrefPublications },
  ];
  const results = await Promise.allSettled(sources.map(source => source.load()));
  const report = reconcileCandidates(publicationCatalog, results.map((result, index) => {
    const { name } = sources[index];
    if (result.status === 'fulfilled' && result.value.length) return { name, records: result.value };
    return { name, error: result.status === 'rejected' ? result.reason.message : 'No records returned' };
  }));

  console.log(JSON.stringify(report, null, 2));
  console.error(`New: ${report.additions.length}; changed: ${report.changes.length}; needs review: ${report.review.length}.`);
  for (const source of report.sources) {
    if (source.error) console.error(`${source.name}: ${source.error}`);
  }
  if (report.sources.every(source => source.error)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
