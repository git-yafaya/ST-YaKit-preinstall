(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.presetTemplate = `
    <div id="yakit-wb-presets-page" class="page" tabindex="-1" hidden>
      <section class="panel" aria-label="预设预览">
        <div class="panel-content preset-picker">
          <div class="field"><label for="yakit-wb-preset-name">Chat Completion 预设 <span id="yakit-wb-preset-entry-count" class="subtle-badge">0 个条目</span></label>
            <div class="save-row"><select id="yakit-wb-preset-name"></select><button type="button" id="yakit-wb-refresh-presets" class="button button-secondary">刷新列表</button><button type="button" id="yakit-wb-read-preset" class="button button-secondary">重新读取</button><button type="button" id="yakit-wb-copy-preset" class="button button-secondary">复制预设</button></div>
          </div>
          <p class="page-hint">每条可独立开关，并选择原版或已保存的测试提示词搭配使用。选择后先预览，点击「应用提示词」写回预设；原版可编辑并保存。未保存的编辑会保留在本次工作台中，刷新酒馆页面后不保留。「载入草稿」使用当前预设中已保存的内容。「复制预设」复制已保存的内容，命名为「原名-试作1」并按已有最大编号递增，完成后切换到副本。</p>
        </div>
        <div id="yakit-wb-preset-entries" class="preset-entries panel-content"></div>
        <p id="yakit-wb-preset-empty" class="panel-content page-hint">暂无条目，请选择预设后读取。</p>
      </section>
    </div>
  `;
  workbench.presetSaveTemplate = `
    <div class="preset-save">
      <p id="yakit-wb-preset-source" class="page-hint" aria-live="polite">尚未载入预设条目</p>
      <button type="button" id="yakit-wb-save-preset-entry" class="button button-secondary">保存到原条目</button>
    </div>
  `;
})();
