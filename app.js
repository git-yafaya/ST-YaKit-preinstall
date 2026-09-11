import './core/state.js';
import './core/prompts.js';
import './core/settings.js';
import './core/presets.js';
import './core/workbench.js';
import './host/api.js';
import './host/api-profiles.js';
import './host/presets.js';
import './host/trial-context.js';
import './host/st-host.js';
import './ui/settings-template.js';
import './ui/theme-view.js';
import './ui/settings-api-view.js';
import './ui/settings-prompt-view.js';
import './ui/settings-view.js';
import './ui/trial-template.js';
import './ui/versions-template.js';
import './ui/preset-template.js';
import './ui/workbench-template.js';
import './ui/navigation-view.js';
import './ui/preset-entries-view.js';
import './ui/preset-view.js';
import './ui/toast.js';
import './ui/select-view.js';
import './ui/workbench-view.js';

/** 在指定容器里挂载工作台，宿主和本地演示共用这一套组件。 */
export async function mountApp(container, host) {
    const api = globalThis.YaKitWorkbench;
    const controller = await api.createWorkbench(host);
    const dispose = api.mountWorkbench(controller, container.querySelector('#yakit-wb-app'));
    const view = container.ownerDocument.defaultView;
    const refresh = () => controller.refreshEnvironment().catch(() => {});
    view.addEventListener('focus', refresh);
    // 再次打开时重新读取聊天和连接，关闭期间酒馆可能已经切换。
    container.addEventListener('yakit:open', refresh);
    return () => {
        view.removeEventListener('focus', refresh);
        container.removeEventListener('yakit:open', refresh);
        dispose();
    };
}
