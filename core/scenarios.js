(() => {
'use strict';
const { clone, designSettings, rawText, required } = globalThis.YaKitWorkbench.state;
const defaults = {
    scenarioText: '', sceneSource: 'manual', emptyCardMode: true, sampleCount: 3,
    sampleRequestMode: 'parallel', combineDesignScenario: false,
    moduleApis: { design: 'default', scenario: 'default', sample: 'main', judge: 'default' },
};
const SCENARIO_INSTRUCTION = `你是提示词压力测试场景设计员。只输出一个可直接作为 user 消息的完整测试场景，不输出答案、不续写聊天。
从原始需求和候选提示词抽取可检验约束，设计有具体人物、动机、信息差和冲突诱因的极限场景。
必须包含会诱发违反约束的明确请求或事件，角色不知道的信息与读者知道的信息要分清；涉及玩家决定时设置诱因，但把最终决定留给玩家。
场景应足以区分是否遵守需求，避免泛泛的“继续故事”；所有样本将收到完全相同的场景。`;

function settingValue(key, value) {
    if (!Object.hasOwn(defaults, key)) return undefined;
    if (key === 'scenarioText') return rawText(value, '测试场景');
    if (['emptyCardMode', 'combineDesignScenario'].includes(key)) {
        if (typeof value !== 'boolean') throw new Error('测试开关必须为布尔值。');
        return value;
    }
    if (key === 'sampleCount') {
        if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 6) throw new Error('样本数量必须是 1 至 6 的整数。');
        return Number(value);
    }
    if (key === 'moduleApis') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('模块 API 配置格式不正确。');
        return Object.fromEntries(Object.keys(defaults.moduleApis).map(module => [module, required(value[module], '模块 API')]));
    }
    if (!(key === 'sceneSource' ? ['manual', 'ai'] : ['parallel', 'single']).includes(value)) throw new Error('测试设置值不正确。');
    return value;
}

function restore(state, saved) {
    for (const [key, value] of Object.entries(defaults)) {
        state[key] = clone(value);
        try { if (saved && Object.hasOwn(saved, key)) state[key] = settingValue(key, saved[key]); } catch { /* 损坏设置恢复默认值。 */ }
    }
}

function moduleSettings(state, module) {
    const selection = state.moduleApis?.[module] || defaults.moduleApis[module];
    if (selection === 'default') return designSettings(state);
    if (selection === 'main') return designSettings({ ...state, designApi: 'main' });
    const config = state.secondaryApiConfigs.find(item => item.id === selection);
    if (!config) {
        const name = { design: '提示词设计', scenario: '场景生成', sample: '样本生成', judge: '盲评' }[module];
        throw new Error(`请重新选择${name}模块的 API 配置。`);
    }
    return designSettings({ ...state, designApi: 'secondary', secondarySource: config.profileId ? 'profile' : 'custom',
        secondaryProfileId: config.profileId, secondaryUrl: config.url, secondaryModel: config.model, secondaryKey: config.apiKey });
}

function messages(goal, content) {
    return [{ role: 'system', content: SCENARIO_INSTRUCTION },
        { role: 'user', content: JSON.stringify({ goal: required(goal, '原始需求'), candidate: content }) }];
}

function combinedMessages(designMessages) {
    return [...designMessages, { role: 'system', content: `${SCENARIO_INSTRUCTION}\n本次与提示词设计合并：仍只输出原设计 JSON，并额外增加 scenario 字段保存完整测试场景。` }];
}

globalThis.YaKitWorkbench.scenarios = { defaults, settingValue, restore, moduleSettings, messages, combinedMessages };
})();
