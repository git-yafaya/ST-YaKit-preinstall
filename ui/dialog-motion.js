/** 关闭按钮、遮罩和 Esc 共用退场动画，结束后再关闭原生弹窗。 */
export function attachDialogMotion(dialog) {
    let closingAnimation;
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
    dialog.addEventListener('cancel', event => {
        event.preventDefault();
        close();
    });
    dialog.addEventListener('close', reset);
    dialog.addEventListener('yakit:open', reset);
    return close;
}
