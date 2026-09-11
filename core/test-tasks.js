(() => {
'use strict';
const { clone, required, text } = globalThis.YaKitWorkbench.state;
const { moduleSettings, generate: generateScenario } = globalThis.YaKitWorkbench.scenarios;
const judgement = globalThis.YaKitWorkbench.judgement;
const { promptText } = globalThis.YaKitWorkbench;
const snapshotSettings = state => ({ emptyCardMode: state.emptyCardMode, sampleCount: state.sampleCount,
    sampleRequestMode: state.sampleRequestMode, moduleApis: clone(state.moduleApis) });

function restore(state, saved) {
    state.testTasks = [];
    state.selectedTestTaskId = '';
    for (const item of Array.isArray(saved?.testTasks) ? saved.testTasks : []) {
        if (!item || typeof item.id !== 'string' || !state.versions.some(version => version.id === item.versionId)
            || typeof item.goal !== 'string' || typeof item.scenario !== 'string') continue;
        const settings = { ...snapshotSettings(state) };
        for (const key of Object.keys(settings)) {
            try { if (item.settings && Object.hasOwn(item.settings, key)) settings[key] = globalThis.YaKitWorkbench.scenarios.settingValue(key, item.settings[key]); }
            catch { /* 损坏的运行设置使用当前默认值。 */ }
        }
        const version = state.versions.find(version => version.id === item.versionId);
        const task = { id: item.id, versionId: item.versionId, versionLabel: item.versionLabel || version.label,
            versionNumber: item.versionNumber || version.number, content: typeof item.content === 'string' ? item.content : version.content,
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
            if (original?.taskId !== task.id || trial.versionId !== task.versionId) continue;
            trial.taskId = task.id;
            trial.sampleIndex = Number.isInteger(original.sampleIndex) && original.sampleIndex > 0 ? original.sampleIndex : task.trialIds.length + 1;
            task.trialIds.push(trial.id);
        }
        if (task.trialIds.includes(item.preferredTrialId)) task.preferredTrialId = item.preferredTrialId;
        task.judgement = judgement.restore(item.judgement, state.trials.filter(trial => task.trialIds.includes(trial.id)));
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
            .map(({ trial }, index) => ({ trialId: trial.id, label: `样本${String.fromCharCode(65 + index)}`, content: trial.content }));
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
        const complete = task.trialIds.length === task.settings.sampleCount;
        task.status = complete ? 'completed' : 'partial';
        task.error = complete ? '' : task.generationError || `已评分 ${task.trialIds.length} 份样本，原计划 ${task.settings.sampleCount} 份。`;
        state.notice = complete ? '测试和盲评已完成，请阅读样本并选择最喜欢的一份。' : '现有样本已评分，采样尚未全部完成。';
    };
    const track = async (task, operation, action) => {
        operation.task = task;
        try { await action(); } catch (error) {
            if (isActive(operation)) {
                if (task.status === 'generating') task.generationError = error.message || String(error);
                task.status = 'error'; task.error = error.message || String(error);
            }
            throw error;
        }
    };
    return {
        generateScenario() {
            let settings, goal, content, assistPrompts;
            try {
                settings = moduleSettings(state, 'scenario'); goal = required(state.goal, '原始需求'); content = state.draft;
                assistPrompts = clone(state.assistPrompts);
            }
            catch (error) { return fail(error); }
            const revision = getRevision();
            return run('scenario', async operation => {
                const result = await generateScenario(host, { goal, content, assistPrompts, settings,
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
        async trial(input = state.scenarioText) {
            let version, settings, scenario, goal;
            try {
                version = clone(find(state.versions, state.selectedVersionId, '已保存版本，请先保存草稿'));
                if (state.draft !== version.content) throw new Error('草稿已有修改，请先保存为新版本，再测试。');
                goal = required(state.goal, '原始需求');
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
                const task = { id: crypto.randomUUID(), versionId: version.id, versionLabel: version.label, versionNumber: version.number,
                    content: version.content, goal, scenario, scenarioPrompt, sceneSource, settings: runtime, createdAt: new Date().toISOString(),
                    status: scenario ? 'generating' : 'scenario', error: '', generationError: '', trialIds: [], preferredTrialId: '', judgement: null };
                state.testTasks.push(task); state.selectedTestTaskId = task.id; state.selectedTrialId = ''; emit();
                await track(task, operation, async () => {
                    await persist();
                    if (!isActive(operation)) return;
                    if (!task.scenario) {
                        const generated = await generateScenario(host, { goal, content: version.content, assistPrompts,
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
                    const sample = async (count, index) => {
                        const result = await host.trial({ content: task.content, input: task.scenario, emptyCardMode: runtime.emptyCardMode,
                            sampleCount: count, sampleRequestMode: runtime.sampleRequestMode, builtinPrompt: assistPrompts.builtin,
                            ...(runtime.emptyCardMode ? {} : { chatScenario: assistPrompts.chatScenario }) },
                        { settings: settings.sample, signal: operation.controller.signal });
                        if (!isActive(operation)) return;
                        const results = Array.isArray(result?.samples) ? result.samples : [result];
                        // 先保存已收到的正文，数量异常也不会抹掉这些样本。
                        for (const [offset, item] of results.entries()) {
                            const content = required(item?.content, '样本正文');
                            const trial = { id: crypto.randomUUID(), versionId: version.id, taskId: task.id, sampleIndex: index + offset,
                                content, input: task.scenario, createdAt: new Date().toISOString(),
                                context: item.context && typeof item.context === 'object' ? clone(item.context) : {},
                                feedback: { status: 'pending', note: '', excerpt: '' } };
                            state.trials.push(trial); task.trialIds.push(trial.id);
                            if (state.selectedTestTaskId === task.id && !state.selectedTrialId) state.selectedTrialId = trial.id;
                        }
                        emit(); await persist();
                        if (results.length !== count) throw new Error(`模型返回了 ${results.length} 份样本，预期 ${count} 份；已有样本已保留。`);
                    };
                    if (runtime.sampleRequestMode === 'single') await sample(runtime.sampleCount, 1);
                    else if (!runtime.emptyCardMode) {
                        // 当前聊天仍使用酒馆共享生成状态；空卡样本各自独立并发。
                        for (let i = 1; i <= runtime.sampleCount && isActive(operation); i++) await sample(1, i);
                    } else {
                        const results = await Promise.allSettled(Array.from({ length: runtime.sampleCount }, (_, index) => sample(1, index + 1)));
                        const failed = results.find(result => result.status === 'rejected');
                        if (failed) throw failed.reason;
                    }
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
