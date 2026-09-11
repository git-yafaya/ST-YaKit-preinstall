(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.settingsTemplate = `
    <section id="yakit-wb-settings-page" class="page settings-panel" aria-label="设置" tabindex="-1" hidden>
      <div class="settings-track">
        <div id="yakit-wb-settings-primary" class="settings-body settings-content">
          <details class="panel settings-card"><summary class="button">界面设置</summary><div class="panel-content settings-group">
            <div class="field"><label for="yakit-wb-theme">主题</label><select id="yakit-wb-theme"><option value="forest">林系风</option><option value="st">跟随酒馆</option><option value="light">浅色</option><option value="dark">深色</option></select><p class="page-hint">选择界面配色，切换后即时生效。</p></div>
            <fieldset class="navigation-options"><legend>导航栏样式</legend><label><input type="radio" name="yakit-wb-navigation-style" value="top"><span>上方</span></label><label><input type="radio" name="yakit-wb-navigation-style" value="bottom"><span>下方</span></label></fieldset>
          </div></details>
          <details class="panel settings-card"><summary class="button">副 API</summary><div class="panel-content settings-group">
            <div class="field"><label for="yakit-wb-design-api">工作台 AI</label><select id="yakit-wb-design-api"><option value="main">主 API</option><option value="secondary">副 API</option></select></div>
            <div class="api-config-toolbar"><div class="field"><label for="yakit-wb-api-config">使用配置</label><select id="yakit-wb-api-config"></select></div><button id="yakit-wb-api-add" type="button" class="button button-primary" aria-controls="yakit-wb-settings-api-form">配置 API</button></div>
            <div id="yakit-wb-api-config-list" class="api-config-list" role="group" aria-label="已保存的副 API"></div>
            <div class="settings-summary"><span>酒馆主 API</span><strong id="yakit-wb-main-api-label">当前主 API</strong></div>
          </div></details>
          <details class="panel settings-card"><summary class="button">模块 API</summary><div class="panel-content settings-group">
            <p class="page-hint">各环节可以使用不同连接；选择「沿用工作台 AI」时，使用上方工作台 AI 的设置。</p>
            ${[['design', '提示词生成与修改'], ['scenario', '冲突场景生成'], ['sample', '正文样本生成'], ['judge', 'AI 盲评']].map(([key, label]) => `<div class="field"><label for="yakit-wb-module-api-${key}">${label}</label><select id="yakit-wb-module-api-${key}"></select></div>`).join('')}
            <label class="test-toggle"><input id="yakit-wb-combine-design-scenario" type="checkbox"><span>生成提示词时，一次请求同时生成冲突场景</span></label>
            <p class="page-hint">先在试写页选择 AI 场景，并为提示词与场景指定同一个 API；开启后，一次请求同时返回提示词和场景。</p>
          </div></details>
          <details class="panel settings-card"><summary class="button">提示词</summary><div class="panel-content settings-group">
            <button id="yakit-wb-prompt-builtin" type="button" class="panel settings-entry" aria-controls="yakit-wb-settings-prompt-page">内置提示词</button>
            <button id="yakit-wb-prompt-custom" type="button" class="panel settings-entry" aria-controls="yakit-wb-settings-prompt-page">破限提示词</button>
          </div></details>
        </div>
        <div id="yakit-wb-settings-secondary" class="settings-body" inert aria-hidden="true">
          <form id="yakit-wb-settings-api-form" class="panel panel-content settings-group" aria-label="配置 API" hidden>
            <div class="field"><label for="yakit-wb-api-profile">连接配置文件</label><select id="yakit-wb-api-profile"></select><p id="yakit-wb-api-profile-status" class="page-hint" role="status"></p></div>
            <p class="page-hint">选择酒馆连接配置，或填写 OpenAI 兼容接口地址与模型。</p>
            <div class="field"><label for="yakit-wb-api-name">配置名称</label><input id="yakit-wb-api-name" required placeholder="填写配置名称" autocomplete="off"></div>
            <div class="field"><label for="yakit-wb-api-url">Base url</label><input id="yakit-wb-api-url" type="url" placeholder="https://api.example.com/v1" autocomplete="off" spellcheck="false"></div>
            <div class="field"><label for="yakit-wb-api-key">API-Key</label><input id="yakit-wb-api-key" type="password" placeholder="填写 API-Key" autocomplete="off" spellcheck="false"></div>
            <button id="yakit-wb-api-fetch-models" type="button" class="button button-primary">拉取模型</button>
            <p id="yakit-wb-api-model-status" class="page-hint" role="status"></p>
            <div class="field"><label for="yakit-wb-api-model-select">模型选择</label><select id="yakit-wb-api-model-select"></select></div>
            <div class="field"><label for="yakit-wb-api-model">模型名称</label><input id="yakit-wb-api-model" placeholder="填写模型名称" autocomplete="off" spellcheck="false"></div>
          </form>
          <div id="yakit-wb-settings-prompt-page" class="panel panel-content settings-group settings-prompt-page" hidden>
            <div class="field"><label id="yakit-wb-prompt-label" for="yakit-wb-prompt-text">提示词</label><textarea id="yakit-wb-prompt-text" rows="14" spellcheck="false"></textarea></div>
            <p id="yakit-wb-prompt-help" class="page-hint"></p><p id="yakit-wb-prompt-status" class="page-hint" role="status"></p>
          </div>
        </div>
      </div>
    </section>`;
})();
