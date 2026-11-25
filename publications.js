const professorSearchNames = '김남권 Namkwen Kim Nam-Kwen Kim';

function publicationUrl({ doi, pmid, kciUrl, url }) {
  if (/^10\.\d{4,}\/[\S]+$/.test(doi || '')) return `https://doi.org/${encodeURI(doi).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
  if (/^\d+$/.test(pmid || '')) return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  return kciUrl || url;
}

function publicationCitation(paper) {
  const volume = paper.issue ? `${paper.volume || ''}(${paper.issue})` : paper.volume;
  const location = [volume, paper.pages].filter(Boolean).join(', ');
  return [paper.journal, location].filter(Boolean).join(' · ');
}

function renderPublications(list, papers) {
  const content = document.createDocumentFragment();
  let year;
  let entries;

  for (const paper of papers) {
    if (year !== paper.year) {
      year = paper.year;
      const heading = document.createElement('h4');
      heading.className = 'publication-year';
      heading.textContent = year;
      entries = document.createElement('ul');
      entries.className = 'publication-list';
      entries.setAttribute('role', 'list');
      content.append(heading, entries);
    }

    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'publication-title';
    link.href = publicationUrl(paper);
    link.textContent = paper.title;
    item.append(link);

    if (paper.authors) {
      const authors = document.createElement('div');
      authors.className = 'publication-authors';
      authors.textContent = paper.authors;
      item.append(authors);
    }

    const citation = document.createElement('div');
    citation.className = 'publication-citation';
    const details = document.createElement('span');
    details.textContent = publicationCitation(paper);
    citation.append(details);

    for (const [label, url] of [
      ['PubMed', paper.pmid && `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`],
      ['KCI', paper.kciUrl],
    ]) {
      if (!url || url === link.href) continue;
      const source = document.createElement('a');
      source.href = url;
      source.textContent = label;
      source.setAttribute('aria-label', `${paper.title} — ${label}`);
      citation.append(source);
    }
    item.append(citation);
    entries.append(item);
  }
  list.replaceChildren(content);
}

function publicationSearchText(text) {
  return text.normalize('NFKC').toLocaleLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function showPublications(section) {
  const search = section.querySelector('input[name="query"]');
  const year = section.querySelector('select[name="year"]');
  const feedback = section.querySelector('.publication-feedback');
  const list = section.querySelector('#publications-list');
  const papers = publicationCatalog
    .filter(paper => paper.year >= 2010)
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  const indexedPapers = papers.map(paper => ({
    paper,
    text: publicationSearchText([paper.title, paper.authors, paper.journal, professorSearchNames].filter(Boolean).join(' ')),
  }));

  for (const value of new Set(papers.map(paper => paper.year))) {
    year.add(new Option(String(value), String(value)));
  }

  function applyFilters() {
    const terms = publicationSearchText(search.value).split(' ').filter(Boolean);
    const matches = indexedPapers.filter(({ paper, text }) =>
      (!year.value || String(paper.year) === year.value) && terms.every(term => text.includes(term))
    ).map(({ paper }) => paper);

    renderPublications(list, matches);
    if (!matches.length) {
      feedback.textContent = '검색 조건에 맞는 논문이 없습니다.';
    } else {
      feedback.textContent = terms.length || year.value ? `${matches.length}편` : '';
    }
  }

  search.addEventListener('input', applyFilters);
  year.addEventListener('change', applyFilters);
  applyFilters();

}
