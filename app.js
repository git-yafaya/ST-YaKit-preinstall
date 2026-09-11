(() => {
    'use strict';

    async function start() {
        const api = globalThis.YaKitWorkbench;
        let host;
        if (new URLSearchParams(window.location.search).get('mode') === 'preview') {
            // 预览复用同一界面，只载入原有本地示例，不连接酒馆或模型。
            await import('./preview/examples.js');
            await import('./host/local-host.js');
            host = api.createLocalHost();
        } else {
            const bridge = window.parent.YaKitWorkbenchHost;
            if (!bridge?.getContext) throw new Error('请从 SillyTavern 扩展菜单打开提示词工作台');
            await import('./host/trial-context.js');
            host = api.createSillyTavernHost(bridge.getContext);
        }
        const controller = await api.createWorkbench(host);
        api.mountWorkbench(controller, document.getElementById('app'));
        window.addEventListener('focus', () => controller.refreshEnvironment().catch(() => {}));
    }

    start().catch(error => {
        console.error('提示词工作台启动失败：', error);
        const root = document.getElementById('app');
        root.textContent = error.message || String(error);
    });
})();
