(() => {
'use strict';
const { rawText } = globalThis.YaKitWorkbench.state;

function createPresetActions({ state, host, run, change, isActive, draftChanged }) {
    const idle = () => {
        if (state.busy) throw new Error('请等待当前操作完成后再操作预设。');
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
                state.presetSource = null;
                state.notice = '预设已读取，请选择要编辑的条目。';
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
                // 等待时若切换了版本，继续保持解绑，避免把版本误写到原目标。
                if (state.presetSource === source) source.content = content;
                state.notice = result.notice || `已写回「${source.name}」。`;
            });
        },
    };
}

globalThis.YaKitWorkbench.createPresetActions = createPresetActions;
})();
