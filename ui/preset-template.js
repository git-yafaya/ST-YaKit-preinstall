(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.presetTemplate = `
    <div id="yakit-wb-presets-page" class="page" tabindex="-1" hidden>
      <section class="panel" aria-label="预设展示">
        <div class="panel-content preset-picker">
          <div class="field"><label for="yakit-wb-preset-name">Chat Completion 预设 <span id="yakit-wb-preset-entry-count" class="subtle-badge">0 个条目</span></label>
            <div class="save-row"><select id="yakit-wb-preset-name"></select><button type="button" id="yakit-wb-refresh-presets" class="button button-secondary">刷新列表</button><button type="button" id="yakit-wb-read-preset" class="button button-secondary">重新读取</button></div>
          </div>
          <p class="page-hint">展开条目即可编辑，点击「保存条目」写回预设。切换预设或重新读取时，未保存的编辑会保留在本次工作台中；刷新酒馆页面后不保留。载入草稿使用已读取的内容。</p>
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
