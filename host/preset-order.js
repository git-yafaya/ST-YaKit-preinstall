(() => {
    'use strict';

    function getPresetOrder(preset, context) {
        const characterId = context?.characterId == null ? null : String(context.characterId);
        if (characterId === null) return { characterId, reason: '酒馆当前提示词顺序不可用，请先打开聊天补全设置。' };
        const lists = Array.isArray(preset?.prompt_order)
            ? preset.prompt_order.filter(item => String(item?.character_id) === characterId) : [];
        if (lists.length !== 1 || !Array.isArray(lists[0].order)) {
            return { characterId, reason: '预设的提示词顺序缺失或重复，请在酒馆中加载并保存后重新读取。' };
        }
        return { characterId, order: lists[0].order };
    }

    function getPresetEntrySwitch(preset, entry, context, orderState = getPresetOrder(preset, context)) {
        const references = orderState.order?.filter(item => item?.identifier === entry.identifier) || [];
        const reference = references[0];
        // 酒馆生成只遍历当前角色顺序；未加入顺序或 enabled 缺省的条目不会启用。
        const enabled = reference?.enabled ? true : false;
        const reason = orderState.reason
            || (preset.prompts.filter(item => item?.identifier === entry.identifier).length !== 1 ? '条目标识重复，请先在酒馆中处理。' : '')
            || (references.length > 1 ? '条目在提示词顺序中重复，请先在酒馆中处理。' : '')
            || (typeof context?.isToggleAllowed !== 'function' ? '酒馆的条目开关接口不可用。' : '')
            || (!context.isToggleAllowed(entry) ? '酒馆不允许切换该条目。' : '');
        return { ...orderState, reference, enabled, rawEnabled: reference?.enabled,
            toggleable: !reason, toggleReason: reason };
    }

    function updatePresetEntrySwitch(state, identifier, enabled) {
        if (state.reference) state.reference.enabled = enabled;
        // 与酒馆 appendPrompt 一致，将首次启用的条目加入顺序开头。
        else state.order.unshift({ identifier, enabled });
    }

    function unchangedPresetEntrySwitch(before, after) {
        return after.toggleable && before.order === after.order
            && before.reference === after.reference && before.rawEnabled === after.rawEnabled;
    }

    Object.assign(globalThis.YaKitWorkbench ||= {}, {
        getPresetOrder, getPresetEntrySwitch, updatePresetEntrySwitch, unchangedPresetEntrySwitch,
    });
})();
