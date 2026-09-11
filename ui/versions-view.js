(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountVersions = function mountVersions(controller, root, { run }) {
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    const title = version => `${version.label} · 版本 ${version.number}`;
    let versionKey = '', selectedId = '', selectedLabel = '', pendingDeleteId = '';

    $('versions').addEventListener('change', () => run(() => controller.selectVersion($('versions').value)));
    $('rename-version').addEventListener('click', () => run(() => controller.renameVersion(controller.getState().selectedVersionId, $('saved-version-label').value)));
    $('delete-version').addEventListener('click', () => {
      const state = controller.getState();
      if (state.busy || !state.selectedVersionId) return;
      pendingDeleteId = state.selectedVersionId;
      render(state);
      $('cancel-delete-version').focus();
    });
    $('cancel-delete-version').addEventListener('click', () => {
      pendingDeleteId = '';
      render(controller.getState());
      $('delete-version').focus();
    });
    $('confirm-delete-version').addEventListener('click', () => {
      const state = controller.getState(), id = pendingDeleteId;
      pendingDeleteId = '';
      render(state);
      if (!id || state.busy || state.selectedVersionId !== id) return;
      return run(async () => {
        await controller.deleteVersion(id);
        render(controller.getState());
        ($('versions').disabled ? $('versions-page') : $('versions')).focus();
      });
    });

    function render(state) {
      const version = state.versions.find(item => item.id === state.selectedVersionId);
      const busy = Boolean(state.busy);
      if (busy || pendingDeleteId !== version?.id) pendingDeleteId = '';
      $('versions').disabled = busy || !state.versions.length;
      $('version-count').textContent = state.versions.length;
      ['saved-version-label', 'rename-version', 'delete-version', 'confirm-delete-version'].forEach(id => { $(id).disabled = busy || !version; });
      $('version-delete-confirmation').hidden = !pendingDeleteId;
      const relatedTrials = pendingDeleteId ? state.trials.filter(item => item.versionId === pendingDeleteId).length : 0;
      $('version-delete-message').textContent = pendingDeleteId ? `删除「${title(version)}」？将同时删除 ${relatedTrials} 条试写及其反馈；当前草稿会保留。` : '';

      // 普通重绘保留正在输入的名称；切换版本时才载入对应名称。
      if (selectedId !== (version?.id || '') || selectedLabel !== (version?.label || '')) {
        $('saved-version-label').value = version?.label || '';
        selectedId = version?.id || ''; selectedLabel = version?.label || '';
      }
      const nextVersionKey = JSON.stringify([state.versions, state.selectedVersionId]);
      if (versionKey === nextVersionKey) return;
      versionKey = nextVersionKey;
      const options = state.versions.map(item => new Option(title(item), item.id));
      $('versions').replaceChildren(...(options.length ? options : [new Option('尚未保存版本', '')]));
      $('versions').value = state.selectedVersionId || '';
      $('version-empty').hidden = Boolean(version);
      $('version-empty').textContent = state.versions.length ? '选择一个提示词，查看内容或重新试写。' : '还没有保存的版本。先在工作台完成草稿，再保存为版本。';
      $('version-details').hidden = !version;
      $('version-title').textContent = version?.label || '';
      $('version-number').textContent = version ? `版本 ${version.number}` : '';
      $('version-content').textContent = version?.content || '';
      const savedAt = new Date(version?.createdAt || '');
      $('version-created-at').textContent = !version ? '' : Number.isNaN(savedAt.getTime()) ? '未记录保存时间' : `保存于 ${savedAt.toLocaleString('zh-CN')}`;
    }
    return { render, title };
  };
})();
