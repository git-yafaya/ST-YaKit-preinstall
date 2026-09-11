(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountPresetSearch = function mountPresetSearch(controller, root, { run, focusEntry }) {
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    const document = root.ownerDocument;
    const results = $('preset-search-results'), button = $('preset-search-button'), input = $('instruction');
    let resultKey = '';
    function element(tag, className, text) {
      const node = document.createElement(tag);
      node.className = className;
      node.textContent = text;
      return node;
    }
    button.addEventListener('click', () => run(() => controller.searchPresetEntries(input.value)));
    input.addEventListener('input', () => render(controller.getState()));
    function render(state) {
      const searching = state.busy === 'preset-search';
      const presetName = state.selectedPresetName || '';
      const search = state.presetSearch;
      const current = !searching && search && search.presetName === presetName && search.goal === state.goal.trim() && search.instruction === input.value.trim();
      const matches = current ? search.results : [];
      const source = state.presetSource;
      $('preset-source').textContent = source ? `当前载入：${source.presetName} / ${source.name}` : '当前未载入预设条目，可在预设预览中选择「载入草稿」。';
      button.disabled = Boolean(state.busy) || (!state.goal.trim() && !input.value.trim()) || !presetName || !state.presetEntries?.length;
      button.textContent = searching ? '正在搜索…' : '搜索预设条目';
      input.disabled = searching;
      const scope = presetName ? `搜索范围：${presetName}（已读取条目，含关闭项）。` : '请先在预设预览中选择并读取预设。';
      $('preset-search-status').textContent = scope + (searching ? '正在查找相关原文…' : current ? matches.length ? `找到 ${matches.length} 条相关条目，点击索引查看原文。` : '未找到高或中相关度的条目，可补充需求后重试。' : '填写需求后搜索。');
      results.setAttribute('aria-busy', String(searching));
      // 状态通知不重建相同结果，保留索引按钮的键盘焦点。
      const nextKey = JSON.stringify([presetName, matches]);
      if (nextKey !== resultKey) {
        resultKey = nextKey;
        results.replaceChildren(...matches.map((match, index) => {
          const row = element('article', 'preset-search-result', '');
          const link = element('button', 'button button-secondary preset-search-index', `${index + 1}. ${match.name}`);
          link.type = 'button';
          link.setAttribute('aria-label', `索引 ${index + 1}：查看${match.name}的预设原文`);
          link.addEventListener('click', () => run(() => focusEntry(match.identifier, match.quote)));
          const relation = { supports: '支持', conflicts: '冲突', related: '间接影响' }[match.relation];
          const meta = element('p', 'page-hint', `${match.confidence === 'high' ? '高' : '中'}相关度 · ${relation} · ${match.enabled ? '已开启' : '已关闭'}`);
          const quote = element('blockquote', 'preset-search-quote', match.quote);
          const reason = element('p', 'page-hint', match.reason);
          row.append(link, meta, quote, reason);
          return row;
        }));
      }
    }
    return { render };
  };
})();
