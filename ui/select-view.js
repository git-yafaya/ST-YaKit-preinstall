(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountSelects = function mountSelects(root) {
    const view = root.ownerDocument.defaultView;
    if (!view.CSS?.supports('appearance', 'base-select') || !view.CSS.supports('selector(select:open)')) return { dispose() {} };
    function onPointerDown(event) {
      const select = event.target;
      if (event.pointerType !== 'touch' || !event.isPrimary || event.button !== 0 || !select.matches?.('select:open') || select.disabled) return;
      if (view.getComputedStyle(select).appearance !== 'base-select') return;
      // 再次触摸时由原生弹层收起；阻止随后模拟的鼠标按下把列表重新打开。
      event.preventDefault();
    }
    root.addEventListener('pointerdown', onPointerDown);
    return { dispose: () => root.removeEventListener('pointerdown', onPointerDown) };
  };
})();
