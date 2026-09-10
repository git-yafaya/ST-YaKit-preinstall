(() => {
    'use strict';

    async function start() {
        const api = globalThis.YaKitPreview;
        const controller = await api.createWorkbench(api.createLocalHost());
        api.mountWorkbench(controller, document.getElementById('app'));
    }

    // defer 脚本在页面解析完成后启动，各组件按 index.html 中的顺序载入。
    start().catch(error => {
        console.error('工作台预览启动失败：', error);
        const root = document.getElementById('app');
        root.textContent = `工作台预览未能打开：${error.message || String(error)}。请保留当前文件夹中的所有组件后重新打开。`;
    });
})();
