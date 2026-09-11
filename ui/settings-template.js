(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.settingsTemplate = `
    <section id="settings-page" class="page settings-panel" aria-label="设置" tabindex="-1" hidden>
      <div class="settings-track">
        <div id="settings-primary" class="settings-body settings-content">
          <details class="panel settings-card"><summary class="button">界面设置</summary><div class="panel-content settings-group">
            <div class="field"><label for="theme">主题</label><select id="theme"><option value="forest">林系风</option><option value="st">跟随酒馆</option><option value="light">浅色</option><option value="dark">深色</option></select><p class="page-hint">选择界面配色，切换后即时生效。</p></div>
            <fieldset class="navigation-options"><legend>导航栏样式</legend><label><input type="radio" name="navigation-style" value="top"><span>上方</span></label><label><input type="radio" name="navigation-style" value="bottom"><span>下方</span></label></fieldset>
          </div></details>
          <details class="panel settings-card"><summary class="button">副 API</summary><div class="panel-content settings-group">
            <div class="field"><label for="design-api">工作台 AI</label><select id="design-api"><option value="main">主 API</option><option value="secondary">副 API</option></select></div>
            <div class="api-config-toolbar"><div class="field"><label for="api-config">使用配置</label><select id="api-config"></select></div><button id="api-add" type="button" class="button button-primary" aria-controls="settings-api-form">配置 API</button></div>
            <div id="api-config-list" class="api-config-list" role="group" aria-label="已保存的副 API"></div>
            <div class="settings-summary"><span>正文 AI</span><strong id="main-api-label">当前主 API</strong></div>
          </div></details>
          <details class="panel settings-card"><summary class="button">提示词</summary><div class="panel-content settings-group">
            <button id="prompt-builtin" type="button" class="panel settings-entry" aria-controls="settings-prompt-page">内置提示词</button>
            <button id="prompt-custom" type="button" class="panel settings-entry" aria-controls="settings-prompt-page">破限提示词</button>
          </div></details>
        </div>
        <div id="settings-secondary" class="settings-body" inert aria-hidden="true">
          <form id="settings-api-form" class="panel panel-content settings-group" aria-label="配置 API" hidden>
            <div class="field"><label for="api-profile">连接配置文件</label><select id="api-profile"></select><p id="api-profile-status" class="page-hint" role="status"></p></div>
            <p class="page-hint">选择酒馆连接配置，或填写 OpenAI 兼容接口地址与模型。</p>
            <div class="field"><label for="api-name">配置名称</label><input id="api-name" required placeholder="填写配置名称" autocomplete="off"></div>
            <div class="field"><label for="api-url">Base url</label><input id="api-url" type="url" placeholder="https://api.example.com/v1" autocomplete="off" spellcheck="false"></div>
            <div class="field"><label for="api-key">API-Key</label><input id="api-key" type="password" placeholder="填写 API-Key" autocomplete="off" spellcheck="false"></div>
            <button id="api-fetch-models" type="button" class="button button-primary">拉取模型</button>
            <p id="api-model-status" class="page-hint" role="status"></p>
            <div class="field"><label for="api-model-select">模型选择</label><select id="api-model-select"></select></div>
            <div class="field"><label for="api-model">模型名称</label><input id="api-model" placeholder="填写模型名称" autocomplete="off" spellcheck="false"></div>
          </form>
          <div id="settings-prompt-page" class="panel panel-content settings-group settings-prompt-page" hidden>
            <div class="field"><label id="prompt-label" for="prompt-text">提示词</label><textarea id="prompt-text" rows="14" spellcheck="false"></textarea></div>
            <p id="prompt-help" class="page-hint"></p><p id="prompt-status" class="page-hint" role="status"></p>
          </div>
        </div>
      </div>
    </section>`;
})();
