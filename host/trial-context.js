(() => {
    'use strict';

    const pick = (value, keys) => Object.fromEntries(keys
        .filter(key => value?.[key] !== undefined).map(key => [key, value[key]]));

    function endpointLabel(value) {
        if (!value) return null;
        try {
            const url = new URL(value);
            if (!['http:', 'https:'].includes(url.protocol)) return null;
            // 条件记录只留服务地址，不保存地址中的认证信息。
            url.username = ''; url.password = ''; url.search = ''; url.hash = '';
            return url.href;
        } catch { return null; }
    }

    function captureConnection(host) {
        const api = host.mainApi || '';
        const chatSettings = host.chatCompletionSettings || {};
        const textSettings = host.textCompletionSettings || {};
        const source = api === 'openai' ? chatSettings.chat_completion_source
            : api === 'textgenerationwebui' ? textSettings.type : api;
        let model = null;
        try {
            model = api === 'openai' ? host.getChatCompletionModel?.()
                : api === 'textgenerationwebui' ? host.getTextGenModel?.() : null;
        } catch {
            // 例如 Ollama 未选模型时宿主会抛错，此时环境说明仍可读取。
        }
        const manager = host.extensionSettings?.connectionManager;
        const profile = host.extensionSettings?.disabledExtensions?.includes('connection-manager')
            ? null : manager?.profiles?.find(item => item.id === manager.selectedProfile);
        // 只读取当前接口实际使用的地址；其他供应商的内置地址由宿主决定。
        const proxySources = ['claude', 'openai', 'mistralai', 'makersuite', 'vertexai', 'deepseek', 'xai', 'zai', 'moonshot'];
        const endpoint = api === 'textgenerationwebui' ? host.getTextGenServer?.()
            : api !== 'openai' ? null : source === 'custom' ? chatSettings.custom_url
                : source === 'azure_openai' ? chatSettings.azure_base_url
                    : proxySources.includes(source) ? chatSettings.reverse_proxy : null;
        return {
            api, source: source || null, model: model || null,
            preset: host.getPresetManager?.(api)?.getSelectedPresetName?.() || null,
            endpoint: endpointLabel(endpoint),
            // 连接配置可能在选中后被手动改动，实际来源、模型以上面的当前设置为准。
            profile: profile ? pick(profile, ['id', 'name']) : null,
            maxContext: host.getMaxContextTokens?.() ?? host.maxContext ?? null,
        };
    }

    function captureTrialContext(host, options, scenario) {
        const character = host.characters?.[host.characterId];
        const group = host.groups?.find(item => String(item.id) === String(host.groupId));
        const chat = Array.isArray(host.chat) ? host.chat : [];
        const metadata = host.chatMetadata || {};
        const powerUser = host.powerUserSettings || {};
        const connection = captureConnection(host);
        const chatCompletion = host.mainApi === 'openai';
        const promptOverride = chatCompletion ? host.getQuietPromptOverride?.() : null;
        const instruct = !chatCompletion && Boolean(powerUser.instruct?.enabled);
        const worldInfo = host.getTrialWorldInfo?.();
        const characterFile = character?.avatar?.replace(/\.[^/.]+$/, '');
        const noteKeys = ['note_prompt', 'note_interval', 'note_depth', 'note_position', 'note_role'];
        const placement = chatCompletion ? 'controlPrompts:last' : 'chat:depth-0';
        // 必须在调用宿主生成前复制；宿主生成期间会修改聊天元数据与扩展提示。
        return structuredClone({
            source: 'sillytavern', api: connection.api,
            capturedAt: new Date().toISOString(),
            chatId: host.chatId ?? '', character: character?.name || host.name2 || '',
            groupId: host.groupId ?? '', scenario, connection,
            injection: {
                entryPoint: 'generateQuietPrompt', placement,
                role: promptOverride?.role ?? (chatCompletion || instruct ? 'system' : null), depth: 0,
                promptManagerOverride: promptOverride
                    ? pick(promptOverride, ['role', 'injection_position', 'injection_depth', 'injection_order']) : null,
                quietToLoud: options.quietToLoud, skipWIAN: options.skipWIAN,
                prompt: options.quietPrompt, instruct,
                instructSystemSameAsUser: instruct ? Boolean(powerUser.instruct.system_same_as_user) : null,
            },
            chat: {
                messageCount: chat.length,
                textLength: chat.reduce((sum, message) => sum + (typeof message.mes === 'string' ? message.mes.length : 0), 0),
                userName: host.name1 || '', characterId: host.characterId ?? null,
                characterAvatar: character?.avatar || '', groupName: group?.name || '',
                members: group?.members || [], disabledMembers: group?.disabled_members || [],
            },
            chatMetadata: pick(metadata, ['scenario', 'world_info', ...noteKeys]),
            authorNote: {
                ...pick(metadata, noteKeys),
                registeredPrompt: pick(host.extensionPrompts?.['2_floating_prompt'], ['value', 'position', 'depth', 'scan', 'role']),
            },
            worldInfo: {
                globalSelection: worldInfo?.globalSelection ?? null,
                character: character?.data?.extensions?.world || '',
                characterExtra: worldInfo?.characterLore?.find(item => item.name === characterFile)?.extraBooks ?? [],
                chat: metadata.world_info || '', persona: powerUser.persona_description_lorebook || '',
            },
            explanation: `${[connection.api, connection.source, connection.model].filter(Boolean).join(' · ')}；${chatCompletion ? '聊天末尾控制提示' : '聊天末尾 depth 0 提示'}；${chat.length} 条聊天。`,
        });
    }

    Object.assign(globalThis.YaKitWorkbench ||= {}, { captureConnection, captureTrialContext });
})();
