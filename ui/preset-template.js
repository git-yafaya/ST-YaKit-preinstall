(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.presetTemplate = `
    <div id="yakit-wb-presets-page" class="page" tabindex="-1" hidden>
      <section class="panel" aria-label="预设预览">
        <div class="panel-content preset-picker">
          <div class="field"><label for="yakit-wb-preset-name">Chat Completion 预设 <span id="yakit-wb-preset-entry-count" class="subtle-badge">0 个条目</span></label>
            <div class="save-row"><select id="yakit-wb-preset-name"></select><button type="button" id="yakit-wb-refresh-presets" class="button button-secondary">刷新列表</button><button type="button" id="yakit-wb-read-preset" class="button button-secondary">重新读取</button><button type="button" id="yakit-wb-copy-preset" class="button button-secondary">复制预设</button></div>
          </div>
          <p class="page-hint">选择提示词仅预览，点击「应用提示词」后写入预设。未保存的编辑在刷新后丢失。「载入草稿」与「复制预设」使用已保存内容；复制后切换到副本。</p>
        </div>
        <div id="yakit-wb-preset-entries" class="preset-entries panel-content"></div>
        <p id="yakit-wb-preset-empty" class="panel-content page-hint">暂无条目，请选择预设后读取。</p>
      </section>
    </div>
  `;
})();
