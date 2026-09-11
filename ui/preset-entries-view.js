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
      const node = element('details', 'preset-entry');
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
      actions.append(save, load); body.append(input, hint, actions); node.append(summary, body);
      const editor = { node, name, role, input, hint, actions, save, load, content: entry.content, marker: entry.marker, edited: false };
      input.value = entry.content;
      input.addEventListener('input', () => {
        const state = controller.getState();
        editor.edited = Boolean(state.busy) || input.value !== editor.content;
        updateStatus(editor, state);
      });
      save.addEventListener('click', () => run(async () => {
        const content = input.value;
        await controller.savePresetContent(entry.identifier, content, editor.content);
        if (!controller.getState().error) {
          editor.content = content;
          editor.edited = input.value !== content;
        }
      }));
      load.addEventListener('click', () => run(async () => {
        await controller.loadPresetEntry(entry.identifier);
        if (!controller.getState().error) openPage('workbench');
      }));
      return editor;
    }
    function updateStatus(editor, state) {
      const changed = editor.input.value !== editor.content;
      editor.save.disabled = Boolean(state.busy) || editor.marker || !changed;
      editor.load.disabled = Boolean(state.busy) || editor.marker;
      editor.hint.textContent = editor.marker ? '标记条目由酒馆生成，仅供查看，不能编辑。' : changed ? '有修改待保存' : '与已读取内容一致';
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
        // 其他条目的保存结果不能改动本条旧基线，避免跳过原文冲突检查。
        if (!editor.edited) {
          if (editor.input.value !== entry.content) editor.input.value = entry.content;
          editor.content = entry.content;
        } else if (rebase) {
          // 明确重新读取后采用新基线，同时保留还没保存的输入。
          editor.content = entry.content;
          editor.edited = editor.input.value !== entry.content;
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
