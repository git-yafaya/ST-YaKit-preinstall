(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.presetTemplate = `
    <div id="presets-page" class="page" tabindex="-1" hidden>
      <section class="panel" aria-labelledby="presets-title">
        <div class="panel-heading"><h2 id="presets-title">预设展示</h2><span id="preset-entry-count" class="subtle-badge">0 个条目</span></div>
        <div class="panel-content preset-picker">
          <div class="field"><label for="preset-name">Chat Completion 预设</label>
            <div class="save-row"><select id="preset-name"></select><button id="refresh-presets" class="text-button">刷新列表</button><button id="read-preset" class="text-button">重新读取</button></div>
          </div>
          <p class="page-hint">展开条目即可编辑，点击「保存条目」写回预设。切换预设或重新读取时，未保存的编辑会保留在本次工作台中；刷新酒馆页面后不保留。载入草稿使用已读取的内容。</p>
        </div>
        <div id="preset-entries" class="preset-entries panel-content"></div>
        <p id="preset-empty" class="panel-content page-hint">暂无条目，请选择预设后读取。</p>
      </section>
    </div>
  `;
  workbench.presetSaveTemplate = `
    <div class="preset-save">
      <p id="preset-source" class="page-hint" aria-live="polite">尚未载入预设条目</p>
      <button id="save-preset-entry" class="button button-secondary">保存到原条目</button>
    </div>
  `;
})();
