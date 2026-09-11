(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.presetTemplate = `
    <details class="preset-picker panel-content">
      <summary>读取酒馆预设条目</summary>
      <div class="settings-group">
        <div class="field"><label for="preset-name">Chat Completion 预设</label>
          <div class="save-row"><select id="preset-name"></select><button id="refresh-presets" class="text-button">刷新列表</button><button id="read-preset" class="text-button">重新读取</button></div>
        </div>
        <div class="field"><label for="preset-entry">预设条目</label>
          <div class="save-row"><select id="preset-entry" aria-describedby="preset-load-hint"></select><button id="load-preset-entry" class="button button-secondary">载入草稿</button></div>
        </div>
        <p id="preset-load-hint" class="page-hint">载入会替换当前草稿；修改后需点击「保存到原条目」才会写回预设。标记条目仅供查看。</p>
      </div>
    </details>
  `;
  workbench.presetSaveTemplate = `
    <div class="preset-save">
      <p id="preset-source" class="page-hint" aria-live="polite">尚未载入预设条目</p>
      <button id="save-preset-entry" class="button button-secondary">保存到原条目</button>
    </div>
  `;
})();
