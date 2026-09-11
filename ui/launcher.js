import { attachDialogMotion } from './dialog-motion.js';
import { shellTemplate } from './shell-template.js';

export function mountLauncher(mount) {
    const existing = document.getElementById('yakit-workbench-dialog');
    if (existing) return () => existing.dispatchEvent(new Event('yakit:open'));
    const menu = document.getElementById('extensionsMenu');
    if (!menu) throw new Error('未找到 SillyTavern 扩展菜单。');
    const styleUrl = new URL('../style.css', import.meta.url).href;
    if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === styleUrl)) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = styleUrl;
        document.head.append(style);
    }
    const dialog = document.createElement('dialog');
    dialog.id = 'yakit-workbench-dialog';
    dialog.className = 'yakit-workbench';
    dialog.dataset.theme = 'st';
    dialog.setAttribute('aria-label', '预设工作台');
    dialog.innerHTML = shellTemplate;
    const close = attachDialogMotion(dialog);
    dialog.querySelector('#yakit-wb-workbench-close').addEventListener('click', close);
    // 按下和松开都在遮罩上才关闭，避免从窗口内拖动到外侧时误触。
    let backdropPressed = false;
    const outside = event => {
        const rect = dialog.getBoundingClientRect();
        return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    };
    dialog.addEventListener('pointerdown', event => { backdropPressed = outside(event); });
    dialog.addEventListener('click', event => {
        if (backdropPressed && outside(event)) close();
        backdropPressed = false;
    });
    document.body.append(dialog);
    let mounted = false;
    let pending;
    dialog.addEventListener('yakit:open', () => {
        if (!dialog.open) dialog.showModal();
        if (mounted || pending) return;
        const content = dialog.querySelector('#yakit-wb-app');
        content.textContent = '正在加载工作台…';
        // 关闭只隐藏窗口；首次加载中的重复打开也复用同一次挂载。
        pending = Promise.resolve().then(() => mount(dialog)).then(() => {
            mounted = true;
        }).catch(error => {
            const message = document.createElement('p');
            message.setAttribute('role', 'alert');
            message.textContent = `工作台加载失败：${error?.message || String(error)}。请关闭后重新打开重试。`;
            content.replaceChildren(message);
        }).finally(() => { pending = null; });
    });
    const open = () => dialog.dispatchEvent(new Event('yakit:open'));
    const entry = document.createElement('button');
    entry.id = 'yakit-workbench-entry'; entry.type = 'button'; entry.className = 'list-group-item flex-container flexGap5';
    const icon = document.createElement('span');
    icon.className = 'yakit-workbench-icon'; icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.textContent = '工作台';
    entry.append(icon, label); entry.addEventListener('click', open); menu.append(entry);
    return open;
}
