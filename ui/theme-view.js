(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountTheme = function mountTheme(controller, root) {
    // 只切换当前工作台的主题，酒馆颜色直接继承宿主变量。
    function sync() { root.dataset.theme = controller.getState().theme || 'st'; }
    return { sync, dispose() {} };
  };
})();
