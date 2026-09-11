(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.versionsTemplate = `
    <section id="yakit-wb-versions-page" class="page panel versions-panel" aria-label="版本记录" tabindex="-1" hidden>
      <div class="panel-content">
        <div class="version-toolbar">
          <div class="field version-picker"><label for="yakit-wb-versions">选择提示词版本 <span class="version-count">共 <span id="yakit-wb-version-count">0</span> 个</span></label><select id="yakit-wb-versions"><option value="">尚未保存版本</option></select></div>
          <div class="version-actions"><button type="button" id="yakit-wb-export" class="button button-secondary">导出工作记录 <span aria-hidden="true">↗</span></button><button type="button" class="button button-secondary" data-open-page="workbench">返回编辑</button><button type="button" class="button button-primary" data-open-page="trial">前往试写 <span aria-hidden="true">→</span></button></div>
        </div>
        <p class="page-hint">选择后会载入该版本的提示词草稿。</p>
        <div id="yakit-wb-version-empty" class="version-empty">还没有保存的版本。先在工作台完成草稿，再保存为版本。</div>
        <section id="yakit-wb-version-details" class="version-details" aria-label="已保存的提示词" hidden>
          <p id="yakit-wb-version-created-at" class="page-hint"></p>
          <pre id="yakit-wb-version-content" class="version-content" tabindex="0"></pre>
        </section>
      </div>
    </section>`;
})();
