(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.trialReviewTemplate = `
    <section id="yakit-wb-review-section" class="feedback-section" aria-labelledby="yakit-wb-review-title" hidden>
      <h3 id="yakit-wb-review-title">整组评审</h3>
      <p id="yakit-wb-review-stage" class="page-hint"></p>
      <p id="yakit-wb-review-summary" class="test-snapshot-text" hidden></p>
      <details id="yakit-wb-review-previous" class="message-prompt" hidden>
        <summary class="button button-secondary">对比上一阶段评分</summary>
        <ul id="yakit-wb-review-scores"></ul>
      </details>
      <div id="yakit-wb-review-note-field" class="field">
        <label for="yakit-wb-review-note">本轮修改意见（选填）</label>
        <textarea id="yakit-wb-review-note" rows="3" placeholder="说明本轮提示词还需要调整的地方。" aria-describedby="yakit-wb-review-note-hint"></textarea>
        <p id="yakit-wb-review-note-hint" class="page-hint">用于整组提示词的整合或重构。</p>
      </div>
      <p id="yakit-wb-review-hint" class="page-hint" role="status"></p>
      <div class="feedback-actions">
        <button type="button" id="yakit-wb-review-revise" class="button button-secondary">提取高分部分并试写</button>
        <button type="button" id="yakit-wb-review-confirm" class="button button-primary" hidden>确认二审通过，进入终审</button>
      </div>
    </section>`;

  workbench.mountTrialReview = function(controller, root, { run }) {
    const $ = id => root.querySelector(`#yakit-wb-review-${id}`);
    const stages = { initial: '初审', second: '二审', final: '终审', approved: '终审已确认' };
    let taskKey = '';
    const complete = (state, task) => {
      const expected = task?.expectedSampleCount ?? (task?.candidates?.length || 1) * (task?.settings?.sampleCount || 1);
      return task?.status === 'completed' && task.trialIds.length === expected
        && task.trialIds.every(id => state.trials.some(trial => trial.id === id && trial.content?.trim()))
        && task.judgement?.results.length === expected
        && task.trialIds.every(id => task.judgement.results.some(result => result.trialId === id));
    };
    const current = () => {
      const state = controller.getState();
      const task = state.testTasks?.find(item => item.id === state.selectedTestTaskId);
      return !state.busy && complete(state, task) ? task : null;
    };
    function render(state, task) {
      $('section').hidden = !task;
      if (taskKey !== (task?.id || '')) {
        taskKey = task?.id || ''; $('note').value = '';
      }
      if (!task) return;
      const stage = task.review?.stage || 'initial', approved = stage === 'approved';
      const ready = complete(state, task), disabled = Boolean(state.busy) || !ready;
      $('stage').textContent = `第 ${task.review?.round || 1} 轮 · ${stages[stage] || '初审'}`;
      $('summary').textContent = task.review?.summary || '';
      $('summary').hidden = !task.review?.summary;
      $('note-field').hidden = approved; $('note').disabled = disabled || approved;
      $('revise').hidden = approved;
      $('revise').disabled = disabled || approved;
      $('revise').textContent = stage === 'initial' ? '提取高分部分并试写' : '拆分重构并重新初审';
      $('confirm').hidden = !['second', 'final'].includes(stage);
      $('confirm').disabled = disabled || !['second', 'final'].includes(stage);
      $('confirm').textContent = stage === 'final' ? '确认终审通过' : '确认二审通过，进入终审';
      $('hint').textContent = approved ? '终审已确认。'
        : !ready ? '请先完成全部样本的试写和 AI 评分，再继续评审。'
          : state.busy ? '正在处理，请等待完成。'
            : stage === 'initial' ? '提取有效部分后，将使用同一场景试写并进行 AI 二审。'
              : stage === 'second' ? '查看二审评分后确认，AI 将对同样的正文再做一次终审。'
                : 'AI 终审已完成，请查看评分后确认，或填写意见继续重构。';
      const previous = task.review?.previousJudgement?.results || [];
      $('previous').hidden = !previous.length;
      // 使用正文记录标识匹配前后评分，匿名标签变化不会错配样本。
      $('scores').replaceChildren(...task.trialIds.filter(id => previous.some(result => result.trialId === id)).map(id => {
        const trial = state.trials.find(item => item.id === id);
        const before = previous.find(result => result.trialId === id);
        const after = task.judgement?.results.find(result => result.trialId === id);
        const row = root.ownerDocument.createElement('li');
        row.setAttribute('data-trial-id', id);
        row.textContent = `样本 ${trial?.sampleIndex || task.trialIds.indexOf(id) + 1}：上一阶段 ${before.score} 分，本阶段 ${after ? `${after.score} 分` : '尚未评分'}`;
        return row;
      }));
    }
    $('revise').addEventListener('click', () => {
      const task = current();
      if (!task || !['initial', 'second', 'final'].includes(task.review?.stage || 'initial')) return;
      const note = task.id === taskKey ? $('note').value : '';
      return run(() => controller.reviseTestTask(task.id, note));
    });
    $('confirm').addEventListener('click', () => {
      const task = current();
      if (!task || !['second', 'final'].includes(task.review?.stage)) return;
      return run(() => controller.confirmReview(task.id));
    });
    return { render };
  };
})();
