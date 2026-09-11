(() => {
'use strict';
const { clone, required, text } = globalThis.YaKitWorkbench.state;
const { designMessages, parseDesign } = globalThis.YaKitWorkbench.prompts;
const { moduleSettings } = globalThis.YaKitWorkbench.scenarios;

function createReviewActions({ state, host, run, find, fail, persist, emit, isActive, addVersion, controller, getRevision, draftChanged }) {
    let pending = false;
    const reviewedTask = id => {
        if (pending || state.busy) throw new Error('请等待当前操作完成，或先取消。');
        const task = find(state.testTasks, id, '测试任务');
        if (task.status !== 'completed' || !task.judgement || !task.trialIds.length
            || task.judgement.results.length !== task.trialIds.length
            || task.trialIds.length !== task.expectedSampleCount) {
            throw new Error('请先完成全部样本的试写和 AI 评分。');
        }
        if (task.review?.stage === 'approved') throw new Error('本轮评审已经确认通过。');
        return task;
    };
    return {
        async reviseTestTask(id, note = '') {
            let task, samples, messages, settings, review;
            try {
                task = clone(reviewedTask(id));
                note = text(note, '修改意见');
                samples = task.trialIds.map(trialId => {
                    const trial = find(state.trials, trialId, '测试样本');
                    return { trialId, versionId: trial.versionId, content: required(trial.content, '样本正文') };
                });
                const candidates = task.candidates || [task];
                const best = [...task.judgement.results].sort((a, b) => b.score - a.score)[0];
                const base = candidates.find(candidate => candidate.versionId === samples.find(sample => sample.trialId === best.trialId)?.versionId);
                if (!base) throw new Error('测试样本缺少对应的提示词快照。');
                const rebuilding = ['second', 'final'].includes(task.review?.stage);
                review = { stage: rebuilding ? 'initial' : 'second', round: (task.review?.round || 1) + Number(rebuilding),
                    parentTaskId: task.id, summary: '' };
                const instruction = (rebuilding
                    ? '本轮二审或终审需要继续修改。请在 explanation 中简要说明为什么没用、哪些地方没用、正确位置是什么，并据此拆分、重构完整提示词。'
                    : '请根据各篇正文的评分和证据，提取高分结果中真正有效的提示词部分，修正暴露的问题，整合成一份完整修订提示词，并在 explanation 中简要说明采用了哪些有效部分。')
                    + '\n以本任务原始需求为目标，保留适用条件和例外；评分提供效果证据，用户意见用于修订。不要把用户说“通过”当成符合需求的证据。'
                    + '\n仅返回设计协议规定的 JSON；prompt 是完整提示词，explanation 是可供用户核对的简短结论。\n'
                    + JSON.stringify({ goal: task.goal, scenario: task.scenario, candidates, samples, judgement: task.judgement, note });
                settings = moduleSettings(state, 'design');
                messages = designMessages({ goal: task.goal, assistPrompts: clone(state.assistPrompts) }, instruction, base.content, true);
            } catch (error) { return fail(error); }
            pending = true;
            try {
                const next = await run('review', async operation => {
                    state.messages.push({ role: 'user', content: messages.at(-1).content }); emit();
                    const reply = await host.design(messages, { settings: clone(settings), signal: operation.controller.signal, purpose: 'design' });
                    if (!isActive(operation)) return;
                    state.messages.push({ role: 'assistant', content: text(reply, '模型答复') });
                    const result = parseDesign(reply);
                    if (getRevision() !== operation.revision) {
                        state.notice = '生成期间草稿或版本已改变；本次答复保留在讨论中，请查看后采用。';
                        emit(); return;
                    }
                    // 采用修订稿之前保存尚未留存的草稿，防止用户编辑被覆盖后丢失。
                    if (state.draft.trim() && state.draft !== result.prompt
                        && !state.versions.some(version => version.content === state.draft)) addVersion('修订前草稿', state.draft);
                    const version = addVersion(`${review.stage === 'second' ? '二审' : '重构'}提示词（第 ${review.round} 轮）`, result.prompt);
                    state.draft = version.content; state.selectedVersionId = version.id; state.presetSource = null;
                    state.testVersionIds = [version.id]; draftChanged(); state.notice = result.explanation;
                    review.summary = result.explanation;
                    emit();
                    return version.id;
                });
                if (next === undefined) return;
                // 新版本和任务显式关联，沿用原任务需求与场景，不读取当前输入框。
                return await controller.trial(task.scenario, { versionIds: [next], goal: task.goal, review });
            } finally { pending = false; }
        },
        async confirmReview(id) {
            let task;
            try {
                task = reviewedTask(id);
                if (!['second', 'final'].includes(task.review?.stage)) throw new Error('请先完成二审，再确认评审结果。');
            } catch (error) { return fail(error); }
            pending = true;
            try {
                if (task.review.stage === 'final') {
                    return await run('review', async () => {
                        const review = { ...task.review, stage: 'approved', approvedAt: new Date().toISOString() };
                        const workshop = globalThis.YaKitWorkbench.workshop;
                        // 先校验并复制任务快照，再确认通过，避免归档失败留下半完成状态。
                        const approvals = workshop ? workshop.approvalSnapshots(state, { ...task, review }) : [];
                        task.review = review;
                        for (const approval of approvals) {
                            if (!state.workshopApprovals.some(item => item.id === approval.id)) state.workshopApprovals.push(approval);
                        }
                        state.notice = workshop && !approvals.length
                            ? '本轮演示终审已确认；固定演示样本不归档到社区，请使用真实模型完成测试。'
                            : approvals.length ? '本轮终审已由用户确认通过，作品已归档，可随时发布到社区。'
                                : '本轮终审已由用户确认通过。'; emit();
                        return task;
                    });
                }
                const previous = clone({ judgement: task.judgement, status: task.status, error: task.error, review: task.review });
                let completed = false;
                try {
                    const result = await controller.judgeTestTask(task.id);
                    if (result === undefined) return;
                    task.review = { ...previous.review, stage: 'final', previousJudgement: previous.judgement };
                    state.notice = 'AI 终审已完成，请查看评分后确认或继续修改。';
                    completed = true;
                } finally {
                    // 终审失败或取消时，保留可重试的二审结果。
                    if (!completed) Object.assign(task, previous);
                    emit(); await persist();
                }
                return task;
            } finally { pending = false; }
        },
    };
}

globalThis.YaKitWorkbench.createReviewActions = createReviewActions;
})();
