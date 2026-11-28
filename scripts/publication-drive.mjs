import { createHash } from 'node:crypto';
import { findCrossrefPublication, normalizedTitle } from './publication-sources.mjs';

const driveEndpoint = 'https://www.googleapis.com/drive/v3/files';
const maxPdfBytes = 25 * 1024 * 1024;

async function driveRequest(path, params, accessToken) {
  const url = new URL(driveEndpoint + path);
  url.search = new URLSearchParams(params);
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + accessToken },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error('Google Drive returned HTTP ' + response.status);
  return response;
}

async function listPdfs(folderId, accessToken) {
  if (!/^[A-Za-z0-9_-]+$/.test(folderId)) throw new Error('Invalid Google Drive folder ID');
  const folder = await driveRequest('/' + folderId, { fields: 'mimeType', supportsAllDrives: 'true' }, accessToken);
  if ((await folder.json()).mimeType !== 'application/vnd.google-apps.folder') {
    throw new Error('The Google Drive ID does not identify a folder');
  }

  const files = [];
  let pageToken;
  do {
    const response = await driveRequest('', {
      q: "'" + folderId + "' in parents and trashed = false and mimeType = 'application/pdf'",
      fields: 'nextPageToken,files(id,size)',
      pageSize: '100',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      ...(pageToken && { pageToken }),
    }, accessToken);
    const page = await response.json();
    files.push(...page.files);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return files.sort((a, b) => a.id.localeCompare(b.id));
}

async function readPdfCitation(bytes) {
  const { getDocument, VerbosityLevel } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: VerbosityLevel.ERRORS,
  });
  try {
    const pdf = await task.promise;
    const { info, metadata } = await pdf.getMetadata();
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str || '').join(' ');
    const identifiers = [metadata?.get('prism:doi'), metadata?.get('dc:identifier'), text]
      .flat().filter(value => typeof value === 'string').join(' ');
    const dois = [...new Set(Array.from(identifiers.matchAll(/\b10\.\d{4,9}\/[^\s<>"']+/gi), match =>
      trimDoi(match[0]).toLowerCase(),
    ))];
    return { text, title: info.Title, dois };
  } finally {
    await task.destroy();
  }
}

// Removes sentence punctuation and the closing brackets of the surrounding text.
// A closing bracket stays when the DOI itself opens it, as in 10.1016/s0140-6736(20)30183-5.
function trimDoi(value) {
  const openers = { ')': '(', ']': '[' };
  let doi = value;
  while (doi) {
    const last = doi.at(-1);
    const unmatched = openers[last] && doi.split(last).length > doi.split(openers[last]).length;
    if (!unmatched && !'.,;'.includes(last)) break;
    doi = doi.slice(0, -1);
  }
  return doi;
}

function matchesCatalogCitation(paper, titleMatches, pageText) {
  if (!paper.kciUrl || paper.doi || !titleMatches(paper.title)) return false;

  const location = [paper.volume, paper.issue, paper.pages].map(normalizedTitle);
  if (location.some(part => !/^\d+$/.test(part))) return false;
  const coordinate = location.join('');
  if (!pageText.includes(paper.year + coordinate) && !pageText.includes(coordinate + paper.year)) return false;

  const authors = paper.authors.split(',').map(normalizedTitle);
  return authors.every(author => author.length >= 2 && pageText.includes(author));
}

async function resolvePdfCitation({ text, title, dois }, catalog) {
  if (!dois.length) return { reason: 'drive-no-doi' };
  if (dois.length > 8) return { reason: 'drive-ambiguous-doi' };

  const titleInMetadata = normalizedTitle(title);
  const titleInText = normalizedTitle(text);
  const titleMatches = candidateTitle => {
    const key = normalizedTitle(candidateTitle?.replace(/<\/?[a-z][^>]*>/gi, ''));
    return Boolean(key && (key === titleInMetadata || titleInText.includes(key)));
  };
  const results = await Promise.allSettled(dois.map(findCrossrefPublication));
  const matches = results.flatMap(result => {
    if (result.status !== 'fulfilled' || !titleMatches(result.value?.paper.title)) return [];
    return [result.value];
  });
  if (matches.length > 1) return { reason: 'drive-ambiguous-doi' };
  if (results.some(result => result.status === 'rejected')) return { reason: 'drive-doi-lookup-failed' };
  if (matches.length === 1) return { record: matches[0] };

  // Some approved KCI records have no DOI. Reuse their verified citation only
  // when the PDF also confirms the author list and publication coordinates.
  const approved = catalog.filter(paper => matchesCatalogCitation(paper, titleMatches, titleInText));
  if (approved.length > 1) return { reason: 'drive-ambiguous-citation' };
  if (approved.length === 1) return { record: { paper: approved[0], evidence: 'approved-kci-citation' } };
  return { reason: 'drive-citation-unconfirmed' };
}

export async function loadDrivePublications({ folderId, accessToken, catalog = [] }) {
  if (!folderId || !accessToken) throw new Error('Google Drive folder ID or access token is missing');

  const files = await listPdfs(folderId, accessToken);
  const records = [];
  const review = [];
  const contentsSeen = new Set();
  for (const file of files) {
    const fileRef = createHash('sha256').update(file.id).digest('hex').slice(0, 16);
    if (Number(file.size) > maxPdfBytes) {
      review.push({ fileRef, reason: 'drive-pdf-too-large' });
      continue;
    }

    let bytes;
    try {
      const response = await driveRequest('/' + encodeURIComponent(file.id), { alt: 'media', supportsAllDrives: 'true' }, accessToken);
      bytes = await response.arrayBuffer();
    } catch {
      review.push({ fileRef, reason: 'drive-download-failed' });
      continue;
    }
    if (bytes.byteLength > maxPdfBytes) {
      review.push({ fileRef, reason: 'drive-pdf-too-large' });
      continue;
    }

    const fingerprint = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    if (contentsSeen.has(fingerprint)) continue;
    contentsSeen.add(fingerprint);

    let citation;
    try {
      citation = await readPdfCitation(bytes);
    } catch {
      review.push({ fileRef, reason: 'drive-unreadable-pdf' });
      continue;
    }
    const result = await resolvePdfCitation(citation, catalog);
    if (result.record) {
      records.push({ ...result.record, fileRef });
    } else {
      review.push({ fileRef, reason: result.reason });
    }
  }
  return { records, review, files: files.length };
}
