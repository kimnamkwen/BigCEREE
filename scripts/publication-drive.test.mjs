import assert from 'node:assert/strict';
import test from 'node:test';
import { loadDrivePublications } from './publication-drive.mjs';
import { reconcileCandidates } from './publications.mjs';

function makePdf(text = '') {
  const body = text ? 'BT /F1 12 Tf 50 720 Td (' + text + ') Tj ET' : 'q Q';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    '<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = ['0000000000 65535 f '];
  for (const [index, content] of objects.entries()) {
    offsets.push(String(pdf.length).padStart(10, '0') + ' 00000 n ');
    pdf += (index + 1) + ' 0 obj\n' + content + '\nendobj\n';
  }
  const xref = pdf.length;
  pdf += 'xref\n0 ' + offsets.length + '\n' + offsets.join('\n') + '\n';
  pdf += 'trailer\n<< /Size ' + offsets.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(pdf);
}

function crossrefRecord(doi, title, year = 2010, orcid = '0000-0001-6969-1231') {
  return {
    DOI: doi, title: [title], type: 'journal-article', 'container-title': ['Example Journal'],
    author: [{ given: 'Namkwen', family: 'Kim', ORCID: orcid }], published: { 'date-parts': [[year]] },
  };
}

test('Drive PDF candidates merge by DOI, retain review reasons and respect the publication year', async t => {
  const article = makePdf('An example publication. DOI: 10.1234/example. Prior work DOI: 10.1234/reference');
  const documents = new Map([
    ['article', article],
    ['duplicate', article],
    ['old', makePdf('An older publication. DOI: 10.1234/old')],
    ['scanned', makePdf()],
    ['different-author', makePdf('Another publication. DOI: 10.1234/other-author')],
    ['invalid', Buffer.from('not a PDF')],
  ]);
  const crossref = new Map([
    ['10.1234/example', crossrefRecord('10.1234/example', 'An example publication')],
    ['10.1234/reference', crossrefRecord('10.1234/reference', 'The cited work')],
    ['10.1234/old', crossrefRecord('10.1234/old', 'An older publication', 2009)],
    ['10.1234/other-author', crossrefRecord('10.1234/other-author', 'Another publication', 2015, '0000-0000-0000-0000')],
  ]);
  const driveRequests = [];
  const lookups = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.hostname === 'api.crossref.org') {
      assert.equal(options.headers.Authorization, undefined);
      const doi = url.pathname.slice('/works/'.length);
      lookups.push(doi);
      return Response.json({ message: crossref.get(doi) });
    }
    assert.equal(url.hostname, 'www.googleapis.com');
    assert.equal(options.headers.Authorization, 'Bearer temporary-token');
    driveRequests.push(url.pathname);
    if (url.pathname.endsWith('/example-folder')) {
      return Response.json({ mimeType: 'application/vnd.google-apps.folder' });
    }
    if (url.pathname.endsWith('/files')) {
      assert.match(url.searchParams.get('q'), /'example-folder' in parents/);
      const entries = [...documents.keys()].map(id => ({ id, size: String(documents.get(id).length) }));
      return url.searchParams.has('pageToken')
        ? Response.json({ files: entries.slice(3) })
        : Response.json({ files: entries.slice(0, 3), nextPageToken: 'second-page' });
    }
    return new Response(documents.get(url.pathname.split('/').at(-1)));
  });

  const result = await loadDrivePublications({ folderId: 'example-folder', accessToken: 'temporary-token' });
  assert.equal(driveRequests.filter(path => path.endsWith('/files')).length, 2);
  assert.equal(lookups.filter(doi => doi === '10.1234/example').length, 1);
  assert.equal(result.files, 6);
  const report = reconcileCandidates([], [
    { name: 'PubMed', records: [{ paper: { ...result.records[0].paper, pmid: '123' }, evidence: 'orcid' }] },
    { name: 'Google Drive', ...result },
  ]);
  assert.equal(report.additions.length, 1);
  assert.equal(report.additions[0].paper.doi, '10.1234/example');
  assert.deepEqual(report.additions[0].observed.map(entry => entry.source), ['PubMed', 'Google Drive']);
  assert.match(report.additions[0].observed[1].fileRef, /^[a-f0-9]{16}$/);
  assert.equal(report.excludedByYear, 1);
  assert.deepEqual(report.review.map(item => item.reason).sort(),
    ['author-needs-verification', 'drive-no-doi', 'drive-unreadable-pdf']);
  assert.doesNotMatch(JSON.stringify(report), /example-folder|temporary-token|The cited work/);
});

