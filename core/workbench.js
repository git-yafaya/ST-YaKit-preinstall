(() => {
'use strict';
const { clone, initialState, rawText, required, savedState, settingValue, text } = globalThis.YaKitWorkbench.state;
const { designMessages, feedbackInstruction, parseDesign } = globalThis.YaKitWorkbench.prompts;
const { restoreSettings, syncLegacyFields, createSettingsActions } = globalThis.YaKitWorkbench.settings;
const scenarios = globalThis.YaKitWorkbench.scenarios;
const testTasks = globalThis.YaKitWorkbench.testTasks;

async function createWorkbench(host) {
    let loaded;
    let loadError = '';
    try { loaded = await host.loadState(); } catch { loadError = '读取保存内容失败，可以继续编辑并导出当前内容。'; }
    const state = initialState(loaded);
    restoreSettings(state, loaded);
    scenarios.restore(state, loaded);
    testTasks.restore(state, loaded);
    state.error = loadError;
    const listeners = new Set();
    let active = null;
    let revision = 0;
    let saveQueue = Promise.resolve();
    const saveError = '保存失败；内容仍在当前工作台，请导出 JSON 留存。';
    const emit = () => { for (const listener of listeners) listener(clone(state)); };
    const fail = error => { state.error = error.message || String(error); emit(); throw error; };
    const find = (list, id, name) => {
        const item = list.find(entry => entry.id === text(id, name));
        if (!item) throw new Error(`找不到${name}。`);
        return item;
    };
    const persist = () => {
        const snapshot = savedState(state);
        // 顺序写入，避免较早的保存覆盖较新的编辑。
        saveQueue = saveQueue.catch(() => {}).then(() => host.saveState(snapshot));
        return saveQueue.then(() => {
            if (state.error === saveError) { state.error = ''; emit(); }
        }, () => fail(new Error(saveError)));
    };
    const change = async action => {
        try { action(); state.error = ''; emit(); } catch (error) { return fail(error); }
        await persist();
    };
    const addVersion = (label, content = state.draft) => {
        const version = { id: crypto.randomUUID(), label, number: state.nextVersionNumber++,
            content, createdAt: new Date().toISOString() };
        state.versions.push(version);
        return version;
    };
    const addAutoVersion = (name, content = state.draft) => {
        const version = addVersion('', content);
        // 名称按保存时的本地日期生成，与记录时间保持同一瞬间。
        const savedAt = new Date(version.createdAt);
        const date = String(savedAt.getFullYear()).padStart(4, '0')
            + [savedAt.getMonth() + 1, savedAt.getDate()].map(value => String(value).padStart(2, '0')).join('');
        version.label = `${name}-${version.number}-${date}`;
        return version;
    };
    const run = async (kind, action) => {
        if (active) return fail(new Error(state.busy === 'preset-save'
            ? '请等待预设写回完成。' : '请等待当前操作完成，或先取消。'));
        const operation = { controller: new AbortController(), revision, kind };
        active = operation;
        state.busy = kind;
        // 读取临时预设不会修复工作记录，继续保留原来的加载失败提示。
        if (kind !== 'preset-read' || state.error !== loadError) state.error = '';
        state.notice = ''; emit();
        let error;
        try { await action(operation); } catch (caught) {
            if (active === operation) error = caught;
        }
        if (active !== operation) return;
        active = null; state.busy = null;
        if (error) state.error = error.message || String(error);
        emit();
        if (kind !== 'preset-read') await persist();
        if (error) throw error;
    };
    const design = async (instruction, sourceDraft) => {
        let messages, settings, count, goal, assistPrompts, combined = false;
        const forceRevise = sourceDraft !== undefined;
        // 固定本轮条目名称，等待答复时切换版本也不会改名。
        const presetEntryName = state.presetSource?.name.trim() || '提示词';
        try {
            // 历史反馈已有对应条目和意见，不受当前需求框是否为空影响。
            if (!forceRevise) required(state.goal, '需求');
            instruction = required(instruction, '设计要求');
            count = forceRevise ? 1 : settingValue('designCount', state.designCount);
            settings = scenarios.moduleSettings(state, 'design');
            messages = designMessages(state, instruction, sourceDraft, forceRevise);
            goal = forceRevise ? instruction : state.goal;
            assistPrompts = clone(state.assistPrompts);
            combined = state.combineDesignScenario && state.sceneSource === 'ai';
            if (combined) {
                const scenarioSettings = scenarios.moduleSettings(state, 'scenario');
                if (JSON.stringify(settings) !== JSON.stringify(scenarioSettings)) throw new Error('合并生成需要为提示词设计和场景选择同一个 API。');
                messages = scenarios.combinedMessages(messages, state.assistPrompts);
            }
        } catch (error) { return fail(error); }
        return run('design', async operation => {
            state.messages.push({ role: 'user', content: instruction }); emit();
            const results = [];
            let saveFailure;
            // 同时发起独立请求，收到一份就保存；最终按请求顺序采用，不由返回快慢决定草稿。
            const replies = await Promise.allSettled(Array.from({ length: count }, async (_, index) => {
                const reply = await host.design(clone(messages), {
                    settings: clone(settings), signal: operation.controller.signal, purpose: 'design',
                });
                if (active !== operation) return;
                state.messages.push({ role: 'assistant', content: text(reply, '模型答复') });
                try {
                    const result = parseDesign(reply);
                    if (combined) required(result.scenarioPrompt, '合并答复中的场景生成提示词');
                    const version = count > 1 ? addAutoVersion(presetEntryName, result.prompt) : null;
                    results[index] = { ...result, version };
                } finally {
                    // 格式错误的原始答复也保留，取消后不丢掉已经收到的内容。
                    emit();
                    try { await persist(); } catch (error) { saveFailure = error; }
                }
            }));
            if (active !== operation) return;
            const valid = results.filter(Boolean), result = valid[0];
            const errors = replies.filter(reply => reply.status === 'rejected').map(reply => reply.reason);
            const unchanged = revision === operation.revision;
            if (result && unchanged) {
                if (state.draft.trim() && state.draft !== result.prompt
                    && !state.versions.some(version => version.content === state.draft)) {
                    addAutoVersion(presetEntryName);
                }
                if (!forceRevise && result.action !== 'revise') state.selectedVersionId = '';
                // 反馈版本没有预设来源记录，不能沿用当前条目的写回目标。
                if (forceRevise || result.action !== 'revise') state.presetSource = null;
                state.draft = result.prompt;
                state.scenarioPrompt = combined ? result.scenarioPrompt : '';
                if (combined) state.scenarioText = '';
                revision++;
                if (result.version) state.selectedVersionId = result.version.id;
                state.notice = count > 1 ? `已生成 ${valid.length} 份提示词并分别保存，可切换版本查看。`
                    : result.explanation || '草稿已更新，请保存为新版本后试写。';
            } else if (result) {
                state.notice = '生成期间草稿或版本已改变；本次答复保留在讨论中，请查看后采用。';
            }
            if (result && unchanged && combined) {
                // 先保留条目和专用提示词，全部设计请求结束后再执行场景生成。
                const scenarioRevision = revision;
                emit(); await persist();
                if (active !== operation) return;
                const generated = await scenarios.generate(host, { goal, content: result.prompt, assistPrompts,
                    settings, signal: operation.controller.signal, scenarioPrompt: result.scenarioPrompt,
                    isActive: () => active === operation });
                if (!generated || active !== operation) return;
                if (revision === scenarioRevision) state.scenarioText = generated.scenario;
                else state.notice = '生成期间需求、草稿或场景已修改，本次生成未覆盖当前输入。';
            }
            if (errors.length) {
                if (count === 1) throw errors[0];
                throw new Error(`${count} 份提示词中 ${errors.length} 份失败，已保留 ${valid.length} 份有效结果。`
                    + (errors[0]?.message || String(errors[0])));
            }
            if (saveFailure) throw saveFailure;
        });
    };
    const controller = {
        getState: () => clone(state),
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        async refreshEnvironment() {
            try {
                const environment = await host.getEnvironment();
                state.profiles = (Array.isArray(environment.profiles) ? environment.profiles : [])
                    .filter(item => item && typeof item.id === 'string' && item.id.trim() && typeof item.name === 'string')
                    .map(({ id, name }) => ({ id: id.trim(), name: name.trim() }));
                state.mainApiLabel = text(environment.mainApiLabel || '', '酒馆 API');
                state.contextLabel = text(environment.contextLabel || '', '写作背景');
                state.canTrial = environment.canTrial === true;
                state.canGenerate = environment.canGenerate === true;
                emit();
            } catch (error) { return fail(error); }
        },
        update(fields) {
            return change(() => {
                if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('更新内容格式不正确。');
                const next = {};
                for (const [key, value] of Object.entries(fields)) {
                    // 编辑时保留空格和换行，提交动作只检查内容是否为空。
                    if (['goal', 'draft'].includes(key)) next[key] = rawText(value, key);
                    else if (Object.hasOwn(scenarios.defaults, key)) next[key] = scenarios.settingValue(key, value);
                    else next[key] = settingValue(key, value);
                }
                if (['draft', 'goal', 'scenarioText', 'sceneSource'].some(key => key in next)) {
                    revision++;
                    if (['draft', 'goal', 'scenarioText', 'sceneSource'].some(key => key in next && next[key] !== state[key])) state.scenarioPrompt = '';
                }
                Object.assign(state, next); syncLegacyFields(state, next); state.notice = '';
            });
        },
        design,
        saveVersion(label = '') {
            return change(() => {
                required(state.draft, '提示词草稿');
                label = text(label, '提示词名称') || '未命名提示词';
                state.selectedVersionId = addVersion(label).id;
                revision++; state.notice = `已保存「${label}」。`;
            });
        },
        renameVersion(id, label) {
            return change(() => {
                if (state.busy) throw new Error('请等待当前操作完成后再修改提示词名称。');
                const version = find(state.versions, id, '提示词版本');
                version.label = required(label, '提示词名称');
                state.notice = `已改名为「${version.label}」。`;
            });
        },
        deleteVersion(id) {
            return change(() => {
                if (state.busy) throw new Error('请等待当前操作完成后再删除版本。');
                const version = find(state.versions, id, '提示词版本');
                if (state.trials.some(item => item.versionId === version.id && item.id === state.selectedTrialId)) {
                    state.selectedTrialId = '';
                }
                state.trials = state.trials.filter(item => item.versionId !== version.id);
                state.testTasks = state.testTasks.filter(item => item.versionId !== version.id);
                if (!state.testTasks.some(item => item.id === state.selectedTestTaskId)) state.selectedTestTaskId = '';
                state.versions = state.versions.filter(item => item.id !== version.id);
                if (state.selectedVersionId === version.id) state.selectedVersionId = '';
                state.notice = `已删除「${version.label}」及其关联试写和反馈。`;
            });
        },
        selectVersion(id) {
            return change(() => {
                const version = find(state.versions, id, '提示词版本');
                state.selectedVersionId = version.id; state.draft = version.content; revision++; state.notice = '';
                state.scenarioPrompt = '';
                state.presetSource = null;
            });
        },
        selectTrial(id) { return change(() => {
            const trial = find(state.trials, id, '试写记录'); state.selectedTrialId = trial.id;
            state.selectedTestTaskId = trial.taskId || '';
        }); },
        setFeedback(id, feedback) {
            return change(() => {
                const trial = find(state.trials, id, '试写记录');
                if (!feedback || !['pending', 'satisfied', 'revise'].includes(feedback.status)) throw new Error('请选择有效的反馈状态。');
                const next = { status: feedback.status, note: text(feedback.note ?? '', '反馈意见'),
                    excerpt: text(feedback.excerpt ?? '', '正文引用') };
                if (next.excerpt && !trial.content.includes(next.excerpt)) throw new Error('引用必须来自这次试写正文。');
                trial.feedback = next;
            });
        },
        async reviseFromFeedback(id) {
            let instruction, version;
            try {
                const trial = find(state.trials, id, '试写记录');
                version = find(state.versions, trial.versionId, '试写关联版本');
                instruction = feedbackInstruction(trial, version, state.assistPrompts);
            } catch (error) { return fail(error); }
            return design(instruction, version.content);
        },
        async cancel() {
            // 预设写入已经交给酒馆，不能把取消显示成写入已撤销。
            if (!active || state.busy === 'preset-save') return;
            const operation = active; active = null; operation.controller.abort();
            if (operation.task) { operation.task.status = 'cancelled'; operation.task.error = '已取消，已有样本已保留。'; }
            state.busy = null; state.notice = '已取消，已有草稿和记录已保留。'; emit();
            if (operation.kind !== 'preset-read') await persist();
        },
        exportData() {
            // 密钥只用于连接和本地设置，不放进导出的工作记录。
            const { secondaryKey, ...data } = savedState(state);
            data.secondaryApiConfigs = data.secondaryApiConfigs.map(({ apiKey, ...config }) => config);
            return JSON.stringify({ formatVersion: 1, ...data }, null, 2);
        },
    };
    Object.assign(controller, createSettingsActions({ state, host, change }));
    Object.assign(controller, testTasks.createActions({ state, host, run, change, persist, emit, fail, find,
        isActive: operation => active === operation, getRevision: () => revision }));
    if (globalThis.YaKitWorkbench.createPresetActions) {
        Object.assign(controller, globalThis.YaKitWorkbench.createPresetActions({
            state, host, run, change, isActive: operation => active === operation,
            draftChanged: () => { revision++; state.scenarioPrompt = ''; },
        }));
    }
    try { await controller.refreshEnvironment(); } catch { /* 环境读取失败时仍允许编辑和导出。 */ }
    if (host.listPresets && controller.refreshPresets) {
        try {
            await controller.refreshPresets();
            // 首次打开读取酒馆当前预设；后续刷新仍保留手动选择和草稿来源。
            if (typeof host.readPreset === 'function' && state.selectedPresetName
                && state.presets.some(preset => preset.name === state.selectedPresetName)) {
                await controller.readPreset(state.selectedPresetName);
            }
        } catch { /* 预设读取失败时仍允许编辑草稿。 */ }
    }
    return controller;
}

globalThis.YaKitWorkbench.createWorkbench = createWorkbench;
})();
