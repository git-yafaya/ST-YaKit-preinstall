(() => {
  const preview = globalThis.YaKitPreview ??= {};
  // 模板只放固定界面；用户输入和示例正文由视图用文本节点填入。
  preview.workbenchTemplate = `
    <header class="app-header">
      <a class="brand" href="#"><span class="brand-mark" aria-hidden="true">Y<span>·</span></span><span>YaKit<span class="brand-divider">/</span><strong>提示词工作台</strong></span></a>
      <div class="header-actions"><span class="demo-badge"><i></i>交互演示</span><button id="export" class="button button-quiet">导出工作记录 <span aria-hidden="true">↗</span></button></div>
    </header>
    <main>
      <section class="intro" aria-labelledby="page-title">
        <div><div class="eyebrow">PROMPT WORKBENCH</div><h1 id="page-title">把想要的效果，写进提示词。</h1><p>从预置示例开始，体验设计、试写与反馈的完整流程。</p></div>
        <div class="demo-note"><span class="note-icon" aria-hidden="true">✳</span><div><strong>先体验完整流程</strong><p>AI 操作展示预置示例。当前没有连接模型。</p></div></div>
      </section>
      <nav class="workflow" aria-label="工作流程">
        <a href="#design-panel"><span>01</span>设计提示词<small>说清你期待的表现</small></a><i aria-hidden="true">→</i>
        <a href="#trial-panel"><span>02</span>试写与反馈<small>读正文，判断效果</small></a><i aria-hidden="true">→</i>
        <a href="#versions-panel"><span>03</span>保留好版本<small>比较、修改、采用</small></a>
      </nav>
      <div id="notice" class="notice" role="status" aria-live="polite" hidden></div>
      <div class="workbench">
        <section id="design-panel" class="panel design-panel" aria-labelledby="design-title">
          <div class="panel-heading"><div><span class="section-kicker">WORKSHOP</span><h2 id="design-title">需求与修改</h2></div><span class="subtle-badge">工作台 AI</span></div>
          <div class="panel-content design-content">
            <div class="field"><label for="goal">你希望改善什么？</label><textarea id="goal" rows="3" placeholder="描述想要的写作效果，例如：NPC 只能知道亲眼见过或被告知的事情。"></textarea></div>
            <div class="example-hint"><span aria-hidden="true">↳</span><span>本次示例 · NPC 认知边界<br><small>避免全知视角，让猜测与事实分开。</small></span></div>
            <form id="design-form" class="composer">
              <label for="instruction" class="sr-only">补充要求或修改意见</label><textarea id="instruction" rows="2" placeholder="继续补充要求，或告诉工作台哪里需要修改…"></textarea>
              <div class="composer-actions"><span>预置示例演示</span><button id="design-button" class="button button-primary" type="submit">生成示例提示词 <span aria-hidden="true">↑</span></button></div>
            </form>
            <div class="conversation-label"><span>修改讨论</span><span>仅用于设计提示词</span></div>
            <div id="messages" class="messages" aria-live="polite"></div>
          </div>
        </section>
        <section class="panel draft-panel" aria-labelledby="draft-title">
          <div class="panel-heading"><div><span class="section-kicker">PROMPT</span><h2 id="draft-title">提示词草稿</h2></div><span class="editable-badge"><i></i>可直接编辑</span></div>
          <div class="draft-toolbar"><span id="draft-state">当前草稿</span><button id="copy" class="text-button">复制提示词 <span aria-hidden="true">⧉</span></button></div>
          <label for="draft" class="sr-only">提示词草稿</label><textarea id="draft" class="draft-editor" spellcheck="false" placeholder="先在左侧描述需求，生成第一版提示词。你也可以在这里直接开始写。"></textarea>
          <div class="editor-footer"><span id="draft-count">0 字</span><span>手动编辑后，保存为新版本</span></div>
          <section id="versions-panel" class="versions-section" aria-labelledby="versions-title">
            <div class="section-row"><h3 id="versions-title">版本记录 <span id="version-count">0</span></h3><span class="tiny-label">每次试写保留对应版本</span></div>
            <div class="version-picker"><label for="versions" class="sr-only">选择提示词版本</label><select id="versions"><option value="">尚未保存版本</option></select></div>
            <div class="save-row"><label for="version-label" class="sr-only">新版本名称</label><input id="version-label" placeholder="版本名称（选填）" maxlength="80"><button id="save-version" class="button button-secondary">保存为版本 <span aria-hidden="true">＋</span></button></div>
          </section>
        </section>
        <section id="trial-panel" class="panel trial-panel" aria-labelledby="trial-title">
          <div class="panel-heading"><div><span class="section-kicker">PLAYGROUND</span><h2 id="trial-title">试写与反馈</h2></div><span class="subtle-badge">正文 AI</span></div>
          <div class="trial-controls">
            <div class="environment"><span class="status-dot"></span><span id="context-label">示例写作场景</span><span>演示</span></div>
            <label for="trial-input">这次写什么场景？</label><textarea id="trial-input" rows="3" placeholder="写下这次要检验的角色、场景和互动。"></textarea>
            <div class="trial-actions"><span id="trial-version">先保存一个提示词版本</span><button id="trial-button" class="button button-primary">试写选中版本 <span aria-hidden="true">↗</span></button></div>
          </div>
          <div class="output-heading"><h3>试写正文</h3><label for="trials" class="sr-only">选择试写记录</label><select id="trials" aria-label="选择试写记录"><option value="">暂无试写</option></select></div>
          <div id="trial-empty" class="trial-empty"><span aria-hidden="true">Aa<span>✧</span></span><h3>从示例正文体验反馈流程</h3><p>保存草稿，点击「试写选中版本」。<br>阅读预置正文，再提交你的评价与修改意见。</p></div>
          <p id="trial-context" class="trial-context" hidden></p>
          <article id="trial-output" class="trial-output" tabindex="0" aria-label="试写正文，可选中片段作为反馈" hidden></article>
          <section id="feedback-section" class="feedback-section" aria-labelledby="feedback-title" hidden>
            <div class="section-row"><h3 id="feedback-title">这次效果如何？</h3><span class="tiny-label">由你来判断</span></div>
            <fieldset class="feedback-status"><legend class="sr-only">人工评价</legend><label><input type="radio" name="feedback-status" value="satisfied"><span>✓ 达到预期</span></label><label><input type="radio" name="feedback-status" value="revise"><span>↻ 还需修改</span></label></fieldset>
            <div class="quote-heading"><label for="excerpt">问题片段 <span>选填</span></label><button id="quote-selection" class="text-button">引用选中正文 ↙</button></div>
            <textarea id="excerpt" rows="2" placeholder="在正文中选中一句话后点击引用，也可以直接粘贴。"></textarea>
            <label for="feedback-note" class="sr-only">反馈与期望表现</label><textarea id="feedback-note" rows="3" placeholder="哪里符合预期，哪里还不对？你希望下一版如何表现？"></textarea>
            <div class="feedback-actions"><button id="save-feedback" class="button button-secondary">保存反馈</button><button id="revise" class="button button-primary">按反馈修改 <span aria-hidden="true">↗</span></button></div>
            <p id="feedback-state" class="feedback-state">尚未提交评价</p>
          </section>
        </section>
      </div>
      <footer class="page-footer"><span>YaKit · 让每一版提示词都有来由</span><span>设计 → 试写 → 人工反馈 → 下一版</span></footer>
    </main>
    <div id="busy-bar" class="busy-bar" role="status" hidden><span class="spinner"></span><span id="busy-text">正在准备示例…</span><button id="cancel" class="text-button">取消</button></div>
  `;
})();
