(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountSettings = function mountSettings(controller, root, { run }) {
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    const container = root.closest('.yakit-workbench');
    const header = id => container.querySelector(`#yakit-wb-${id}`);
    const theme = workbench.mountTheme(controller, container);
    const prompt = workbench.mountSettingsPrompt(controller, root);
    const api = workbench.mountSettingsApi(controller, root, syncActions);
    let page = 'primary', editing = null, returnButton = null, listKey = '', moduleKey = '', saving = false;
    function syncActions() {
      header('settings-actions').hidden = page === 'primary' || page === 'api';
      header('settings-reset').hidden = page === 'primary' || page === 'api';
      header('settings-delete').hidden = page !== 'api' || !editing;
      header('settings-save').textContent = page === 'api' ? '保存' : '确认';
      header('settings-save').disabled = saving || Boolean(controller.getState().busy) || (page === 'api' && !api.canSave);
      header('settings-delete').disabled = saving || Boolean(controller.getState().busy);
      header('settings-reset').disabled = saving;
    }
    function showPage(next, config = null, button = null) {
      const previous = page;
      page = next; editing = config;
      const isPrimary = next === 'primary';
      $('settings-page').dataset.subpage = isPrimary ? 'primary' : 'secondary';
      $('settings-primary').inert = !isPrimary;
      $('settings-primary').setAttribute('aria-hidden', String(!isPrimary));
      $('settings-secondary').inert = isPrimary;
      $('settings-secondary').setAttribute('aria-hidden', String(isPrimary));
      // 复用原按钮和事件，API 页放到底栏，其他页面恢复顶栏顺序。
      if (next === 'api') {
        $('settings-api-secondary-actions').append(header('settings-back'), header('settings-delete'));
        $('settings-api-footer').append(header('settings-save'));
        $('settings-api-fields').scrollTop = 0;
      } else {
        header('settings-actions').append(...['back', 'reset', 'delete', 'save'].map(name => header('settings-' + name)));
      }
      if (next === 'api') api.open(config); else api.close(isPrimary && previous === 'api');
      if (Object.hasOwn(workbench.promptTitles, next)) prompt.open(next); else prompt.close(isPrimary && previous !== 'primary' && previous !== 'api');
      if (!isPrimary) { returnButton = button; $('settings-secondary').scrollTop = 0; }
      syncActions();
      if (!isPrimary) header('settings-back').focus({ preventScroll: true });
      else if (returnButton && !$('settings-page').inert) {
        (returnButton.isConnected ? returnButton : $('api-add')).focus({ preventScroll: true });
      }
    }
    function close() {
      returnButton = null; showPage('primary');
      // 关闭或换顶级页时直接清空敏感草稿，不保留退场中的内容。
      api.close(); prompt.close();
    }
    $('api-add').addEventListener('click', event => showPage('api', null, event.currentTarget));
    for (const kind of Object.keys(workbench.promptTitles)) $('prompt-' + kind).addEventListener('click', event => showPage(kind, null, event.currentTarget));
    $('theme').addEventListener('change', () => run(() => controller.update({ theme: $('theme').value })));
    $('api-config').addEventListener('change', () => run(() => controller.selectApiConfig($('api-config').value)));
    for (const key of ['design', 'scenario', 'sample', 'judge']) $('module-api-' + key).addEventListener('change', () => run(() => controller.update({ moduleApis: { ...controller.getState().moduleApis, [key]: $('module-api-' + key).value } })));
    $('combine-design-scenario').addEventListener('change', () => run(() => controller.update({ combineDesignScenario: $('combine-design-scenario').checked })));

    root.querySelectorAll('input[name="yakit-wb-navigation-style"]').forEach(input => input.addEventListener('change', () => {
      if (input.checked) run(() => controller.update({ navigationStyle: input.value }));
    }));
    header('settings-back').addEventListener('click', () => showPage('primary'));
    header('settings-reset').addEventListener('click', () => prompt.reset());
    async function commit(remove = false) {
      if (saving || page === 'primary') return;
      saving = true; syncActions();
      try {
        const saved = remove ? await api.remove() : await (page === 'api' ? api.save() : prompt.save());
        if (saved) showPage('primary');
      } finally { saving = false; syncActions(); }
    }
    header('settings-save').addEventListener('click', () => run(() => commit(), true));
    header('settings-delete').addEventListener('click', () => run(() => commit(true), true));
    const dialog = root.closest('dialog');
    dialog?.addEventListener('close', close);
    dialog?.addEventListener('yakit:open', close);
    function render(state) {
      $('theme').value = state.theme || 'forest';
      const navigationStyle = state.navigationStyle || 'auto';
      const navigator = root.ownerDocument.defaultView?.navigator || {};
      // 按设备识别手机和平板；iPad 桌面模式单独判断，触屏电脑仍放在上方。
      const mobile = navigator.userAgentData?.mobile || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') || (/Macintosh/i.test(navigator.userAgent || '') && navigator.maxTouchPoints > 1);
      $('app-shell').dataset.navigationStyle = navigationStyle === 'auto' ? (mobile ? 'bottom' : 'top') : navigationStyle;
      root.querySelectorAll('input[name="yakit-wb-navigation-style"]').forEach(input => { input.checked = input.value === navigationStyle; });
      const configs = state.secondaryApiConfigs || [];
      const nextList = JSON.stringify([configs, state.profiles]);
      if (listKey !== nextList) {
        listKey = nextList;
        $('api-config').replaceChildren(new Option('留空，沿用酒馆当前 API', ''), ...configs.map(config => new Option(config.name, config.id)));
        $('api-config-list').replaceChildren(...configs.map(config => {
          const button = root.ownerDocument.createElement('button');
          button.type = 'button'; button.className = 'panel settings-entry';
          button.setAttribute('aria-label', `配置 ${config.name}`); button.setAttribute('aria-controls', 'yakit-wb-settings-api-form');
          const name = root.ownerDocument.createElement('strong'); name.textContent = config.name;
          const summary = root.ownerDocument.createElement('small');
          summary.textContent = [config.url, config.model, state.profiles?.find(item => item.id === config.profileId)?.name || config.profileId].filter(Boolean).join(' · ') || (config.apiKey ? '已填写 API-Key' : '沿用酒馆当前 API');
          button.append(name, summary); button.addEventListener('click', () => showPage('api', config, button));
          return button;
        }));
      }
      $('api-config').value = state.activeSecondaryApiId || '';
      $('api-config').disabled = Boolean(state.busy);
      const nextModuleKey = JSON.stringify(configs.map(config => [config.id, config.name]));
      if (moduleKey !== nextModuleKey) {
        moduleKey = nextModuleKey;
        for (const key of ['design', 'scenario', 'sample', 'judge']) $('module-api-' + key).replaceChildren(new Option('沿用副 API（留空时使用酒馆 API）', 'default'), ...configs.map(config => new Option(config.name, config.id)));
      }
      for (const key of ['design', 'scenario', 'sample', 'judge']) {
        $('module-api-' + key).value = state.moduleApis?.[key] || 'default';
        $('module-api-' + key).disabled = Boolean(state.busy);
      }
      $('combine-design-scenario').checked = Boolean(state.combineDesignScenario);
      $('combine-design-scenario').disabled = Boolean(state.busy);

      for (const [kind, title] of Object.entries(workbench.promptTitles)) {
        const saved = controller.getPrompt(kind), modified = saved.text !== saved.defaultText;
        $('prompt-' + kind).textContent = `${title}${modified ? '（已修改）' : ''} ›`;
        $('prompt-' + kind).classList.toggle('prompt-modified', modified);
      }
      syncActions(); theme.sync();
    }
    return {
      render, close,
      dispose() { close(); theme.dispose(); dialog?.removeEventListener('close', close); dialog?.removeEventListener('yakit:open', close); },
    };
  };
})();
