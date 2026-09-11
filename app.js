(() => {
    'use strict';

    async function start() {
        const api = globalThis.YaKitWorkbench;
        const bridge = window.parent.YaKitWorkbenchHost;
        if (!bridge?.getContext) throw new Error('请从 SillyTavern 扩展菜单打开提示词工作台');
        const controller = await api.createWorkbench(api.createSillyTavernHost(bridge.getContext));
        api.mountWorkbench(controller, document.getElementById('app'));
        window.addEventListener('focus', () => controller.refreshEnvironment().catch(() => {}));
    }

    start().catch(error => {
        console.error('提示词工作台启动失败：', error);
        const root = document.getElementById('app');
        root.textContent = error.message || String(error);
    });
})();
