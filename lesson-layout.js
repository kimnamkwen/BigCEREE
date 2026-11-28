const lessonLayout = document.querySelector('.lesson-layout');
const lessonToc = lessonLayout?.querySelector('.lesson-toc');
const lessonTocToggle = document.getElementById('btn-toc');

if (lessonToc && lessonTocToggle) {
  const narrowLesson = window.matchMedia('(max-width: 900px), (max-width: 960px) and (max-height: 500px)');

  function setTocExpanded(expanded) {
    lessonLayout.classList.toggle('toc-hidden', !expanded);
    lessonTocToggle.setAttribute('aria-expanded', String(expanded));
  }

  lessonToc.id = 'lesson-toc';
  lessonTocToggle.setAttribute('aria-controls', lessonToc.id);
  setTocExpanded(!narrowLesson.matches);
  narrowLesson.addEventListener('change', event => setTocExpanded(!event.matches));
  lessonTocToggle.addEventListener('click', () => setTocExpanded(lessonLayout.classList.contains('toc-hidden')));
  lessonToc.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !narrowLesson.matches) return;
    setTocExpanded(false);
    const heading = document.getElementById(link.hash.slice(1));
    if (heading && event.detail === 0) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  });
  lessonToc.addEventListener('keydown', event => {
    if (event.key === 'Escape' && narrowLesson.matches) {
      setTocExpanded(false);
      lessonTocToggle.focus();
    }
  });
}

const lessonToolbar = document.querySelector('.lesson-topbar');
if (lessonToolbar && lessonLayout) {
  const resizeToolbar = new ResizeObserver(() => {
    lessonLayout.style.setProperty('--lesson-anchor-offset', `${lessonToolbar.offsetHeight + 8}px`);
  });
  resizeToolbar.observe(lessonToolbar);

  const materialActions = [...lessonToolbar.querySelectorAll('#btn-pdf, #btn-print')];
  if (materialActions.length) {
    const materials = document.createElement('details');
    materials.className = 'lesson-materials';
    const summary = document.createElement('summary');
    summary.className = 'tool-btn';
    summary.textContent = '자료';
    const actions = document.createElement('div');
    actions.className = 'lesson-material-actions';
    materialActions[0].before(materials);
    actions.append(...materialActions);
    materials.append(summary, actions);

    materials.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !materials.open) return;
      materials.open = false;
      summary.focus();
    });
    document.addEventListener('click', event => {
      if (materials.open && !materials.contains(event.target)) materials.open = false;
    });
  }
}

const lessonTableObserver = new ResizeObserver(entries => {
  for (const { target } of entries) {
    const wrapper = target.matches('table') ? target.parentElement : target;
    if (wrapper.scrollWidth > wrapper.clientWidth) wrapper.tabIndex = 0;
    else wrapper.removeAttribute('tabindex');
  }
});

for (const table of lessonLayout?.querySelectorAll('.lesson-main table') ?? []) {
  const wrapper = document.createElement('div');
  wrapper.className = 'lesson-table-scroll';
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', table.caption?.textContent.trim() || '수업 표');
  table.before(wrapper);
  wrapper.append(table);
  lessonTableObserver.observe(wrapper);
  lessonTableObserver.observe(table);
}
