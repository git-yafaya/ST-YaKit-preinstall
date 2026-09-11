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
    const copyMessages = messages => {
        if (!Array.isArray(messages) || !messages.length || messages.some(message =>
            !message || !['system', 'user', 'assistant'].includes(message.role)
            || typeof message.content !== 'string')) throw new Error('请求消息格式不正确。');
        return messages.map(({ role, content }) => ({ role, content }));
    };

    const tokenLimit = (source, model, max) => ['openai', 'azure_openai', 'openrouter'].includes(source)
        && /^(openai\/)?(o[134](?:-|$)|gpt-5)/.test(model || '')
        ? { max_tokens: undefined, max_completion_tokens: max } : { max_tokens: max };

    function prepareMainRequest(context) {
        if (context.onlineStatus === 'no_connection') throw new Error('请先连接酒馆主 API。');
        if (context.mainApi === 'openai' && context.ChatCompletionService?.processRequest) {
            const current = context.chatCompletionSettings || {};
            // 只复制连接所需字段，不带入预设正文、辅助提示、宏、停止词或工具。
            const keys = ['chat_completion_source', 'custom_url', 'custom_include_headers',
                'reverse_proxy', 'proxy_password', 'azure_base_url', 'azure_deployment_name',
                'azure_api_version', 'vertexai_region', 'vertexai_auth_mode', 'vertexai_express_project_id', 'workers_ai_account_id',
                'zai_endpoint', 'siliconflow_endpoint', 'minimax_endpoint'];
            const connection = Object.fromEntries(keys.filter(key => current[key] !== undefined)
                .map(key => [key, current[key]]));
            if (current.chat_completion_source === 'openrouter') Object.assign(connection, {
                provider: current.openrouter_providers, allow_fallbacks: current.openrouter_allow_fallbacks,
                use_fallback: current.openrouter_use_fallback, quantizations: current.openrouter_quantizations,
            });
            if (current.chat_completion_source === 'nanogpt') Object.assign(connection, {
                nanogpt_provider: current.nanogpt_provider, nanogpt_payg_override: current.nanogpt_payg_override,
            });
            const model = required(context.getChatCompletionModel?.(), '主 API 模型');
            return { service: context.ChatCompletionService, messageKey: 'messages', payload: structuredClone({
                ...connection,
                model, ...tokenLimit(current.chat_completion_source, model, current.openai_max_tokens || 4096),
            }) };
        } else if (context.mainApi === 'textgenerationwebui' && context.TextCompletionService?.processRequest) {
            const current = context.textCompletionSettings || {};
            return { service: context.TextCompletionService, messageKey: 'prompt', payload: structuredClone({
                api_type: current.type,
                api_server: context.getTextGenServer?.(), model: context.getTextGenModel?.(),
            }) };
        } else {
            throw new Error('独立请求需要酒馆的聊天补全或文本补全 API，请切换连接或使用副 API。');
        }
    }

    async function isolatedRequest(context, messages, settings, signal, count = 1, prepared) {
        checkAbort(signal);
        const prompt = copyMessages(messages);
        // 多样本必须读取服务商原始 choices，不把一条回复按段落拆分。
        const extractData = count === 1;
        const common = { stream: false, max_tokens: 4096, ...(count > 1 ? { n: count } : {}) };
        let result;
        if ((settings.designApi || 'main') === 'main') {
            const { service, messageKey, payload } = prepared || prepareMainRequest(context);
            if (count > 1 && messageKey === 'prompt') throw new Error('主文本补全不支持单次多样本，请改用独立请求。');
            result = await service.processRequest({ ...common, ...structuredClone(payload), [messageKey]: prompt }, {}, extractData, signal);
        } else if (settings.designApi === 'secondary') {
            if (settings.secondarySource === 'profile') {
                const service = context.ConnectionManagerRequestService;
                if (!service?.sendRequest) throw new Error('当前酒馆不支持连接配置请求。');
                const id = required(settings.secondaryProfileId, '副 API 连接配置');
                const profile = service.getSupportedProfiles().find(item => item.id === id);
                if (!profile) throw new Error('副 API 连接配置已失效，请重新选择。');
                const api = service.validateProfile?.(profile) || context.CONNECT_API_MAP?.[profile.api];
                const type = api?.selected;
                if (count > 1 && type === 'textgenerationwebui') {
                    throw new Error('文本补全连接不支持单次多样本，请改用独立请求。');
                }
                result = await service.sendRequest(id, prompt, common.max_tokens, {
                    stream: false, signal, extractData, includePreset: false, includeInstruct: false,
                }, { ...(count > 1 ? { n: count } : {}), custom_prompt_post_processing: '',
                    ...tokenLimit(api?.source, settings.secondaryModel?.trim() || profile.model, common.max_tokens),
                    ...(settings.secondaryModel?.trim() ? { model: settings.secondaryModel.trim() } : {}) });
            } else if (settings.secondarySource === 'custom') {
                if (!context.ChatCompletionService?.processRequest) throw new Error('当前酒馆不支持自定义副 API。');
                const url = globalThis.YaKitWorkbench.normalizeApiUrl(settings.secondaryUrl);
                const key = typeof settings.secondaryKey === 'string' ? settings.secondaryKey.trim() : '';
                if (/[\r\n]/.test(key)) throw new Error('副 API 密钥不能包含换行。');
                result = await context.ChatCompletionService.processRequest({
                    ...common, messages: prompt, model: required(settings.secondaryModel, '副 API 模型'),
                    chat_completion_source: 'custom', custom_url: url,
                    // JSON 也是有效 YAML；空密钥也不借用酒馆已有密钥。
                    custom_include_headers: JSON.stringify({ Authorization: key ? `Bearer ${key}` : '' }),
                }, {}, extractData, signal);
            } else throw new Error('请选择副 API 的配置方式。');
        } else throw new Error('请选择有效的 API。');
        checkAbort(signal);
        if (count === 1) return [replyText(result)];
        if (!Array.isArray(result?.choices) || result.choices.length !== count) {
            throw new Error(`接口未返回 ${count} 份独立 choices，请改用独立请求。`);
        }
        return result.choices.map(choice => replyText(choice.message?.content ?? choice.text));
    }

    Object.assign(globalThis.YaKitWorkbench ||= {}, { required, checkAbort, replyText, isolatedRequest, prepareMainRequest });
})();
