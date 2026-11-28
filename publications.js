const professorSearchNames = '김남권 Namkwen Kim Nam-Kwen Kim';
const publicationQueryKeys = ['q', 'year', 'index', 'journal', 'sort', 'limit', 'page'];
const publicationPageSizes = [10, 20, 50];
const publicationIndexNames = ['PubMed', 'KCI'];
const publicationJournalPreviewSize = 5;
const firstPublicationYear = 2010;

function clearPublicationQuery(url) {
  for (const key of publicationQueryKeys) url.searchParams.delete(key);
}

function publicationSearchText(text) {
  return text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function normalizePublicationJournal(name) {
  return name?.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase() || '';
}

function publicationSources(paper) {
  const sources = [];
  if (/^\d+$/.test(paper.pmid || '')) sources.push(['PubMed', `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`]);
  const kciUrl = paper.kciUrl || paper.url;
  if (/^https:\/\/(?:www\.)?kci\.go\.kr\//i.test(kciUrl || '')) sources.push(['KCI', kciUrl]);
  return sources;
}

function publicationUrl({ doi, pmid, kciUrl, url }) {
  if (/^10\.\d{4,}\/\S+$/.test(doi || '')) return `https://doi.org/${encodeURI(doi).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
  if (/^\d+$/.test(pmid || '')) return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  return kciUrl || url;
}

function publicationCitation(paper) {
  const volume = paper.issue ? `${paper.volume || ''}(${paper.issue})` : paper.volume;
  const location = [volume, paper.pages].filter(Boolean).join(', ');
  return [paper.journal, location].filter(Boolean).join(' · ');
}

function preparePublications(catalog) {
  const records = [];
  const years = new Set();
  const indexes = new Set();
  const journals = new Map();
  for (const [order, paper] of catalog.entries()) {
    const knownYear = Number.isInteger(paper.year) && paper.year > 0;
    if (knownYear && paper.year < firstPublicationYear) continue;
    const year = knownYear ? String(paper.year) : 'unknown';
    const sources = publicationSources(paper);
    const paperIndexes = sources.map(([name]) => name);
    const journal = normalizePublicationJournal(paper.journal);
    if (journal) {
      if (!journals.has(journal)) journals.set(journal, { label: paper.journal.trim().replace(/\s+/g, ' '), count: 0 });
      journals.get(journal).count++;
    }
    const authors = publicationSearchText(paper.authors || '');
    const aliases = /김남권|nam ?kwen kim|kim nam ?kwen/.test(authors) ? professorSearchNames : '';
    const text = publicationSearchText([paper.title, paper.authors, paper.journal, paper.doi, aliases].filter(Boolean).join(' '));
    records.push({ paper, year, sources, indexes: paperIndexes, journal, text, order });
    years.add(year);
    for (const index of paperIndexes) indexes.add(index);
  }
  const publishedYears = [...years].filter(year => year !== 'unknown').sort((a, b) => Number(b) - Number(a));
  const currentYear = new Date().getFullYear();
  return {
    records,
    years: publishedYears,
    maxYear: Math.max(currentYear, Number(publishedYears[0] ?? firstPublicationYear)),
    recentYears: `${Math.max(firstPublicationYear, currentYear - 2)}-${currentYear}`,
    hasUnknownYear: years.has('unknown'),
    indexes: publicationIndexNames.filter(index => indexes.has(index)),
    journals: new Map([...journals]
      .sort(([, a], [, b]) => b.count - a.count || a.label.localeCompare(b.label, 'ko'))
      .map(([key, item]) => [key, item.label])),
  };
}

function readPublicationYearRange(value, maxYear) {
  const match = /^(\d{4})-(\d{4})$/.exec(value || '');
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return start >= firstPublicationYear && start <= end && end <= maxYear ? { start, end } : null;
}

function readPublicationState(params, data) {
  const requestedYear = params.get('year');
  const year = requestedYear === 'all' || data.years.includes(requestedYear) || readPublicationYearRange(requestedYear, data.maxYear) ||
    (requestedYear === 'unknown' && data.hasUnknownYear) ? requestedYear : null;
  const selectedIndexes = (params.get('index') || '').split(',');
  const selectedJournals = new Set(params.getAll('journal').map(normalizePublicationJournal));
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('limit'));
  return {
    query: (params.get('q') || '').trim(),
    year,
    indexes: data.indexes.filter(index => selectedIndexes.includes(index)),
    journals: [...data.journals.keys()].filter(journal => selectedJournals.has(journal)),
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
    pageSize: publicationPageSizes.includes(pageSize) ? pageSize : publicationPageSizes[0],
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

function publicationYearLabel(year) {
  if (year === 'all') return '전체';
  return year === 'unknown' ? '발행연도 미상' : year;
}

function publicationYearFilterLabel(year) {
  const [start, end] = year.split('-');
  return year === 'unknown' ? publicationYearLabel(year) : end && start !== end ? `${start}~${end}년` : `${start}년`;
}

function getPublicationView(data, state) {
  const terms = publicationSearchText(state.query).split(' ').filter(Boolean);
  const journalFilter = new Set(state.journals);
  const hasSearch = terms.length || state.indexes.length || journalFilter.size;
  const year = state.year ?? (hasSearch ? 'all' : data.years[0] ?? 'all');
  const range = readPublicationYearRange(year, data.maxYear);
  const yearCounts = new Map();
  const indexCounts = new Map();
  const journalCounts = new Map();
  const resultYearCounts = new Map();
  const results = [];
  let allYearCount = 0;
  let hasResultsWithoutJournals = false;

  for (const publication of data.records) {
    if (!terms.every(term => publication.text.includes(term))) continue;
    const publicationYear = Number(publication.year);
    const yearMatches = range
      ? range.start <= publicationYear && publicationYear <= range.end
      : year === 'all' || publication.year === year;
    const indexMatches = !state.indexes.length || state.indexes.some(index => publication.indexes.includes(index));
    const journalMatches = !journalFilter.size || journalFilter.has(publication.journal);
    if (indexMatches && journalMatches) {
      allYearCount++;
      yearCounts.set(publication.year, (yearCounts.get(publication.year) || 0) + 1);
    }
    if (yearMatches && journalMatches) {
      for (const index of publication.indexes) indexCounts.set(index, (indexCounts.get(index) || 0) + 1);
    }
    if (yearMatches && indexMatches) {
      hasResultsWithoutJournals = true;
      if (publication.journal) journalCounts.set(publication.journal, (journalCounts.get(publication.journal) || 0) + 1);
      if (journalMatches) {
        results.push(publication);
        resultYearCounts.set(publication.year, (resultYearCounts.get(publication.year) || 0) + 1);
      }
    }
  }

  const direction = state.sort === 'oldest' ? 1 : -1;
  results.sort((a, b) => {
    if (a.year === b.year) return a.order - b.order;
    if (a.year === 'unknown') return 1;
    if (b.year === 'unknown') return -1;
    return direction * (Number(a.year) - Number(b.year));
  });

  const totalPages = Math.max(1, Math.ceil(results.length / state.pageSize));
  const page = Math.min(state.page, totalPages);
  const offset = (page - 1) * state.pageSize;
  return {
    year, yearCounts, indexCounts, journalCounts, resultYearCounts, allYearCount, hasResultsWithoutJournals,
    total: results.length, totalPages, page, offset,
    rows: results.slice(offset, offset + state.pageSize),
  };
}

function writePublicationState(state, historyMethod) {
  const url = new URL(window.location.href);
  const values = new Map([
    ['q', state.query.trim()],
    ['year', state.year],
    ['index', state.indexes.join(',')],
    ['sort', state.sort === 'oldest' ? 'oldest' : null],
    ['limit', state.pageSize !== publicationPageSizes[0] ? state.pageSize : null],
    ['page', state.page > 1 ? state.page : null],
  ]);
  for (const [key, value] of values) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  url.searchParams.delete('journal');
  for (const journal of state.journals) url.searchParams.append('journal', journal);
  if (url.href !== window.location.href) window.history[historyMethod](null, '', url);
}

function publicationElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function publicationButton(text, action, value, className) {
  const button = publicationElement('button', className, text);
  button.type = 'button';
  button.dataset.publicationAction = action;
  if (value !== undefined) button.value = value;
  return button;
}

function renderPublications(list, view) {
  const content = document.createDocumentFragment();
  let year;
  let entries;
  for (const publication of view.rows) {
    const { paper, sources } = publication;
    if (year !== publication.year) {
      year = publication.year;
      const heading = publicationElement('h4', 'publication-year');
      heading.append(
        publicationElement('span', '', publicationYearLabel(year)),
        publicationElement('span', 'publication-year-count', `${view.resultYearCounts.get(year)}편`),
      );
      entries = publicationElement('ul', 'publication-list');
      entries.setAttribute('role', 'list');
      content.append(heading, entries);
    }

    const item = publicationElement('li');
    const url = publicationUrl(paper);
    const title = publicationElement(url ? 'a' : 'span', 'publication-title', paper.title);
    if (url) title.href = url;
    item.append(title);
    if (paper.authors) item.append(publicationElement('div', 'publication-authors', paper.authors));

    const citation = publicationElement('div', 'publication-citation');
    citation.append(publicationElement('span', '', publicationCitation(paper)));
    for (const [label, sourceUrl] of sources) {
      const sharesTitleLink = sourceUrl === url;
      const source = publicationElement(sharesTitleLink ? 'span' : 'a', 'publication-index-label', label);
      if (!sharesTitleLink) {
        source.href = sourceUrl;
        source.setAttribute('aria-label', `${paper.title}, ${label}`);
        const arrow = publicationElement('span', 'publication-index-arrow', '→');
        arrow.setAttribute('aria-hidden', 'true');
        source.append(arrow);
      }
      citation.append(source);
    }
    item.append(citation);
    entries.append(item);
  }

  if (!view.total) {
    const empty = publicationElement('div', 'publication-empty');
    const actions = publicationElement('div', 'publication-empty-actions');
    if (view.hasResultsWithoutJournals) {
      actions.append(publicationButton('학술지 선택 해제', 'clear-journals', undefined, 'publication-text-button'));
    }
    actions.append(publicationButton('검색 및 필터 지우기', 'clear', undefined, 'publication-text-button'));
    empty.append(publicationElement('p', '', '조건에 맞는 논문이 없습니다.'), actions);
    content.append(empty);
  }
  list.replaceChildren(content);
}

function createPublicationChecks(container, entries, name) {
  const checks = new Map();
  for (const [value, text] of entries) {
    const row = publicationElement('label', 'publication-facet-checkbox');
    const checkbox = publicationElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = name;
    checkbox.value = value;
    const count = publicationElement('span', 'publication-facet-count');
    row.append(checkbox, publicationElement('span', 'publication-facet-option-label', text), count);
    container.append(row);
    checks.set(value, { row, checkbox, count });
  }
  container.closest('details').hidden = !checks.size;
  return checks;
}

function createPublicationYearForm(maxYear) {
  const form = publicationElement('form', 'publication-year-range');
  form.id = 'publication-year-range';
  form.hidden = true;
  form.setAttribute('aria-label', '발행연도 기간 지정');
  form.innerHTML = `
    <div class="publication-year-range-fields">
      <label><span>시작 연도</span><select name="start-year"></select></label>
      <label><span>종료 연도</span><select name="end-year" aria-describedby="publication-year-range-error"></select></label>
    </div>
    <p id="publication-year-range-error" role="alert"></p>
    <div class="publication-year-range-actions">
      <button type="button" data-publication-action="cancel-range" class="publication-text-button">취소</button>
      <button type="submit" class="publication-year-range-submit">기간 적용</button>
    </div>
  `;
  const start = form.elements.namedItem('start-year');
  const end = form.elements.namedItem('end-year');
  for (let year = maxYear; year >= firstPublicationYear; year--) {
    start.add(new Option(year, year));
    end.add(new Option(year, year));
  }
  return { form, start, end, error: form.querySelector('[role="alert"]') };
}

function createPublicationFilters(data) {
  const panel = publicationElement('section', 'publication-facets');
  panel.setAttribute('aria-label', '발표논문 필터');
  panel.innerHTML = `
    <div class="publication-facet-header">
      <span>필터</span>
      <button type="button" class="publication-text-button" data-publication-action="reset">초기화</button>
    </div>
    <details class="publication-facet-group publication-year-group" open>
      <summary>발행연도</summary>
      <div class="publication-year-options" role="group" aria-label="발행연도"></div>
      <div id="publication-older-years" role="group" aria-label="이전 연도"></div>
      <button type="button" class="publication-older-toggle" data-publication-action="older"
        aria-expanded="false" aria-controls="publication-older-years">이전 연도 더 보기</button>
    </details>
    <details class="publication-facet-group publication-index-group" open>
      <summary>색인 및 등재 정보</summary>
      <div class="publication-index-options" role="group" aria-label="색인 및 등재 정보"></div>
    </details>
    <details class="publication-facet-group publication-journal-group" open>
      <summary>학술지</summary>
      <input type="search" class="publication-journal-search" aria-label="학술지 검색" placeholder="학술지명 검색"
        aria-controls="publication-journal-options">
      <div id="publication-journal-options" role="group" aria-label="학술지"></div>
      <p class="publication-journal-empty" role="status" hidden></p>
      <button type="button" class="publication-older-toggle" data-publication-action="more-journals"
        aria-expanded="false" aria-controls="publication-journal-options">학술지 더 보기</button>
    </details>
    <button type="button" class="publication-mobile-close" data-publication-action="close-mobile">필터 닫기</button>
  `;

  const recent = panel.querySelector('.publication-year-options');
  const older = panel.querySelector('#publication-older-years');
  const years = ['all', data.recentYears, ...data.years, ...(data.hasUnknownYear ? ['unknown'] : [])];
  const yearButtons = new Map();
  for (const [position, year] of years.entries()) {
    const button = publicationButton('', 'year', year, 'publication-year-option');
    const count = publicationElement('span', 'publication-facet-count');
    const label = year === data.recentYears ? '최근 3년' : publicationYearLabel(year);
    button.append(publicationElement('span', '', label), count);
    const isOlder = position > 6 && year !== 'unknown';
    (isOlder ? older : recent).append(button);
    yearButtons.set(year, { button, count, isOlder });
  }

  const indexChecks = createPublicationChecks(panel.querySelector('.publication-index-options'),
    data.indexes.map(index => [index, index]), 'publication-index');
  const journalChecks = createPublicationChecks(panel.querySelector('#publication-journal-options'),
    data.journals, 'publication-journal');
  const olderToggle = panel.querySelector('[data-publication-action="older"]');
  olderToggle.hidden = !older.childElementCount;
  const rangeToggle = publicationButton('기간 지정', 'toggle-range', undefined, 'publication-older-toggle');
  rangeToggle.setAttribute('aria-controls', 'publication-year-range');
  recent.insertBefore(rangeToggle, recent.children[2] ?? null);
  return {
    panel, yearButtons, indexChecks, journalChecks, olderToggle, rangeToggle,
    journalSearch: panel.querySelector('.publication-journal-search'),
    journalEmpty: panel.querySelector('.publication-journal-empty'),
    journalToggle: panel.querySelector('[data-publication-action="more-journals"]'),
    reset: panel.querySelector('[data-publication-action="reset"]'),
  };
}

function renderPublicationFilters(filters, view, state, data, olderExpanded) {
  const recentRange = readPublicationYearRange(data.recentYears, data.maxYear);
  let recentCount = 0;
  for (let year = recentRange.start; year <= recentRange.end; year++) {
    recentCount += view.yearCounts.get(String(year)) || 0;
  }
  for (const [year, item] of filters.yearButtons) {
    const selected = view.year === year;
    item.button.setAttribute('aria-pressed', String(selected));
    item.button.hidden = item.isOlder && !olderExpanded && !selected;
    const count = year === data.recentYears ? recentCount : view.yearCounts.get(year) || 0;
    item.count.textContent = year === 'all' ? view.allYearCount : count;
  }
  for (const [index, item] of filters.indexChecks) {
    const count = view.indexCounts.get(index) || 0;
    item.checkbox.checked = state.indexes.includes(index);
    item.checkbox.disabled = count === 0 && !item.checkbox.checked;
    item.count.textContent = count;
  }
  filters.reset.disabled = view.year === 'all' && !state.indexes.length && !state.journals.length;
  filters.olderToggle.setAttribute('aria-expanded', String(olderExpanded));
  filters.olderToggle.textContent = olderExpanded ? '이전 연도 접기' : '이전 연도 더 보기';
}

function renderPublicationJournals(filters, view, state, expanded) {
  const terms = publicationSearchText(filters.journalSearch.value).split(' ').filter(Boolean);
  let availableCount = 0;
  let matchingNames = 0;
  for (const [journal, item] of filters.journalChecks) {
    const selected = state.journals.includes(journal);
    const count = view.journalCounts.get(journal) || 0;
    if (count > 0) availableCount++;
    const inPreview = availableCount <= publicationJournalPreviewSize;
    const matches = count > 0 && terms.every(term => publicationSearchText(journal).includes(term));
    if (matches) matchingNames++;
    item.row.hidden = !matches || (!terms.length && !expanded && !inPreview && !selected);
    item.checkbox.checked = selected;
    item.count.textContent = count;
  }
  const emptyMessage = view.journalCounts.size
    ? '일치하는 학술지가 없습니다.'
    : '현재 조건에서 선택할 수 있는 학술지가 없습니다.';
  if (filters.journalEmpty.textContent !== emptyMessage) filters.journalEmpty.textContent = emptyMessage;
  filters.journalEmpty.hidden = matchingNames > 0;
  filters.journalToggle.hidden = Boolean(terms.length) || view.journalCounts.size <= publicationJournalPreviewSize;
  filters.journalToggle.setAttribute('aria-expanded', String(expanded));
  filters.journalToggle.textContent = expanded ? '학술지 접기' : '학술지 더 보기';
}

function renderPublicationChips(list, state, journalNames) {
  const chips = state.year && state.year !== 'all'
    ? [['remove-year', '', publicationYearFilterLabel(state.year)]]
    : [];
  for (const index of state.indexes) chips.push(['remove-index', index, index]);
  for (const journal of state.journals) chips.push(['remove-journal', journal, journalNames.get(journal)]);
  list.replaceChildren(...chips.map(([action, value, label]) => {
    const item = publicationElement('li');
    const button = publicationButton(label, action, value, 'publication-chip');
    const remove = publicationElement('span', '', '×');
    remove.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-label', `${label} 필터 해제`);
    button.append(remove);
    item.append(button);
    return item;
  }));
  list.hidden = !chips.length;
}

function renderPublicationPagination(pagination, view) {
  pagination.hidden = view.totalPages <= 1;
  if (pagination.hidden) return;
  pagination.querySelector('.publication-range').textContent =
    `전체 ${view.total}편 중 ${view.offset + 1}–${view.offset + view.rows.length}편`;

  const buttons = pagination.querySelector('.publication-pages');
  const entries = [];
  function pageButton(text, page, label) {
    const button = publicationButton(text, 'page', page, 'publication-page-button');
    button.setAttribute('aria-label', label);
    entries.push(button);
    return button;
  }

  const previous = pageButton('이전', view.page - 1, '이전 페이지');
  previous.disabled = view.page === 1;
  let last = 0;
  const pageNumbers = new Set([1, view.page - 1, view.page, view.page + 1, view.totalPages]);
  for (const page of [...pageNumbers].sort((a, b) => a - b)) {
    if (page < 1 || page > view.totalPages) continue;
    if (last && page - last > 1) entries.push(publicationElement('span', 'publication-page-gap', '…'));
    const button = pageButton(String(page), page, `${page} 페이지`);
    button.classList.add('publication-page-number');
    if (page === view.page) button.setAttribute('aria-current', 'page');
    last = page;
  }
  const next = pageButton('다음', view.page + 1, '다음 페이지');
  next.disabled = view.page === view.totalPages;
  buttons.replaceChildren(...entries);
}

function showPublications(section, sidebar) {
  const feedback = section.querySelector('.publication-feedback');
  const list = section.querySelector('#publications-list');
  if (typeof publicationCatalog === 'undefined' || !Array.isArray(publicationCatalog)) {
    feedback.textContent = '논문 목록을 불러올 수 없습니다.';
    const retry = publicationButton('다시 불러오기', 'retry', undefined, 'publication-text-button');
    retry.addEventListener('click', () => window.location.reload());
    list.append(retry);
    return;
  }

  const data = preparePublications(publicationCatalog);
  const search = section.querySelector('input[name="query"]');
  const sort = section.querySelector('select[name="sort"]');
  const pageSize = section.querySelector('select[name="limit"]');
  const mobileControls = section.querySelector('.publication-mobile-controls');
  const mobileYear = mobileControls.querySelector('select');
  const mobileToggle = mobileControls.querySelector('button');
  const mobilePanel = section.querySelector('#publication-mobile-filters');
  const chips = section.querySelector('.publication-chips');
  const pagination = section.querySelector('.publication-pagination');
  const filters = createPublicationFilters(data);
  const yearRange = createPublicationYearForm(data.maxYear);
  const media = window.matchMedia('(max-width: 900px)');
  const controller = new AbortController();
  const listener = { signal: controller.signal };
  let state = readPublicationState(new URLSearchParams(window.location.search), data);
  let olderExpanded = false;
  let journalsExpanded = false;
  let view;
  let searchHistoryTimer;

  const mobileCustom = new Option('기간 지정', 'custom');
  const mobileSelectedRange = new Option();
  for (const year of filters.yearButtons.keys()) {
    const label = year === 'all' ? '전체 연도' : year === data.recentYears ? '최근 3년' : publicationYearLabel(year);
    mobileYear.add(new Option(label, year));
    if (year === data.recentYears) mobileYear.add(mobileCustom);
  }
  section.querySelector('.publication-result-controls').hidden = false;
  search.disabled = false;

  function setMobilePanel(open) {
    mobilePanel.hidden = !open;
    mobileToggle.setAttribute('aria-expanded', String(open));
  }

  function positionFilters() {
    const focused = document.activeElement;
    const restoreYearFocus = yearRange.form.contains(focused);
    mobileControls.hidden = !media.matches;
    setMobilePanel(false);
    (media.matches ? mobilePanel : sidebar).append(filters.panel);
    (media.matches ? mobileControls : filters.rangeToggle).after(yearRange.form);
    if (restoreYearFocus) focused.focus({ preventScroll: true });
  }

  function renderYearControls() {
    const hasCustomRange = !filters.yearButtons.has(view.year);
    if (hasCustomRange) {
      mobileSelectedRange.value = view.year;
      mobileSelectedRange.textContent = publicationYearFilterLabel(view.year);
      if (!mobileSelectedRange.parentElement) mobileYear.add(mobileSelectedRange, mobileCustom);
    } else {
      mobileSelectedRange.remove();
    }
    mobileYear.value = yearRange.form.hidden ? view.year : mobileCustom.value;
    filters.rangeToggle.textContent = hasCustomRange ? '기간 변경' : '기간 지정';
    filters.rangeToggle.setAttribute('aria-expanded', String(!yearRange.form.hidden));
  }

  function clearYearRangeError() {
    yearRange.error.textContent = '';
    yearRange.end.removeAttribute('aria-invalid');
  }

  function openYearRange() {
    const selectedRange = readPublicationYearRange(view.year, data.maxYear);
    const selectedYear = Number(view.year);
    const fallback = readPublicationYearRange(data.recentYears, data.maxYear);
    const dates = selectedRange ?? (Number.isInteger(selectedYear) ? { start: selectedYear, end: selectedYear } : fallback);
    yearRange.start.value = dates.start;
    yearRange.end.value = dates.end;
    clearYearRangeError();
    yearRange.form.hidden = false;
    renderYearControls();
    yearRange.start.focus();
  }

  function yearRangeTrigger() {
    return media.matches ? mobileYear : filters.rangeToggle;
  }

  function cancelYearRange() {
    yearRange.form.hidden = true;
    renderYearControls();
    yearRangeTrigger().focus();
  }

  function render(historyMethod) {
    view = getPublicationView(data, state);
    state.page = view.page;
    if (search.value !== state.query) search.value = state.query;
    sort.value = state.sort;
    pageSize.value = state.pageSize;
    renderYearControls();
    const selectedFilters = state.indexes.length + state.journals.length;
    mobileToggle.textContent = selectedFilters ? `필터 (${selectedFilters})` : '필터';
    if (selectedFilters) mobileToggle.setAttribute('aria-label', `필터, ${selectedFilters}개 선택됨`);
    else mobileToggle.removeAttribute('aria-label');
    feedback.textContent = `총 ${view.total}편`;
    renderPublicationFilters(filters, view, state, data, olderExpanded);
    renderPublicationJournals(filters, view, state, journalsExpanded);
    renderPublicationChips(chips, state, data.journals);
    renderPublications(list, view);
    renderPublicationPagination(pagination, view);
    writePublicationState(state, historyMethod);
  }

  function update(changes, historyMethod = 'pushState') {
    state = { ...state, page: 1, ...changes };
    render(historyMethod);
  }

  function finishSearchHistory() {
    window.clearTimeout(searchHistoryTimer);
    searchHistoryTimer = undefined;
  }

  search.addEventListener('input', () => {
    const method = searchHistoryTimer ? 'replaceState' : 'pushState';
    finishSearchHistory();
    update({ query: search.value }, method);
    searchHistoryTimer = window.setTimeout(finishSearchHistory, 600);
  }, listener);
  search.addEventListener('blur', finishSearchHistory, listener);
  filters.journalSearch.addEventListener('input', () => {
    renderPublicationJournals(filters, view, state, journalsExpanded);
  }, listener);

  yearRange.form.addEventListener('change', clearYearRangeError, listener);
  yearRange.form.addEventListener('submit', event => {
    event.preventDefault();
    const year = `${yearRange.start.value}-${yearRange.end.value}`;
    if (!readPublicationYearRange(year, data.maxYear)) {
      yearRange.error.textContent = '종료 연도는 시작 연도와 같거나 이후여야 합니다.';
      yearRange.end.setAttribute('aria-invalid', 'true');
      yearRange.end.focus();
      return;
    }
    finishSearchHistory();
    yearRange.form.hidden = true;
    update({ year });
    yearRangeTrigger().focus();
  }, listener);
  yearRange.form.addEventListener('keydown', event => {
    if (event.key === 'Escape') cancelYearRange();
  }, listener);

  sidebar.parentElement.addEventListener('change', event => {
    const field = event.target;
    if (field === mobileYear) {
      if (field.value === mobileCustom.value) openYearRange();
      else {
        yearRange.form.hidden = true;
        update({ year: field.value });
      }
    }
    if (field === sort) update({ sort: field.value });
    if (field === pageSize) update({ pageSize: Number(field.value) });
    if (field.name === 'publication-index') {
      const indexes = data.indexes.filter(index => filters.indexChecks.get(index).checkbox.checked);
      update({ indexes });
      if (field.disabled) field.closest('details').querySelector('summary').focus();
    }
    if (field.name === 'publication-journal') {
      const journals = [...filters.journalChecks].filter(([, item]) => item.checkbox.checked).map(([journal]) => journal);
      update({ journals });
    }
  }, listener);

  sidebar.parentElement.addEventListener('click', event => {
    const button = event.target.closest('[data-publication-action]');
    if (!button) return;
    finishSearchHistory();
    switch (button.dataset.publicationAction) {
      case 'year':
        yearRange.form.hidden = true;
        update({ year: button.value });
        break;
      case 'toggle-range':
        if (yearRange.form.hidden) openYearRange();
        else cancelYearRange();
        break;
      case 'cancel-range':
        cancelYearRange();
        break;
      case 'older':
        olderExpanded = !olderExpanded;
        render('replaceState');
        break;
      case 'more-journals':
        journalsExpanded = !journalsExpanded;
        renderPublicationJournals(filters, view, state, journalsExpanded);
        break;
      case 'reset':
        yearRange.form.hidden = true;
        filters.journalSearch.value = '';
        journalsExpanded = false;
        update({ year: 'all', indexes: [], journals: [] });
        if (button.disabled) (media.matches ? mobileYear : filters.panel.querySelector('[value="all"]')).focus();
        break;
      case 'remove-year':
        yearRange.form.hidden = true;
        update({ year: 'all' });
        search.focus();
        break;
      case 'remove-index':
        update({ indexes: state.indexes.filter(index => index !== button.value) });
        search.focus();
        break;
      case 'remove-journal':
        update({ journals: state.journals.filter(journal => journal !== button.value) });
        search.focus();
        break;
      case 'clear-journals':
        filters.journalSearch.value = '';
        update({ year: view.year, journals: [] });
        search.focus();
        break;
      case 'clear':
        yearRange.form.hidden = true;
        filters.journalSearch.value = '';
        journalsExpanded = false;
        update({ query: '', year: 'all', indexes: [], journals: [] });
        search.focus();
        break;
      case 'page':
        update({ page: Number(button.value) });
        list.focus({ preventScroll: true });
        list.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        break;
      case 'toggle-mobile':
        setMobilePanel(mobilePanel.hidden);
        break;
      case 'close-mobile':
        setMobilePanel(false);
        mobileToggle.focus();
        break;
    }
  }, listener);

  mobilePanel.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setMobilePanel(false);
      mobileToggle.focus();
    }
  }, listener);
  media.addEventListener('change', positionFilters, listener);
  window.addEventListener('popstate', () => {
    if (window.location.hash !== '#center/paper') return;
    finishSearchHistory();
    const restoreFocus = yearRange.form.contains(document.activeElement);
    yearRange.form.hidden = true;
    state = readPublicationState(new URLSearchParams(window.location.search), data);
    render('replaceState');
    if (restoreFocus) yearRangeTrigger().focus();
  }, listener);

  positionFilters();
  render('replaceState');
  return () => {
    finishSearchHistory();
    controller.abort();
    filters.panel.remove();
    yearRange.form.remove();
  };
}
