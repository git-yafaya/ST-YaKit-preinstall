(() => {
'use strict';
// 浏览器和社区服务共用同一份白名单，只复制公开作品字段。
const object = (value, name) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name}格式不正确。`);
    return value;
};
const string = (value, name, required = false) => {
    if (typeof value !== 'string' || (required && !value.trim())) throw new Error(`${name}必须是${required ? '非空' : ''}文字。`);
    return value;
};
const integer = (value, name) => {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name}必须是正整数。`);
    return value;
};
const date = (value, name) => {
    string(value, name, true);
    if (!Number.isFinite(Date.parse(value))) throw new Error(`${name}不是有效时间。`);
    return value;
};
const strings = (value, name) => {
    if (!Array.isArray(value)) throw new Error(`${name}必须是列表。`);
    return [...new Set(value.map(item => string(item, name, true).trim()))];
};

function parseApproval(value) {
    const data = object(value, '终审作品'), review = object(data.review, '终审记录');
    if (data.formatVersion !== 1 || review.stage !== 'approved') throw new Error('作品必须具有已通过的终审记录。');
    const sampleCount = integer(review.sampleCount, '样本数量');
    if (!Array.isArray(review.results) || review.results.length !== sampleCount) throw new Error('终审评分必须覆盖全部样本。');
    const results = review.results.map(item => {
        object(item, '样本评分');
        const sampleIndex = integer(item.sampleIndex, '样本编号');
        if (sampleIndex > sampleCount || !Number.isFinite(item.score) || item.score < 0 || item.score > 100) {
            throw new Error('样本编号或评分不正确。');
        }
        return { sampleIndex, score: item.score, reason: string(item.reason, '评分理由') };
    });
    if (new Set(results.map(item => item.sampleIndex)).size !== sampleCount) throw new Error('样本编号不能重复。');
    return { formatVersion: 1, id: string(data.id, '终审标识', true), taskId: string(data.taskId, '任务标识', true),
        versionId: string(data.versionId, '版本标识', true), title: string(data.title, '作品名称', true),
        content: string(data.content, '提示词正文', true), goal: string(data.goal, '需求'), scenario: string(data.scenario, '场景'),
        approvedAt: data.approvedAt === null ? null : date(data.approvedAt, '通过时间'),
        review: { stage: 'approved', round: integer(review.round, '评审轮次'), summary: string(review.summary, '评审摘要'),
            sampleCount, results, models: strings(review.models, '模型名称') } };
}

function parseMetadata(value) {
    const data = object(value, '作品介绍');
    return { title: string(data.title, '作品名称', true).trim(), description: string(data.description, '作品介绍'),
        tags: strings(data.tags, '标签'), usage: string(data.usage, '使用说明') };
}

function parseEntry(value) {
    const data = object(value, '社区作品'), author = object(data.author, '作者');
    if (typeof data.withdrawn !== 'boolean' || !Array.isArray(data.releases) || !data.releases.length) {
        throw new Error('社区作品状态或发布版本不正确。');
    }
    const releases = data.releases.map(item => {
        object(item, '发布版本');
        return { id: string(item.id, '发布版本标识', true), number: integer(item.number, '发布版本编号'),
            createdAt: date(item.createdAt, '发布时间'), approval: parseApproval(item.approval) };
    });
    if (new Set(releases.map(item => item.id)).size !== releases.length
        || releases.some((item, index) => index && item.number <= releases[index - 1].number)) throw new Error('发布版本重复或顺序不正确。');
    return { id: string(data.id, '社区作品标识', true),
        author: { id: string(author.id, '作者标识', true), login: string(author.login, '作者名称', true) },
        createdAt: date(data.createdAt, '创建时间'), updatedAt: date(data.updatedAt, '更新时间'),
        withdrawn: data.withdrawn, ...parseMetadata(data), releases };
}

(globalThis.YaKitWorkbench ||= {}).workshopPackage = { parseApproval, parseMetadata, parseEntry };
})();
