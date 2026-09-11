(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountNavigation = function mountNavigation(root) {
    const $ = id => root.querySelector(`#${id}`);
    const document = root.ownerDocument;
    const toggle = document.getElementById('sidebar-toggle');
    const pages = { workbench: '工作台', trial: '试写与反馈', versions: '版本记录', settings: '设置' };
    const names = Object.keys(pages);
    const buttons = Array.from(root.querySelectorAll('[data-page]'));
    names.forEach(name => {
      const page = $(`${name}-page`);
      // 各页留在轨道上，切页不重建输入、选区或滚动位置。
      page.hidden = false;
      page.setAttribute('role', 'tabpanel');
      page.setAttribute('aria-labelledby', `nav-${name}`);
    });
    function openPage(name, focus = 'page') {
      const index = names.indexOf(name);
      if (index < 0) return;
      $('app-shell').style.setProperty('--page-index', index);
      names.forEach(pageName => {
        const page = $(`${pageName}-page`);
        page.inert = pageName !== name;
        // 滚动容器也不可聚焦，避免键盘进入屏幕外的页面。
        page.parentElement.inert = page.inert;
        if (!page.inert) page.setAttribute('aria-hidden', 'false');
      });
      buttons.forEach(button => {
        const active = button.dataset.page === name;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
      document.getElementById('page-title').textContent = pages[name];
      if (focus) (focus === 'tab' ? buttons[index] : $(`${name}-page`)).focus({ preventScroll: true });
      names.forEach(pageName => {
        $(`${pageName}-page`).setAttribute('aria-hidden', String(pageName !== name));
      });
    }
    buttons.forEach((button, index) => {
      button.id = `nav-${button.dataset.page}`;
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `${button.dataset.page}-page`);
      button.style.gridColumn = index + 1;
      button.addEventListener('click', () => openPage(button.dataset.page, 'tab'));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        openPage(buttons[next].dataset.page, 'tab');
      });
    });
    root.querySelectorAll('[data-open-page]').forEach(button => button.addEventListener('click', () => openPage(button.dataset.openPage)));
    toggle.addEventListener('click', () => {
      const collapsed = !$('sidebar').hidden;
      if (collapsed && $('sidebar').contains(document.activeElement)) toggle.focus({ preventScroll: true });
      $('sidebar').hidden = collapsed;
      toggle.setAttribute('aria-expanded', String(!collapsed));
      const label = collapsed ? '显示导航' : '隐藏导航';
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    });
    toggle.disabled = false;
    openPage('workbench', false);
  };
})();
