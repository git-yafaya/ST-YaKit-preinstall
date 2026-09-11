(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountWorkbench = function mountWorkbench(controller, root = document.getElementById('app')) {
    root.innerHTML = workbench.workbenchTemplate;
    const $ = id => root.querySelector(`#${id}`);
    const statusNames = { pending: '待反馈', satisfied: '达到预期', revise: '还需修改' };
    let messageKey = '', versionKey = '', trialKey = '', feedbackKey = '', selection = '';
    let lastNotice = '', lastError = '', shownError = '', errorCount = 0, noticeCount = 0;
    const toast = workbench.createToast(root.ownerDocument);
    const settings = workbench.mountSettings(controller, root, { run, notify });
    const { openPage } = workbench.mountNavigation(root);
    const presets = workbench.mountPresets(controller, root, { run: action => run(action, true), openPage });

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
    function setOptions(id, entries, selected, empty) {
      const options = entries.map(([value, label]) => new Option(label, value));
      if (!options.length) options.push(new Option(empty, ''));
      $(id).replaceChildren(...options);
      $(id).value = selected || '';
    }
    function currentTrial(state = controller.getState()) {
      return state.trials.find(item => item.id === state.selectedTrialId);
    }
    function feedback() {
      const status = root.querySelector('input[name="feedback-status"]:checked')?.value;
      if (!status) throw new Error('先选择「达到预期」或「还需修改」，再提交反馈。');
      return { status, note: $('feedback-note').value, excerpt: $('excerpt').value };
    }
    function render(state) {
      settings.render(state);
      presets.render(state);
      setValue('goal', state.goal); setValue('draft', state.draft);
      const activeVersion = state.versions.find(item => item.id === state.selectedVersionId);
      const trial = currentTrial(state);
      $('draft-count').textContent = `${Array.from(state.draft).length} 字`;
      $('draft-state').textContent = activeVersion?.content === state.draft ? `已保存 · ${activeVersion.label}` : '当前草稿 · 尚未保存为版本';
      $('version-count').textContent = state.versions.length;
      $('trial-version').textContent = activeVersion ? (activeVersion.content === state.draft ? `使用版本 · ${activeVersion.label}` : '草稿已修改，请先保存新版本') : '先保存一个提示词版本';
      $('context-label').textContent = state.contextLabel || '当前聊天';
      $('busy-bar').hidden = !state.busy;
      $('busy-text').textContent = ({ trial: '正文 AI 正在试写…', 'preset-read': '正在读取预设…', 'preset-save': '正在保存预设条目…' })[state.busy] || '工作台 AI 正在生成…';
      $('cancel').hidden = state.busy === 'preset-save' || state.busy === 'preset-read';
      $('design-button').disabled = Boolean(state.busy) || !state.goal.trim();
      $('design-button').firstChild.textContent = state.busy === 'design' ? '正在生成 ' : state.messages.length > 1 ? '修改提示词 ' : '生成提示词 ';
      $('trial-button').disabled = Boolean(state.busy) || !state.canTrial || !activeVersion || activeVersion.content !== state.draft;
      $('save-version').disabled = Boolean(state.busy) || !state.draft.trim();
      $('copy').disabled = !state.draft.trim();
      $('versions').disabled = Boolean(state.busy) || !state.versions.length;
      $('trials').disabled = Boolean(state.busy) || !state.trials.length;
      $('save-feedback').disabled = Boolean(state.busy) || !trial;
      $('revise').disabled = Boolean(state.busy) || !trial;
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
            const summary = document.createElement('summary'); summary.textContent = '查看提示词';
            const prompt = document.createElement('div'); prompt.textContent = candidate.prompt;
            details.append(summary, prompt); item.append(details);
          }
          return item;
        }));
        $('messages').scrollTop = $('messages').scrollHeight;
      }
      const nextVersionKey = JSON.stringify([state.versions, state.selectedVersionId]);
      if (versionKey !== nextVersionKey) {
        versionKey = nextVersionKey;
        setOptions('versions', state.versions.map(item => [item.id, item.label]), state.selectedVersionId, '尚未保存版本');
        $('version-empty').hidden = Boolean(activeVersion);
        $('version-details').hidden = !activeVersion;
        // 版本页展示保存时的原文，编辑草稿不会覆盖这里。
        $('version-content').textContent = activeVersion?.content || '';
        const savedAt = new Date(activeVersion?.createdAt || '');
        $('version-created-at').textContent = Number.isNaN(savedAt.getTime()) ? '未记录保存时间' : `保存于 ${savedAt.toLocaleString('zh-CN')}`;
      }
      const nextTrialKey = JSON.stringify([state.trials.map(item => [item.id, item.feedback?.status]), state.selectedTrialId]);
      if (trialKey !== nextTrialKey) {
        trialKey = nextTrialKey;
        setOptions('trials', state.trials.map((item, index) => [item.id, `第 ${index + 1} 次试写 · ${statusNames[item.feedback?.status] || '待反馈'}`]), state.selectedTrialId, '暂无试写');
      }
      $('trial-empty').hidden = Boolean(trial);
      $('trial-output').hidden = !trial; $('feedback-section').hidden = !trial;
      const trialVersion = state.versions.find(item => item.id === trial?.versionId);
      $('trial-context').textContent = trial ? `对应「${trialVersion?.label || '已保存版本'}」${trial.context?.explanation ? ` · ${trial.context.explanation}` : ''}` : '';
      $('trial-context').hidden = !trial;
      if ($('trial-output').textContent !== (trial?.content || '')) $('trial-output').textContent = trial?.content || '';
      const nextFeedbackKey = JSON.stringify([trial?.id, trial?.feedback]);
      if (feedbackKey !== nextFeedbackKey) {
        feedbackKey = nextFeedbackKey; selection = '';
        setValue('excerpt', trial?.feedback?.excerpt); setValue('feedback-note', trial?.feedback?.note);
        root.querySelectorAll('input[name="feedback-status"]').forEach(input => { input.checked = input.value === trial?.feedback?.status; });
      }
      $('feedback-state').textContent = trial?.feedback?.status && trial.feedback.status !== 'pending' ? `已保存评价 · ${statusNames[trial.feedback.status]}` : '尚未提交评价';
    }

    ['goal', 'draft'].forEach(id => $(id).addEventListener('input', () => run(() => controller.update({ [id]: $(id).value }))));
    $('design-form').addEventListener('submit', event => {
      event.preventDefault();
      run(async () => {
        await controller.design($('instruction').value || $('goal').value);
        if (!controller.getState().error) $('instruction').value = '';
      });
    });
    $('save-version').addEventListener('click', () => run(async () => {
      await controller.saveVersion($('version-label').value);
      if (!controller.getState().error) $('version-label').value = '';
    }, true));
    $('versions').addEventListener('change', () => run(() => controller.selectVersion($('versions').value)));
    $('trial-button').addEventListener('click', () => run(() => controller.trial($('trial-input').value)));
    $('trials').addEventListener('change', () => run(() => controller.selectTrial($('trials').value)));
    $('cancel').addEventListener('click', () => run(() => controller.cancel()));
    $('save-feedback').addEventListener('click', () => run(() => controller.setFeedback(currentTrial().id, feedback())));
    $('revise').addEventListener('click', () => run(async () => {
      const trial = currentTrial();
      await controller.setFeedback(trial.id, feedback());
      if (controller.getState().error) return;
      await controller.reviseFromFeedback(trial.id);
    }));
    // 只引用正文区域里的选区，点击按钮后仍保留最后一次选中的片段。
    function rememberSelection() {
      const selected = window.getSelection();
      if (selected?.rangeCount && $('trial-output').contains(selected.anchorNode) && $('trial-output').contains(selected.focusNode)) selection = selected.toString();
    }
    $('trial-output').addEventListener('mouseup', rememberSelection);
    $('trial-output').addEventListener('keyup', rememberSelection);
    $('trial-output').addEventListener('touchend', rememberSelection);
    $('quote-selection').addEventListener('click', () => {
      rememberSelection();
      if (!selection.trim()) { notify('先在试写正文中选中要反馈的句子；也可以直接填写问题片段。', 'warning'); return; }
      $('excerpt').value = selection; $('feedback-note').focus();
    });
    $('copy').addEventListener('click', () => run(async () => {
      const content = controller.getState().draft;
      try { await navigator.clipboard.writeText(content); }
      catch {
        // 剪贴板接口不可用时，尝试浏览器的原生复制。
        const field = document.createElement('textarea'); field.value = content; field.style.cssText = 'position:fixed;left:-9999px';
        document.body.append(field); field.select();
        const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw new Error('浏览器未允许复制，请选中草稿后手动复制。');
      }
      notify('提示词已复制。');
    }));
    $('export').addEventListener('click', () => run(async () => {
      const data = await controller.exportData();
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = `YaKit-提示词工作记录-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('工作记录已导出。');
    }));
    render(controller.getState());
    const unsubscribe = controller.subscribe(render);
    return () => { unsubscribe(); settings.dispose(); toast.dispose(); };
  };
})();
