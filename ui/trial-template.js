(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.trialTemplate = `
    <div id="trial-page" class="page" tabindex="-1" hidden>
      <section id="trial-panel" class="panel trial-panel" aria-label="试写与反馈">
          <div class="trial-controls">
            <div class="environment"><span class="status-dot"></span><span id="context-label">当前聊天</span><span>主 API</span></div>
            <label for="trial-input">这次写什么场景？</label><textarea id="trial-input" rows="3" placeholder="写下这次要检验的角色、场景和互动。"></textarea>
            <div class="trial-actions"><span id="trial-version">先保存一个提示词版本</span><button type="button" id="trial-button" class="button button-primary">试写选中版本 <span aria-hidden="true">↗</span></button></div>
          </div>
          <div class="trial-reading">
            <section class="trial-result" aria-label="试写结果">
          <div class="output-heading"><h3>试写正文</h3><label for="trials" class="sr-only">选择试写记录</label><select id="trials" aria-label="选择试写记录"><option value="">暂无试写</option></select></div>
          <div id="trial-empty" class="trial-empty"><span aria-hidden="true">Aa<span>✧</span></span><h3>暂无试写正文</h3></div>
          <p id="trial-context" class="trial-context" hidden></p>
          <article id="trial-output" class="trial-output" tabindex="0" aria-label="试写正文，可选中片段作为反馈" hidden></article>
            </section>
            <section id="feedback-section" class="feedback-section" aria-labelledby="feedback-title" hidden>
            <div class="section-row"><h3 id="feedback-title">这次效果如何？</h3></div>
            <fieldset class="feedback-status"><legend class="sr-only">人工评价</legend><label><input type="radio" name="feedback-status" value="satisfied"><span class="button button-secondary">✓ 达到预期</span></label><label><input type="radio" name="feedback-status" value="revise"><span class="button button-secondary">↻ 还需修改</span></label></fieldset>
            <div class="quote-heading"><label for="excerpt">问题片段 <span>选填</span></label><button type="button" id="quote-selection" class="button button-secondary">引用选中正文 ↙</button></div>
            <textarea id="excerpt" rows="2" placeholder="在正文中选中一句话后点击引用，也可以直接粘贴。"></textarea>
            <label for="feedback-note" class="sr-only">反馈与期望表现</label><textarea id="feedback-note" rows="3" placeholder="哪里符合预期，哪里还不对？你希望下一版如何表现？"></textarea>
            <div class="feedback-actions"><button type="button" class="button button-secondary" data-open-page="workbench">返回编辑</button><button type="button" id="save-feedback" class="button button-secondary">保存反馈</button><button type="button" id="revise" class="button button-primary">按反馈修改 <span aria-hidden="true">↗</span></button></div>
            <p id="feedback-state" class="feedback-state">尚未提交评价</p>
            </section>
          </div>
      </section>
    </div>`;
})();
