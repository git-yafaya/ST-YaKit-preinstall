(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountNavigation = function mountNavigation(root) {
    const $ = id => root.querySelector(`#${id}`);
    const pages = { workbench: '工作台', trial: '试写与反馈', versions: '版本记录', settings: '设置' };
    const buttons = root.querySelectorAll('[data-page]');
    function openPage(page, focus = true) {
      if (!Object.hasOwn(pages, page)) return;
      // 只切换可见性，保留各页尚未提交的输入和反馈。
      Object.keys(pages).forEach(name => { $(`${name}-page`).hidden = name !== page; });
      buttons.forEach(button => {
        const active = button.dataset.page === page;
        button.classList.toggle('active', active);
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
      $('page-title').textContent = pages[page];
      if (focus) $(`${page}-page`).focus();
    }
    buttons.forEach(button => button.addEventListener('click', () => openPage(button.dataset.page)));
    root.querySelectorAll('[data-open-page]').forEach(button => button.addEventListener('click', () => openPage(button.dataset.openPage)));
    $('sidebar-toggle').addEventListener('click', () => {
      const collapsed = !$('sidebar').hidden;
      // 原生隐藏同时移除侧栏的键盘焦点，展开按钮始终留在页面上。
      if (collapsed && $('sidebar').contains(document.activeElement)) $('sidebar-toggle').focus();
      $('sidebar').hidden = collapsed;
      $('sidebar-toggle').setAttribute('aria-expanded', String(!collapsed));
      const label = collapsed ? '显示导航' : '隐藏导航';
      $('sidebar-toggle').setAttribute('aria-label', label);
      $('sidebar-toggle').title = label;
    });
    $('sidebar-toggle').setAttribute('aria-controls', 'sidebar');
    $('sidebar-toggle').setAttribute('aria-expanded', 'true');
    $('sidebar-toggle').title = '隐藏导航';
    openPage('workbench', false);
  };
})();
