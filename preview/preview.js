import { mountApp } from '../app.js';
import { shellTemplate } from '../ui/shell-template.js';
import './examples.js';
import '../host/local-host.js';

const container = document.querySelector('.yakit-workbench-preview');
container.innerHTML = shellTemplate;
// 本地演示直接在浏览器页中使用，退出由浏览器标签页控制。
container.querySelector('#yakit-wb-workbench-close').hidden = true;
mountApp(container, globalThis.YaKitWorkbench.createLocalHost()).catch(error => {
    container.querySelector('#yakit-wb-app').textContent = error.message || String(error);
});
