(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountWorkshopPublish = function(controller, root, { run }) {
    const $ = id => root.querySelector(`#yakit-wb-workshop-${id}`);
    const document = root.ownerDocument;
    let selectedEntry = '', selectedApproval = '', pendingWithdraw = '', ownerKey = '', approvalsKey = '';
    const approvals = state => (state.workshopApprovals || []).filter(item => item.review?.stage === 'approved');
    const owned = state => (state.workshopUser ? state.workshopMine || [] : []).filter(item => String(item.author?.id) === String(state.workshopUser?.id));
    const currentEntry = state => owned(state).find(item => item.id === selectedEntry);
    const currentApproval = state => approvals(state).find(item => item.id === selectedApproval);
    const metadata = () => ({ title: $('edit-title').value, description: $('edit-description').value,
      tags: $('edit-tags').value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean), usage: $('edit-usage').value });
    function option(title, value) {
      const node = document.createElement('option'); node.value = value; node.textContent = title; return node;
    }
    function loadEntry(state) {
      const entry = currentEntry(state);
      $('edit-title').value = entry?.title || '';
      $('edit-description').value = entry?.description || '';
      $('edit-tags').value = (entry?.tags || []).join(', ');
      $('edit-usage').value = entry?.usage || '';
      selectedApproval = ''; pendingWithdraw = '';
    }
    function render(state) {
      const entry = currentEntry(state), approval = currentApproval(state), mine = owned(state), eligible = approvals(state);
      const busy = Boolean(state.busy), connected = Boolean(state.workshopUrl), signedIn = Boolean(state.workshopUser);
      const canWrite = connected && signedIn && !busy;
      // 普通刷新不回填表单，避免远端旧数据覆盖尚未保存的介绍。
      const nextOwnerKey = JSON.stringify(mine.map(item => [item.id, item.title, item.withdrawn]));
      if (ownerKey !== nextOwnerKey) {
        ownerKey = nextOwnerKey;
        $('owned').replaceChildren(option('发布新作品', ''), ...mine.map(item => option(`${item.title}${item.withdrawn ? ' · 已下架' : ''}`, item.id)));
        if (selectedEntry && !entry) { selectedEntry = ''; loadEntry(state); }
        $('owned').value = selectedEntry;
      }
      const nextApprovalsKey = JSON.stringify(eligible.map(item => [item.id, item.title]));
      if (approvalsKey !== nextApprovalsKey) {
        approvalsKey = nextApprovalsKey;
        $('approval').replaceChildren(option(eligible.length ? '选择一个终审条目' : '暂无终审通过的条目', ''), ...eligible.map(item => option(`${item.title || '未命名条目'} · 第 ${item.review.round || 1} 轮${item.approvedAt ? ` · ${item.approvedAt.slice(0, 10)}` : ''}`, item.id)));
        if (!approval) selectedApproval = '';
        $('approval').value = selectedApproval;
      }
      $('publish-hint').textContent = !connected ? '请先保存工坊地址。'
        : !signedIn ? '登录 GitHub 后可发布作品或管理自己的发布。'
          : !eligible.length ? '暂无可上传条目。在试写与反馈中人工确认终审通过后，条目会保存在这里。'
            : entry?.withdrawn ? '作品已下架。选择终审条目后，可重新发布作品。' : '选择终审通过的条目，填写介绍后手动发布。已有作品可保存介绍或发布新版本。';
      $('snapshot').hidden = !approval;
      $('snapshot-content').textContent = approval?.content || '';
      $('snapshot-review').textContent = approval ? `作者终审通过 · 第 ${approval.review.round || 1} 轮\n${approval.review.summary || '未附终审摘要'}` : '';
      $('owned').disabled = busy || !signedIn;
      $('approval').disabled = busy || !eligible.length;
      for (const id of ['edit-title', 'edit-description', 'edit-tags', 'edit-usage']) $(id).disabled = !canWrite;
      $('publish').textContent = entry?.withdrawn ? '重新发布作品' : entry ? '发布新版本' : '发布作品';
      $('publish').disabled = !canWrite || !approval || Boolean(selectedEntry && !entry);
      $('edit').hidden = !entry; $('edit').disabled = !canWrite || !entry;
      $('withdraw').hidden = !entry || entry.withdrawn; $('withdraw').disabled = !canWrite || !entry || entry.withdrawn;
      if (busy || pendingWithdraw !== entry?.id) pendingWithdraw = '';
      $('withdraw-confirmation').hidden = !pendingWithdraw;
      $('withdraw-confirm').disabled = !canWrite || !pendingWithdraw;
    }
    $('owned').addEventListener('change', () => {
      selectedEntry = $('owned').value; loadEntry(controller.getState()); render(controller.getState());
    });
    $('approval').addEventListener('change', () => {
      selectedApproval = $('approval').value;
      const approval = currentApproval(controller.getState());
      if (!selectedEntry && !$('edit-title').value.trim() && approval) $('edit-title').value = approval.title || '';
      render(controller.getState());
    });
    $('publish-form').addEventListener('submit', event => {
      event.preventDefault();
      const state = controller.getState(), approval = currentApproval(state);
      if (state.busy || !state.workshopUrl || !state.workshopUser || !approval || (selectedEntry && !currentEntry(state)) || !$('publish-form').reportValidity()) return;
      return run(async () => {
        const entry = await controller.publishWorkshop(approval.id, metadata(), selectedEntry);
        if (!entry?.id || controller.getState().error) return;
        // 发布后停在该作品，继续编辑介绍或另选终审条目发新版本。
        selectedEntry = entry.id; selectedApproval = '';
        $('owned').value = selectedEntry; $('approval').value = '';
      });
    });
    $('edit').addEventListener('click', () => {
      const state = controller.getState(), entry = currentEntry(state);
      if (state.busy || !state.workshopUrl || !state.workshopUser || !entry || !$('publish-form').reportValidity()) return;
      return run(() => controller.editWorkshopEntry(entry.id, metadata()));
    });
    $('withdraw').addEventListener('click', () => {
      const state = controller.getState(), entry = currentEntry(state);
      if (state.busy || !entry || entry.withdrawn) return;
      pendingWithdraw = entry.id; render(state); $('withdraw-cancel').focus();
    });
    $('withdraw-cancel').addEventListener('click', () => {
      pendingWithdraw = ''; render(controller.getState()); $('withdraw').focus();
    });
    $('withdraw-confirm').addEventListener('click', () => {
      const state = controller.getState(), entry = currentEntry(state), id = pendingWithdraw;
      if (state.busy || !state.workshopUrl || !state.workshopUser || !id || entry?.id !== id || entry.withdrawn) return;
      pendingWithdraw = ''; return run(() => controller.withdrawWorkshop(id));
    });
    return { render };
  };
})();
