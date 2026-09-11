import { attachDialogMotion } from './dialog-motion.js';

export function mountLauncher(url) {
    const existing = document.getElementById('yakit-workbench-dialog');
    if (existing) return () => {
        existing.dispatchEvent(new Event('yakit:open'));
        if (!existing.open) existing.showModal();
    };
    const menu = document.getElementById('extensionsMenu');
    if (!menu) throw new Error('未找到 SillyTavern 扩展菜单。');
    for (const file of ['theme.css', 'launcher.css']) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = new URL(`../styles/${file}`, import.meta.url).href;
        document.head.append(style);
    }
    const dialog = document.createElement('dialog');
    dialog.id = 'yakit-workbench-dialog';
    dialog.setAttribute('aria-label', 'YaKit 提示词工作台');
    const close = attachDialogMotion(dialog);
    const frame = document.createElement('iframe');
    frame.title = 'YaKit 提示词工作台';
    // 框架内的按钮与键盘退出共用宿主窗口的退场效果。
    frame.addEventListener('load', () => {
        frame.contentDocument.getElementById('workbench-close')?.addEventListener('click', close);
        frame.contentDocument.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            // 原生下拉先处理 Esc；旧浏览器无法判断展开状态时保留系统行为。
            const select = event.target.closest?.('select');
            if (select && (!frame.contentWindow.CSS?.supports?.('selector(select:open)') || select.matches(':open'))) return;
            event.preventDefault();
            close();
        });
    });
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
    dialog.append(frame);
    document.body.append(dialog);
    const open = () => {
        if (!frame.hasAttribute('src')) frame.src = url;
        dialog.dispatchEvent(new Event('yakit:open'));
        if (!dialog.open) dialog.showModal();
    };
    const entry = document.createElement('button');
    entry.id = 'yakit-workbench-entry'; entry.type = 'button'; entry.className = 'list-group-item flex-container flexGap5';
    const icon = document.createElement('span');
    icon.className = 'yakit-workbench-icon'; icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.textContent = '工作台';
    entry.append(icon, label); entry.addEventListener('click', open); menu.append(entry);
    return open;
}
