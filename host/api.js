(() => {
    'use strict';

    const required = (value, name, trim = true) => {
        if (typeof value !== 'string' || !value.trim()) throw new Error(`请先填写${name}。`);
        return trim ? value.trim() : value;
    };
    const checkAbort = signal => {
        if (signal?.aborted) throw new DOMException('操作已取消', 'AbortError');
    };
    const replyText = result => required(typeof result === 'string' ? result : result?.content, '模型答复');

    function createApi(getContext) {
        let primaryBusy = false;

        async function primaryRequest(context, signal, request) {
            checkAbort(signal);
            if (primaryBusy) throw new Error('上一条主 API 请求仍在结束中，请稍后再试。');
            if (context.isGenerating?.()) throw new Error('酒馆正在生成正文，请完成后再使用主 API。');
            if (context.onlineStatus === 'no_connection') throw new Error('请先连接酒馆主 API。');
            primaryBusy = true;
            try {
                // 宿主的这两个入口不接收独立取消信号；等待结束再释放占用，避免误停其他生成。
                const result = await request();
                checkAbort(signal);
                return replyText(result);
            } finally {
                primaryBusy = false;
            }
        }

        return {
            async design(messages, { settings = {}, signal } = {}) {
                checkAbort(signal);
                if (!Array.isArray(messages) || !messages.length || messages.some(message =>
                    !message || !['system', 'user', 'assistant'].includes(message.role)
                    || typeof message.content !== 'string')) throw new Error('设计消息格式不正确。');
                // generateRaw 会改写传入的消息，复制后再交给宿主。
                const prompt = messages.map(({ role, content }) => ({ role, content }));
                const context = getContext();
                if ((settings.designApi || 'main') === 'main') {
                    if (typeof context.generateRaw !== 'function') throw new Error('当前酒馆不支持主 API 独立设计。');
                    return primaryRequest(context, signal, () => context.generateRaw({
                        prompt, instructOverride: true, trimNames: false,
                    }));
                }
                if (settings.designApi !== 'secondary') throw new Error('请选择有效的设计 API。');
                let result;
                if (settings.secondarySource === 'profile') {
                    const service = context.ConnectionManagerRequestService;
                    if (!service?.sendRequest) throw new Error('当前酒馆不支持连接配置请求。');
                    const profileId = required(settings.secondaryProfileId, '副 API 连接配置');
                    if (!service.getSupportedProfiles().some(profile => profile.id === profileId)) {
                        throw new Error('副 API 连接配置已失效，请重新选择。');
                    }
                    result = await service.sendRequest(profileId, prompt, 4096, {
                        stream: false, signal, extractData: true, includePreset: true, includeInstruct: true,
                    }, settings.secondaryModel?.trim() ? { model: settings.secondaryModel.trim() } : {});
                } else if (settings.secondarySource === 'custom') {
                    if (!context.ChatCompletionService?.processRequest) throw new Error('当前酒馆不支持自定义副 API。');
                    const url = globalThis.YaKitWorkbench.normalizeApiUrl(settings.secondaryUrl);
                    const key = typeof settings.secondaryKey === 'string' ? settings.secondaryKey.trim() : '';
                    if (/[\r\n]/.test(key)) throw new Error('副 API 密钥不能包含换行。');
                    result = await context.ChatCompletionService.processRequest({
                        stream: false, messages: prompt, max_tokens: 4096,
                        model: required(settings.secondaryModel, '副 API 模型'),
                        chat_completion_source: 'custom', custom_url: url,
                        // JSON 也是有效 YAML；显式覆盖认证头，空密钥也不借用酒馆已有密钥。
                        custom_include_headers: JSON.stringify({ Authorization: key ? `Bearer ${key}` : '' }),
                    }, {}, true, signal);
                } else {
                    throw new Error('请选择副 API 的配置方式。');
                }
                checkAbort(signal);
                return replyText(result);
            },

            async trial(request, { signal } = {}) {
                const context = getContext();
                if (typeof context.generateQuietPrompt !== 'function') throw new Error('当前酒馆不支持正文试写。');
                const content = required(request?.content, '候选提示词', false);
                const input = required(request?.input, '试写要求');
                if (context.characterId == null && !context.groupId) throw new Error('请先打开一个角色或群组聊天。');
                const options = {
                    // 这里只传候选提示词和本次试写要求；当前聊天背景由酒馆组装。
                    quietPrompt: `${content}\n\n${input}`, quietToLoud: false, skipWIAN: false,
                };
                let snapshot;
                const result = await primaryRequest(context, signal, () => {
                    snapshot = globalThis.YaKitWorkbench.captureTrialContext(context, options, input);
                    return context.generateQuietPrompt(options);
                });
                return { content: result, context: snapshot };
            },
        };
    }

    (globalThis.YaKitWorkbench ||= {}).createApi = createApi;
})();
