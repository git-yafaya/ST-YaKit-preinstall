(() => {
'use strict';
const api = globalThis.YaKitWorkbench;
const { parseApproval, parseMetadata, parseEntry } = api.workshopPackage;

function approvalSnapshots(state, task) {
    const candidates = task.candidates || [task], ids = task.trialIds;
    const count = task.expectedSampleCount ?? candidates.length * task.settings?.sampleCount;
    if (task.review?.stage !== 'approved' || task.status !== 'completed' || task.generationError
        || !Array.isArray(ids) || !ids.length || ids.length !== count || new Set(ids).size !== count
        || !Array.isArray(task.judgement?.results) || task.judgement.results.length !== count) {
        throw new Error('只有完成全部样本评分并由用户确认终审通过的作品才能归档。');
    }
    const trials = ids.map(id => state.trials.find(trial => trial.id === id));
    if (trials.some(trial => !trial || trial.taskId !== task.id || !trial.content?.trim()
        || !candidates.some(candidate => candidate.versionId === trial.versionId))) throw new Error('终审样本或提示词快照不完整。');
    // 固定演示正文只用来体验操作，不能作为社区作品的实际验证记录。
    if (trials.some(trial => trial.context?.source === 'local-preview')) return [];
    const results = trials.map((trial, index) => {
        const rows = task.judgement.results.filter(row => row.trialId === trial.id);
        const sampleIndex = trial.sampleIndex ?? index + 1;
        if (rows.length !== 1 || !Number.isFinite(rows[0].score) || rows[0].score < 0 || rows[0].score > 100
            || typeof rows[0].reason !== 'string' || !Number.isSafeInteger(sampleIndex) || sampleIndex < 1 || sampleIndex > count) {
            throw new Error('终审评分缺少样本或评分格式不正确。');
        }
        return { sampleIndex, score: rows[0].score, reason: rows[0].reason };
    });
    if (new Set(results.map(row => row.sampleIndex)).size !== count) throw new Error('终审样本编号不能重复。');
    return candidates.map(candidate => {
        // 整组通过完整性检查后，每个作品只保留自己的样本证据，编号从一开始。
        const ownTrials = trials.filter(trial => trial.versionId === candidate.versionId);
        const ownResults = ownTrials.map((trial, index) => ({ ...results[trials.indexOf(trial)], sampleIndex: index + 1 }));
        const models = ownTrials.map(trial => trial.context?.model || trial.context?.connection?.model)
            .filter(model => typeof model === 'string' && model.trim());
        return parseApproval({ formatVersion: 1, id: `${task.id}:${candidate.versionId}`,
            taskId: task.id, versionId: candidate.versionId, title: candidate.versionLabel || '已通过终审的提示词',
            content: candidate.content, goal: task.goal, scenario: task.scenario, approvedAt: task.review.approvedAt ?? null,
            review: { stage: 'approved', round: task.review.round, summary: task.review.summary || '',
                sampleCount: ownTrials.length, results: ownResults, models } });
    });
}

function restore(state, saved) {
    state.workshopUrl = '';
    try { state.workshopUrl = api.workshopUrl(saved?.workshopUrl || ''); } catch { /* 无效旧地址不触发联网。 */ }
    state.workshopApprovals = []; state.workshopImports = [];
    state.workshopEntries = []; state.workshopMine = []; state.workshopUser = null;
    for (const item of Array.isArray(saved?.workshopApprovals) ? saved.workshopApprovals : []) {
        try {
            const approval = parseApproval(item);
            if (!state.workshopApprovals.some(record => record.id === approval.id)) state.workshopApprovals.push(approval);
        } catch { /* 不完整的历史归档不能发布。 */ }
    }
    // 直接读取旧任务快照，不依赖原版本仍存在；不补造历史通过时间。
    for (const task of Array.isArray(saved?.testTasks) ? saved.testTasks : []) {
        if (task?.review?.stage !== 'approved') continue;
        try {
            for (const approval of approvalSnapshots({ trials: Array.isArray(saved.trials) ? saved.trials : [] }, task)) {
                if (!state.workshopApprovals.some(record => record.id === approval.id)) state.workshopApprovals.push(approval);
            }
        } catch { /* 只有保留全部真实快照和评分的旧任务才能迁移。 */ }
    }
    for (const item of Array.isArray(saved?.workshopImports) ? saved.workshopImports : []) {
        if (item && ['entryId', 'releaseId', 'versionId'].every(key => typeof item[key] === 'string' && item[key].trim())
            && state.versions.some(version => version.id === item.versionId)) {
            state.workshopImports.push({ entryId: item.entryId, releaseId: item.releaseId, versionId: item.versionId });
        }
    }
}

function createActions({ state, run, change, find, isActive, addVersion }) {
    const client = api.createWorkshopClient(state.workshopUrl);
    const idle = () => { if (state.busy) throw new Error('请等待当前操作完成后再修改社区连接。'); };
    const ownedEntry = id => {
        const entry = find(state.workshopMine, id, '自己发布的作品');
        if (!state.workshopUser || entry.author.id !== state.workshopUser.id) throw new Error('只能管理自己发布的作品。');
        return entry;
    };
    const applyEntry = data => {
        const entry = parseEntry(data.entry);
        state.workshopMine = [...state.workshopMine.filter(item => item.id !== entry.id), entry];
        state.workshopEntries = state.workshopEntries.filter(item => item.id !== entry.id);
        if (!entry.withdrawn) state.workshopEntries.push(entry);
        return entry;
    };
    const refresh = async operation => {
        try {
            const publicData = await client.request('/entries', { signal: operation.controller.signal });
            if (!Array.isArray(publicData.entries)) throw new Error('社区作品列表格式不正确。');
            const entries = publicData.entries.map(parseEntry).filter(entry => !entry.withdrawn);
            let mine = [];
            if (client.getUser()) {
                const data = await client.request('/me/entries', { auth: true, signal: operation.controller.signal });
                if (!Array.isArray(data.entries)) throw new Error('我的作品列表格式不正确。');
                mine = data.entries.map(parseEntry);
            }
            if (isActive(operation)) { state.workshopEntries = entries; state.workshopMine = mine; }
        } finally {
            if (isActive(operation)) {
                state.workshopUser = client.getUser();
                if (!state.workshopUser) state.workshopMine = [];
            }
        }
    };
    const write = action => run('workshop-save', async () => {
        try { return await action(); } finally { state.workshopUser = client.getUser(); }
    });
    return {
        configureWorkshop(url) {
            return change(() => {
                idle(); const next = client.configure(url);
                if (next !== state.workshopUrl) {
                    state.workshopEntries = []; state.workshopMine = []; state.workshopUser = null;
                }
                state.workshopUrl = next; state.notice = next ? '社区服务地址已保存。' : '社区服务地址已清除。';
            });
        },
        loginWorkshop() {
            return run('workshop-login', async operation => {
                state.workshopUser = await client.login(operation.controller.signal);
                await refresh(operation);
                if (isActive(operation)) state.notice = '已登录社区。';
            });
        },
        logoutWorkshop() {
            return change(() => { idle(); client.logout(); state.workshopUser = null; state.workshopMine = []; state.notice = '已退出社区。'; });
        },
        refreshWorkshop() { return run('workshop-read', refresh); },
        publishWorkshop(approvalId, metadata, entryId = '') {
            return write(async () => {
                // 正文只能取持久归档，表单和当前草稿都不能替换终审内容。
                const approval = parseApproval(find(state.workshopApprovals, approvalId, '已归档的终审作品'));
                const body = { approval, metadata: parseMetadata(metadata) };
                if (entryId) body.entryId = ownedEntry(entryId).id;
                const entry = applyEntry(await client.request('/entries', { method: 'POST', auth: true, body }));
                state.notice = `「${entry.title}」已发布到社区。`; return entry;
            });
        },
        editWorkshopEntry(entryId, metadata) {
            return write(async () => {
                const id = ownedEntry(entryId).id, body = parseMetadata(metadata);
                const entry = applyEntry(await client.request(`/entries/${encodeURIComponent(id)}`, { method: 'PATCH', auth: true, body }));
                state.notice = '作品介绍已更新。'; return entry;
            });
        },
        withdrawWorkshop(entryId) {
            return write(async () => {
                const id = ownedEntry(entryId).id;
                const entry = applyEntry(await client.request(`/entries/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }));
                state.notice = '作品已从社区下架，本地终审作品仍可使用。'; return entry;
            });
        },
        importWorkshopEntry(entryId) {
            let versionId;
            return change(() => {
                const entry = parseEntry(find(state.workshopEntries, entryId, '社区作品'));
                if (entry.withdrawn) throw new Error('作品已下架，不能继续下载。');
                const release = entry.releases.at(-1);
                const previous = state.workshopImports.find(item => item.entryId === entry.id && item.releaseId === release.id
                    && state.versions.some(version => version.id === item.versionId));
                if (previous) { versionId = previous.versionId; state.notice = '这个发布版本已下载，可在本地版本中使用。'; return; }
                const version = addVersion(`${entry.title} · 社区 v${release.number}`, release.approval.content);
                versionId = version.id;
                state.workshopImports = state.workshopImports.filter(item => !(item.entryId === entry.id && item.releaseId === release.id));
                state.workshopImports.push({ entryId: entry.id, releaseId: release.id, versionId });
                state.notice = '已下载为本地版本，可在预设中选择应用；当前草稿已保留。';
            }).then(() => versionId);
        },
    };
}

api.workshop = { restore, approvalSnapshots, createActions };
})();
