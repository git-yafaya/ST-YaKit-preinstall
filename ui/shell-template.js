export const shellTemplate = `
  <header class="app-toolbar" aria-label="工作台控制">
    <h1 class="app-brand"><span class="app-brand-icon" aria-hidden="true"></span>预设工作台</h1>
    <span id="yakit-wb-page-title" class="sr-only">工作台</span>
    <div id="yakit-wb-settings-actions" class="settings-header-actions" hidden>
      <button id="yakit-wb-settings-back" class="button button-secondary" type="button">返回</button>
      <button id="yakit-wb-settings-reset" class="button button-secondary" type="button" hidden>重置</button>
      <button id="yakit-wb-settings-delete" class="button button-secondary" type="button" hidden>删除</button>
      <button id="yakit-wb-settings-save" class="button button-primary" type="button">保存</button>
    </div>
    <button id="yakit-wb-workbench-close" class="button button-quiet" type="button" aria-label="关闭工作台" title="关闭工作台"><span aria-hidden="true">×</span></button>
  </header>
  <div id="yakit-wb-app"></div>
`;
