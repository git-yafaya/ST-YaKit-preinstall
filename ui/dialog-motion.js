export function attachDialogMotion(dialog) {
    let closingAnimation;
    let preserveCancel = false;
    let cancelReset;
    const reset = () => {
        closingAnimation = null;
        dialog.classList.remove('yakit-workbench--closing');
        dialog.inert = false;
    };
    const close = () => {
        if (!dialog.open || dialog.classList.contains('yakit-workbench--closing')) return;
        dialog.classList.add('yakit-workbench--closing');
        dialog.inert = true;
        const animation = dialog.getAnimations().find(item => item.animationName === 'yakit-workbench-exit');
        // 减少动态效果或样式未加载时立即关闭。
        if (!animation) {
            reset();
            dialog.close();
            return;
        }
        closingAnimation = animation;
        animation.finished.catch(() => {}).then(() => {
            if (closingAnimation !== animation) return;
            reset();
            dialog.close();
        });
    };
    dialog.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        const select = event.target.closest?.('select');
        const css = dialog.ownerDocument.defaultView.CSS;
        // 已处理的 Esc 与展开的原生下拉保留系统行为，同时拦住随后的弹窗 cancel。
        preserveCancel = event.defaultPrevented || Boolean(select && (!css?.supports?.('selector(select:open)') || select.matches(':open')));
        clearTimeout(cancelReset);
        cancelReset = setTimeout(() => { preserveCancel = false; }, 0);
        if (preserveCancel) return;
        event.preventDefault();
        close();
    });
    dialog.addEventListener('cancel', event => {
        const handled = event.defaultPrevented;
        event.preventDefault();
        if (!handled && !preserveCancel) close();
    });
    dialog.addEventListener('close', reset);
    dialog.addEventListener('yakit:open', reset);
    return close;
}
