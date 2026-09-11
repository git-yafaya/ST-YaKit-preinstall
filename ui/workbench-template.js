(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.workbenchTemplate = `
    <div id="app-shell" class="app-shell">
      <nav id="sidebar" class="sidebar" role="tablist" aria-label="页面导航">
        <span class="nav-indicator" aria-hidden="true"></span>
        <button class="nav-item active" data-page="workbench" aria-current="page">工作台</button>
        <button class="nav-item" data-page="presets">预设展示</button>
        <button class="nav-item" data-page="trial">试写与反馈</button>
        <button class="nav-item" data-page="versions">版本记录</button>
        <button class="nav-item" data-page="settings">设置</button>
      </nav>
      <main>
      <div id="notice" class="notice" role="status" aria-live="polite" hidden></div>
      <div class="page-viewport"><div class="page-track">
      <div class="page-frame">
      <div id="workbench-page" class="page workbench" tabindex="-1">
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
          <div class="panel-content preset-picker"><button class="text-button" data-open-page="presets">查看并编辑预设条目 <span aria-hidden="true">→</span></button></div>
          <div class="draft-toolbar"><span id="draft-state">当前草稿</span><button id="copy" class="text-button">复制提示词 <span aria-hidden="true">⧉</span></button></div>
          <label for="draft" class="sr-only">提示词草稿</label><textarea id="draft" class="draft-editor" spellcheck="false" placeholder="先在左侧描述需求，生成第一版提示词。你也可以在这里直接开始写。"></textarea>
          <div class="editor-footer"><span id="draft-count">0 字</span></div>
          <div class="draft-save">
            ${workbench.presetSaveTemplate}
            <div class="save-row"><label for="version-label" class="sr-only">新版本名称</label><input id="version-label" placeholder="版本名称（选填）" maxlength="80"><button id="save-version" class="button button-secondary">保存为版本 <span aria-hidden="true">＋</span></button></div>
            <div class="draft-links"><button class="text-button" data-open-page="versions">查看版本记录</button><button class="text-button" data-open-page="trial">前往试写 <span aria-hidden="true">→</span></button></div>
          </div>
        </section>

      </div>
      </div>
      <div class="page-frame">${workbench.presetTemplate}</div>
      <div class="page-frame">${workbench.trialTemplate}</div>
      <div class="page-frame">${workbench.versionsTemplate}</div>
      <div class="page-frame">${workbench.settingsTemplate}</div>
      </div></div>
      </main>
    </div>
    <div id="busy-bar" class="busy-bar" role="status" hidden><span class="spinner"></span><span id="busy-text">正在生成…</span><button id="cancel" class="text-button">取消</button></div>
  `;
})();
