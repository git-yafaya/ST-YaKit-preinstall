(() => {
    'use strict';

    function createApi(getContext) {
        const { required, checkAbort, replyText, isolatedRequest } = globalThis.YaKitWorkbench;
        let primaryBusy = false;
        const preparedTrials = new WeakMap();

        function prepareTrialSettings(settings = {}) {
            const copied = structuredClone(settings);
            if ((copied.designApi || 'main') === 'main') {
                const context = getContext();
                // 请求参数只留在本次任务内存中，不进入设置、条件记录或导出。
                preparedTrials.set(copied, {
                    request: globalThis.YaKitWorkbench.prepareMainRequest(context),
                    connection: globalThis.YaKitWorkbench.captureConnection(context),
                });
            }
            // 保存连接仍交给宿主按 ID 解析；自定义连接的参数在这里独立复制。
            return copied;
        }

        async function primaryRequest(context, signal, request) {
            checkAbort(signal);
            if (primaryBusy) throw new Error('上一条主 API 请求仍在结束中，请稍后再试。');
            if (context.isGenerating?.()) throw new Error('酒馆正在生成正文，请完成后再使用主 API。');
            if (context.onlineStatus === 'no_connection') throw new Error('请先连接酒馆主 API。');
            primaryBusy = true;
            try {
                const result = await request();
                checkAbort(signal);
                return result;
            } finally {
                primaryBusy = false;
            }
        }

        return {
            prepareTrialSettings,
            async design(messages, { settings = {}, signal, purpose = 'design' } = {}) {
                const context = getContext();
                // 设计、场景和盲评共用独立消息通道，purpose 只供调用方标识用途。
                const request = () => isolatedRequest(context, messages, settings, signal);
                const results = (settings.designApi || 'main') === 'main'
                    ? await primaryRequest(context, signal, request) : await request();
                return results[0];
            },

            async trial(request, { settings = {}, signal } = {}) {
                const context = getContext();
                const content = required(request?.content, '候选提示词', false);
                const input = required(request?.input, '试写场景');
                // 旧调用保留单次聊天试写；新调用默认为空卡、三份独立样本。
                const legacy = !['emptyCardMode', 'sampleCount', 'sampleRequestMode'].some(key => Object.hasOwn(request, key));
                const emptyCardMode = request.emptyCardMode ?? !legacy;
                const count = request.sampleCount ?? (legacy ? 1 : 3);
                const mode = request.sampleRequestMode ?? 'parallel';
                if (typeof emptyCardMode !== 'boolean' || !Number.isInteger(count) || count < 1 || count > 6
                    || !['parallel', 'single'].includes(mode)) throw new Error('试写模式或样本数量无效（须为 1—6 份）。');
                const main = (settings.designApi || 'main') === 'main';
                if (!emptyCardMode) {
                    if (!main) throw new Error('当前聊天试写仅支持主 API；副 API 请启用空卡模式。');
                    if (context.characterId == null && !context.groupId) throw new Error('请先打开一个角色或群组聊天。');
                    if (typeof context.generateQuietPrompt !== 'function') throw new Error('当前酒馆不支持正文试写。');
                    if (mode === 'single' && count > 1) throw new Error('当前聊天模式不支持单次多样本，请改用独立请求。');
                }
                checkAbort(signal);
                if (emptyCardMode && !preparedTrials.has(settings)) settings = prepareTrialSettings(settings);
                const prepared = preparedTrials.get(settings);
                const messages = [{ role: 'system', content }, { role: 'user', content: input }];
                const snapshot = () => globalThis.YaKitWorkbench.captureIsolatedContext(context, settings, messages, mode, count, prepared?.connection);
                const run = async () => {
                    checkAbort(signal);
                    if (emptyCardMode) {
                        const captured = snapshot();
                        const values = await isolatedRequest(context, messages, settings, signal, mode === 'single' ? count : 1, prepared?.request);
                        return values.map(value => ({ content: value, context: structuredClone(captured) }));
                    }
                    const options = {
                        quietPrompt: `${content}\n\n本次试写以以下场景为准；已有背景与之冲突时采用本次场景：\n${input}`,
                        quietToLoud: false, skipWIAN: false,
                    };
                    const captured = globalThis.YaKitWorkbench.captureTrialContext(context, options, input);
                    return [{ content: replyText(await context.generateQuietPrompt(options)), context: captured }];
                };
                let samples;
                if (!emptyCardMode) {
                    samples = await primaryRequest(context, signal, async () => {
                        const results = [];
                        for (let index = 0; index < (mode === 'single' ? 1 : count); index++) results.push(...await run());
                        return results;
                    });
                } else {
                    // 空卡直接发送独立消息，不占用酒馆聊天生成通道。
                    samples = (await Promise.all(Array.from({ length: mode === 'single' ? 1 : count }, run))).flat();
                }
                checkAbort(signal);
                return { ...samples[0], samples };
            },
        };
    }

    (globalThis.YaKitWorkbench ||= {}).createApi = createApi;
})();
