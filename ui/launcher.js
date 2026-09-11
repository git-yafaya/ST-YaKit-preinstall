export function mountLauncher(url) {
    const existing = document.getElementById('yakit-workbench-dialog');
    if (existing) return () => { if (!existing.open) existing.showModal(); };
    const menu = document.getElementById('extensionsMenu');
    if (!menu) throw new Error('未找到 SillyTavern 扩展菜单。');
    const style = document.createElement('style');
    style.textContent = `
      #yakit-workbench-entry{display:flex;align-items:center;gap:10px;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
      #yakit-workbench-dialog{width:96vw;height:94dvh;max-width:1900px;max-height:94dvh;padding:0;border:1px solid var(--SmartThemeBorderColor,#52616b);border-radius:14px;background:var(--SmartThemeBlurTintColor,#f4f6f7);color:var(--SmartThemeBodyColor,#25333a);overflow:hidden}
      #yakit-workbench-dialog::backdrop{background:#0008}
      #yakit-workbench-dialog .yakit-window-bar{height:38px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#e3e8eb);font-size:12px}
      #yakit-workbench-dialog .yakit-close{width:28px;height:28px;padding:0;background:transparent;color:inherit;border:0;border-radius:7px;font-size:20px;cursor:pointer;transition:background .16s,transform .16s}
      #yakit-workbench-dialog .yakit-close:hover{background:color-mix(in srgb,currentColor 10%,transparent)}
      #yakit-workbench-dialog .yakit-close:active{transform:translateY(1px)}
      #yakit-workbench-dialog iframe{display:block;width:100%;height:calc(100% - 38px);border:0}
      @media(max-width:610px){#yakit-workbench-dialog{width:100vw;height:100dvh;max-width:100vw;max-height:100dvh;border-radius:0;border:0}}
      @media(prefers-reduced-motion:reduce){#yakit-workbench-dialog .yakit-close{transition:none}}
    `;
    const dialog = document.createElement('dialog');
    dialog.id = 'yakit-workbench-dialog';
    dialog.setAttribute('aria-label', 'YaKit 提示词工作台');
    const bar = document.createElement('div');
    bar.className = 'yakit-window-bar';
    const title = document.createElement('span');
    title.textContent = 'YaKit';
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'yakit-close'; close.textContent = '×';
    close.setAttribute('aria-label', '关闭工作台');
    close.addEventListener('click', () => dialog.close());
    bar.append(title, close);
    const frame = document.createElement('iframe');
    frame.title = 'YaKit 提示词工作台';
    dialog.append(bar, frame);
    document.head.append(style); document.body.append(dialog);
    const open = () => {
        if (!frame.hasAttribute('src')) frame.src = url;
        if (!dialog.open) dialog.showModal();
    };
    const entry = document.createElement('button');
    entry.id = 'yakit-workbench-entry'; entry.type = 'button'; entry.className = 'list-group-item flex-container flexGap5';
    const icon = document.createElement('span');
    icon.className = 'fa-solid fa-pen-ruler'; icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.textContent = 'YaKit 提示词工作台';
    entry.append(icon, label); entry.addEventListener('click', open); menu.append(entry);
    return open;
}
