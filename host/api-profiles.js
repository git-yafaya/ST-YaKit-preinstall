(() => {
    'use strict';

    function normalizeApiUrl(value) {
        let url;
        try { url = new URL(typeof value === 'string' ? value.trim() : ''); }
        catch { throw new Error('请填写完整的副 API 地址。'); }
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
            throw new Error('副 API 地址须为不含查询参数的 HTTP 或 HTTPS 地址，密钥请填入密钥栏。');
        }
        url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
        return url.href.replace(/\/+$/, '');
    }

    const proxySources = ['openai', 'claude', 'mistralai', 'makersuite', 'vertexai', 'deepseek', 'xai', 'zai', 'moonshot'];
    const defaultUrls = {
        openai: 'https://api.openai.com/v1', claude: 'https://api.anthropic.com/v1',
        openrouter: 'https://openrouter.ai/api/v1', ai21: 'https://api.ai21.com/studio/v1',
        makersuite: 'https://generativelanguage.googleapis.com', mistralai: 'https://api.mistral.ai/v1',
        cohere: 'https://api.cohere.ai/v2', perplexity: 'https://api.perplexity.ai',
        groq: 'https://api.groq.com/openai/v1', chutes: 'https://llm.chutes.ai/v1',
        electronhub: 'https://api.electronhub.ai/v1', nanogpt: 'https://nano-gpt.com/api/v1',
        deepseek: 'https://api.deepseek.com/beta', aimlapi: 'https://api.aimlapi.com/v1',
        xai: 'https://api.x.ai/v1', pollinations: 'https://gen.pollinations.ai/v1',
        moonshot: 'https://api.moonshot.ai/v1', fireworks: 'https://api.fireworks.ai/inference/v1',
        cometapi: 'https://api.cometapi.com/v1',
    };
    const connectionFields = {
        custom: ['custom_url', 'custom_include_headers'],
        vertexai: ['vertexai_region', 'vertexai_auth_mode', 'vertexai_express_project_id'],
        azure_openai: ['azure_base_url', 'azure_deployment_name', 'azure_api_version'],
        zai: ['zai_endpoint'], siliconflow: ['siliconflow_endpoint'], minimax: ['minimax_endpoint'],
        workers_ai: ['workers_ai_account_id'], nanogpt: ['nanogpt_provider', 'nanogpt_payg_override'],
    };
    const addressFields = { custom: 'custom_url', vertexai: 'vertexai_region', zai: 'zai_endpoint',
        siliconflow: 'siliconflow_endpoint', minimax: 'minimax_endpoint' };

    function readPreset(context, profile, type) {
        return profile.preset ? context.getPresetManager?.(type)?.getCompletionPresetByName(profile.preset) : null;
    }

    function resolveProfileApi(context, profile) {
        if (!profile) return null;
        if (profile.api) {
            const api = context.CONNECT_API_MAP?.[profile.api];
            return api?.selected === 'openai' && api.source || api?.selected === 'textgenerationwebui' && api.type ? api : null;
        }
        // 连接中未录入 API 时，酒馆保留当前类型；命名预设仍可切换该类型下的来源。
        const selected = profile.mode === 'cc' ? 'openai'
            : profile.mode === 'tc' ? 'textgenerationwebui' : context.mainApi;
        if (selected !== context.mainApi || !['openai', 'textgenerationwebui'].includes(selected)) return null;
        const current = selected === 'openai' ? context.chatCompletionSettings : context.textCompletionSettings;
        const preset = readPreset(context, profile, selected);
        const source = preset?.chat_completion_source ?? current?.chat_completion_source;
        const type = preset?.type ?? current?.type;
        return Object.values(context.CONNECT_API_MAP || {}).find(api => api.selected === selected
            && (selected === 'openai' ? source && api.source === source : type && api.type === type)) || null;
    }

    function createApiProfiles(getContext) {
        async function details(profileId) {
            const context = getContext();
            const service = context.ConnectionManagerRequestService;
            if (context.extensionSettings.disabledExtensions?.includes('connection-manager')) {
                throw new Error('请先启用酒馆连接配置扩展。');
            }
            const profile = context.extensionSettings.connectionManager?.profiles?.find(item => item.id === profileId)
                || service?.getProfile?.(profileId);
            if (!profile) throw new Error('找不到所选的连接配置。');
            const api = resolveProfileApi(context, profile);
            if (!api) {
                throw new Error('连接配置的 API 不可用，请检查酒馆当前连接或重新保存配置。');
            }
            const preset = readPreset(context, profile, api.selected);
            const current = (api.selected === 'openai' ? context.chatCompletionSettings : context.textCompletionSettings) || {};
            const settings = { ...current, ...preset };
            let model, payload;
            if (api.selected === 'textgenerationwebui') {
                model = profile.model || context.getTextGenModel?.({ ...settings, type: api.type }) || '';
                payload = { api_type: api.type, secret_id: profile['secret-id'],
                    api_server: profile['api-url'] || settings.server_urls?.[api.type] || context.getTextGenServer?.(api.type) || '' };
            } else {
                model = profile.model || context.getChatCompletionModel?.({ ...settings, chat_completion_source: api.source }) || '';
                payload = { chat_completion_source: api.source, secret_id: profile['secret-id'] };
                // 只带当前来源使用的字段，避免把其他连接的地址和凭据发给它。
                for (const field of connectionFields[api.source] || []) payload[field] = settings[field];
                const addressField = addressFields[api.source];
                if (addressField) payload[addressField] = profile['api-url'] || settings[addressField] || current[addressField];
                if (proxySources.includes(api.source)) {
                    let proxy;
                    if (profile.proxy) {
                        const resources = await context.getApiProfileResources();
                        proxy = resources.proxies.find(item => item.name === profile.proxy);
                        if (!proxy) throw new Error('找不到连接配置使用的代理。');
                    }
                    const sameSource = current.chat_completion_source === api.source;
                    payload.reverse_proxy = proxy?.url ?? preset?.reverse_proxy ?? (sameSource ? current.reverse_proxy : '') ?? '';
                    const sameProxy = sameSource && payload.reverse_proxy === current.reverse_proxy;
                    payload.proxy_password = proxy?.password ?? preset?.proxy_password ?? (sameProxy ? current.proxy_password : '') ?? '';
                }
                if (api.source === 'openrouter') Object.assign(payload, {
                    provider: settings.openrouter_providers, allow_fallbacks: settings.openrouter_allow_fallbacks,
                    use_fallback: settings.openrouter_use_fallback, quantizations: settings.openrouter_quantizations,
                });
            }
            return { context, profile, api, payload, model };
        }

        return {
            resolveApiProfile: details,
            async readApiProfile(profileId) {
                const { context, profile, api, payload, model } = await details(profileId);
                const source = api.source;
                let url = api.selected === 'textgenerationwebui' ? payload.api_server : defaultUrls[source] || '';
                let apiKey = '';
                let usesProfileSecret = true;
                if (source === 'custom') url = payload.custom_url || '';
                if (source === 'azure_openai') url = payload.azure_base_url || '';
                if (source === 'vertexai') url = payload.vertexai_region === 'global' ? 'https://aiplatform.googleapis.com'
                    : `https://${payload.vertexai_region || 'us-central1'}-aiplatform.googleapis.com`;
                if (source === 'zai') url = `https://api.z.ai/api/${payload.zai_endpoint === 'coding' ? 'coding/' : ''}paas/v4`;
                if (source === 'siliconflow') url = `https://api.siliconflow.${payload.siliconflow_endpoint === 'cn' ? 'cn' : 'com'}/v1`;
                if (source === 'minimax') url = payload.minimax_endpoint === 'cn' ? 'https://api.minimaxi.com/v1' : 'https://api.minimax.io/v1';
                if (source === 'workers_ai' && payload.workers_ai_account_id) {
                    url = `https://api.cloudflare.com/client/v4/accounts/${payload.workers_ai_account_id}/ai/v1`;
                }
                if (payload.reverse_proxy) {
                    url = payload.reverse_proxy;
                    apiKey = payload.proxy_password || '';
                    usesProfileSecret = source !== 'openai';
                } else {
                    // 宿主禁止展示密钥时，仍保留原连接的引用以便正常请求。
                    const { findSecret, SECRET_KEYS, chat_completion_sources, textgen_types } = await context.getApiProfileResources();
                    const sources = api.selected === 'openai' ? chat_completion_sources : textgen_types;
                    const keyName = source === 'vertexai' && payload.vertexai_auth_mode === 'full' ? 'VERTEXAI_SERVICE_ACCOUNT'
                        : Object.entries(sources || {}).find(([, value]) => value === (source || api.type))?.[0];
                    const secretKey = SECRET_KEYS[keyName];
                    const value = secretKey ? await findSecret(secretKey, profile['secret-id']) : null;
                    apiKey = typeof value === 'string' ? value : '';
                    usesProfileSecret = value == null || !['openai', 'custom'].includes(source) || Boolean(payload.custom_include_headers);
                }
                return { name: profile.name || '', url, apiKey, model, profileId, usesProfileSecret };
            },
            async fetchApiModels({ profileId = '', url = '', apiKey = '' } = {}) {
                const context = getContext();
                if (!context.getRequestHeaders) throw new Error('当前酒馆版本未提供请求接口。');
                let payload;
                if (profileId) {
                    const config = await details(profileId);
                    if (config.api?.selected !== 'openai' || !config.api.source) {
                        throw new Error('此连接暂不支持拉取模型，请手动填写模型名称。');
                    }
                    payload = config.payload;
                } else {
                    const key = typeof apiKey === 'string' ? apiKey.trim() : '';
                    if (/[\r\n]/.test(key)) throw new Error('副 API 密钥不能包含换行。');
                    payload = { chat_completion_source: 'openai', reverse_proxy: normalizeApiUrl(url), proxy_password: key };
                }
                const response = await fetch('/api/backends/chat-completions/status', {
                    method: 'POST', headers: context.getRequestHeaders(), body: JSON.stringify(payload),
                });
                if (!response.ok) throw new Error(`拉取模型失败（${response.status}）。`);
                const result = await response.json();
                if (result?.error) throw new Error('拉取模型失败，请检查连接配置。');
                const entries = Array.isArray(result) ? result : result?.data;
                if (!Array.isArray(entries)) throw new Error('模型列表格式无效。');
                const models = [...new Set(entries.map(item => typeof item === 'string' ? item : item?.id || item?.name)
                    .filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()))];
                if (!models.length) throw new Error('接口未返回可用模型，请手动填写模型名称。');
                return models;
            },
        };
    }

    Object.assign(globalThis.YaKitWorkbench ||= {}, { createApiProfiles, normalizeApiUrl, resolveProfileApi });
})();
