(() => {
    'use strict';

    const textContent = entry => typeof entry?.content === 'string' ? entry.content : '';
    const matchingEntries = (preset, identifier) => Array.isArray(preset?.prompts)
        ? preset.prompts.filter(entry => entry?.identifier === identifier) : [];
    const { getPresetOrder, getPresetEntrySwitch, updatePresetEntrySwitch, unchangedPresetEntrySwitch } = globalThis.YaKitWorkbench;

    function presetView(name, preset, context) {
        if (!Array.isArray(preset?.prompts)) throw new Error('该预设没有可读取的提示词条目。');
        const orderState = getPresetOrder(preset, context);
        const entries = preset.prompts.filter(entry => entry && typeof entry.identifier === 'string')
            .map(entry => {
                const { enabled, toggleable, toggleReason } = getPresetEntrySwitch(preset, entry, context, orderState);
                return { identifier: entry.identifier,
                    name: typeof entry.name === 'string' ? entry.name : entry.identifier,
                    content: textContent(entry), marker: Boolean(entry.marker),
                    enabled, toggleable, toggleReason,
                    ...(typeof entry.role === 'string' ? { role: entry.role } : {}),
                };
            });
        // 采用酒馆当前实际使用的角色顺序，未列入顺序的条目仍可读取。
        const order = orderState.order;
        const positions = new Map();
        if (Array.isArray(order)) order.forEach((item, index) => {
            if (!positions.has(item?.identifier)) positions.set(item?.identifier, index);
        });
        entries.sort((a, b) => (positions.get(a.identifier) ?? Infinity) - (positions.get(b.identifier) ?? Infinity));
        return { name, entries, orderCharacterId: orderState.characterId };
    }

    function createPresets(getContext) {
        let saving = false;
        const getManager = () => {
            const manager = getContext().getPresetManager?.('openai');
            if (!manager?.getPresetList || !manager.getCompletionPresetByName || !manager.getSelectedPresetName) {
                throw new Error('当前酒馆不支持读取聊天补全预设。');
            }
            return manager;
        };
        const getSaved = (manager, name) => {
            if (typeof name !== 'string' || !name.trim()) throw new Error('请先选择预设。');
            const { preset_names: names } = manager.getPresetList();
            if (!names || !Object.hasOwn(names, name)) throw new Error('预设已不存在，请刷新后重新选择。');
            const preset = manager.getCompletionPresetByName(name);
            if (!preset || typeof preset !== 'object') throw new Error('无法读取该预设。');
            return preset;
        };

        return {
            async listPresets() {
                const host = getContext();
                if (typeof host.getPresetManager !== 'function') return { presets: [], selectedPresetName: '' };
                const manager = host.getPresetManager('openai');
                if (!manager?.getPresetList || !manager.getSelectedPresetName) return { presets: [], selectedPresetName: '' };
                const { presets, preset_names: names } = manager.getPresetList();
                return {
                    presets: Object.keys(names || {}).filter(name => presets?.[names[name]])
                        .map(name => ({ name })),
                    selectedPresetName: manager.getSelectedPresetName() || '',
                };
            },

            async readPreset(name) {
                const manager = getManager();
                return presetView(name, getSaved(manager, name), getContext().getPresetPromptContext?.());
            },

            async savePresetEntry({ presetName, identifier, content, expectedContent } = {}) {
                if (typeof identifier !== 'string' || !identifier.trim()
                    || typeof content !== 'string' || typeof expectedContent !== 'string') {
                    throw new Error('预设条目或内容格式不正确，请重新读取条目。');
                }
                if (saving) throw new Error('上一条预设仍在保存中，请稍后再试。');
                const manager = getManager();
                if (typeof manager.savePreset !== 'function') throw new Error('当前酒馆不支持保存预设。');
                const saved = getSaved(manager, presetName);
                const matches = matchingEntries(saved, identifier);
                if (matches.length !== 1) throw new Error('目标条目不存在或标识重复，请重新读取预设。');
                const entry = matches[0];
                if (entry.marker) throw new Error('占位条目由酒馆生成，不能修改内容。');
                if (entry.content != null && typeof entry.content !== 'string') throw new Error('目标条目内容格式不正确。');
                if (textContent(entry) !== expectedContent) throw new Error('该条目已被修改，请重新读取后再保存。');
                const host = getContext();
                const active = manager.getSelectedPresetName() === presetName;
                const activeEntries = matchingEntries(host.chatCompletionSettings, identifier);
                if (active && (activeEntries.length !== 1 || textContent(activeEntries[0]) !== expectedContent)) {
                    throw new Error('酒馆当前条目有未保存的修改，请先处理后重新读取。');
                }
                if (active && typeof host.saveSettingsDebounced !== 'function') throw new Error('酒馆设置保存接口不可用。');
                // 从已保存的预设复制，只替换目标内容，不写入活动设置的其他改动。
                const next = structuredClone(saved);
                matchingEntries(next, identifier)[0].content = content;
                const result = presetView(presetName, next, host.getPresetPromptContext?.());
                saving = true;
                try {
                    await manager.savePreset(presetName, next, { skipUpdate: true });
                    // 请求结束后再检查，保留等待期间发生的编辑、删除或预设切换。
                    const currentHost = getContext();
                    const currentSaved = manager.getCompletionPresetByName(presetName);
                    const currentEntries = matchingEntries(currentSaved, identifier);
                    if (currentEntries.length === 1 && !currentEntries[0].marker
                        && textContent(currentEntries[0]) === expectedContent) {
                        currentEntries[0].content = content;
                    } else {
                        result.notice = '预设文件已保存；保存期间预设条目发生变化，已保留酒馆中的新内容，请重新读取。';
                    }
                    if (manager.getSelectedPresetName() === presetName) {
                        const currentActive = matchingEntries(currentHost.chatCompletionSettings, identifier);
                        if (active && currentActive.length === 1 && !currentActive[0].marker && currentActive[0] === activeEntries[0]
                            && textContent(currentActive[0]) === expectedContent) {
                            currentActive[0].content = content;
                            try {
                                currentHost.saveSettingsDebounced();
                                currentHost.refreshPresetEditor?.();
                            } catch {
                                result.notice = '预设文件已保存，酒馆设置或条目列表刷新失败，请在酒馆中确认。';
                            }
                        } else {
                            result.notice = '预设文件已保存；酒馆当前条目在保存期间发生变化，已保留当前内容。';
                        }
                    }
                    return result;
                } finally {
                    saving = false;
                }
            },

            async setPresetEntryEnabled({ presetName, identifier, enabled, expectedEnabled, expectedOrderCharacterId } = {}) {
                if (typeof identifier !== 'string' || !identifier.trim()
                    || typeof enabled !== 'boolean' || typeof expectedEnabled !== 'boolean') {
                    throw new Error('预设条目或开关格式不正确，请重新读取条目。');
                }
                if (saving) throw new Error('上一条预设仍在保存中，请稍后再试。');
                const manager = getManager();
                if (typeof manager.savePreset !== 'function') throw new Error('当前酒馆不支持保存预设。');
                const host = getContext();
                const context = host.getPresetPromptContext?.();
                const saved = getSaved(manager, presetName);
                const entries = matchingEntries(saved, identifier);
                if (entries.length !== 1) throw new Error('目标条目不存在或标识重复，请重新读取预设。');
                const state = getPresetEntrySwitch(saved, entries[0], context);
                if (!state.toggleable) throw new Error(state.toggleReason);
                if (expectedOrderCharacterId !== undefined && String(expectedOrderCharacterId) !== state.characterId) {
                    throw new Error('酒馆当前提示词顺序已切换，请重新读取预设。');
                }
                if (state.enabled !== expectedEnabled) throw new Error('该条目开关已被修改，请重新读取后再保存。');
                const active = manager.getSelectedPresetName() === presetName;
                const activeEntries = matchingEntries(host.chatCompletionSettings, identifier);
                const activeState = activeEntries.length === 1
                    ? getPresetEntrySwitch(host.chatCompletionSettings, activeEntries[0], context) : null;
                if (active && (!activeState?.toggleable || activeState.enabled !== expectedEnabled)) {
                    throw new Error('酒馆当前条目开关有未保存的修改，请先处理后重新读取。');
                }
                if (active && typeof host.saveSettingsDebounced !== 'function') throw new Error('酒馆设置保存接口不可用。');
                // 文件只替换目标开关，正文、其他设置与其他角色顺序全部保留。
                const next = structuredClone(saved);
                updatePresetEntrySwitch(getPresetEntrySwitch(next, matchingEntries(next, identifier)[0], context), identifier, enabled);
                const result = presetView(presetName, next, context);
                saving = true;
                try {
                    await manager.savePreset(presetName, next, { skipUpdate: true });
                    const currentSaved = manager.getCompletionPresetByName(presetName);
                    const currentEntries = matchingEntries(currentSaved, identifier);
                    const currentState = currentEntries.length === 1
                        ? getPresetEntrySwitch(currentSaved, currentEntries[0], context) : null;
                    if (currentState && unchangedPresetEntrySwitch(state, currentState)) {
                        updatePresetEntrySwitch(currentState, identifier, enabled);
                    } else {
                        result.notice = '预设文件已保存；保存期间预设开关或顺序发生变化，已保留酒馆中的修改，请重新读取。';
                    }
                    if (manager.getSelectedPresetName() === presetName) {
                        const currentHost = getContext();
                        const currentContext = currentHost.getPresetPromptContext?.();
                        const currentActiveEntries = matchingEntries(currentHost.chatCompletionSettings, identifier);
                        const currentActiveState = currentActiveEntries.length === 1
                            ? getPresetEntrySwitch(currentHost.chatCompletionSettings, currentActiveEntries[0], currentContext) : null;
                        if (active && currentActiveState && state.characterId === currentActiveState.characterId
                            && unchangedPresetEntrySwitch(activeState, currentActiveState)) {
                            updatePresetEntrySwitch(currentActiveState, identifier, enabled);
                            try {
                                currentHost.saveSettingsDebounced();
                                currentHost.refreshPresetEditor?.();
                            } catch {
                                result.notice = '预设文件已保存，酒馆设置或条目列表刷新失败，请在酒馆中确认。';
                            }
                        } else {
                            result.notice = '预设文件已保存；酒馆当前开关或顺序在保存期间发生变化，已保留当前修改。';
                        }
                    }
                    return result;
                } finally {
                    saving = false;
                }
            },
        };
    }

    (globalThis.YaKitWorkbench ||= {}).createPresets = createPresets;
})();
