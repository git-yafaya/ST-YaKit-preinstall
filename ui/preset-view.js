(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountPresets = function mountPresets(controller, root, { run, openPage }) {
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    const entries = workbench.mountPresetEntries(controller, root, { run, openPage });
    let presetKey = '';
    $('refresh-presets').addEventListener('click', () => run(() => controller.refreshPresets()));
    async function readPreset() {
      await controller.readPreset($('preset-name').value);
      if (!controller.getState().error) entries.rebase(controller.getState());
    }
    $('preset-name').addEventListener('change', () => run(readPreset));
    $('read-preset').addEventListener('click', () => run(readPreset));
    $('copy-preset').addEventListener('click', () => run(() => controller.copyPreset()));

    function render(state) {
      const presets = state.presets || [];
      const nextPresets = JSON.stringify([presets, state.selectedPresetName]);
      if (presetKey !== nextPresets) {
        presetKey = nextPresets;
        const options = presets.map(item => new Option(item.name, item.name));
        // 刷新后目标被删除时仍标明正在展示的旧预设，避免误认其他预设。
        if (state.selectedPresetName && !presets.some(item => item.name === state.selectedPresetName)) options.unshift(new Option(`${state.selectedPresetName}（不在列表中）`, state.selectedPresetName));
        $('preset-name').replaceChildren(...(options.length ? options : [new Option('暂无可用预设', '')]));
      }
      $('preset-name').value = state.selectedPresetName || '';
      const busy = Boolean(state.busy);
      $('preset-name').disabled = busy || !presets.length;
      $('refresh-presets').disabled = busy;
      $('read-preset').disabled = busy || !state.selectedPresetName;
      $('copy-preset').disabled = busy || !state.selectedPresetName || !presets.some(item => item.name === state.selectedPresetName);
      entries.render(state);
    }
    return { render, focusEntry(identifier, quote) { openPage('presets', false); entries.focusEntry(identifier, quote); } };
  };
})();
