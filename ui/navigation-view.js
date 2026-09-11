(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountNavigation = function mountNavigation(root, { onPageChange } = {}) {
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    const container = root.closest('.yakit-workbench');
    const pages = { presets: '预设预览', workbench: '工作台', trial: '试写与反馈', versions: '版本记录', workshop: '创意工坊', settings: '设置' };
    const names = Object.keys(pages);
    const buttons = Array.from(root.querySelectorAll('[data-page]'));
    names.forEach(name => {
      const page = $(`${name}-page`);
      // 各页留在轨道上，切页不重建输入、选区或滚动位置。
      page.hidden = false;
      page.setAttribute('role', 'tabpanel');
      page.setAttribute('aria-labelledby', `yakit-wb-nav-${name}`);
    });
    function openPage(name, focus = 'page') {
      const index = names.indexOf(name);
      if (index < 0) return;
      onPageChange?.(name);
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
      container.querySelector('#yakit-wb-page-title').textContent = pages[name];
      if (focus) (focus === 'tab' ? buttons[index] : $(`${name}-page`)).focus({ preventScroll: true });
      names.forEach(pageName => {
        $(`${pageName}-page`).setAttribute('aria-hidden', String(pageName !== name));
      });
    }
    buttons.forEach((button, index) => {
      button.id = `yakit-wb-nav-${button.dataset.page}`;
      button.type = 'button';
      button.title = pages[button.dataset.page];
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `yakit-wb-${button.dataset.page}-page`);
      button.style.gridColumn = index + 1;
      button.addEventListener('click', () => {
        // 再点当前预设导航时，让预设列表回到顶部。
        if (button.dataset.page === 'presets' && button.classList.contains('active')) $('presets-page').parentElement.scrollTop = 0;
        openPage(button.dataset.page, 'tab');
      });
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
    openPage('workbench', false);
    return { openPage };
  };
})();
