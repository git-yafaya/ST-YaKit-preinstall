(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.trialTemplate = `
    <div id="yakit-wb-trial-page" class="page" tabindex="-1" hidden>
      <section id="yakit-wb-trial-panel" class="panel trial-panel" aria-label="试写与反馈">
          <div class="trial-controls">
            <div class="environment"><span class="status-dot"></span><span id="yakit-wb-context-label">空卡测试</span><span id="yakit-wb-sample-api-label">主 API</span></div>
            <div class="test-options">
              <label class="test-toggle"><input id="yakit-wb-empty-card" type="checkbox" checked><span>空卡模式：仅使用提示词和场景</span></label>
              <div class="field"><label for="yakit-wb-scene-source">场景来源</label><select id="yakit-wb-scene-source"><option value="manual">手动填写</option><option value="ai">AI 生成冲突场景</option></select></div>
              <div class="field"><label for="yakit-wb-sample-count">独立样本数</label><select id="yakit-wb-sample-count">${[1, 2, 3, 4, 5, 6].map(count => `<option value="${count}" ${count === 3 ? 'selected' : ''}>${count} 个样本</option>`).join('')}</select></div>
              <div class="field"><label for="yakit-wb-sample-mode">样本请求方式</label><select id="yakit-wb-sample-mode"><option value="parallel">独立请求</option><option value="single">单次请求返回 n 个样本</option></select></div>
            </div>
            <p id="yakit-wb-sample-mode-hint" class="page-hint">每个样本独立生成，使用同一份提示词和固定场景。</p>
            <div class="quote-heading"><label for="yakit-wb-trial-input">固定测试场景</label><button type="button" id="yakit-wb-generate-scenario" class="button button-secondary">生成冲突场景</button></div>
            <textarea id="yakit-wb-trial-input" rows="3" placeholder="写下能检验要求的冲突场景。选择 AI 场景后，留空可在创建任务时自动生成。"></textarea>
            <p id="yakit-wb-scenario-hint" class="page-hint" hidden>可先生成并编辑；场景留空时，开始测试会自动生成。已有场景会沿用。</p>
            <p class="page-hint">创建后自动生成样本并进行盲评。</p>
            <div class="trial-actions"><span id="yakit-wb-trial-version">先保存一个提示词版本</span><button type="button" id="yakit-wb-trial-button" class="button button-primary">创建测试任务 <span aria-hidden="true">↗</span></button></div>
          </div>
          <div class="test-task-bar">
            <div class="field"><label for="yakit-wb-test-tasks">测试任务</label><select id="yakit-wb-test-tasks"><option value="">暂无测试任务</option></select></div>
            <p id="yakit-wb-task-status" class="page-hint" role="status"></p>
            <details id="yakit-wb-task-snapshot" class="message-prompt" hidden><summary class="button button-secondary">查看本次原始需求与固定场景</summary><div><h3>原始需求</h3><p id="yakit-wb-task-goal" class="test-snapshot-text"></p><h3>固定场景</h3><p id="yakit-wb-task-scene" class="test-snapshot-text"></p></div></details>
            <div id="yakit-wb-judge-actions" class="test-options" hidden><label class="test-toggle"><input id="yakit-wb-score-order" type="checkbox" checked><span>按 AI 推荐顺序查看</span></label><button type="button" id="yakit-wb-judge-task" class="button button-secondary">重新盲评现有样本</button></div>
            <p class="page-hint">AI 评分用于初筛，最终由你选择最喜欢的样本；重评会保留正文与人工反馈。</p>
          </div>
          <div class="trial-reading">
            <section class="trial-result" aria-label="试写结果">
          <div class="output-heading"><h3>样本正文</h3><label for="yakit-wb-trials" class="sr-only">选择样本</label><select id="yakit-wb-trials" aria-label="选择样本"><option value="">暂无试写</option></select></div>
          <div id="yakit-wb-trial-empty" class="trial-empty"><span aria-hidden="true">Aa<span>✧</span></span><h3>暂无样本正文</h3></div>
          <p id="yakit-wb-trial-context" class="trial-context" hidden></p>
          <section id="yakit-wb-sample-score" class="sample-score" aria-label="AI 盲评结果" hidden><strong id="yakit-wb-score-label"></strong><p id="yakit-wb-score-reason"></p><ul id="yakit-wb-score-violations"></ul></section>
          <article id="yakit-wb-trial-output" class="trial-output" tabindex="0" aria-label="试写正文，可选中片段作为反馈" hidden></article>
            </section>
            <section id="yakit-wb-feedback-section" class="feedback-section" aria-labelledby="yakit-wb-feedback-title" hidden>
            <div class="section-row"><h3 id="yakit-wb-feedback-title">这次效果如何？</h3><button type="button" id="yakit-wb-prefer-trial" class="button button-secondary" aria-pressed="false">选为最喜欢</button></div>
            <fieldset class="feedback-status"><legend class="sr-only">人工评价</legend><label><input type="radio" name="yakit-wb-feedback-status" value="satisfied"><span class="button button-secondary">✓ 达到预期</span></label><label><input type="radio" name="yakit-wb-feedback-status" value="revise"><span class="button button-secondary">↻ 还需修改</span></label></fieldset>
            <div class="quote-heading"><label for="yakit-wb-excerpt">问题片段 <span>选填</span></label><button type="button" id="yakit-wb-quote-selection" class="button button-secondary">引用选中正文 ↙</button></div>
            <textarea id="yakit-wb-excerpt" rows="2" placeholder="在正文中选中一句话后点击引用，也可以直接粘贴。"></textarea>
            <label for="yakit-wb-feedback-note" class="sr-only">反馈与期望表现</label><textarea id="yakit-wb-feedback-note" rows="3" placeholder="哪里符合预期，哪里还不对？你希望下一版如何表现？"></textarea>
            <div class="feedback-actions"><button type="button" class="button button-secondary" data-open-page="workbench">返回编辑</button><button type="button" id="yakit-wb-save-feedback" class="button button-secondary">保存反馈</button><button type="button" id="yakit-wb-revise" class="button button-primary">按反馈修改 <span aria-hidden="true">↗</span></button></div>
            <p id="yakit-wb-feedback-state" class="feedback-state">尚未提交评价</p>
            </section>
          </div>
      </section>
    </div>`;
})();
