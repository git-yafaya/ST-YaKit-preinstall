(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.settingsTemplate = `
    <section id="settings-page" class="page panel settings-panel" aria-labelledby="settings-title" tabindex="-1" hidden>
      <div class="panel-heading"><div><span class="section-kicker">SETTINGS</span><h2 id="settings-title">设置</h2></div></div>
      <div class="panel-content settings-content">
        <div class="field"><label for="theme">界面主题</label><select id="theme"><option value="st">跟随 SillyTavern</option><option value="light">浅色</option><option value="dark">深色</option></select></div>
        <form id="settings-form" class="settings-form">
          <div class="field"><label for="design-api">工作台 AI</label><select id="design-api"><option value="main">主 API</option><option value="secondary">副 API</option></select></div>
          <div id="secondary-settings" class="settings-group" hidden>
            <div class="field"><label for="secondary-source">副 API 来源</label><select id="secondary-source"><option value="profile">已保存的连接配置</option><option value="custom">自定义 OpenAI 兼容接口</option></select></div>
            <div id="profile-settings" class="field"><label for="secondary-profile">连接配置</label><select id="secondary-profile"><option value="">选择连接配置</option></select></div>
            <div id="custom-settings" class="settings-group" hidden>
              <div class="field"><label for="secondary-url">接口地址</label><input id="secondary-url" type="url" placeholder="https://api.example.com/v1" autocomplete="off" spellcheck="false"></div>
              <div class="field"><label for="secondary-model">模型</label><input id="secondary-model" autocomplete="off" spellcheck="false"></div>
              <div class="field"><label for="secondary-key">API 密钥</label><input id="secondary-key" type="password" autocomplete="off" spellcheck="false"></div>
            </div>
          </div>
          <div class="settings-summary"><span>正文 AI</span><strong id="main-api-label">当前主 API</strong></div>
          <div class="settings-actions"><button id="save-settings" class="button button-primary" type="submit">保存设置</button></div>
        </form>
      </div>
    </section>`;
})();
