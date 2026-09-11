(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountPresets = function mountPresets(controller, root, { run }) {
    const $ = id => root.querySelector(`#${id}`);
    let presetKey = '', entryKey = '';
    $('refresh-presets').addEventListener('click', () => run(() => controller.refreshPresets()));
    // 选择后立即读取，选单中的预设名始终对应当前条目列表。
    $('preset-name').addEventListener('change', () => run(() => controller.readPreset($('preset-name').value)));
    $('read-preset').addEventListener('click', () => run(() => controller.readPreset($('preset-name').value)));
    $('preset-entry').addEventListener('change', () => render(controller.getState()));
    $('load-preset-entry').addEventListener('click', () => run(() => controller.loadPresetEntry($('preset-entry').value)));
    $('save-preset-entry').addEventListener('click', () => run(() => controller.savePresetEntry()));

    function render(state) {
      const presets = state.presets || [], entries = state.presetEntries || [];
      const nextPresets = JSON.stringify([presets, state.selectedPresetName]);
      if (presetKey !== nextPresets) {
        presetKey = nextPresets;
        $('preset-name').replaceChildren(...(presets.length ? presets.map(item => new Option(item.name, item.name)) : [new Option('暂无可用预设', '')]));
      }
      $('preset-name').value = state.selectedPresetName || '';
      const nextEntries = JSON.stringify([state.selectedPresetName, entries]);
      if (entryKey !== nextEntries) {
        entryKey = nextEntries;
        $('preset-entry').replaceChildren(new Option(entries.length ? '选择要修改的条目' : '暂无条目，请先读取预设', ''), ...entries.map(item => new Option(`${item.name}${item.marker ? ' · 标记条目' : ''}`, item.identifier)));
      }
      const entry = entries.find(item => item.identifier === $('preset-entry').value);
      const busy = Boolean(state.busy), source = state.presetSource;
      $('preset-name').disabled = busy || !presets.length;
      $('refresh-presets').disabled = busy;
      $('read-preset').disabled = busy || !state.selectedPresetName;
      $('preset-entry').disabled = busy || !entries.length;
      $('load-preset-entry').disabled = busy || !entry || Boolean(entry.marker);
      // 空内容也可保存，只比较原文快照，避免把清空条目误判为没有修改。
      $('save-preset-entry').disabled = busy || !source || state.draft === source.content;
      $('preset-source').textContent = source ? `当前来源：${source.presetName} / ${source.name}${state.draft === source.content ? ' · 与原条目一致' : ' · 有修改待保存'}` : '尚未载入预设条目';
    }
    return { render };
  };
})();
