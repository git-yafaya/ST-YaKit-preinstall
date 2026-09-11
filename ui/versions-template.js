(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.versionsTemplate = `
    <section id="versions-page" class="page panel versions-panel" aria-labelledby="versions-title" tabindex="-1" hidden>
      <div class="panel-heading"><div><span class="section-kicker">VERSIONS</span><h2 id="versions-title">版本记录 <span id="version-count" class="version-count">0</span></h2></div><button id="export" class="button button-quiet">导出工作记录 <span aria-hidden="true">↗</span></button></div>
      <div class="panel-content">
        <div class="version-toolbar">
          <div class="field version-picker"><label for="versions">选择提示词版本</label><select id="versions"><option value="">尚未保存版本</option></select></div>
          <div class="version-actions"><button class="button button-secondary" data-open-page="workbench">返回编辑</button><button class="button button-primary" data-open-page="trial">前往试写 <span aria-hidden="true">→</span></button></div>
        </div>
        <p class="page-hint">选择后会载入该版本的提示词草稿。</p>
        <div id="version-empty" class="version-empty">还没有保存的版本。先在工作台完成草稿，再保存为版本。</div>
        <section id="version-details" class="version-details" aria-label="已保存的提示词" hidden>
          <p id="version-created-at" class="page-hint"></p>
          <pre id="version-content" class="version-content" tabindex="0"></pre>
        </section>
      </div>
    </section>`;
})();
