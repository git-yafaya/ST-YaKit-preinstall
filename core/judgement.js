(() => {
'use strict';
const { required } = globalThis.YaKitWorkbench.state;
const instruction = globalThis.YaKitWorkbench.promptDefaults.judge;

function validate(data, samples, key, legacy = false) {
    const invalid = () => { throw new Error('裁判评分缺漏或格式不正确，样本已保留，可以重新盲评。'); };
    let requirements;
    if (!legacy) {
        if (!Array.isArray(data?.requirements) || !data.requirements.length) invalid();
        requirements = data.requirements.map(item => {
            if (!item || !['hard', 'quality'].includes(item.kind)) invalid();
            return { id: required(item.id, '要求标识'), text: required(item.text, '需求条目'), kind: item.kind };
        });
        if (new Set(requirements.map(item => item.id)).size !== requirements.length) invalid();
    }
    const rows = data?.results;
    if (!Array.isArray(rows) || rows.length !== samples.length
        || new Set(rows.map(row => row?.[key])).size !== rows.length) invalid();
    const results = rows.map(row => {
        const sample = samples.find(item => item[key] === row?.[key]);
        if (!row || !sample || !Number.isFinite(row.score) || row.score < 0 || row.score > 100
            || typeof row.reason !== 'string' || !Array.isArray(row.violations)) invalid();
        if (legacy) {
            if (row.violations.some(item => typeof item !== 'string')
                || (row.doubts !== undefined && (!Array.isArray(row.doubts) || row.doubts.length))) invalid();
            return { trialId: sample.trialId, label: String(row.label || ''), score: row.score,
                reason: row.reason, violations: [...row.violations], doubts: [] };
        }
        const evidence = items => {
            if (!Array.isArray(items)) invalid();
            return items.map(item => {
                if (!item || !requirements.some(requirement => requirement.id === item.requirementId)) invalid();
                required(item.quote, '证据原句');
                // 引用保留原样，不修剪后再匹配，确保确实来自这一篇范本。
                if (!sample.content.includes(item.quote)) throw new Error('裁判引用不属于对应范本，样本已保留，可以重新盲评。');
                return { requirementId: item.requirementId, quote: item.quote, reason: required(item.reason, '问题理由') };
            });
        };
        return { trialId: sample.trialId, label: required(row.label, '样本标签'), score: row.score, reason: required(row.reason, '评分理由'),
            violations: evidence(row.violations), doubts: evidence(row.doubts) };
    });
    return { ...(requirements ? { requirements } : {}), results };
}

function parse(reply, samples) {
    let data;
    try { data = JSON.parse(required(reply, '模型答复').replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, '$1')); }
    catch { throw new Error('裁判答复不是有效 JSON，样本已保留，可以重新盲评。'); }
    return validate(data, samples, 'label');
}

function restore(data, trials) {
    if (!data) return null;
    try {
        // 历史评分仍显示原来的文字违例，新请求必须遵守结构化证据契约。
        return { createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
            ...validate(data, trials.map(trial => ({ trialId: trial.id, content: trial.content })), 'trialId', data.requirements === undefined) };
    } catch { return null; }
}

globalThis.YaKitWorkbench.judgement = { instruction, parse, restore };
})();
