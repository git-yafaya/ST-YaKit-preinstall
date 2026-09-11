(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.workbenchTemplate = `
    <div id="yakit-wb-app-shell" class="app-shell">
      <nav id="yakit-wb-sidebar" class="sidebar" role="tablist" aria-label="页面导航">
        <span class="nav-indicator" aria-hidden="true"></span>
        <button type="button" class="nav-item" data-page="presets"><span class="nav-icon" aria-hidden="true">☷</span><span class="nav-label">预设预览</span></button>
        <button type="button" class="nav-item active" data-page="workbench" aria-current="page"><span class="nav-icon" aria-hidden="true">✦</span><span class="nav-label">工作台</span></button>
        <button type="button" class="nav-item" data-page="trial"><span class="nav-icon" aria-hidden="true">✎</span><span class="nav-label">试写与反馈</span></button>
        <button type="button" class="nav-item" data-page="versions"><span class="nav-icon" aria-hidden="true">◷</span><span class="nav-label">版本记录</span></button>
        <button type="button" class="nav-item" data-page="settings"><span class="nav-icon" aria-hidden="true">⚙</span><span class="nav-label">设置</span></button>
      </nav>
      <main>
      <div class="page-viewport"><div class="page-track">
      <div class="page-frame">${workbench.presetTemplate}</div>
      <div class="page-frame">
      <div id="yakit-wb-workbench-page" class="page workbench" tabindex="-1">
        <section id="yakit-wb-design-panel" class="panel design-panel" aria-label="需求与修改">
          <div class="panel-content design-content">
            <div class="field"><label for="yakit-wb-goal">你希望改善什么？</label><textarea id="yakit-wb-goal" rows="3" placeholder="描述想要的写作效果，例如：NPC 只能知道亲眼见过或被告知的事情。"></textarea></div>
            <form id="yakit-wb-design-form" class="composer">
              <label for="yakit-wb-instruction" class="sr-only">补充要求或修改意见</label><textarea id="yakit-wb-instruction" rows="2" placeholder="继续补充要求，或告诉工作台哪里需要修改…"></textarea>
              <div class="composer-actions">
                <label for="yakit-wb-design-count" class="design-count">生成数量<input id="yakit-wb-design-count" type="number" min="1" max="9007199254740991" step="1" value="1" required aria-describedby="yakit-wb-design-count-hint"></label>
                <button id="yakit-wb-design-button" class="button button-primary" type="submit">生成提示词 <span aria-hidden="true">↑</span></button>
                <p id="yakit-wb-design-count-hint" class="page-hint">多条同时生成，结果可在版本记录切换。</p>
              </div>
            </form>
          </div>
        </section>
        <section class="panel discussion-panel" aria-label="修改讨论">
          <div class="panel-content discussion-content">
            <div class="conversation-label"><span>修改讨论</span></div>
            <div id="yakit-wb-messages" class="messages" aria-live="polite"></div>
          </div>
        </section>

      </div>
      </div>
      <div class="page-frame">${workbench.trialTemplate}</div>
      <div class="page-frame">${workbench.versionsTemplate}</div>
      <div class="page-frame">${workbench.settingsTemplate}</div>
      </div></div>
      </main>
    </div>
    <div id="yakit-wb-busy-bar" class="busy-bar" role="status" hidden><span class="spinner"></span><span id="yakit-wb-busy-text">正在生成…</span><button type="button" id="yakit-wb-cancel" class="button button-secondary">取消</button></div>
  `;
})();
