(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountWorkbench = function mountWorkbench(controller, root) {
    const document = root.ownerDocument;
    const container = root.closest('.yakit-workbench');
    root.innerHTML = workbench.workbenchTemplate;
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    let designCountEditing = false, designSubmitting = false;
    let lastNotice = '', lastError = '', shownError = '', errorCount = 0, noticeCount = 0;
    const toast = workbench.createToast(document, container);
    const selects = workbench.mountSelects(root);
    const settings = workbench.mountSettings(controller, root, { run, notify });
    const { openPage } = workbench.mountNavigation(root, { onPageChange: name => { if (name !== 'settings') settings.close(); } });
    const presets = workbench.mountPresets(controller, root, { run: action => run(action, true), openPage });
    const versions = workbench.mountVersions(controller, root, { run: action => run(action, true) });
    const trials = workbench.mountTrials(controller, root, { run, notify, versionTitle: version => versions.title(version) });
    const messages = workbench.mountWorkbenchMessages(controller, root, { run: action => run(action, true), notify });

    function showNotice(state) {
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
      messages.render(state);
      setValue('goal', state.goal);
      // 保留尚未填完的数量，清空重输时不会被订阅刷新覆盖。
      if (!designCountEditing) setValue('design-count', String(state.designCount));
      $('busy-bar').hidden = !state.busy;
      $('busy-text').textContent = ({ trial: '测试任务正在生成样本并进行 AI 盲评…', scenario: '正在生成冲突场景…', judge: '正在进行 AI 盲评…', 'preset-read': '正在读取预设…', 'preset-save': '正在保存预设…' })[state.busy] || '工作台 AI 正在生成…';
      $('cancel').hidden = state.busy === 'preset-save' || state.busy === 'preset-read';
      $('design-button').disabled = designSubmitting || Boolean(state.busy) || !state.goal.trim();
      $('design-count').disabled = designSubmitting || Boolean(state.busy);
      $('design-button').firstChild.textContent = state.busy === 'design' ? '正在生成 ' : state.messages.length > 1 ? '修改提示词 ' : '生成提示词 ';
      showNotice(state);
    }

    $('goal').addEventListener('input', () => run(() => controller.update({ goal: $('goal').value })));
    $('design-count').addEventListener('input', () => { designCountEditing = true; });
    $('design-count').addEventListener('change', () => {
      if (!$('design-count').checkValidity()) return;
      const designCount = $('design-count').valueAsNumber;
      designCountEditing = false;
      run(() => controller.update({ designCount }));
    });
    $('design-form').addEventListener('submit', event => {
      event.preventDefault();
      if (designSubmitting || controller.getState().busy || !$('design-form').reportValidity()) return;
      const designCount = $('design-count').valueAsNumber;
      const instruction = $('instruction').value || $('goal').value;
      // 保存数量期间也锁定提交，避免重复启动或改动本轮数量。
      designSubmitting = true;
      designCountEditing = false;
      run(async () => {
        try {
          await controller.update({ designCount });
        } finally { designSubmitting = false; }
        await controller.design(instruction);
        if (!controller.getState().error) $('instruction').value = '';
      });
    });
    $('cancel').addEventListener('click', () => run(() => controller.cancel()));
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
