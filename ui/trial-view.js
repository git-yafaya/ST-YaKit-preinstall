(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  // 测试页只负责展示与收集输入，任务、采样与评分由控制器执行。
  workbench.mountTrials = function(controller, root, { run, notify, versionTitle }) {
    const document = root.ownerDocument;
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    const statusNames = { pending: '待反馈', satisfied: '达到预期', revise: '还需修改' };
    const taskStatuses = { scenario: '正在生成场景', generating: '正在生成样本', judging: '正在 AI 盲评', completed: '已完成', partial: '部分样本已评分', error: '未完成', cancelled: '已取消' };
    let taskKey = '', trialKey = '', feedbackKey = '', selection = '';
    const currentTrial = (state = controller.getState()) => state.trials.find(item => item.id === state.selectedTrialId);
    const currentTask = (state = controller.getState()) => (state.testTasks || []).find(item => item.id === state.selectedTestTaskId);
    function setValue(id, value) {
      if ($(id).value !== String(value ?? '')) $(id).value = value ?? '';
    }
    function feedback() {
      const status = root.querySelector('input[name="yakit-wb-feedback-status"]:checked')?.value;
      if (!status) throw new Error('先选择「达到预期」或「还需修改」，再提交反馈。');
      return { status, note: $('feedback-note').value, excerpt: $('excerpt').value };
    }
    function render(state) {
      const busy = Boolean(state.busy), trial = currentTrial(state), task = currentTask(state);
      const activeVersion = state.versions.find(item => item.id === state.selectedVersionId);
      const emptyCard = state.emptyCardMode !== false;
      const route = state.moduleApis?.sample || 'main';
      const sampleApi = route === 'default' ? state.designApi === 'secondary' ? state.activeSecondaryApiId : 'main' : route;
      $('context-label').textContent = emptyCard ? '空卡测试 · 无需角色或聊天' : state.contextLabel || '当前聊天';
      $('sample-api-label').textContent = sampleApi === 'main' ? state.mainApiLabel || '主 API' : state.secondaryApiConfigs?.find(item => item.id === sampleApi)?.name || '工作台 AI';
      $('empty-card').checked = emptyCard;
      setValue('trial-input', state.scenarioText);
      setValue('scene-source', state.sceneSource || 'manual');
      setValue('sample-count', state.sampleCount || 3);
      setValue('sample-mode', state.sampleRequestMode || 'parallel');
      for (const id of ['empty-card', 'trial-input', 'scene-source', 'sample-count', 'sample-mode']) $(id).disabled = busy;
      $('sample-mode-hint').textContent = !emptyCard
        ? '当前聊天模式使用主 API 和独立请求；使用副 API 或单次多样本时，请开启空卡模式。'
        : state.sampleRequestMode === 'single'
          ? '需要接口真正支持 n 个独立结果；主文本补全或不支持 n 的接口请选择独立请求。'
          : '每个样本独立生成，使用同一份提示词和固定场景。';
      $('trial-version').textContent = activeVersion ? (activeVersion.content === state.draft ? `使用 · ${versionTitle(activeVersion)}` : '草稿已修改，请先保存新版本') : '先保存一个提示词版本';
      // 空卡与副 API 不依赖当前聊天，具体连接能力由控制器检查。
      $('trial-button').disabled = busy || !activeVersion || activeVersion.content !== state.draft || (!emptyCard && !state.canTrial);
      $('generate-scenario').disabled = busy || !(state.goal.trim() || state.draft.trim());
      $('scenario-hint').hidden = state.sceneSource !== 'ai';
      const tasks = state.testTasks || [];
      const hasLegacy = state.trials.some(item => !item.taskId);
      const nextTaskKey = JSON.stringify([hasLegacy, tasks.map(item => [item.id, item.versionLabel, item.versionNumber, item.status]), state.selectedTestTaskId]);
      if (taskKey !== nextTaskKey) {
        taskKey = nextTaskKey;
        const options = tasks.map((item, index) => new Option(`任务 ${index + 1} · ${item.versionNumber ? `第 ${item.versionNumber} 版` : item.versionLabel || '已保存版本'} · ${taskStatuses[item.status] || item.status}`, item.id));
        if (hasLegacy) options.unshift(new Option('历史单次试写', ''));
        $('test-tasks').replaceChildren(...(options.length ? options : [new Option('暂无测试任务', '')]));
        $('test-tasks').value = state.selectedTestTaskId || '';
      }
      $('test-tasks').disabled = busy || (!tasks.length && !hasLegacy);
      $('task-snapshot').hidden = !task;
      $('task-goal').textContent = task?.goal || '未填写原始需求';
      $('task-scene').textContent = task?.scenario || '场景尚未生成';
      $('task-status').textContent = task ? `${taskStatuses[task.status] || task.status} · 已生成 ${task.trialIds.length}/${task.settings.sampleCount} 个样本${task.error ? ` · ${task.error}` : ''}` : '';
      $('judge-actions').hidden = !task;
      $('judge-task').disabled = busy || !task?.trialIds.length;
      const scores = task?.judgement?.results || [];
      const visibleTrials = state.trials.filter(item => task ? item.taskId === task.id : !item.taskId);
      if ($('score-order').checked) visibleTrials.sort((a, b) => (scores.find(item => item.trialId === b.id)?.score ?? -1) - (scores.find(item => item.trialId === a.id)?.score ?? -1));
      const nextTrialKey = JSON.stringify([visibleTrials.map(item => [item.id, item.feedback?.status]), state.selectedTrialId, scores, task?.preferredTrialId]);
      if (trialKey !== nextTrialKey) {
        trialKey = nextTrialKey;
        $('trials').replaceChildren(...(visibleTrials.length ? visibleTrials.map((item, index) => {
          const score = scores.find(result => result.trialId === item.id);
          return new Option(`${task ? `样本 ${item.sampleIndex}` : `第 ${index + 1} 次试写`}${score ? ` · ${score.score} 分` : ''}${item.id === task?.preferredTrialId ? ' · 最喜欢' : ''} · ${statusNames[item.feedback?.status] || '待反馈'}`, item.id);
        }) : [new Option('暂无样本', '')]));
        $('trials').value = state.selectedTrialId || '';
      }
      $('trials').disabled = busy || !visibleTrials.length;
      $('trial-empty').hidden = Boolean(trial);
      $('trial-output').hidden = !trial; $('feedback-section').hidden = !trial;
      const trialVersion = state.versions.find(item => item.id === trial?.versionId);
      $('trial-context').textContent = trial ? `对应「${trialVersion ? versionTitle(trialVersion) : '已保存版本'}」${trial.context?.explanation ? ` · ${trial.context.explanation}` : ''}` : '';
      $('trial-context').hidden = !trial;
      if ($('trial-output').textContent !== (trial?.content || '')) $('trial-output').textContent = trial?.content || '';
      const score = scores.find(item => item.trialId === trial?.id);
      $('sample-score').hidden = !score;
      $('score-label').textContent = score ? `AI 盲评 · ${score.score} / 100` : '';
      $('score-reason').textContent = score?.reason || '';
      $('score-violations').replaceChildren(...(score?.violations || []).map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
      $('score-violations').hidden = !score?.violations.length;
      $('prefer-trial').hidden = !task;
      $('prefer-trial').disabled = busy || !trial;
      const preferred = Boolean(trial && trial.id === task?.preferredTrialId);
      $('prefer-trial').textContent = preferred ? '✓ 最喜欢的样本' : '选为最喜欢';
      $('prefer-trial').setAttribute('aria-pressed', String(preferred));
      $('save-feedback').disabled = busy || !trial;
      $('revise').disabled = busy || !trial;
      const nextFeedbackKey = JSON.stringify([trial?.id, trial?.feedback]);
      if (feedbackKey !== nextFeedbackKey) {
        feedbackKey = nextFeedbackKey; selection = '';
        setValue('excerpt', trial?.feedback?.excerpt); setValue('feedback-note', trial?.feedback?.note);
        root.querySelectorAll('input[name="yakit-wb-feedback-status"]').forEach(input => { input.checked = input.value === trial?.feedback?.status; });
      }
      $('feedback-state').textContent = trial?.feedback?.status && trial.feedback.status !== 'pending' ? `已保存评价 · ${statusNames[trial.feedback.status]}` : '尚未提交评价';
    }
    $('trial-input').addEventListener('input', () => run(() => controller.update({ scenarioText: $('trial-input').value })));
    for (const [id, field] of [['scene-source', 'sceneSource'], ['sample-mode', 'sampleRequestMode']]) $(id).addEventListener('change', () => run(() => controller.update({ [field]: $(id).value })));
    $('empty-card').addEventListener('change', () => run(() => controller.update({ emptyCardMode: $('empty-card').checked })));
    $('sample-count').addEventListener('change', () => run(() => controller.update({ sampleCount: Number($('sample-count').value) })));
    $('generate-scenario').addEventListener('click', () => run(() => controller.generateScenario()));
    $('trial-button').addEventListener('click', () => run(() => controller.trial($('trial-input').value)));
    $('test-tasks').addEventListener('change', () => run(() => controller.selectTestTask($('test-tasks').value)));
    $('trials').addEventListener('change', () => run(() => controller.selectTrial($('trials').value)));
    $('score-order').addEventListener('change', () => render(controller.getState()));
    $('judge-task').addEventListener('click', () => run(() => controller.judgeTestTask(currentTask().id)));
    $('prefer-trial').addEventListener('click', () => run(() => controller.preferTrial(currentTrial().id)));
    $('save-feedback').addEventListener('click', () => run(() => controller.setFeedback(currentTrial().id, feedback())));
    $('revise').addEventListener('click', () => run(async () => {
      const trial = currentTrial();
      await controller.setFeedback(trial.id, feedback());
      if (!controller.getState().error) await controller.reviseFromFeedback(trial.id);
    }));
    // 只引用正文区域里的选区，点击按钮后仍保留最后一次选中的片段。
    function rememberSelection() {
      const selected = document.defaultView.getSelection();
      if (selected?.rangeCount && $('trial-output').contains(selected.anchorNode) && $('trial-output').contains(selected.focusNode)) selection = selected.toString();
    }
    for (const event of ['mouseup', 'keyup', 'touchend']) $('trial-output').addEventListener(event, rememberSelection);
    $('quote-selection').addEventListener('click', () => {
      rememberSelection();
      if (!selection.trim()) { notify('先在试写正文中选中要反馈的句子；也可以直接填写问题片段。', 'warning'); return; }
      $('excerpt').value = selection; $('feedback-note').focus();
    });
    return { render };
  };
})();
