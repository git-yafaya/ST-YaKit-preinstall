(() => {
'use strict';
const { required } = globalThis.YaKitPreview.state;

const INSTRUCTION = `你是提示词设计助手。根据用户需求、提示词草稿和设计讨论生成或修改提示词。
根据用户对正文的评价与修改要求调整提示词，由用户阅读试写结果并决定是否采用。
只输出一个 JSON 对象，格式为 {"prompt":"完整的下一版提示词","explanation":"简要说明修改内容"}。
prompt 必须是可直接使用的完整提示词，不能是修改补丁。`;

function designMessages(state, instruction, draft = state.draft) {
    // 仅传入工作台设计讨论，不隐式加入试写正文或环境记录。
    return [
        { role: 'system', content: INSTRUCTION },
        { role: 'user', content: `需求：\n${state.goal}\n\n本次修改的提示词：\n${draft || '尚无草稿'}` },
        ...state.messages.map(({ role, content }) => ({ role, content })),
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
    return { prompt: data.prompt.trim(), explanation: data.explanation.trim() };
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

globalThis.YaKitPreview.prompts = { designMessages, parseDesign, feedbackInstruction };
})();
