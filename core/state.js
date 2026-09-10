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

function initialState(saved) {
    const state = {
        goal: '', draft: '', profileId: '', injectionMode: 'append', targetPromptId: '', depth: 1,
        messages: [], versions: [], selectedVersionId: '', trials: [], selectedTrialId: '',
        profiles: [], promptTargets: [], contextLabel: '', canTrial: false,
        busy: null, error: '', notice: '',
    };
    if (!saved || typeof saved !== 'object') return state;
    for (const key of ['goal', 'draft', 'profileId', 'targetPromptId']) {
        if (typeof saved[key] === 'string') state[key] = ['goal', 'draft'].includes(key) ? saved[key] : saved[key].trim();
    }
    if (['append', 'replace'].includes(saved.injectionMode)) state.injectionMode = saved.injectionMode;
    if (Number.isInteger(saved.depth) && saved.depth >= 0) state.depth = saved.depth;
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
    const { profiles, promptTargets, contextLabel, canTrial, busy, error, notice, ...data } = state;
    return clone(data);
}

const api = globalThis.YaKitPreview ||= {};
api.state = { clone, rawText, text, required, initialState, savedState };
})();
