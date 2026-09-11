(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.workbenchTemplate = `
    <header class="app-header">
      <div class="brand"><span class="brand-mark" aria-hidden="true">Y<span>·</span></span><span>YaKit<span class="brand-divider">/</span><strong>提示词工作台</strong></span></div>
      <div class="header-actions"><button id="export" class="button button-quiet">导出工作记录 <span aria-hidden="true">↗</span></button></div>
    </header>
    <div class="app-shell">
      <nav class="sidebar" aria-label="页面导航">
        <button class="nav-item active" data-page="workbench" aria-current="page">工作台</button>
        <button class="nav-item" data-page="settings">设置</button>
      </nav>
      <main>
      <div id="notice" class="notice" role="status" aria-live="polite" hidden></div>
      <div id="workbench-page" class="workbench">
        <section id="design-panel" class="panel design-panel" aria-labelledby="design-title">
          <div class="panel-heading"><div><span class="section-kicker">WORKSHOP</span><h2 id="design-title">需求与修改</h2></div><span class="subtle-badge">工作台 AI</span></div>
          <div class="panel-content design-content">
            <div class="field"><label for="goal">你希望改善什么？</label><textarea id="goal" rows="3" placeholder="描述想要的写作效果，例如：NPC 只能知道亲眼见过或被告知的事情。"></textarea></div>
            <form id="design-form" class="composer">
              <label for="instruction" class="sr-only">补充要求或修改意见</label><textarea id="instruction" rows="2" placeholder="继续补充要求，或告诉工作台哪里需要修改…"></textarea>
              <div class="composer-actions"><button id="design-button" class="button button-primary" type="submit">生成提示词 <span aria-hidden="true">↑</span></button></div>
            </form>
            <div class="conversation-label"><span>修改讨论</span></div>
            <div id="messages" class="messages" aria-live="polite"></div>
          </div>
        </section>
        <section class="panel draft-panel" aria-labelledby="draft-title">
          <div class="panel-heading"><div><span class="section-kicker">PROMPT</span><h2 id="draft-title">提示词草稿</h2></div><span class="editable-badge"><i></i>可直接编辑</span></div>
          <div class="draft-toolbar"><span id="draft-state">当前草稿</span><button id="copy" class="text-button">复制提示词 <span aria-hidden="true">⧉</span></button></div>
          <label for="draft" class="sr-only">提示词草稿</label><textarea id="draft" class="draft-editor" spellcheck="false" placeholder="先在左侧描述需求，生成第一版提示词。你也可以在这里直接开始写。"></textarea>
          <div class="editor-footer"><span id="draft-count">0 字</span></div>
          <section id="versions-panel" class="versions-section" aria-labelledby="versions-title">
            <div class="section-row"><h3 id="versions-title">版本记录 <span id="version-count">0</span></h3></div>
            <div class="version-picker"><label for="versions" class="sr-only">选择提示词版本</label><select id="versions"><option value="">尚未保存版本</option></select></div>
            <div class="save-row"><label for="version-label" class="sr-only">新版本名称</label><input id="version-label" placeholder="版本名称（选填）" maxlength="80"><button id="save-version" class="button button-secondary">保存为版本 <span aria-hidden="true">＋</span></button></div>
          </section>
        </section>
        <section id="trial-panel" class="panel trial-panel" aria-labelledby="trial-title">
          <div class="panel-heading"><div><span class="section-kicker">PLAYGROUND</span><h2 id="trial-title">试写与反馈</h2></div><span class="subtle-badge">正文 AI</span></div>
          <div class="trial-controls">
            <div class="environment"><span class="status-dot"></span><span id="context-label">当前聊天</span><span>主 API</span></div>
            <label for="trial-input">这次写什么场景？</label><textarea id="trial-input" rows="3" placeholder="写下这次要检验的角色、场景和互动。"></textarea>
            <div class="trial-actions"><span id="trial-version">先保存一个提示词版本</span><button id="trial-button" class="button button-primary">试写选中版本 <span aria-hidden="true">↗</span></button></div>
          </div>
          <div class="output-heading"><h3>试写正文</h3><label for="trials" class="sr-only">选择试写记录</label><select id="trials" aria-label="选择试写记录"><option value="">暂无试写</option></select></div>
          <div id="trial-empty" class="trial-empty"><span aria-hidden="true">Aa<span>✧</span></span><h3>暂无试写正文</h3></div>
          <p id="trial-context" class="trial-context" hidden></p>
          <article id="trial-output" class="trial-output" tabindex="0" aria-label="试写正文，可选中片段作为反馈" hidden></article>
          <section id="feedback-section" class="feedback-section" aria-labelledby="feedback-title" hidden>
            <div class="section-row"><h3 id="feedback-title">这次效果如何？</h3></div>
            <fieldset class="feedback-status"><legend class="sr-only">人工评价</legend><label><input type="radio" name="feedback-status" value="satisfied"><span>✓ 达到预期</span></label><label><input type="radio" name="feedback-status" value="revise"><span>↻ 还需修改</span></label></fieldset>
            <div class="quote-heading"><label for="excerpt">问题片段 <span>选填</span></label><button id="quote-selection" class="text-button">引用选中正文 ↙</button></div>
            <textarea id="excerpt" rows="2" placeholder="在正文中选中一句话后点击引用，也可以直接粘贴。"></textarea>
            <label for="feedback-note" class="sr-only">反馈与期望表现</label><textarea id="feedback-note" rows="3" placeholder="哪里符合预期，哪里还不对？你希望下一版如何表现？"></textarea>
            <div class="feedback-actions"><button id="save-feedback" class="button button-secondary">保存反馈</button><button id="revise" class="button button-primary">按反馈修改 <span aria-hidden="true">↗</span></button></div>
            <p id="feedback-state" class="feedback-state">尚未提交评价</p>
          </section>
        </section>
      </div>
      ${workbench.settingsTemplate}
      </main>
    </div>
    <div id="busy-bar" class="busy-bar" role="status" hidden><span class="spinner"></span><span id="busy-text">正在生成…</span><button id="cancel" class="text-button">取消</button></div>
  `;
})();
