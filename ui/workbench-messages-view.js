(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountWorkbenchMessages = function(controller, root, { run, notify }) {
    const document = root.ownerDocument, container = root.closest('.yakit-workbench');
    const messages = root.querySelector('#yakit-wb-messages');
    let messageKey = '', actions = [], pending = false;
    const canWrite = (state, prompt) => !pending && !state.busy && state.presetSource
      && prompt === state.draft && prompt !== state.presetSource.content;
    function save(action) {
      if (pending || controller.getState().busy) return;
      // 持久化完成前锁住所有保存按钮，避免不同消息同时改写当前草稿。
      pending = true; render(controller.getState());
      return run(async () => {
        try { await action(); }
        finally { pending = false; render(controller.getState()); }
      }, true);
    }
    async function copy(prompt) {
      try { await document.defaultView.navigator.clipboard.writeText(prompt); }
      catch {
        const field = document.createElement('textarea'); field.value = prompt; field.style.cssText = 'position:fixed;left:-9999px';
        container.append(field); field.select();
        const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw new Error('浏览器未允许复制，请展开提示词后手动复制。');
      }
      notify('提示词已复制。');
    }
    function render(state) {
      const nextKey = JSON.stringify(state.messages);
      if (messageKey !== nextKey) {
        messageKey = nextKey; actions = [];
        messages.replaceChildren(...state.messages.map((message, index) => {
          const item = document.createElement('div');
          item.className = `message message-${message.role === 'user' ? 'user' : 'assistant'}`;
          const role = document.createElement('span'); role.className = 'message-role'; role.textContent = message.role === 'user' ? '你' : '工作台 AI';
          const content = document.createElement('span');
          let readable = message.content, candidate = null;
          if (message.role !== 'user') {
            try { candidate = workbench.prompts.parseDesign(readable); readable = candidate.explanation; } catch { /* 普通文字按原样展示。 */ }
          }
          content.textContent = readable; item.append(role, content);
          if (candidate) {
            const row = document.createElement('div'); row.className = 'message-actions';
            const body = document.createElement('div'); body.className = 'message-prompt-body';
            body.id = `yakit-wb-message-prompt-${index}`; body.textContent = candidate.prompt; body.hidden = true;
            const button = (label, click) => {
              const node = document.createElement('button'); node.type = 'button';
              node.className = 'button button-secondary'; node.textContent = label;
              node.addEventListener('click', click); row.append(node); return node;
            };
            const toggle = button('查看提示词', () => {
              body.hidden = !body.hidden; toggle.setAttribute('aria-expanded', String(!body.hidden));
            });
            toggle.className += ' message-prompt-toggle';
            toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-controls', body.id);
            button('复制提示词', () => run(() => copy(candidate.prompt)));
            const write = button('保存到原条目', () => {
              if (canWrite(controller.getState(), candidate.prompt)) return save(() => controller.savePresetEntry());
            });
            const version = button('保存为版本', () => save(async () => {
              const current = controller.getState();
              const label = current.versions.find(saved => saved.content === candidate.prompt)?.label || '';
              if (current.draft !== candidate.prompt) await controller.update({ draft: candidate.prompt });
              await controller.saveVersion(label);
            }));
            actions.push({ prompt: candidate.prompt, write, version });
            item.append(row, body);
          }
          return item;
        }));
        messages.scrollTop = messages.scrollHeight;
      }
      for (const { prompt, write, version } of actions) {
        write.disabled = !canWrite(state, prompt);
        write.title = state.presetSource ? `保存到「${state.presetSource.name}」；仅当前已修改提示词可保存` : '请先载入要修改的预设条目';
        version.disabled = pending || Boolean(state.busy);
      }
    }
    return { render };
  };
})();
