document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.main-header');
  const menu = header?.querySelector('.menu-bar');
  const sidebar = document.querySelector('.layout .side-nav');
  if (!menu || !sidebar) return;

  const mobile = window.matchMedia('(max-width: 900px), (max-width: 960px) and (max-height: 500px)');
  const menuToggle = makeToggle('site-menu-toggle', '메뉴', menu.id || 'main-menu');
  const sectionToggle = makeToggle('site-section-toggle', '세부 메뉴', 'site-section-links');
  const sectionSheet = makeSectionSheet();
  menu.id = menuToggle.getAttribute('aria-controls');
  header.insertBefore(menuToggle, menu);
  let sectionLinks;
  let sheetScroll = 0;
  let backdropPressed = false;

  function makeToggle(className, label, controls) {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-controls', controls);
    return button;
  }

  function setExpanded(toggle, links, expanded) {
    links.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
  }

  function makeSectionSheet() {
    const dialog = document.createElement('dialog');
    if (typeof dialog.showModal !== 'function') return null;
    dialog.id = 'site-section-sheet';
    dialog.className = 'site-section-sheet';
    dialog.setAttribute('aria-labelledby', 'site-section-sheet-title');
    dialog.innerHTML = `
      <div class="site-section-sheet-header">
        <h2 id="site-section-sheet-title">세부 메뉴</h2>
        <button type="button" class="site-section-sheet-close" aria-label="세부 메뉴 닫기">닫기</button>
      </div>
      <nav class="site-section-sheet-links" aria-labelledby="site-section-sheet-title"></nav>`;
    document.body.append(dialog);
    return dialog;
  }

  function syncSection() {
    sectionLinks = sidebar.querySelector('.nav-list');
    if (!sectionLinks) return;
    sectionLinks.id = 'site-section-links';
    sectionLinks.before(sectionToggle);
    const active = sectionLinks.querySelector('.nav-link.active');
    const section = sidebar.dataset.sectionLabel;
    const label = section ? `${section} 메뉴` : '세부 메뉴';
    sectionToggle.textContent = label;
    const current = active?.textContent.trim();
    const accessibleLabel = current ? `${label}, 현재 ${current}` : label;
    sectionToggle.setAttribute('aria-label', accessibleLabel);
    sectionToggle.hidden = !mobile.matches;
    const useSheet = mobile.matches && sectionSheet;
    sectionToggle.setAttribute('aria-controls', useSheet ? sectionSheet.id : sectionLinks.id);
    if (useSheet) {
      sectionToggle.setAttribute('aria-haspopup', 'dialog');
      sectionSheet.querySelector('h2').textContent = label;
    } else {
      sectionToggle.removeAttribute('aria-haspopup');
    }
    setExpanded(sectionToggle, sectionLinks, !mobile.matches);
  }

  function syncLayout() {
    menuToggle.hidden = !mobile.matches;
    setExpanded(menuToggle, menu, !mobile.matches);
    syncSection();
  }

  menuToggle.addEventListener('click', () => setExpanded(menuToggle, menu, menu.hidden));
  sectionToggle.addEventListener('click', () => {
    if (mobile.matches && sectionSheet) openSectionSheet();
    else setExpanded(sectionToggle, sectionLinks, sectionLinks.hidden);
  });

  function openSectionSheet() {
    if (!sectionLinks || sectionSheet.open || document.querySelector('.publication-mobile-panel[open]')) return;
    const copy = sectionLinks.cloneNode(true);
    copy.removeAttribute('id');
    copy.hidden = false;
    copy.querySelector('.nav-link.active')?.setAttribute('aria-current', 'page');
    sectionSheet.querySelector('nav').replaceChildren(copy);
    sheetScroll = window.scrollY;
    sectionSheet.showModal();
    sectionToggle.setAttribute('aria-expanded', 'true');
    sectionSheet.querySelector('.site-section-sheet-close').focus({ preventScroll: true });
  }

  function closeSectionSheet(restoreFocus = true) {
    if (!sectionSheet?.open) return;
    sectionSheet.close();
    sectionToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      window.scrollTo({ top: sheetScroll, behavior: 'instant' });
      sectionToggle.focus({ preventScroll: true });
    }
  }

  if (sectionSheet) {
    sectionSheet.querySelector('.site-section-sheet-close').addEventListener('click', () => closeSectionSheet());
    sectionSheet.addEventListener('cancel', event => {
      event.preventDefault();
      closeSectionSheet();
    });
    sectionSheet.addEventListener('pointerdown', event => {
      backdropPressed = event.target === sectionSheet;
    });
    sectionSheet.addEventListener('click', event => {
      if (backdropPressed && event.target === sectionSheet) closeSectionSheet();
      backdropPressed = false;
      const link = event.target.closest('a[href]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.getAttribute('aria-current') === 'page') {
        event.preventDefault();
        event.stopPropagation();
        closeSectionSheet();
        return;
      }
      closeSectionSheet(false);
      if (link.hasAttribute('data-site-route')) {
        window.requestAnimationFrame(() => {
          const main = document.getElementById('main-content');
          main.focus({ preventScroll: true });
          main.scrollIntoView({ block: 'start', behavior: 'instant' });
        });
      }
    });
    window.addEventListener('popstate', () => closeSectionSheet());
  }

  document.addEventListener('site-navigation-change', () => {
    const focusInMenu = menu.contains(document.activeElement);
    const focusInSection = sectionLinks?.contains(document.activeElement);
    closeSectionSheet(false);
    syncLayout();
    if (mobile.matches && (focusInMenu || focusInSection)) {
      (sectionLinks ? sectionToggle : menuToggle).focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !mobile.matches) return;
    if (!menu.hidden && (header.contains(event.target))) {
      setExpanded(menuToggle, menu, false);
      menuToggle.focus();
    } else if (sectionLinks && !sectionLinks.hidden && sidebar.contains(event.target)) {
      setExpanded(sectionToggle, sectionLinks, false);
      sectionToggle.focus();
    }
  });

  mobile.addEventListener('change', () => {
    closeSectionSheet(false);
    syncLayout();
  });
  syncLayout();
});
