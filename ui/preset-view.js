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
    // 选择后立即读取，读取成功才更新本地编辑器的原文基线。
    $('preset-name').addEventListener('change', () => run(readPreset));
    $('read-preset').addEventListener('click', () => run(readPreset));
    $('save-preset-entry').addEventListener('click', () => run(() => controller.savePresetEntry()));

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
      const busy = Boolean(state.busy), source = state.presetSource;
      $('preset-name').disabled = busy || !presets.length;
      $('refresh-presets').disabled = busy;
      $('read-preset').disabled = busy || !state.selectedPresetName;
      // 空内容也可保存，只比较原文快照，避免把清空条目误判为没有修改。
      $('save-preset-entry').disabled = busy || !source || state.draft === source.content;
      $('preset-source').textContent = source ? `当前来源：${source.presetName} / ${source.name}${state.draft === source.content ? ' · 与原条目一致' : ' · 有修改待保存'}` : '尚未载入预设条目';
      entries.render(state);
    }
    return { render };
  };
})();
