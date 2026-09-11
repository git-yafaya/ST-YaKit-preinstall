(() => {
'use strict';
const { rawText, required, text } = globalThis.YaKitWorkbench.state;
const { INSTRUCTION, LEGACY_INSTRUCTION } = globalThis.YaKitWorkbench.prompts;
const { promptDefaults, promptText } = globalThis.YaKitWorkbench;

function configFields(fields) {
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('API 配置格式不正确。');
    return {
        name: required(fields.name, '配置名称'), url: text(fields.url ?? '', 'API 地址'),
        apiKey: rawText(fields.apiKey ?? '', 'API 密钥'), model: text(fields.model ?? '', 'API 模型'),
        profileId: text(fields.profileId ?? '', '连接配置'),
    };
}

function syncSelection(state, selected) {
    // 请求继续读取旧字段，选择和编辑配置时统一同步。
    Object.assign(state, {
        activeSecondaryApiId: selected?.id || '', secondarySource: selected?.profileId ? 'profile' : 'custom',
        secondaryProfileId: selected?.profileId || '', secondaryUrl: selected?.url || '',
        secondaryModel: selected?.model || '', secondaryKey: selected?.apiKey || '',
    });
}

function getPrompt(state, kind) {
    return { text: promptText(state.assistPrompts, kind), defaultText: promptDefaults[kind] };
}

function syncLegacyFields(state, fields) {
    if (!['secondarySource', 'secondaryProfileId', 'secondaryUrl', 'secondaryModel', 'secondaryKey']
        .some(key => Object.hasOwn(fields, key))) return;
    let config = state.secondaryApiConfigs.find(item => item.id === state.activeSecondaryApiId);
    if (!config && [state.secondaryProfileId, state.secondaryUrl, state.secondaryModel, state.secondaryKey].some(Boolean)) {
        config = { id: 'legacy-secondary-api', name: '已有配置' };
        state.secondaryApiConfigs.push(config);
        state.activeSecondaryApiId = config.id;
    }
    // 兼容旧入口直接编辑单套字段，重新打开时仍使用最后保存的值。
    if (config) Object.assign(config, { url: state.secondaryUrl, model: state.secondaryModel,
        apiKey: state.secondaryKey, profileId: state.secondarySource === 'profile' ? state.secondaryProfileId : '' });
}

function restoreSettings(state, saved) {
    state.secondaryApiConfigs = [];
    state.activeSecondaryApiId = '';
    if (Array.isArray(saved?.secondaryApiConfigs)) {
        for (const config of saved.secondaryApiConfigs) {
            try {
                const id = required(config?.id, '配置标识');
                if (!state.secondaryApiConfigs.some(item => item.id === id)) {
                    state.secondaryApiConfigs.push({ id, ...configFields(config) });
                }
            } catch { /* 跳过损坏的配置，其他配置仍可正常使用。 */ }
        }
        const selected = state.secondaryApiConfigs.find(config => config.id === saved.activeSecondaryApiId)
            || state.secondaryApiConfigs[0];
        syncSelection(state, selected);
        if (!selected) state.designApi = 'main';
    } else if ([state.secondaryProfileId, state.secondaryUrl, state.secondaryModel, state.secondaryKey].some(Boolean)) {
        // 旧单套配置首次读取时迁移，保留原来的主副 API 选择。
        const config = { id: 'legacy-secondary-api', name: '已有配置', url: state.secondaryUrl,
            model: state.secondaryModel, apiKey: state.secondaryKey,
            profileId: state.secondarySource === 'profile' ? state.secondaryProfileId : '' };
        state.secondaryApiConfigs.push(config);
        state.activeSecondaryApiId = config.id;
    }
    state.assistPrompts = Object.fromEntries(Object.keys(promptDefaults).map(kind => [kind, getPrompt(saved || {}, kind).text]));
    // 仅迁移逐字相同的旧默认文案，保留用户编辑过的提示词。
    if (state.assistPrompts.builtin === LEGACY_INSTRUCTION) state.assistPrompts.builtin = INSTRUCTION;
}

function createSettingsActions({ state, host, change }) {
    const findConfig = id => {
        const config = state.secondaryApiConfigs.find(item => item.id === text(id, '配置标识'));
        if (!config) throw new Error('找不到所选的副 API 配置。');
        return config;
    };
    return {
        saveApiConfig(fields, id = '') {
            return change(() => {
                const values = configFields(fields);
                if (id) {
                    const config = findConfig(id);
                    Object.assign(config, values);
                    if (config.id === state.activeSecondaryApiId) syncSelection(state, config);
                } else {
                    const config = { id: crypto.randomUUID(), ...values };
                    state.secondaryApiConfigs.push(config);
                    syncSelection(state, config);
                    state.designApi = 'secondary';
                }
                state.notice = 'API 配置已保存。';
            });
        },
        selectApiConfig(id) {
            return change(() => {
                syncSelection(state, findConfig(id));
                state.designApi = 'secondary'; state.notice = '';
            });
        },
        deleteApiConfig(id) {
            return change(() => {
                const config = findConfig(id);
                state.secondaryApiConfigs = state.secondaryApiConfigs.filter(item => item.id !== config.id);
                if (state.activeSecondaryApiId === config.id) syncSelection(state, state.secondaryApiConfigs[0]);
                if (!state.secondaryApiConfigs.length) state.designApi = 'main';
                state.notice = 'API 配置已删除。';
            });
        },
        getPrompt: kind => getPrompt(state, kind),
        savePrompt(kind, value) {
            return change(() => {
                const prompt = rawText(value, '提示词');
                state.assistPrompts[kind] = promptText({ [kind]: prompt }, kind);
                state.notice = '提示词已保存。';
            });
        },
        readApiProfile: profileId => host.readApiProfile(profileId),
        fetchApiModels: fields => host.fetchApiModels(fields),
    };
}

globalThis.YaKitWorkbench.settings = { restoreSettings, syncLegacyFields, createSettingsActions };
})();
