(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.createToast = function createToast(document = globalThis.document, container = document.body) {
    let root = document.createElement('div');
    root.id = 'yakit-wb-toast-root';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-relevant', 'additions');
    container.appendChild(root);
    const active = new Set();

    function show(message, { type = 'success', durationMs = 2300 } = {}) {
      if (!root) return;
      const element = document.createElement('div');
      element.className = `yakit-toast yakit-toast--${type}`;
      element.textContent = message;
      root.appendChild(element);
      const entry = { element };
      active.add(entry);
      // 下一帧再显示，让向上淡入的过渡生效。
      entry.frame = requestAnimationFrame(() => element.classList.add('yakit-toast--visible'));
      entry.timer = setTimeout(() => {
        element.classList.remove('yakit-toast--visible');
        // 淡出结束后移除文字，并释放对应的任务记录。
        entry.timer = setTimeout(() => {
          element.remove();
          active.delete(entry);
        }, 300);
      }, durationMs);
    }

    function dispose() {
      for (const entry of active) {
        cancelAnimationFrame(entry.frame);
        clearTimeout(entry.timer);
      }
      active.clear();
      root?.remove();
      root = null;
    }

    return { show, dispose };
  };
})();
