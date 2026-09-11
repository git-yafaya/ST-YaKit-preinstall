(() => {
'use strict';
const { clone, designSettings, rawText, required } = globalThis.YaKitWorkbench.state;
const defaults = {
    scenarioText: '', scenarioPrompt: '', sceneSource: 'manual', emptyCardMode: true, sampleCount: 3,
    sampleRequestMode: 'parallel', combineDesignScenario: false,
    moduleApis: { design: 'default', scenario: 'default', sample: 'default', judge: 'default' },
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
    if (key === 'moduleApis') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('模块 API 配置格式不正确。');
        return Object.fromEntries(Object.keys(defaults.moduleApis).map(module => {
            const selected = required(value[module], '模块 API');
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
}

function moduleSettings(state, module) {
    const selection = state.moduleApis?.[module] || defaults.moduleApis[module];
    if (selection === 'default' || selection === 'main') return designSettings(state);
    const config = state.secondaryApiConfigs.find(item => item.id === selection);
    if (!config) {
        const name = { design: '提示词设计', scenario: '场景生成', sample: '样本生成', judge: '盲评' }[module];
        throw new Error(`请重新选择${name}模块的 API 配置。`);
    }
    return designSettings({ ...state, activeSecondaryApiId: config.id, secondarySource: config.profileId ? 'profile' : 'custom',
        secondaryProfileId: config.profileId, secondaryUrl: config.url, secondaryModel: config.model, secondaryKey: config.apiKey });
}

const promptContract = '本阶段只编写专用场景生成提示词，不生成场景。'
    + '只依据本次原始需求和当前候选条目，按原需求逐点展开适用条件、正确边界、诱发违规的具体事件、可观察事实和已有冲突优先级。'
    + '每个细项独立成句，覆盖全部原需求，不固定套用无关角色或题材，不输出达标答案。';

function promptMessages(goal, content, assistPrompts) {
    return [{ role: 'system', content: promptText(assistPrompts, 'builtin') },
        { role: 'system', content: `${promptText(assistPrompts, 'scenario')}\n\n${promptContract}\n只输出完整专用提示词文本，不加 JSON、代码围栏或解释。` },
        { role: 'user', content: JSON.stringify({ goal: required(goal, '原始需求'), candidate: rawText(content, '候选提示词') }) }];
}

function messages(goal, content, assistPrompts, scenarioPrompt) {
    return [{ role: 'system', content: promptText(assistPrompts, 'builtin') },
        { role: 'system', content: `${required(scenarioPrompt, '场景生成提示词')}\n\n本阶段执行以上专用提示词，只输出一个可直接作为 user 消息的完整冲突测试场景。`
        + '只提供必要背景、事实、请求和待处理事件，停在被测模型开始回应之前。'
        + '不要把需求分析、判断边界、优先级说明、评分规则或达标示范附在场景中，不解释测试目的，不解决冲突，不续写被测正文。' },
        { role: 'user', content: JSON.stringify({ goal: required(goal, '原始需求'), candidate: rawText(content, '候选提示词') }) }];
}

function combinedMessages(designMessages, assistPrompts) {
    return [...designMessages, { role: 'system', content: `${promptText(assistPrompts, 'scenario')}\n\n${promptContract}`
        + '\n本次与提示词设计合并：以本次需求和即将输出的 prompt 条目为依据编写专用场景生成提示词。'
        + '仍只输出原设计 JSON，并额外增加 scenarioPrompt 字段保存详细、完整、可单独执行的专用提示词，场景留给下一次请求生成。' }];
}

async function generate(host, { goal, content, assistPrompts, settings, signal, scenarioPrompt = '',
    isActive = () => !signal?.aborted, onPrompt = () => {} }) {
    // 两阶段沿用开始时的连接和引导，途中编辑设置不会改变本次任务。
    const settingsSnapshot = clone(settings), promptsSnapshot = clone(assistPrompts);
    const active = () => !signal?.aborted && isActive();
    if (!active()) return;
    try {
        let prompt = rawText(scenarioPrompt, '场景生成提示词').trim();
        if (!prompt) {
            const reply = await host.design(promptMessages(goal, content, promptsSnapshot), {
                settings: clone(settingsSnapshot), signal, purpose: 'scenario-prompt',
            });
            if (!active()) return;
            prompt = required(reply, '场景生成提示词');
        }
        if (!active()) return;
        await onPrompt(prompt);
        if (!active()) return;
        const reply = await host.design(messages(goal, content, promptsSnapshot, prompt), {
            settings: clone(settingsSnapshot), signal, purpose: 'scenario',
        });
        if (!active()) return;
        return { scenarioPrompt: prompt, scenario: required(reply, '测试场景') };
    } catch (error) {
        if (!active()) return;
        throw error;
    }
}

globalThis.YaKitWorkbench.scenarios = { defaults, settingValue, restore, moduleSettings, promptMessages, messages, combinedMessages, generate };
})();
