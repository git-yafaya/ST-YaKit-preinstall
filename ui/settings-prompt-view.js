(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  const help = {
    builtin: '随所有模型生成请求发送的通用引导。',
    design: '根据本次需求生成提示词，并指导后续修改。',
    custom: '随破限提示词一起发送给工作台 AI，可留空。',
    scenario: '生成检验需求的冲突场景。',
    judge: '拆解需求、检查样本并评分。',
    feedback: '根据人工反馈引导下一版提示词的修订。',
    chatScenario: '关闭空卡模式时，引导当前聊天生成试写。',
  };
  workbench.mountSettingsPrompt = function(controller, root) {
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    let kind = '', revision = 0;
    function refresh() {
      const modified = $('prompt-text').value !== controller.getPrompt(kind).defaultText;
      $('prompt-label').textContent = `${workbench.promptTitles[kind]}${modified ? '（已修改）' : ''}`;
      $('prompt-label').classList.toggle('prompt-modified', modified);
    }
    $('prompt-text').addEventListener('input', refresh);
    return {
      open(next) {
        revision++; kind = next;
        $('prompt-text').value = controller.getPrompt(kind).text;
        $('prompt-help').textContent = help[kind];
        $('prompt-status').textContent = '';
        $('settings-prompt-page').hidden = false; refresh();
      },
      reset() { $('prompt-text').value = controller.getPrompt(kind).defaultText; refresh(); },
      async save() {
        const current = revision;
        await controller.savePrompt(kind, $('prompt-text').value);
        return current === revision && !controller.getState().error;
      },
      close(keepVisible = false) {
        revision++; kind = '';
        $('settings-prompt-page').hidden = !keepVisible;
        if (!keepVisible) $('prompt-text').value = '';
      },
    };
  };
})();
