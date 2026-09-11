(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  // 这里只保留每条的预览选择；写回及原版记录由控制器处理。
  workbench.createPresetPromptView = function createPresetPromptView(controller, editor, { element, run, updateStatus }) {
    const row = element('div', 'save-row preset-prompt-picker');
    const select = element('select', '');
    const apply = element('button', 'button button-secondary', '应用提示词');
    apply.type = 'button';
    row.append(select, apply);
    const preview = element('textarea', 'preset-entry-editor');
    preview.rows = 8; preview.readOnly = true; preview.spellcheck = false;
    const status = element('p', 'page-hint');
    status.setAttribute('aria-live', 'polite');
    let selection, optionsKey = '';
    const currentValue = '__preset_current__';

    select.addEventListener('change', () => {
      selection = select.value;
      updateStatus(editor, controller.getState());
    });
    apply.addEventListener('click', () => run(async () => {
      await controller.applyPresetPrompt(editor.identifier, selection, editor.savedContent);
      const state = controller.getState();
      if (!state.error) {
        const entry = state.presetEntries.find(item => item.identifier === editor.identifier);
        const override = state.presetPromptOverrides?.find(item => item.presetName === state.selectedPresetName && item.identifier === editor.identifier);
        editor.savedContent = entry.content;
        editor.content = override?.originalContent ?? entry.content;
        editor.edited = editor.input.value !== editor.content;
      }
    }));

    function render(state) {
      const entry = editor.entry;
      const override = state.presetPromptOverrides?.find(item => item.presetName === state.selectedPresetName && item.identifier === editor.identifier);
      const stale = override && override.appliedContent !== entry.content;
      const versions = state.versions || [];
      const options = [{ id: '', label: '原版提示词', content: editor.content },
        ...versions.map(version => ({ ...version, label: `测试：${version.label}${version.number ? ` · 版本 ${version.number}` : ''}` }))];
      // 已删除的版本仍显示已应用的正文，原版也仍可切回。
      if (override && !versions.some(version => version.id === override.versionId)) {
        options.push({ id: override.versionId, label: '测试：已删除版本', content: override.appliedContent });
      }
      if (stale) options.push({ id: currentValue, label: '当前预设内容（已在外部修改）', content: entry.content });
      if (selection === undefined) selection = stale ? currentValue : override?.versionId || '';
      if (!options.some(option => option.id === selection)) selection = '';
      const nextKey = JSON.stringify(options.map(option => [option.id, option.label]));
      if (nextKey !== optionsKey) {
        optionsKey = nextKey;
        select.replaceChildren(...options.map(option => {
          const node = element('option', '', option.label);
          node.value = option.id;
          return node;
        }));
      }
      select.value = selection;
      const selected = options.find(option => option.id === selection);
      const original = selection === '';
      const changed = editor.input.value !== editor.content;
      if (preview.value !== selected.content) preview.value = selected.content;
      preview.setAttribute('aria-label', `${entry.name}的提示词预览`);
      select.setAttribute('aria-label', `${entry.name}的提示词来源`);
      editor.input.hidden = !original;
      editor.actions.hidden = !original || Boolean(entry.marker);
      editor.hint.hidden = !original;
      preview.hidden = original;
      row.hidden = status.hidden = Boolean(entry.marker);
      select.disabled = Boolean(state.busy);
      const unavailable = selection === currentValue || (selection && !versions.some(version => version.id === selection));
      apply.disabled = Boolean(state.busy) || entry.marker || changed || unavailable || selected.content === entry.content;
      status.textContent = stale ? '当前预设内容已在酒馆中修改，可选择「当前预设内容」查看。'
        : override ? `当前使用：${options.find(option => option.id === override.versionId)?.label || '测试提示词'}` : '当前使用：原版提示词';
      status.textContent += changed ? '；原版有未保存的编辑，请先保存再应用。' : '。选择仅预览，点击「应用提示词」后写回预设。';
    }
    return { row, preview, status, render };
  };
})();
