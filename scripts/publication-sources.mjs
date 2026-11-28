const professorOrcid = '0000-0001-6969-1231';
const knownAffiliations = /(?:pusan|busan) national university|wonkwang univ(?:ersity)?\b|national institute for korean medicine development/i;

async function requestMetadata(endpoint, params) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams(params);
  const response = await fetch(url, {
    headers: { 'User-Agent': 'BigCEREE publications (+https://github.com/kimnamkwen/BigCEREE)' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function normalizeOrcid(value) {
  return value?.trim().replace(/^https?:\/\/orcid\.org\//i, '');
}

function authorEvidence(authors) {
  let nameEvidence;
  for (const author of authors) {
    if (author.authorId?.type?.toUpperCase() === 'ORCID') {
      if (normalizeOrcid(author.authorId.value) === professorOrcid) return 'orcid';
      continue;
    }
    const given = author.firstName?.toLowerCase().replace(/[\s-]/g, '');
    if (author.lastName?.toLowerCase() !== 'kim' || given !== 'namkwen') continue;
    const affiliations = author.authorAffiliationDetailsList?.authorAffiliation || [];
    if (affiliations.some(({ affiliation }) => knownAffiliations.test(affiliation))) {
      nameEvidence = 'name-and-affiliation';
    } else {
      nameEvidence ||= 'name-only';
    }
  }
  return nameEvidence;
}

export async function loadPubMedPublications() {
  const endpoint = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
  const query = `SRC:MED AND (AUTHORID:${professorOrcid} OR AUTH:"Kim Namkwen" OR AUTH:"Kim Nam-Kwen" OR AUTH:"Kim Nam Kwen")`;
  const records = [];
  let cursorMark = '*';

  while (cursorMark) {
    const page = await requestMetadata(endpoint, { query, cursorMark, format: 'json', resultType: 'core', pageSize: '100' });
    const results = page.resultList.result;
    records.push(...results);
    if (records.length >= page.hitCount) break;
    if (!results.length || !page.nextCursorMark || page.nextCursorMark === cursorMark) {
      throw new Error('Incomplete PubMed results');
    }
    cursorMark = page.nextCursorMark;
  }

  return records.flatMap(record => {
    const publicationTypes = record.pubTypeList?.pubType || [];
    if (!publicationTypes.some(type => type.toLowerCase() === 'journal article')) return [];
    const authors = record.authorList?.author || [];
    const evidence = authorEvidence(authors);
    if (!evidence) return [];

    return [{
      evidence,
      paper: {
        year: Number(record.pubYear),
        title: record.title,
        authors: authors.map(author => author.firstName && author.lastName
          ? `${author.firstName} ${author.lastName}`
          : author.fullName || author.collectiveName).filter(Boolean).join(', ') || record.authorString,
        journal: record.journalInfo?.journal?.title,
        volume: record.journalInfo?.volume,
        issue: record.journalInfo?.issue,
        pages: record.pageInfo,
        doi: record.doi,
        pmid: record.pmid,
      },
    }];
  });
}

export async function loadCrossrefPublications() {
  const endpoint = 'https://api.crossref.org/works';
  const records = [];
  let cursor = '*';

  while (cursor) {
    const { message } = await requestMetadata(endpoint, {
      cursor, rows: '100', filter: `orcid:${professorOrcid},type:journal-article`,
      select: 'DOI,title,author,published,container-title,volume,issue,page,article-number',
    });
    records.push(...message.items);
    if (records.length >= message['total-results']) break;
    if (!message.items.length || !message['next-cursor']) throw new Error('Incomplete Crossref results');
    cursor = message['next-cursor'];
  }

  return records.filter(record => record.author?.some(author => normalizeOrcid(author.ORCID) === professorOrcid))
    .map(record => ({
      evidence: 'orcid',
      paper: {
        year: Number(record.published?.['date-parts']?.[0]?.[0]),
        title: record.title?.[0],
        authors: record.author.map(author => author.name || [author.given, author.family].filter(Boolean).join(' ')).filter(Boolean).join(', '),
        journal: record['container-title']?.[0],
        volume: record.volume,
        issue: record.issue,
        pages: record.page || record['article-number'],
        doi: record.DOI,
      },
    }));
}
