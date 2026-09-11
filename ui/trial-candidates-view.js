(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  // 历史任务优先显示当时的名称，之后重命名提示词不会改变正文来源。
  workbench.trialSourceTitle = function(task, trial, versions = []) {
    const snapshot = task?.candidates?.find(item => item.versionId === trial?.versionId)
      || (task && (!task.candidates?.length || task.versionId === trial?.versionId) ? task : null);
    const version = versions.find(item => item.id === trial?.versionId);
    const label = snapshot?.versionLabel || version?.label || '已保存提示词';
    const number = snapshot?.versionNumber || version?.number;
    return `${label}${number ? ` · 版本 ${number}` : ''}`;
  };
  workbench.mountTrialCandidates = function(controller, root, { run, notify, versionTitle }) {
    const document = root.ownerDocument;
    const list = root.querySelector('#yakit-wb-test-versions');
    const hint = root.querySelector('#yakit-wb-test-versions-hint');
    let key = '';
    const selectedVersions = state => {
      const ids = state.testVersionIds?.length ? state.testVersionIds : [state.selectedVersionId];
      return ids.map(id => state.versions.find(item => item.id === id)).filter(Boolean);
    };
    function render(state) {
      const selected = selectedVersions(state), ids = selected.map(item => item.id);
      const nextKey = JSON.stringify([state.versions.map(item => [item.id, item.label, item.number]), ids, state.busy]);
      hint.textContent = state.versions.length ? `已选 ${selected.length} 份提示词；每份都使用下方同一个场景。` : '先在工作台保存提示词，再回到这里选择。';
      if (key === nextKey) return selected;
      key = nextKey;
      list.replaceChildren(...state.versions.map(version => {
        const label = document.createElement('label'), input = document.createElement('input'), text = document.createElement('span');
        label.className = 'test-toggle'; input.type = 'checkbox'; input.value = version.id;
        input.checked = ids.includes(version.id); input.disabled = Boolean(state.busy);
        text.textContent = versionTitle(version); label.append(input, text);
        input.addEventListener('change', () => run(() => {
          const current = selectedVersions(controller.getState()).map(item => item.id);
          const next = input.checked ? [...new Set([...current, version.id])] : current.filter(id => id !== version.id);
          if (!next.length) { input.checked = true; notify('至少保留一份待测提示词。', 'warning'); return; }
          return controller.update({ testVersionIds: next });
        }));
        return label;
      }));
      return selected;
    }
    return { render, selectedVersions };
  };
})();
