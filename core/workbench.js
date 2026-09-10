(() => {
'use strict';
const { clone, initialState, rawText, required, savedState, text } = globalThis.YaKitPreview.state;
const { designMessages, feedbackInstruction, parseDesign } = globalThis.YaKitPreview.prompts;

async function createWorkbench(host) {
    let loaded;
    let loadError = '';
    try { loaded = await host.loadState(); } catch { loadError = '读取保存内容失败，可以继续编辑并导出当前内容。'; }
    const state = initialState(loaded);
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
    const run = async (kind, action) => {
        if (active) return fail(new Error('请等待当前操作完成，或先取消。'));
        const operation = { controller: new AbortController(), revision };
        active = operation;
        state.busy = kind; state.error = ''; state.notice = ''; emit();
        let error;
        try { await action(operation); } catch (caught) {
            if (active === operation) error = caught;
        }
        if (active !== operation) return;
        active = null; state.busy = null;
        if (error) state.error = error.message || String(error);
        emit();
        await persist();
        if (error) throw error;
    };
    const design = async (instruction, sourceDraft) => {
        let messages;
        try {
            required(state.goal, '需求');
            instruction = required(instruction, '设计要求');
            find(state.profiles, state.profileId, '工作台连接');
            messages = designMessages(state, instruction, sourceDraft);
        } catch (error) { return fail(error); }
        return run('design', async operation => {
            state.messages.push({ role: 'user', content: instruction }); emit();
            const reply = await host.design(messages, { profileId: state.profileId, signal: operation.controller.signal });
            if (active !== operation) return;
            state.messages.push({ role: 'assistant', content: text(reply, '模型答复') });
            const result = parseDesign(reply);
            if (revision === operation.revision) {
                state.draft = result.prompt; revision++;
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
                for (const key of ['profiles', 'promptTargets']) {
                    state[key] = (Array.isArray(environment[key]) ? environment[key] : [])
                        .filter(item => item && typeof item.id === 'string' && typeof item.name === 'string')
                        .map(({ id, name }) => ({ id: id.trim(), name: name.trim() }));
                }
                state.contextLabel = text(environment.contextLabel || '', '写作背景');
                state.canTrial = environment.canTrial === true;
                if (!state.profiles.some(item => item.id === state.profileId)) state.profileId = state.profiles[0]?.id || '';
                if (!state.promptTargets.some(item => item.id === state.targetPromptId)) state.targetPromptId = state.promptTargets[0]?.id || '';
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
                    else if (['profileId', 'targetPromptId'].includes(key)) next[key] = text(value, key);
                    else if (key === 'injectionMode' && ['append', 'replace'].includes(value)) next[key] = value;
                    else if (key === 'depth' && Number.isInteger(Number(value)) && Number(value) >= 0
                        && (typeof value === 'number' || typeof value === 'string' && value.trim())) next[key] = Number(value);
                    else throw new Error(`不能更新字段：${key}。`);
                }
                if ('draft' in next || 'goal' in next) revision++;
                Object.assign(state, next); state.notice = '';
            });
        },
        design,
        saveVersion(label = '') {
            return change(() => {
                required(state.draft, '提示词草稿');
                const content = state.draft;
                label = text(label, '版本名称') || `版本 ${state.versions.length + 1}`;
                const version = { id: crypto.randomUUID(), label, content, createdAt: new Date().toISOString() };
                state.versions.push(version); state.selectedVersionId = version.id;
                revision++; state.notice = `已保存「${label}」。`;
            });
        },
        selectVersion(id) {
            return change(() => {
                const version = find(state.versions, id, '提示词版本');
                state.selectedVersionId = version.id; state.draft = version.content; revision++; state.notice = '';
            });
        },
        async trial(input) {
            let version, request;
            try {
                version = find(state.versions, state.selectedVersionId, '已保存版本，请先保存草稿');
                if (state.draft !== version.content) throw new Error('草稿已有修改，请先保存为新版本，再试写。');
                if (!state.canTrial) throw new Error('当前没有可用的试写背景。');
                if (state.injectionMode === 'replace') find(state.promptTargets, state.targetPromptId, '使用位置');
                request = { content: version.content, input: required(input, '试写要求'), mode: state.injectionMode,
                    promptId: state.targetPromptId, depth: state.depth };
            } catch (error) { return fail(error); }
            return run('trial', async operation => {
                const result = await host.trial(request, { signal: operation.controller.signal });
                if (active !== operation) return;
                const record = { id: crypto.randomUUID(), versionId: version.id,
                    content: required(result?.content, '试写答复'), input: request.input, createdAt: new Date().toISOString(),
                    context: { ...(result.context && typeof result.context === 'object' ? clone(result.context) : {}),
                        mode: request.mode, promptId: request.promptId, depth: request.depth },
                    feedback: { status: 'pending', note: '', excerpt: '' } };
                state.trials.push(record); state.selectedTrialId = record.id;
                state.notice = `「${version.label}」试写完成，请阅读并反馈。`;
            });
        },
        selectTrial(id) { return change(() => { state.selectedTrialId = find(state.trials, id, '试写记录').id; }); },
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
            if (!active) return;
            const operation = active; active = null; operation.controller.abort();
            state.busy = null; state.notice = '已取消，已有草稿和记录已保留。'; emit();
            await persist();
        },
        exportData: () => JSON.stringify({ formatVersion: 1, ...savedState(state) }, null, 2),
    };
    try { await controller.refreshEnvironment(); } catch { /* 环境读取失败时仍允许编辑和导出。 */ }
    return controller;
}

globalThis.YaKitPreview.createWorkbench = createWorkbench;
})();
