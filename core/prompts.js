(() => {
'use strict';
const { required } = globalThis.YaKitWorkbench.state;

const LEGACY_INSTRUCTION = `你是提示词设计助手。根据用户需求、提示词草稿和设计讨论生成或修改提示词。
根据用户对正文的评价与修改要求调整提示词，由用户阅读试写结果并决定是否采用。
只输出一个 JSON 对象，格式为 {"prompt":"完整的下一版提示词","explanation":"简要说明修改内容"}。
prompt 必须是可直接使用的完整提示词，不能是修改补丁。`;

const INSTRUCTION = `你是提示词设计助手。每次新需求默认生成一个独立的提示词条目，只包含本次需求，不自动合并已有条目。
只有用户在本次需求中明确要求修改当前条目时，才修订该条目；用户交回试写反馈时，围绕对应条目修改。
只输出一个 JSON 对象，格式为 {"action":"create","prompt":"单个条目的完整提示词","explanation":"简要说明本次结果"}。
action 为 create 表示新建，revise 表示修订；prompt 必须可直接使用，不能是修改补丁，由用户阅读试写结果并决定是否采用。`;

function designMessages(state, instruction, draft = state.draft, forceRevise = false) {
    // 旧讨论仅供展示；当前条目用于明确修订时参考，不作为新需求的累加底稿。
    const builtin = state.assistPrompts?.builtin || INSTRUCTION;
    const custom = state.assistPrompts?.custom || '';
    return [
        { role: 'system', content: builtin + (custom ? `\n\n${custom}` : '') },
        { role: 'system', content: '本次结果契约：只输出 JSON 对象，包含 action、prompt、explanation。'
            + 'action 只能是 create 或 revise，prompt 是可单独复制使用的单个条目的完整提示词，explanation 是简要说明。\n'
            + (forceRevise
                ? '本次操作：revise。仅根据本次反馈修订下面指定的条目，必须返回 action: "revise"。'
                : '默认返回 action: "create"，只生成本次新需求的独立条目，不自动合并参考条目。'
                    + '只有本次需求明确要求修改当前参考条目时才返回 action: "revise"。背景仅帮助理解本次需求，不要把此前需求或参考条目的全部规则重写进新条目。') },
        { role: 'user', content: forceRevise
            ? `本次反馈对应的条目：\n${draft || '尚无草稿'}`
            : `本次需求背景：\n${state.goal}\n\n当前可参考条目（仅在明确修订时使用）：\n${draft || '尚无草稿'}` },
        { role: 'user', content: instruction },
    ];
}

function parseDesign(reply) {
    const raw = required(reply, '模型答复');
    const fenced = raw.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
    let data;
    try { data = JSON.parse(fenced ? fenced[1] : raw); } catch {
        throw new Error('答复格式不正确，原始答复已保留在讨论中，草稿未改动。');
    }
    if (!data || typeof data.explanation !== 'string' || typeof data.prompt !== 'string' || !data.prompt.trim()) {
        throw new Error('答复缺少完整提示词或修改说明，原始答复已保留在讨论中。');
    }
    // 旧格式默认为新建，未知操作不采用，避免改坏原稿。
    const action = Object.hasOwn(data, 'action') ? data.action : 'create';
    if (!['create', 'revise'].includes(action)) {
        throw new Error('答复操作不正确，action 必须是 create 或 revise，原始答复已保留在讨论中，草稿未改动。');
    }
    return { action, prompt: data.prompt.trim(), explanation: data.explanation.trim(),
        ...(typeof data.scenario === 'string' ? { scenario: data.scenario.trim() } : {}) };
}

function feedbackInstruction(trial, version) {
    const feedback = trial.feedback;
    if (feedback.status === 'pending') throw new Error('请先评价这次试写，再交回修改。');
    required(feedback.note, '修改意见');
    return `请根据用户明确交回的反馈修改版本「${version.label}」。\n`
        + `用户评价：${feedback.status === 'satisfied' ? '满意' : '需要修改'}\n`
        + `用户意见：\n${feedback.note}\n\n用户交回的${feedback.excerpt ? '正文片段' : '正文'}：\n`
        + (feedback.excerpt || trial.content);
}

globalThis.YaKitWorkbench.prompts = { INSTRUCTION, LEGACY_INSTRUCTION, designMessages, parseDesign, feedbackInstruction };
})();
