(() => {
'use strict';
const { clone, required, text } = globalThis.YaKitWorkbench.state;
const { moduleSettings, generate: generateScenario } = globalThis.YaKitWorkbench.scenarios;
const judgement = globalThis.YaKitWorkbench.judgement;
const { promptText } = globalThis.YaKitWorkbench;
const snapshotSettings = state => ({ emptyCardMode: state.emptyCardMode, sampleCount: state.sampleCount,
    sampleRequestMode: state.sampleRequestMode, moduleApis: clone(state.moduleApis) });

function reviewValue(value = {}, restoring = false) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('评审阶段格式不正确。');
    const stage = value.stage ?? 'initial', round = value.round ?? 1;
    if (!(restoring ? ['initial', 'second', 'final', 'approved'] : ['initial', 'second']).includes(stage)
        || !Number.isSafeInteger(round) || round < 1) throw new Error('评审阶段或轮次不正确。');
    return { stage, round, parentTaskId: text(value.parentTaskId ?? '', '上轮测试任务'), summary: text(value.summary ?? '', '评审摘要') };
}

function restore(state, saved) {
    state.testTasks = [];
    state.selectedTestTaskId = '';
    for (const item of Array.isArray(saved?.testTasks) ? saved.testTasks : []) {
        if (!item || typeof item.id !== 'string' || typeof item.goal !== 'string' || typeof item.scenario !== 'string') continue;
        const candidates = [];
        for (const record of Array.isArray(item.candidates) ? item.candidates : [item]) {
            const version = state.versions.find(version => version.id === record?.versionId);
            if (!version || candidates.some(candidate => candidate.versionId === version.id)) continue;
            candidates.push({ versionId: version.id, versionLabel: typeof record.versionLabel === 'string' ? record.versionLabel : version.label,
                versionNumber: Number.isSafeInteger(record.versionNumber) && record.versionNumber > 0 ? record.versionNumber : version.number,
                content: typeof record.content === 'string' ? record.content : version.content });
        }
        if (!candidates.length) continue;
        const settings = { ...snapshotSettings(state) };
        for (const key of Object.keys(settings)) {
            try { if (item.settings && Object.hasOwn(item.settings, key)) settings[key] = globalThis.YaKitWorkbench.scenarios.settingValue(key, item.settings[key]); }
            catch { /* 损坏的运行设置使用当前默认值。 */ }
        }
        let review;
        try { review = reviewValue(item.review, true); } catch { review = reviewValue(); }
        const task = { id: item.id, review, ...candidates[0], candidates, expectedSampleCount: candidates.length * settings.sampleCount,
            goal: item.goal, scenario: item.scenario, scenarioPrompt: typeof item.scenarioPrompt === 'string' ? item.scenarioPrompt : '',
            sceneSource: item.sceneSource === 'ai' ? 'ai' : 'manual', settings,
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : '', status: item.status,
            error: typeof item.error === 'string' ? item.error : '',
            generationError: typeof item.generationError === 'string' ? item.generationError : '',
            trialIds: [], preferredTrialId: '', judgement: null };
        // 刷新后不能继续旧请求；已保存的样本仍可重新盲评。
        if (!['completed', 'partial', 'error', 'cancelled'].includes(task.status)) {
            task.status = 'cancelled'; task.error = '页面重载中断了测试，已有样本已保留。';
        }
        for (const trial of state.trials) {
            const original = (Array.isArray(saved.trials) ? saved.trials : []).find(record => record?.id === trial.id);
            if (original?.taskId !== task.id || !candidates.some(candidate => candidate.versionId === trial.versionId)) continue;
            trial.taskId = task.id;
            trial.sampleIndex = Number.isInteger(original.sampleIndex) && original.sampleIndex > 0 ? original.sampleIndex : task.trialIds.length + 1;
            task.trialIds.push(trial.id);
        }
        task.trialIds.sort((a, b) => state.trials.find(trial => trial.id === a).sampleIndex - state.trials.find(trial => trial.id === b).sampleIndex);
        if (task.trialIds.includes(item.preferredTrialId)) task.preferredTrialId = item.preferredTrialId;
        const taskTrials = state.trials.filter(trial => task.trialIds.includes(trial.id));
        task.judgement = judgement.restore(item.judgement, taskTrials);
        const previousJudgement = judgement.restore(item.review?.previousJudgement, taskTrials);
        if (previousJudgement) task.review.previousJudgement = previousJudgement;
        state.testTasks.push(task);
    }
    if (state.testTasks.some(item => item.id === saved?.selectedTestTaskId)) state.selectedTestTaskId = saved.selectedTestTaskId;
}

function createActions({ state, host, run, change, persist, emit, fail, find, isActive, getRevision }) {
    const judge = async (task, operation, settings, assistPrompts) => {
        const trials = task.trialIds.map(id => find(state.trials, id, '测试样本'));
        if (!trials.length) throw new Error('这个测试任务还没有可评分的样本。');
        // 用随机键打乱顺序并分配新标签，发送内容不包含候选提示词、版本和设计记录。
        const anonymous = trials.map(trial => ({ trial, key: crypto.randomUUID() })).sort((a, b) => a.key.localeCompare(b.key))
            .map(({ trial }, index) => ({ trialId: trial.id, label: `样本${index + 1}`, content: trial.content }));
        task.status = 'judging'; task.error = ''; emit();
        const instruction = `${promptText(assistPrompts, 'builtin')}\n\n${promptText(assistPrompts, 'judge')}`;
        const reply = await host.design([{ role: 'system', content: instruction }, { role: 'user', content: JSON.stringify({
            goal: task.goal, scenario: task.scenario, samples: anonymous.map(({ label, content }) => ({ label, content })),
        }) }], { settings, purpose: 'judge', signal: operation.controller.signal });
        if (!isActive(operation)) return;
        task.judgement = { createdAt: new Date().toISOString(), ...judgement.parse(reply, anonymous) };
        if (state.selectedTestTaskId === task.id && !task.preferredTrialId) {
            // 同分保持样本原顺序，只调整阅读位置，不代替用户表达偏好。
            state.selectedTrialId = task.trialIds.map(id => task.judgement.results.find(row => row.trialId === id))
                .sort((a, b) => b.score - a.score)[0].trialId;
        }
        const complete = !task.generationError && task.trialIds.length === task.expectedSampleCount;
        task.status = complete ? 'completed' : 'partial';
        task.error = complete ? '' : task.generationError || `已评分 ${task.trialIds.length} 份样本，原计划 ${task.expectedSampleCount} 份。`;
        state.notice = complete ? '测试和盲评已完成，请阅读样本并选择最喜欢的一份。' : '现有样本已评分，采样尚未全部完成。';
        return task;
    };
    const track = async (task, operation, action) => {
        operation.task = task;
        try { return await action(); } catch (error) {
            if (isActive(operation)) {
                if (task.status === 'generating') task.generationError = error.message || String(error);
                task.status = 'error'; task.error = error.message || String(error);
            }
            throw error;
        }
    };
    return {
        generateScenario() {
            let settings, goal, assistPrompts;
            try {
                settings = moduleSettings(state, 'scenario'); goal = required(state.goal, '原始需求');
                assistPrompts = clone(state.assistPrompts);
            }
            catch (error) { return fail(error); }
            const revision = getRevision();
            return run('scenario', async operation => {
                const result = await generateScenario(host, { goal, assistPrompts, settings,
                    signal: operation.controller.signal, isActive: () => isActive(operation),
                });
                if (!result || !isActive(operation)) return;
                if (getRevision() === revision) {
                    state.scenarioPrompt = ''; state.scenarioText = result.scenario;
                    state.sceneSource = 'ai'; state.notice = '测试场景已生成，可编辑后开始测试。';
                }
                else state.notice = '生成期间需求、草稿或场景已修改，本次生成未覆盖当前输入。';
            });
        },
        async trial(input = state.scenarioText, options = {}) {
            let candidates, settings, scenario, goal, review;
            try {
                if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('测试选项格式不正确。');
                if (options.versionIds !== undefined && !Array.isArray(options.versionIds)) throw new Error('待测提示词列表格式不正确。');
                review = reviewValue(options.review);
                if (state.testVersionIds !== undefined && !Array.isArray(state.testVersionIds)) throw new Error('待测提示词列表格式不正确。');
                const selected = (options.versionIds?.length ? options.versionIds : state.testVersionIds || []).map(id => required(id, '待测提示词版本'));
                const versions = [...new Set(selected.length ? selected : [state.selectedVersionId])]
                    .map(id => find(state.versions, id, '已保存版本，请先保存草稿'));
                if (!selected.length && state.draft !== versions[0].content) throw new Error('草稿已有修改，请先保存为新版本，再测试。');
                candidates = versions.map(version => ({ versionId: version.id, versionLabel: version.label,
                    versionNumber: version.number, content: version.content }));
                goal = required(options.goal === undefined ? state.goal : options.goal, '原始需求');
                scenario = text(input, '测试场景');
                if (state.sceneSource === 'manual') required(scenario, '测试场景');
                settings = { sample: moduleSettings(state, 'sample'), judge: moduleSettings(state, 'judge'),
                    scenario: !scenario ? moduleSettings(state, 'scenario') : null };
                // 一次固定本任务的正文连接，仅传给本次请求，不写进任务记录。
                if (state.emptyCardMode && host.prepareTrialSettings) settings.sample = host.prepareTrialSettings(settings.sample);
                if (state.emptyCardMode ? settings.sample.designApi === 'main' && !(state.canGenerate || state.canTrial) : !state.canTrial) {
                    throw new Error('当前没有可用的生成连接或试写背景。');
                }
            } catch (error) { return fail(error); }
            const runtime = snapshotSettings(state), sceneSource = state.sceneSource;
            const scenarioPrompt = scenario && state.scenarioText === input ? state.scenarioPrompt : '';
            // 本任务沿用开始时保存的引导词，生成期间编辑设置不会改变后续请求。
            const assistPrompts = Object.fromEntries(['builtin', 'scenario', 'judge', 'chatScenario']
                .map(kind => [kind, promptText(state.assistPrompts, kind)]));
            const revision = getRevision();
            return run('trial', async operation => {
                const task = { id: crypto.randomUUID(), review, ...candidates[0], candidates, expectedSampleCount: candidates.length * runtime.sampleCount,
                    goal, scenario, scenarioPrompt, sceneSource, settings: runtime, createdAt: new Date().toISOString(),
                    status: scenario ? 'generating' : 'scenario', error: '', generationError: '', trialIds: [], preferredTrialId: '', judgement: null };
                state.testTasks.push(task); state.selectedTestTaskId = task.id; state.selectedTrialId = ''; emit();
                await track(task, operation, async () => {
                    await persist();
                    if (!isActive(operation)) return;
                    if (!task.scenario) {
                        const generated = await generateScenario(host, { goal, assistPrompts,
                            settings: settings.scenario, signal: operation.controller.signal, isActive: () => isActive(operation),
                        });
                        if (!generated || !isActive(operation)) return;
                        task.scenario = generated.scenario;
                        if (getRevision() === revision) {
                            state.scenarioPrompt = task.scenarioPrompt; state.scenarioText = task.scenario;
                        }
                    }
                    task.status = 'generating'; emit();
                    // 固定场景先落盘，刷新后仍能看到本次样本实际使用的场景。
                    await persist();
                    if (!isActive(operation)) return;
                    let extraIndex = task.expectedSampleCount;
                    const sample = async (candidate, count, index) => {
                        const result = await host.trial({ content: candidate.content, input: task.scenario, emptyCardMode: runtime.emptyCardMode,
                            sampleCount: count, sampleRequestMode: runtime.sampleRequestMode, builtinPrompt: assistPrompts.builtin,
                            ...(runtime.emptyCardMode ? {} : { chatScenario: assistPrompts.chatScenario }) },
                        { settings: settings.sample, signal: operation.controller.signal });
                        if (!isActive(operation)) return;
                        const results = Array.isArray(result?.samples) ? result.samples : [result];
                        // 先保存已收到的正文，数量异常也不会抹掉这些样本。
                        for (const [offset, item] of results.entries()) {
                            const content = required(item?.content, '样本正文');
                            const trial = { id: crypto.randomUUID(), versionId: candidate.versionId, taskId: task.id,
                                sampleIndex: offset < count ? index + offset : ++extraIndex,
                                content, input: task.scenario, createdAt: new Date().toISOString(),
                                context: item.context && typeof item.context === 'object' ? clone(item.context) : {},
                                feedback: { status: 'pending', note: '', excerpt: '' } };
                            state.trials.push(trial); task.trialIds.push(trial.id);
                            if (state.selectedTestTaskId === task.id && !state.selectedTrialId) state.selectedTrialId = trial.id;
                        }
                        task.trialIds.sort((a, b) => find(state.trials, a).sampleIndex - find(state.trials, b).sampleIndex);
                        emit(); await persist();
                        if (results.length !== count) throw new Error(`模型返回了 ${results.length} 份样本，预期 ${count} 份；已有样本已保留。`);
                    };
                    // 每个候选占固定编号区间，返回先后不会改变样本归属。
                    const requests = candidates.flatMap((candidate, candidateIndex) => {
                        const start = candidateIndex * runtime.sampleCount + 1;
                        return runtime.sampleRequestMode === 'single'
                            ? [() => sample(candidate, runtime.sampleCount, start)]
                            : Array.from({ length: runtime.sampleCount }, (_, index) => () => sample(candidate, 1, start + index));
                    });
                    let failure;
                    if (runtime.emptyCardMode) {
                        const results = await Promise.allSettled(requests.map(request => request()));
                        failure = results.find(result => result.status === 'rejected')?.reason;
                    } else {
                        // 聊天使用酒馆共享生成状态，失败后仍尝试其余候选，取消后停止。
                        for (const request of requests) {
                            if (!isActive(operation)) return;
                            try { await request(); } catch (error) { failure ||= error; }
                        }
                    }
                    if (failure) throw failure;
                    if (!isActive(operation)) return;
                    await judge(task, operation, settings.judge, assistPrompts);
                });
            });
        },
        selectTestTask(id) {
            return change(() => {
                if (!text(id, '测试任务')) {
                    state.selectedTestTaskId = ''; state.selectedTrialId = state.trials.find(item => !item.taskId)?.id || ''; return;
                }
                const task = find(state.testTasks, id, '测试任务');
                state.selectedTestTaskId = task.id; state.selectedTrialId = task.trialIds[0] || '';
            });
        },
        judgeTestTask(id) {
            let task, settings, assistPrompts;
            try {
                task = find(state.testTasks, id, '测试任务'); settings = moduleSettings(state, 'judge');
                assistPrompts = Object.fromEntries(['builtin', 'judge'].map(kind => [kind, promptText(state.assistPrompts, kind)]));
            }
            catch (error) { return fail(error); }
            return run('judge', operation => track(task, operation, () => judge(task, operation, settings, assistPrompts)));
        },
        preferTrial(id) {
            return change(() => {
                const trial = find(state.trials, id, '测试样本');
                const task = find(state.testTasks, trial.taskId, '测试任务');
                task.preferredTrialId = trial.id; state.notice = `已选择样本 ${trial.sampleIndex} 为最喜欢的结果。`;
            });
        },
    };
}

globalThis.YaKitWorkbench.testTasks = { restore, createActions };
})();
