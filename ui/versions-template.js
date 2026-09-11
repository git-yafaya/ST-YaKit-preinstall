(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.versionsTemplate = `
    <section id="yakit-wb-versions-page" class="page panel versions-panel" aria-label="版本记录" tabindex="-1" hidden>
      <div class="panel-content">
        <div class="version-toolbar">
          <div class="field version-picker"><label for="yakit-wb-versions">选择提示词版本 <span class="version-count">共 <span id="yakit-wb-version-count">0</span> 个</span></label><select id="yakit-wb-versions"><option value="">尚未保存版本</option></select></div>
          <div class="version-actions"><button type="button" id="yakit-wb-export" class="button button-secondary">导出工作记录 <span aria-hidden="true">↗</span></button></div>
        </div>
        <p class="page-hint">选择后会载入该版本的提示词草稿。</p>
        <div id="yakit-wb-version-empty" class="version-empty">还没有保存的版本。先在工作台完成草稿，再保存为版本。</div>
        <section id="yakit-wb-version-details" class="version-details" aria-label="已保存的提示词" hidden>
          <h2 class="version-title"><span id="yakit-wb-version-title"></span><span id="yakit-wb-version-number" class="version-count"></span></h2>
          <div class="field"><label for="yakit-wb-saved-version-label">提示词名称</label><div class="save-row"><input id="yakit-wb-saved-version-label" maxlength="80" placeholder="输入提示词名称"><button type="button" id="yakit-wb-rename-version" class="button button-secondary">保存名称</button><button type="button" id="yakit-wb-delete-version" class="button button-secondary">删除提示词</button></div></div>
          <div id="yakit-wb-version-delete-confirmation" aria-live="polite" hidden><p id="yakit-wb-version-delete-message" class="page-hint"></p><div class="save-row"><button type="button" id="yakit-wb-confirm-delete-version" class="button button-primary">确认删除</button><button type="button" id="yakit-wb-cancel-delete-version" class="button button-secondary">取消</button></div></div>
          <p id="yakit-wb-version-created-at" class="page-hint"></p>
          <pre id="yakit-wb-version-content" class="version-content" tabindex="0"></pre>
        </section>
      </div>
    </section>`;
})();
