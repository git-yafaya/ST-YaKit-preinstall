(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountTrialComparison = function(controller, root, { run, statusNames }) {
    const document = root.ownerDocument;
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    const grid = $('comparison-grid'), cards = new Map();
    function node(tag, className, text = '') {
      const element = document.createElement(tag);
      element.className = className; element.textContent = text;
      return element;
    }
    function createCard(index) {
      const element = node('article', 'sample-comparison-card');
      const heading = node('h4', 'comparison-card-heading', `样本 ${index}`);
      const meta = node('p', 'comparison-card-meta');
      const body = node('div', 'comparison-card-body');
      body.tabIndex = 0; body.setAttribute('aria-label', `样本 ${index} 正文`);
      const empty = node('p', 'comparison-card-empty');
      const select = node('button', 'button button-secondary comparison-card-select');
      select.type = 'button';
      const card = { element, meta, body, empty, select, trialId: '' };
      select.addEventListener('click', () => run(() => controller.selectTrial(card.trialId)));
      element.append(heading, meta, body, empty, select);
      return card;
    }
    function render(state, task, trials, ranks, selectedVersions = []) {
      $('trial-comparison').hidden = !task && trials.length > 0;
      const perVersion = task?.settings.sampleCount ?? state.sampleCount ?? 1;
      const candidates = task?.candidates?.length ? task.candidates : task ? [task] : selectedVersions.map(item => ({ versionId: item.id, versionLabel: item.label, versionNumber: item.number }));
      const count = task?.expectedSampleCount ?? perVersion * candidates.length;
      const scores = task?.judgement?.results || [];
      const waiting = !task || ['scenario', 'generating'].includes(task.status);
      // 槽位取创建任务时的数量，失败或乱序返回不会挤掉其他样本的位置。
      const samples = Array.from({ length: count }, (_, index) => ({
        index: index + 1, candidate: candidates[Math.floor(index / perVersion)], trial: task ? trials.find(item => item.sampleIndex === index + 1) : null,
      }));
      if ($('score-order').checked) samples.sort((a, b) =>
        (scores.find(item => item.trialId === b.trial?.id)?.score ?? -1)
        - (scores.find(item => item.trialId === a.trial?.id)?.score ?? -1));
      $('comparison-hint').textContent = task
        ? `当前任务共 ${candidates.length} 份提示词、${count} 份正文；上方选择与数量用于新任务。选择样本后可在下方查看评分和填写反馈。`
        : `已选 ${candidates.length} 份提示词，将生成 ${count} 份正文；生成后逐一显示全文和评分。`;
      const keys = new Set();
      for (const [position, sample] of samples.entries()) {
        const key = `${task?.id || 'preview'}:${sample.index}`;
        keys.add(key);
        let card = cards.get(key);
        if (!card) { card = createCard(sample.index); cards.set(key, card); }
        const trial = sample.trial, score = scores.find(item => item.trialId === trial?.id);
        const selected = Boolean(trial && trial.id === state.selectedTrialId);
        card.trialId = trial?.id || '';
        card.element.setAttribute('aria-current', String(selected));
        const source = workbench.trialSourceTitle(task || { candidates }, trial || sample.candidate, state.versions);
        card.meta.textContent = trial
          ? [source, score ? `${ranks.get(trial.id)} · ${score.score} 分` : '待评分',
            trial.id === task.preferredTrialId ? '最喜欢' : '', statusNames[trial.feedback?.status] || '待反馈'].filter(Boolean).join(' · ')
          : `${source} · ${waiting ? '待生成' : task.status === 'cancelled' ? '已取消' : '未生成'}`;
        // 正文没有变化时保留原节点，刷新评分或反馈不会清掉滚动位置与选区。
        if (card.body.textContent !== (trial?.content || '')) card.body.textContent = trial?.content || '';
        card.body.hidden = !trial; card.empty.hidden = Boolean(trial);
        card.empty.textContent = !task ? '创建测试任务后，这里显示样本正文。'
          : waiting ? '等待此样本生成…'
            : task.status === 'cancelled' ? '本次已取消，此样本尚未生成。'
              : '此样本未生成，已有样本可继续查看。';
        card.select.disabled = Boolean(state.busy) || !trial;
        card.select.textContent = selected ? '当前样本' : '查看评分与反馈';
        card.select.setAttribute('aria-label', `样本 ${sample.index}：查看评分与反馈`);
        // 仅顺序发生变化时移动节点，日常刷新不重建卡片。
        if (grid.children[position] !== card.element) grid.insertBefore(card.element, grid.children[position] || null);
      }
      for (const [key, card] of cards) {
        if (!keys.has(key)) { card.element.remove(); cards.delete(key); }
      }
    }
    return { render };
  };
})();
