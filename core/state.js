(() => {
'use strict';
const clone = value => structuredClone(value);

function rawText(value, name = '内容') {
    if (typeof value !== 'string') throw new Error(`${name}必须是文字。`);
    return value;
}

const text = (value, name) => rawText(value, name).trim();

function required(value, name) {
    const result = text(value, name);
    if (!result) throw new Error(`请先填写${name}。`);
    return result;
}

const settingDefaults = {
    theme: 'st', designApi: 'main', secondarySource: 'profile',
    secondaryProfileId: '', secondaryUrl: '', secondaryModel: '', secondaryKey: '',
};
const settingOptions = {
    theme: ['st', 'forest', 'light', 'dark'], designApi: ['main', 'secondary'], secondarySource: ['profile', 'custom'],
};

function settingValue(key, value) {
    if (!Object.hasOwn(settingDefaults, key)) throw new Error(`不能更新字段：${key}。`);
    const result = text(value, key);
    if (settingOptions[key] && !settingOptions[key].includes(result)) throw new Error(`设置值不正确：${key}。`);
    return result;
}

function designSettings(state) {
    const settings = Object.fromEntries(Object.keys(settingDefaults).map(key => [key, settingValue(key, state[key])]));
    if (settings.designApi === 'secondary') {
        if (settings.secondarySource === 'profile') {
            if (!state.profiles.some(profile => profile.id === settings.secondaryProfileId && profile.id)) {
                throw new Error('请先在设置中选择可用的副 API 连接。');
            }
        } else {
            required(settings.secondaryUrl, '副 API 地址');
            required(settings.secondaryModel, '副 API 模型');
            let url;
            try { url = new URL(settings.secondaryUrl); } catch { throw new Error('副 API 地址必须是完整的 HTTP 或 HTTPS 地址。'); }
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error('副 API 地址必须是完整的 HTTP 或 HTTPS 地址。');
        }
    }
    return settings;
}

function initialState(saved) {
    const state = {
        goal: '', draft: '', ...settingDefaults,
        messages: [], versions: [], selectedVersionId: '', trials: [], selectedTrialId: '',
        profiles: [], mainApiLabel: '', contextLabel: '', canTrial: false,
        presets: [], selectedPresetName: '', presetEntries: [], presetSource: null,
        busy: null, error: '', notice: '',
    };
    if (!saved || typeof saved !== 'object') return state;
    for (const key of ['goal', 'draft']) {
        if (typeof saved[key] === 'string') state[key] = saved[key];
    }
    for (const key of Object.keys(settingDefaults)) {
        try { state[key] = settingValue(key, saved[key]); } catch { /* 无效设置恢复默认值。 */ }
    }
    if (!state.secondaryProfileId && typeof saved.profileId === 'string') state.secondaryProfileId = saved.profileId.trim();
    // 只恢复完整记录，避免损坏的本地数据打断工作台。
    const records = key => Array.isArray(saved[key]) ? saved[key] : [];
    state.messages = records('messages').filter(item => item && ['user', 'assistant'].includes(item.role)
        && typeof item.content === 'string').map(({ role, content }) => ({ role, content }));
    state.versions = records('versions').filter(item => item && typeof item.id === 'string'
        && typeof item.content === 'string' && item.content.trim()).map(item => ({
        id: item.id, label: typeof item.label === 'string' ? item.label : '已保存版本',
        content: item.content, createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    }));
    state.trials = records('trials').filter(item => item && typeof item.id === 'string'
        && typeof item.content === 'string' && state.versions.some(version => version.id === item.versionId))
        .map(item => ({
            id: item.id, versionId: item.versionId, content: item.content,
            input: typeof item.input === 'string' ? item.input : '',
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
            context: item.context && typeof item.context === 'object' ? clone(item.context) : {},
            feedback: {
                status: ['pending', 'satisfied', 'revise'].includes(item.feedback?.status) ? item.feedback.status : 'pending',
                note: typeof item.feedback?.note === 'string' ? item.feedback.note : '',
                excerpt: typeof item.feedback?.excerpt === 'string' ? item.feedback.excerpt : '',
            },
        }));
    if (state.versions.some(item => item.id === saved.selectedVersionId)) state.selectedVersionId = saved.selectedVersionId;
    if (state.trials.some(item => item.id === saved.selectedTrialId)) state.selectedTrialId = saved.selectedTrialId;
    return state;
}

function savedState(state) {
    // 预设目标只在当前页面有效，重新加载页面后须重新读取并选择条目。
    const { profiles, mainApiLabel, contextLabel, canTrial, presets, selectedPresetName,
        presetEntries, presetSource, busy, error, notice, ...data } = state;
    return clone(data);
}

const api = globalThis.YaKitWorkbench ||= {};
api.state = { clone, rawText, text, required, settingValue, designSettings, initialState, savedState };
})();
