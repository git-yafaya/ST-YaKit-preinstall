(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountPresetEntries = function mountPresetEntries(controller, root, { run, openPage }) {
    const document = root.ownerDocument;
    const list = root.querySelector('#yakit-wb-preset-entries');
    // 按预设保留原来的节点，切页、重读及保存其他条目不会清空输入或选区。
    const presets = new Map();
    function element(tag, className, text) {
      const node = document.createElement(tag);
      node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function createEditor(entry) {
      const node = element('div', 'preset-entry-row');
      const details = element('details', 'preset-entry');
      const summary = element('summary', 'preset-entry-summary button button-secondary');
      const name = element('span', 'preset-entry-name');
      const role = element('span', 'subtle-badge');
      summary.append(name, role);
      const body = element('div', 'preset-entry-body');
      const input = element('textarea', 'preset-entry-editor');
      input.rows = 8; input.spellcheck = false;
      const hint = element('p', 'page-hint');
      const actions = element('div', 'save-row');
      const save = element('button', 'button button-secondary', '保存条目');
      const load = element('button', 'button button-secondary', '载入草稿');
      save.type = load.type = 'button';
      const toggle = element('button', 'button button-secondary preset-entry-toggle');
      toggle.type = 'button'; toggle.setAttribute('role', 'switch');
      actions.append(save, load);
      const editor = { node, name, role, input, hint, actions, save, load, toggle, identifier: entry.identifier,
        entry, content: entry.content, savedContent: entry.content, marker: entry.marker, edited: false };
      editor.prompt = workbench.createPresetPromptView(controller, editor, { element, run, updateStatus });
      body.append(editor.prompt.row, input, editor.prompt.preview, hint, actions, editor.prompt.status);
      details.append(summary, body); node.append(details, toggle);
      input.value = entry.content;
      input.addEventListener('input', () => {
        const state = controller.getState();
        editor.edited = Boolean(state.busy) || input.value !== editor.content;
        updateStatus(editor, state);
      });
      save.addEventListener('click', () => run(async () => {
        const content = input.value;
        await controller.savePresetContent(entry.identifier, content, editor.savedContent);
        if (!controller.getState().error) {
          editor.content = editor.savedContent = content;
          editor.edited = input.value !== content;
        }
      }));
      load.addEventListener('click', () => run(async () => {
        await controller.loadPresetEntry(entry.identifier);
        if (!controller.getState().error) openPage('workbench');
      }));
      // 开关放在折叠控件外，点击和键盘操作都不会顺带展开条目。
      toggle.addEventListener('click', () => run(async () => {
        toggle.disabled = true;
        try { await controller.setPresetEntryEnabled(entry.identifier, !editor.entry.enabled); }
        finally { updateStatus(editor, controller.getState()); }
      }));
      return editor;
    }
    function updateStatus(editor, state) {
      const changed = editor.input.value !== editor.content;
      editor.save.disabled = Boolean(state.busy) || editor.marker || !changed;
      editor.load.disabled = Boolean(state.busy) || editor.marker;
      editor.hint.textContent = editor.marker ? '标记条目由酒馆生成，仅供查看，不能编辑。' : changed ? '有修改待保存' : '与已读取内容一致';
      editor.toggle.disabled = Boolean(state.busy) || !editor.entry.toggleable;
      editor.toggle.setAttribute('aria-checked', String(Boolean(editor.entry.enabled)));
      editor.toggle.setAttribute('aria-label', `${editor.entry.name}的启用状态`);
      editor.toggle.textContent = editor.entry.enabled ? '已开启' : '已关闭';
      editor.toggle.title = editor.entry.toggleReason || '保存此条目的启用状态';
      editor.prompt.render(state);
    }
    function render(state, rebase = false) {
      const entries = state.presetEntries || [];
      const presetName = state.selectedPresetName || '';
      if (!presets.has(presetName)) presets.set(presetName, new Map());
      const editors = presets.get(presetName), occurrences = new Map();
      const nodes = entries.map(entry => {
        const occurrence = occurrences.get(entry.identifier) || 0;
        occurrences.set(entry.identifier, occurrence + 1);
        const key = JSON.stringify([entry.identifier, occurrence]);
        if (!editors.has(key)) editors.set(key, createEditor(entry));
        const editor = editors.get(key);
        const override = state.presetPromptOverrides?.find(item => item.presetName === presetName && item.identifier === entry.identifier);
        const originalContent = override?.originalContent ?? entry.content;
        editor.entry = entry;
        // 其他条目的保存结果不能改动本条旧基线，避免跳过原文冲突检查。
        if (!editor.edited) {
          if (editor.input.value !== originalContent) editor.input.value = originalContent;
          editor.content = originalContent;
          editor.savedContent = entry.content;
        } else if (rebase) {
          // 明确重新读取后采用新基线，同时保留还没保存的输入。
          editor.content = originalContent;
          editor.savedContent = entry.content;
          editor.edited = editor.input.value !== originalContent;
        }
        editor.marker = entry.marker;
        editor.name.textContent = entry.name;
        editor.role.textContent = entry.role || '未指定角色';
        editor.input.setAttribute('aria-label', `${entry.name}的内容`);
        editor.input.readOnly = Boolean(entry.marker);
        editor.actions.hidden = Boolean(entry.marker);
        updateStatus(editor, state);
        return editor.node;
      });
      // 节点和顺序不变时不动 DOM，状态通知不会打断正在编辑的光标。
      if (nodes.length !== list.children.length || nodes.some((node, index) => node !== list.children[index])) list.replaceChildren(...nodes);
      root.querySelector('#yakit-wb-preset-entry-count').textContent = `${entries.length} 个条目`;
      root.querySelector('#yakit-wb-preset-empty').hidden = Boolean(entries.length);
    }
    return { render, rebase: state => render(state, true) };
  };
})();
