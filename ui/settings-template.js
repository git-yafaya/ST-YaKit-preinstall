(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.promptTitles = { builtin: '破限提示词', design: '提示词生成与修改提示词', custom: '补充提示词', scenario: '场景生成提示词', judge: '裁判提示词', feedback: '反馈修订提示词', chatScenario: '聊天试写提示词' };
  workbench.settingsTemplate = `
    <section id="yakit-wb-settings-page" class="page settings-panel" aria-label="设置" tabindex="-1" hidden>
      <div class="settings-track">
        <div id="yakit-wb-settings-primary" class="settings-body settings-content">
          <details class="panel settings-card"><summary class="button">界面设置</summary><div class="panel-content settings-group">
            <div class="field"><label for="yakit-wb-theme">主题</label><select id="yakit-wb-theme"><option value="forest">林系风</option><option value="st">跟随酒馆</option><option value="light">浅色</option><option value="dark">深色</option></select></div>
            <fieldset class="navigation-options"><legend>导航栏样式</legend><label><input type="radio" name="yakit-wb-navigation-style" value="auto"><span>自动</span></label><label><input type="radio" name="yakit-wb-navigation-style" value="top"><span>上方</span></label><label><input type="radio" name="yakit-wb-navigation-style" value="bottom"><span>下方</span></label></fieldset>
          </div></details>
          <details class="panel settings-card"><summary class="button">副 API</summary><div class="panel-content settings-group">
            <div class="api-config-toolbar"><div class="field"><label for="yakit-wb-api-config">使用配置</label><select id="yakit-wb-api-config"></select></div><button id="yakit-wb-api-add" type="button" class="button button-primary" aria-controls="yakit-wb-settings-api-form">配置 API</button></div>
            <p class="page-hint">副 API 留空时沿用酒馆当前 API。</p>
            <div id="yakit-wb-api-config-list" class="api-config-list" role="group" aria-label="已保存的副 API"></div>
          </div></details>
          <details class="panel settings-card"><summary class="button">模块 API</summary><div class="panel-content settings-group">
            ${[['design', '提示词生成与修改'], ['presetSearch', '预设条目查找'], ['scenario', '冲突场景生成'], ['sample', '正文样本生成'], ['judge', 'AI 盲评']].map(([key, label]) => `<div class="field"><label for="yakit-wb-module-api-${key}">${label}</label><select id="yakit-wb-module-api-${key}"></select></div>`).join('')}
            <label class="test-toggle"><input id="yakit-wb-combine-design-scenario" type="checkbox" aria-labelledby="yakit-wb-combine-design-scenario-label" aria-describedby="yakit-wb-combine-design-scenario-hint"><span class="test-toggle-content"><span id="yakit-wb-combine-design-scenario-label">生成提示词后准备共用场景</span><span id="yakit-wb-combine-design-scenario-hint" class="page-hint">需在试写页选择 AI 场景；场景为空时单独生成一次，已有场景会沿用。各模块沿用上方 API 配置。</span></span></label>
          </div></details>
          <details class="panel settings-card"><summary class="button">内置提示词</summary><div class="panel-content settings-group">
            ${Object.entries(workbench.promptTitles).map(([kind, title]) => `<button id="yakit-wb-prompt-${kind}" type="button" class="panel settings-entry" aria-controls="yakit-wb-settings-prompt-page">${title}</button>`).join('')}
          </div></details>
        </div>
        <div id="yakit-wb-settings-secondary" class="settings-body" inert aria-hidden="true">
          <form id="yakit-wb-settings-api-form" class="panel settings-api-page" aria-label="配置 API" hidden>
            <div id="yakit-wb-settings-api-fields" class="panel-content settings-group settings-api-fields">
              <div class="field"><label for="yakit-wb-api-profile">连接配置文件</label><select id="yakit-wb-api-profile"></select><p id="yakit-wb-api-profile-status" class="page-hint" role="status"></p></div>
              <p class="page-hint">选择酒馆连接配置，或填写 OpenAI 兼容接口地址与模型；连接信息全部留空时沿用酒馆当前 API。</p>
              <div class="field"><label for="yakit-wb-api-name">配置名称</label><input id="yakit-wb-api-name" required placeholder="填写配置名称" autocomplete="off"></div>
              <div class="field"><label for="yakit-wb-api-url">Base url</label><input id="yakit-wb-api-url" type="url" placeholder="https://api.example.com/v1" autocomplete="off" spellcheck="false"></div>
              <div class="field"><label for="yakit-wb-api-key">API-Key</label><input id="yakit-wb-api-key" type="password" placeholder="填写 API-Key" autocomplete="off" spellcheck="false"></div>
              <button id="yakit-wb-api-fetch-models" type="button" class="button button-primary">拉取模型</button>
              <p id="yakit-wb-api-model-status" class="page-hint" role="status"></p>
              <div class="field"><label for="yakit-wb-api-model-select">模型选择</label><select id="yakit-wb-api-model-select"></select></div>
              <div class="field"><label for="yakit-wb-api-model">模型名称</label><input id="yakit-wb-api-model" placeholder="填写模型名称" autocomplete="off" spellcheck="false"></div>
            </div>
            <div id="yakit-wb-settings-api-footer" class="settings-api-footer">
              <div id="yakit-wb-settings-api-secondary-actions" class="settings-api-secondary-actions"></div>
            </div>
          </form>
          <div id="yakit-wb-settings-prompt-page" class="panel settings-prompt-page" hidden>
            <div id="yakit-wb-settings-prompt-fields" class="panel-content settings-group settings-prompt-fields">
              <div class="field"><label id="yakit-wb-prompt-label" for="yakit-wb-prompt-text">提示词</label><textarea id="yakit-wb-prompt-text" rows="14" spellcheck="false"></textarea></div>
              <p id="yakit-wb-prompt-help" class="page-hint"></p><p id="yakit-wb-prompt-status" class="page-hint" role="status"></p>
            </div>
            <div id="yakit-wb-settings-actions" class="settings-api-footer" hidden>
              <button id="yakit-wb-settings-back" class="button button-secondary" type="button">返回</button>
              <button id="yakit-wb-settings-reset" class="button button-secondary" type="button" hidden>重置</button>
              <button id="yakit-wb-settings-delete" class="button button-secondary" type="button" hidden>删除</button>
              <button id="yakit-wb-settings-save" class="button button-primary" type="button">保存</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;
})();
