(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.promptTitles = { builtin: '内置提示词', custom: '破限提示词' };
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
        $('prompt-help').textContent = kind === 'builtin' ? '引导工作台 AI 设计和修改提示词。' : '与内置提示词一起发送给工作台 AI。';
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
