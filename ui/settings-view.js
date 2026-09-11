(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountSettings = function mountSettings(controller, root, { run }) {
    const $ = id => root.querySelector(`#${id}`);
    // 顶栏位于应用挂载点外，按所属文档查找二级操作区。
    const header = id => root.ownerDocument.getElementById(id);
    const theme = workbench.mountTheme(controller);
    const prompt = workbench.mountSettingsPrompt(controller, root);
    const api = workbench.mountSettingsApi(controller, root, syncActions);
    let page = 'primary', editing = null, returnButton = null, listKey = '', saving = false;
    function syncActions() {
      header('settings-actions').hidden = page === 'primary';
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
      if (next === 'api') api.open(config); else api.close(isPrimary && previous === 'api');
      if (next === 'builtin' || next === 'custom') prompt.open(next); else prompt.close(isPrimary && previous !== 'primary' && previous !== 'api');
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
    $('design-api').addEventListener('change', () => run(() => controller.update({ designApi: $('design-api').value })));
    $('api-config').addEventListener('change', () => run(() => controller.selectApiConfig($('api-config').value)));
    root.querySelectorAll('input[name="navigation-style"]').forEach(input => input.addEventListener('change', () => {
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
    const dialog = parent !== window ? parent.document.getElementById('yakit-workbench-dialog') : null;
    dialog?.addEventListener('close', close);
    dialog?.addEventListener('yakit:open', close);
    function render(state) {
      $('theme').value = state.theme || 'st';
      $('design-api').value = state.designApi || 'main';
      $('design-api').disabled = Boolean(state.busy);
      $('app-shell').dataset.navigationStyle = state.navigationStyle || 'top';
      root.querySelectorAll('input[name="navigation-style"]').forEach(input => { input.checked = input.value === (state.navigationStyle || 'top'); });
      $('main-api-label').textContent = state.mainApiLabel || '当前主 API';
      const configs = state.secondaryApiConfigs || [];
      const nextList = JSON.stringify([configs, state.profiles]);
      if (listKey !== nextList) {
        listKey = nextList;
        $('api-config').replaceChildren(...(configs.length ? configs.map(config => new Option(config.name, config.id)) : [new Option('未配置，沿用酒馆当前连接', '')]));
        $('api-config-list').replaceChildren(...configs.map(config => {
          const button = root.ownerDocument.createElement('button');
          button.type = 'button'; button.className = 'panel settings-entry';
          button.setAttribute('aria-label', `配置 ${config.name}`); button.setAttribute('aria-controls', 'settings-api-form');
          const name = root.ownerDocument.createElement('strong'); name.textContent = config.name;
          const summary = root.ownerDocument.createElement('small');
          summary.textContent = [config.url, config.model, state.profiles?.find(item => item.id === config.profileId)?.name || config.profileId].filter(Boolean).join(' · ') || '沿用酒馆当前连接';
          button.append(name, summary); button.addEventListener('click', () => showPage('api', config, button));
          return button;
        }));
      }
      $('api-config').value = state.activeSecondaryApiId || '';
      $('api-config').disabled = !configs.length || Boolean(state.busy);
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
