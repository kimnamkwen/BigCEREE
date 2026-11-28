import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPubMedPublications } from './publication-sources.mjs';
import { reconcileCandidates, validateCatalog } from './publications.mjs';

const paper = { title: 'A shared title', authors: 'Author A', journal: 'Journal A', year: 2025 };
const observation = (paper, evidence = 'orcid') => ({ paper, evidence });

test('distinct DOIs are review candidates even when the titles and years match', () => {
  const first = { ...paper, doi: '10.1234/first' };
  const second = { ...paper, doi: '10.1234/second' };
  const report = reconcileCandidates([], [{ name: 'Example source', records: [observation(first), observation(second)] }]);

  assert.equal(report.additions.length, 0);
  assert.deepEqual(report.review.map(item => item.paper.doi), [first.doi, second.doi]);
  assert.ok(report.review.every(item => item.reason === 'title-match-without-shared-identifier'));
});

test('matching DOI enriches known data, while a different PMID on the same DOI needs review', () => {
  const approved = { ...paper, doi: '10.1234/first', pmid: '123' };
  const revised = { ...approved, pages: '1–4' };
  const sources = [{ name: 'Example source', records: [observation(revised)] }];
  const report = reconcileCandidates([approved], sources);

  assert.deepEqual(report.changes.map(item => item.fields), [['pages']]);
  sources[0].records = [observation({ ...revised, pmid: '456' })];
  assert.equal(reconcileCandidates([approved], sources).review[0].reason, 'identifier-conflict');
  assert.throws(() => validateCatalog([approved, { ...approved, doi: '10.1234/FIRST' }]), /Duplicate doi/);
});

test('one unavailable source still leaves candidates from the other source', () => {
  const first = { ...paper, doi: '10.1234/first' };
  const second = { ...paper, title: 'Another title', pmid: '123' };
  const report = reconcileCandidates([], [
    { name: 'Unavailable source', error: 'Timeout' },
    { name: 'Available source', records: [observation(first), observation(second, 'name-only')] },
  ]);

  assert.equal(report.additions.length, 1);
  assert.equal(report.review[0].reason, 'author-needs-verification');
  assert.equal(report.sources[0].error, 'Timeout');
});

test('PubMed candidates distinguish missing affiliation from a conflicting ORCID', async t => {
  const author = { firstName: 'Nam-Kwen', lastName: 'Kim' };
  const response = { hitCount: 3, resultList: { result: [
    { pmid: '111', author: { ...author, authorId: { type: 'ORCID', value: '0000-0001-6969-1231' } } },
    { pmid: '222', author },
    { pmid: '333', author: { ...author, authorId: { type: 'ORCID', value: '0000-0000-0000-0000' } } },
  ].map(record => ({
    pmid: record.pmid,
    title: `Publication ${record.pmid}`,
    pubYear: '2025',
    pubTypeList: { pubType: ['Journal Article'] },
    authorList: { author: [record.author] },
  })) } };
  t.mock.method(globalThis, 'fetch', async () => Response.json(response));

  const results = await loadPubMedPublications();

  assert.deepEqual(results.map(({ paper, evidence }) => [paper.pmid, evidence]),
    [['111', 'orcid'], ['222', 'name-only']]);
});
