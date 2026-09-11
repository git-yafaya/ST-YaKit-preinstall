(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountTheme = function mountTheme(controller) {
    const root = document.documentElement;
    const host = parent !== window ? parent.document : null;
    const dialog = host?.getElementById('yakit-workbench-dialog');
    const variables = ['--SmartThemeBodyColor', '--SmartThemeBlurTintColor', '--SmartThemeChatTintColor', '--SmartThemeBorderColor', '--SmartThemeQuoteColor', '--SmartThemeEmColor', '--mainFontFamily'];
    function sync() {
      const theme = controller.getState().theme || 'st';
      root.dataset.theme = theme;
      if (dialog) dialog.dataset.theme = theme;
      if (theme !== 'st' || !host) return;
      // 从宿主正文读取继承后的颜色，弹窗自身继续直接继承宿主变量。
      const style = parent.getComputedStyle(host.body);
      variables.forEach(name => root.style.setProperty(name, style.getPropertyValue(name)));
    }
    const observer = new MutationObserver(sync);
    if (host) {
      const options = { attributes: true, attributeFilter: ['style', 'class', 'data-theme'] };
      observer.observe(host.documentElement, options);
      observer.observe(host.body, options);
    }
    return { sync, dispose: () => observer.disconnect() };
  };
})();
