(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountWorkbench = function mountWorkbench(controller, root) {
    const document = root.ownerDocument;
    const container = root.closest('.yakit-workbench');
    root.innerHTML = workbench.workbenchTemplate;
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    let messageKey = '';
    let lastNotice = '', lastError = '', shownError = '', errorCount = 0, noticeCount = 0;
    const toast = workbench.createToast(document, container);
    const selects = workbench.mountSelects(root);
    const settings = workbench.mountSettings(controller, root, { run, notify });
    const { openPage } = workbench.mountNavigation(root, { onPageChange: name => { if (name !== 'settings') settings.close(); } });
    const presets = workbench.mountPresets(controller, root, { run: action => run(action, true), openPage });
    const versions = workbench.mountVersions(controller, root, { run: action => run(action, true) });
    const trials = workbench.mountTrials(controller, root, { run, notify, versionTitle: version => versions.title(version) });

    function showNotice(state) {
      // 只提示新结果；错误存在时不让成功文案盖住它。
      if (state.error && state.error !== lastError) notify(state.error, 'error');
      else if (!state.error && state.notice && state.notice !== lastNotice) notify(state.notice);
      lastError = state.error; lastNotice = state.notice;
    }
    async function run(action, repeatNotice = false) {
      const errorsBefore = errorCount, noticesBefore = noticeCount;
      let failed = false;
      try { await action(); }
      catch (error) {
        failed = true;
        const message = error.message || '本次操作没有完成，请重试。';
        // 核心订阅已报出的错误不重复弹出；再次执行仍会提示相同错误。
        if (errorCount === errorsBefore || shownError !== message) notify(message, 'error');
      }
      const state = controller.getState();
      render(state);
      // 保存或载入可以再次产生同一结果，输入、选择记录不重播旧提示。
      if (repeatNotice && !failed && !state.error && state.notice && noticeCount === noticesBefore) notify(state.notice);
    }
    function notify(message, type = 'success') {
      if (type === 'error') { errorCount++; shownError = message; }
      else noticeCount++;
      toast.show(message, { type });
    }
    function setValue(id, value) {
      // 只在值确实变化时赋值，逐字输入不会重建编辑器或跳动光标。
      if ($(id).value !== (value ?? '')) $(id).value = value ?? '';
    }
    function render(state) {
      settings.render(state);
      presets.render(state);
      versions.render(state);
      trials.render(state);
      setValue('goal', state.goal); setValue('draft', state.draft);
      const activeVersion = state.versions.find(item => item.id === state.selectedVersionId);
      $('draft-count').textContent = `${Array.from(state.draft).length} 字`;
      $('draft-state').textContent = activeVersion?.content === state.draft ? `已保存 · ${versions.title(activeVersion)}` : '当前草稿 · 尚未保存为版本';
      $('busy-bar').hidden = !state.busy;
      $('busy-text').textContent = ({ trial: '测试任务正在生成样本并进行 AI 盲评…', scenario: '正在生成冲突场景…', judge: '正在进行 AI 盲评…', 'preset-read': '正在读取预设…', 'preset-save': '正在保存预设…' })[state.busy] || '工作台 AI 正在生成…';
      $('cancel').hidden = state.busy === 'preset-save' || state.busy === 'preset-read';
      $('design-button').disabled = Boolean(state.busy) || !state.goal.trim();
      $('design-button').firstChild.textContent = state.busy === 'design' ? '正在生成 ' : state.messages.length > 1 ? '修改提示词 ' : '生成提示词 ';
      $('save-version').disabled = Boolean(state.busy) || !state.draft.trim();
      $('copy').disabled = !state.draft.trim();
      showNotice(state);

      const nextMessageKey = JSON.stringify(state.messages);
      if (messageKey !== nextMessageKey) {
        messageKey = nextMessageKey;
        const messages = state.messages;
        $('messages').replaceChildren(...messages.map(message => {
          const item = document.createElement('div');
          item.className = `message message-${message.role === 'user' ? 'user' : 'assistant'}`;
          const role = document.createElement('span'); role.className = 'message-role'; role.textContent = message.role === 'user' ? '你' : '工作台 AI';
          const content = document.createElement('span');
          let readable = message.content, candidate = null;
          if (message.role !== 'user') {
            // 结构化答复先展示说明，候选提示词可以展开查看。
            try { candidate = workbench.prompts.parseDesign(readable); readable = candidate.explanation; } catch { /* 普通文字按原样展示。 */ }
          }
          content.textContent = readable;
          item.append(role, content);
          if (candidate) {
            const details = document.createElement('details');
            details.className = 'message-prompt';
            const summary = document.createElement('summary'); summary.className = 'button button-secondary'; summary.textContent = '查看提示词';
            const prompt = document.createElement('div'); prompt.textContent = candidate.prompt;
            details.append(summary, prompt); item.append(details);
          }
          return item;
        }));
        $('messages').scrollTop = $('messages').scrollHeight;
      }

    }

    ['goal', 'draft'].forEach(id => $(id).addEventListener('input', () => run(() => controller.update({ [id]: $(id).value }))));
    $('design-form').addEventListener('submit', event => {
      event.preventDefault();
      run(async () => {
        await controller.design($('instruction').value || $('goal').value);
        if (!controller.getState().error) $('instruction').value = '';
      });
    });
    $('cancel').addEventListener('click', () => run(() => controller.cancel()));
    $('copy').addEventListener('click', () => run(async () => {
      const content = controller.getState().draft;
      try { await document.defaultView.navigator.clipboard.writeText(content); }
      catch {
        // 剪贴板接口不可用时，尝试浏览器的原生复制。
        const field = document.createElement('textarea'); field.value = content; field.style.cssText = 'position:fixed;left:-9999px';
        container.append(field); field.select();
        const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw new Error('浏览器未允许复制，请选中草稿后手动复制。');
      }
      notify('提示词已复制。');
    }));
    $('export').addEventListener('click', () => run(async () => {
      const data = await controller.exportData();
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = `YaKit-提示词工作记录-${new Date().toISOString().slice(0, 10)}.json`;
      container.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('工作记录已导出。');
    }));
    render(controller.getState());
    const unsubscribe = controller.subscribe(render);
    return () => { unsubscribe(); settings.dispose(); selects.dispose(); toast.dispose(); };
  };
})();
