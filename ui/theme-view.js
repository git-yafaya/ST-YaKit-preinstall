(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountTheme = function mountTheme(controller, root) {
    function sync() { root.dataset.theme = controller.getState().theme || 'st'; }
    return { sync, dispose() {} };
  };
})();
