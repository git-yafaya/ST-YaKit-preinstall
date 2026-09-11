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
            // 较新的保存成功后，清除队列中较早那次保存的错误。
            if (state.error === saveError) { state.error = ''; emit(); }
        }, () => fail(new Error(saveError)));
    };
    const change = async action => {
        try { action(); state.error = ''; emit(); } catch (error) { return fail(error); }
        await persist();
    };
    const addVersion = label => {
        const version = { id: crypto.randomUUID(), label, number: state.nextVersionNumber++,
            content: state.draft, createdAt: new Date().toISOString() };
        state.versions.push(version);
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
        let messages, settings, combined = false;
        const forceRevise = sourceDraft !== undefined;
        try {
            // 历史反馈已有对应条目和意见，不受当前需求框是否为空影响。
            if (!forceRevise) required(state.goal, '需求');
            instruction = required(instruction, '设计要求');
            settings = scenarios.moduleSettings(state, 'design');
            messages = designMessages(state, instruction, sourceDraft, forceRevise);
            combined = state.combineDesignScenario && state.sceneSource === 'ai';
            if (combined) {
                const scenarioSettings = scenarios.moduleSettings(state, 'scenario');
                if (JSON.stringify(settings) !== JSON.stringify(scenarioSettings)) throw new Error('合并生成需要为提示词设计和场景选择同一个 API。');
                messages = scenarios.combinedMessages(messages);
            }
        } catch (error) { return fail(error); }
        return run('design', async operation => {
            state.messages.push({ role: 'user', content: instruction }); emit();
            const reply = await host.design(messages, { settings, signal: operation.controller.signal, purpose: 'design' });
            if (active !== operation) return;
            state.messages.push({ role: 'assistant', content: text(reply, '模型答复') });
            const result = parseDesign(reply);
            if (combined) required(result.scenario, '合并答复中的测试场景');
            if (revision === operation.revision) {
                // 替换前逐字留存未保存的草稿，已保存过的内容不重复插入。
                if (state.draft.trim() && state.draft !== result.prompt
                    && !state.versions.some(version => version.content === state.draft)) {
                    addVersion(`自动保留 ${state.nextVersionNumber}`);
                }
                if (!forceRevise && result.action !== 'revise') state.selectedVersionId = '';
                // 反馈版本没有预设来源记录，不能沿用当前条目的写回目标。
                if (forceRevise || result.action !== 'revise') state.presetSource = null;
                state.draft = result.prompt;
                if (combined) state.scenarioText = result.scenario;
                revision++;
                state.notice = result.explanation || '草稿已更新，请保存为新版本后试写。';
            } else {
                state.notice = '生成期间草稿或版本已改变；本次答复保留在讨论中，请查看后采用。';
            }
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
                state.mainApiLabel = text(environment.mainApiLabel || '', '主 API');
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
                if (['draft', 'goal', 'scenarioText', 'sceneSource'].some(key => key in next)) revision++;
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
                // 关联反馈随试写一起删除，保留当前草稿和预设绑定。
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
                instruction = feedbackInstruction(trial, version);
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
            draftChanged: () => { revision++; },
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