test('missing Drive permission leaves other source results available', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 403 }));
  await assert.rejects(
    loadDrivePublications({ folderId: 'example-folder', accessToken: 'temporary-token' }),
    /Google Drive returned HTTP 403/,
  );
  const result = reconcileCandidates([], [
    { name: 'Google Drive', error: 'Google Drive returned HTTP 403' },
    { name: 'Crossref', records: [{ paper: {
      doi: '10.1234/available', title: 'An available publication', journal: 'Example Journal', authors: 'Namkwen Kim', year: 2010,
    }, evidence: 'orcid' }] },
  ]);
  assert.equal(result.additions.length, 1);
  assert.equal(result.sources[0].error, 'Google Drive returned HTTP 403');
});

test('DOI extraction drops surrounding brackets and keeps parentheses that belong to the DOI', async t => {
  const cases = [
    ['(doi: 10.1234/round)', '10.1234/round'],
    ['[https://doi.org/10.1234/square].', '10.1234/square'],
    ['(see [doi 10.1234/nested]);', '10.1234/nested'],
    ['10.1234/s0140-6736(20)30183-5', '10.1234/s0140-6736(20)30183-5'],
    ['(doi: 10.1234/suffix(a))', '10.1234/suffix(a)'],
  ];
  const lookups = [];
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.hostname === 'api.crossref.org') {
      lookups.push(decodeURIComponent(url.pathname.slice('/works/'.length)));
      return new Response(null, { status: 404 });
    }
    if (url.pathname.endsWith('/example-folder')) return Response.json({ mimeType: 'application/vnd.google-apps.folder' });
    if (url.pathname.endsWith('/files')) return Response.json({ files: cases.map((_, index) => ({ id: 'file-' + index })) });
    return new Response(makePdf(cases[Number(url.pathname.split('-').at(-1))][0]));
  });

  await loadDrivePublications({ folderId: 'example-folder', accessToken: 'temporary-token' });

  assert.deepEqual(lookups, cases.map(([, doi]) => doi));
});

test('a full approved KCI citation identifies a duplicate even when Crossref has no DOI record', async t => {
  const approved = {
    title: 'A KCI case report',
    authors: 'Jane Kim, Alex Lee',
    journal: 'Example Journal',
    year: 2026,
    volume: '40',
    issue: '1',
    pages: '78–84',
    kciUrl: 'https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART000001234',
  };
  const firstPage = approved.title + '. Jane Kim and Alex Lee. 40.1:78-84, 2026. DOI: 10.1234/kci';
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.hostname === 'api.crossref.org') return new Response(null, { status: 404 });
    if (url.pathname.endsWith('/example-folder')) return Response.json({ mimeType: 'application/vnd.google-apps.folder' });
    if (url.pathname.endsWith('/files')) return Response.json({ files: [{ id: 'complete' }, { id: 'title-only' }] });
    const text = url.pathname.endsWith('/complete') ? firstPage : approved.title + '. DOI: 10.1234/other';
    return new Response(makePdf(text));
  });

  const catalog = [approved];
  const source = await loadDrivePublications({ folderId: 'example-folder', accessToken: 'temporary-token', catalog });
  assert.deepEqual(source.records.map(({ paper, evidence }) => ({ paper, evidence })),
    [{ paper: approved, evidence: 'approved-kci-citation' }]);
  const report = reconcileCandidates(catalog, [{ name: 'Google Drive', ...source }]);
  assert.equal(report.additions.length, 0);
  assert.equal(report.changes.length, 0);
  assert.deepEqual(report.review.map(item => item.reason), ['drive-citation-unconfirmed']);
});
