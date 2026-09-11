(() => {
'use strict';
const { clone, designSettings, rawText, required } = globalThis.YaKitWorkbench.state;
const defaults = {
    scenarioText: '', sceneSource: 'manual', emptyCardMode: true, sampleCount: 3,
    sampleRequestMode: 'parallel', combineDesignScenario: false,
    moduleApis: { design: 'default', scenario: 'default', sample: 'main', judge: 'default' },
};
const { promptText } = globalThis.YaKitWorkbench;

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

function messages(goal, content, assistPrompts) {
    return [{ role: 'system', content: promptText(assistPrompts, 'scenario') },
        { role: 'user', content: JSON.stringify({ goal: required(goal, '原始需求'), candidate: content }) }];
}

function combinedMessages(designMessages, assistPrompts) {
    return [...designMessages, { role: 'system', content: `${promptText(assistPrompts, 'scenario')}\n本次与提示词设计合并：仍只输出原设计 JSON，并额外增加 scenario 字段保存完整测试场景。` }];
}

globalThis.YaKitWorkbench.scenarios = { defaults, settingValue, restore, moduleSettings, messages, combinedMessages };
})();
