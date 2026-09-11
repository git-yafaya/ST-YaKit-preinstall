(() => {
'use strict';
const { clone, designSettings, rawText, required } = globalThis.YaKitWorkbench.state;
const defaults = {
    scenarioText: '', scenarioPrompt: '', sceneSource: 'manual', emptyCardMode: true, sampleCount: 1, testVersionIds: [],
    sampleRequestMode: 'parallel', combineDesignScenario: false,
    moduleApis: { design: 'default', scenario: 'default', sample: 'default', judge: 'default', presetSearch: 'default' },
};
const { promptText } = globalThis.YaKitWorkbench;

function settingValue(key, value) {
    if (!Object.hasOwn(defaults, key)) return undefined;
    if (['scenarioText', 'scenarioPrompt'].includes(key)) return rawText(value, key === 'scenarioText' ? '测试场景' : '场景生成提示词');
    if (['emptyCardMode', 'combineDesignScenario'].includes(key)) {
        if (typeof value !== 'boolean') throw new Error('测试开关必须为布尔值。');
        return value;
    }
    if (key === 'sampleCount') {
        if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 6) throw new Error('样本数量必须是 1 至 6 的整数。');
        return Number(value);
    }
    if (key === 'testVersionIds') {
        if (!Array.isArray(value)) throw new Error('参测版本必须是数组。');
        const ids = value.map(id => required(id, '参测版本标识'));
        if (new Set(ids).size !== ids.length) throw new Error('参测版本不能重复。');
        return ids;
    }
    if (key === 'moduleApis') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('模块 API 配置格式不正确。');
        return Object.fromEntries(Object.keys(defaults.moduleApis).map(module => {
            // 旧存档没有条目查找配置，补默认选择并保留已有四项。
            const selected = required(module === 'presetSearch' && !Object.hasOwn(value, module) ? 'default' : value[module], '模块 API');
            return [module, selected === 'main' ? 'default' : selected];
        }));
    }
    if (!(key === 'sceneSource' ? ['manual', 'ai'] : ['parallel', 'single']).includes(value)) throw new Error('测试设置值不正确。');
    return value;
}

function restore(state, saved) {
    for (const [key, value] of Object.entries(defaults)) {
        state[key] = clone(value);
        try { if (saved && Object.hasOwn(saved, key)) state[key] = settingValue(key, saved[key]); } catch { /* 损坏设置恢复默认值。 */ }
    }
    state.testVersionIds = state.testVersionIds.filter(id => state.versions.some(version => version.id === id));
}

function moduleSettings(state, module) {
    const selection = state.moduleApis?.[module] || defaults.moduleApis[module];
    if (selection === 'default' || selection === 'main') return designSettings(state);
    const config = state.secondaryApiConfigs.find(item => item.id === selection);
    if (!config) {
        const name = { design: '提示词设计', scenario: '场景生成', sample: '样本生成', judge: '盲评', presetSearch: '预设条目查找' }[module];
        throw new Error(`请重新选择${name}模块的 API 配置。`);
    }
    return designSettings({ ...state, activeSecondaryApiId: config.id, secondarySource: config.profileId ? 'profile' : 'custom',
        secondaryProfileId: config.profileId, secondaryUrl: config.url, secondaryModel: config.model, secondaryKey: config.apiKey });
}

function messages(goal, content, assistPrompts) {
    // 所有候选共享原需求生成的场景，旧调用的候选参数不再发送。
    return [{ role: 'system', content: promptText(assistPrompts, 'builtin') },
        { role: 'system', content: promptText(assistPrompts, 'scenario') },
        { role: 'user', content: JSON.stringify({ goal: required(goal, '原始需求') }) }];
}

async function generate(host, { goal, content, assistPrompts, settings, signal, isActive = () => !signal?.aborted }) {
    const active = () => !signal?.aborted && isActive();
    if (!active()) return;
    try {
        const reply = await host.design(messages(goal, content, assistPrompts), {
            settings: clone(settings), signal, purpose: 'scenario',
        });
        if (!active()) return;
        return { scenario: required(reply, '测试场景') };
    } catch (error) {
        if (!active()) return;
        throw error;
    }
}

globalThis.YaKitWorkbench.scenarios = { defaults, settingValue, restore, moduleSettings, messages, generate };
})();
