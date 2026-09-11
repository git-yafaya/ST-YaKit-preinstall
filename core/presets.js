(() => {
'use strict';
const { rawText } = globalThis.YaKitWorkbench.state;

function createPresetActions({ state, host, run, change, isActive, draftChanged }) {
    const idle = () => {
        if (state.busy) throw new Error('请等待当前操作完成后再操作预设。');
    };
    const findEntry = identifier => {
        const entries = state.presetEntries.filter(item => item.identifier === identifier);
        if (!state.selectedPresetName || entries.length !== 1) throw new Error('目标条目不存在或标识重复，请重新读取预设。');
        return entries[0];
    };
    const forgetOverride = (presetName, identifier) => {
        state.presetPromptOverrides = state.presetPromptOverrides.filter(item =>
            item.presetName !== presetName || item.identifier !== identifier);
    };
    return {
        refreshPresets() {
            return run('preset-read', async operation => {
                if (typeof host.listPresets !== 'function') throw new Error('请从酒馆扩展菜单打开工作台后读取预设。');
                const result = await host.listPresets();
                if (!isActive(operation)) return;
                state.presets = result.presets;
                // 刷新只补充下拉选项，不替用户读取或更换已载入的条目。
                if (!state.selectedPresetName) state.selectedPresetName = result.selectedPresetName || '';
            });
        },
        readPreset(name) {
            return run('preset-read', async operation => {
                if (typeof host.readPreset !== 'function') throw new Error('请从酒馆扩展菜单打开工作台后读取预设。');
                const result = await host.readPreset(rawText(name, '预设名称'));
                if (!isActive(operation)) return;
                state.selectedPresetName = result.name;
                state.presetEntries = result.entries;
                state.presetSearch = null;
                state.presetOrderCharacterId = result.orderCharacterId ?? null;
                state.presetSource = null;
                state.notice = '预设已读取，请选择要编辑的条目。';
            });
        },
        copyPreset() {
            return run('preset-save', async () => {
                if (typeof host.copyPreset !== 'function') throw new Error('请从酒馆扩展菜单打开工作台后复制预设。');
                const result = await host.copyPreset(state.selectedPresetName);
                state.presets = result.presets;
                state.selectedPresetName = result.name;
                state.presetEntries = result.entries;
                state.presetSearch = null;
                state.presetOrderCharacterId = result.orderCharacterId ?? null;
                state.presetSource = null;
                state.notice = `已复制为「${result.name}」。`;
            });
        },
        setPresetEntryEnabled(identifier, enabled) {
            return run('preset-save', async () => {
                if (typeof host.setPresetEntryEnabled !== 'function') throw new Error('请从酒馆扩展菜单打开工作台后调整条目开关。');
                const entry = findEntry(identifier);
                if (typeof enabled !== 'boolean') throw new Error('条目开关必须为开启或关闭。');
                if (!entry.toggleable) throw new Error(entry.toggleReason || '该条目不能切换开关，请重新读取预设。');
                const result = await host.setPresetEntryEnabled({ presetName: state.selectedPresetName,
                    identifier, enabled, expectedEnabled: entry.enabled,
                    expectedOrderCharacterId: state.presetOrderCharacterId });
                state.presetEntries = result.entries;
                state.presetSearch = null;
                state.presetOrderCharacterId = result.orderCharacterId ?? null;
                state.notice = result.notice || `已${enabled ? '开启' : '关闭'}「${entry.name}」。`;
            });
        },
        applyPresetPrompt(identifier, versionId, expectedContent) {
            return run('preset-save', async () => {
                if (typeof host.savePresetEntry !== 'function') throw new Error('请从酒馆扩展菜单打开工作台后应用提示词。');
                const entry = findEntry(identifier);
                if (entry.marker) throw new Error('占位条目不能替换提示词。');
                versionId = rawText(versionId, '版本标识');
                expectedContent = rawText(expectedContent, '条目原文');
                const presetName = state.selectedPresetName;
                const original = state.presetPromptOverrides.find(item =>
                    item.presetName === presetName && item.identifier === identifier);
                const version = versionId ? state.versions.find(item => item.id === versionId) : null;
                if (versionId && !version) throw new Error('找不到已保存的测试提示词，请重新选择。');
                const content = version ? version.content : original?.originalContent ?? entry.content;
                const result = await host.savePresetEntry({ presetName, identifier, content, expectedContent });
                // 只有宿主写入成功才记录替换；每个条目单独保留首次替换前的原文。
                forgetOverride(presetName, identifier);
                if (version) state.presetPromptOverrides.push({ presetName, identifier,
                    originalContent: original?.originalContent ?? expectedContent,
                    appliedContent: content, versionId });
                state.presetEntries = result.entries;
                state.presetSearch = null;
                state.presetOrderCharacterId = result.orderCharacterId ?? null;
                state.notice = result.notice || `「${entry.name}」已应用${version ? `测试提示词「${version.label}」` : '原版提示词'}。`;
            });
        },
        loadPresetEntry(identifier) {
            return change(() => {
                idle();
                const entry = state.presetEntries.find(item => item.identifier === identifier);
                if (!entry) throw new Error('找不到预设条目，请重新读取预设。');
                if (entry.marker) throw new Error('占位条目不能载入或修改。');
                const content = rawText(entry.content, '条目内容');
                state.draft = content;
                state.selectedVersionId = '';
                state.presetSource = { presetName: state.selectedPresetName,
                    identifier: entry.identifier, name: entry.name, content };
                draftChanged();
                state.notice = `已载入「${entry.name}」，修改后可写回预设。`;
            });
        },
        savePresetContent(identifier, content, expectedContent) {
            return run('preset-save', async () => {
                if (typeof host.savePresetEntry !== 'function') throw new Error('请从酒馆扩展菜单打开工作台后写回预设。');
                const presetName = state.selectedPresetName;
                const entry = findEntry(identifier);
                if (entry.marker) throw new Error('占位条目不能载入或修改。');
                content = rawText(content, '条目内容');
                expectedContent = rawText(expectedContent, '条目原文');
                const source = state.presetSource;
                const result = await host.savePresetEntry({ presetName, identifier, content, expectedContent });
                state.presetEntries = result.entries;
                state.presetSearch = null;
                state.presetOrderCharacterId = result.orderCharacterId ?? null;
                // 手动保存正文成为新的原版，之前的测试替换记录随之结束。
                forgetOverride(presetName, identifier);
                // 草稿正好是本次保存内容时才同步基线，旧草稿仍须通过原文冲突检查。
                if (state.presetSource === source && source?.presetName === presetName
                    && source.identifier === identifier && source.content === expectedContent && state.draft === content) {
                    source.content = content;
                }
                state.notice = result.notice || `已写回「${entry.name}」。`;
            });
        },
        savePresetEntry() {
            return run('preset-save', async () => {
                if (typeof host.savePresetEntry !== 'function') throw new Error('请从酒馆扩展菜单打开工作台后写回预设。');
                const source = state.presetSource;
                if (!source) throw new Error('请先读取预设并载入要修改的条目。');
                // 提交开始时固定正文，保留空白和空字符串，不覆盖等待期间的手动修改。
                const content = rawText(state.draft, '条目内容');
                const result = await host.savePresetEntry({ presetName: source.presetName,
                    identifier: source.identifier, content, expectedContent: source.content });
                state.presetEntries = result.entries;
                state.presetSearch = null;
                state.presetOrderCharacterId = result.orderCharacterId ?? null;
                forgetOverride(source.presetName, source.identifier);
                // 等待时若切换了版本，继续保持解绑，避免把版本误写到原目标。
                if (state.presetSource === source) source.content = content;
                state.notice = result.notice || `已写回「${source.name}」。`;
            });
        },
    };
}

globalThis.YaKitWorkbench.createPresetActions = createPresetActions;
})();
