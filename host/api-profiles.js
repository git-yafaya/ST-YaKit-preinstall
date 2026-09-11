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

    function createApiProfiles(getContext) {
        async function details(profileId) {
            const context = getContext();
            const service = context.ConnectionManagerRequestService;
            if (context.extensionSettings.disabledExtensions?.includes('connection-manager')) {
                throw new Error('请先启用酒馆连接配置扩展。');
            }
            const profile = service?.getProfile?.(profileId)
                || context.extensionSettings.connectionManager?.profiles?.find(item => item.id === profileId);
            if (!profile) throw new Error('找不到所选的连接配置。');
            const api = service?.validateProfile?.(profile) || context.CONNECT_API_MAP?.[profile.api];
            let proxy;
            if (profile.proxy) {
                // 通过宿主入口复用酒馆已经加载的连接资源。
                const resources = await context.getApiProfileResources();
                proxy = resources.proxies.find(item => item.name === profile.proxy);
                if (!proxy) throw new Error('找不到连接配置使用的代理。');
            }
            const preset = profile.preset ? context.getPresetManager?.('openai')?.getCompletionPresetByName(profile.preset) : null;
            const settings = preset ? { ...context.chatCompletionSettings, ...preset } : {};
            const payload = {
                chat_completion_source: api?.source, secret_id: profile['secret-id'],
                custom_url: profile['api-url'] || settings.custom_url,
                custom_include_headers: settings.custom_include_headers,
                vertexai_region: profile['api-url'] || settings.vertexai_region,
                zai_endpoint: profile['api-url'] || settings.zai_endpoint,
                siliconflow_endpoint: profile['api-url'] || settings.siliconflow_endpoint,
                minimax_endpoint: profile['api-url'] || settings.minimax_endpoint,
                reverse_proxy: proxy?.url ?? settings.reverse_proxy,
                proxy_password: proxy?.password ?? settings.proxy_password,
                azure_base_url: settings.azure_base_url,
                azure_deployment_name: settings.azure_deployment_name,
                azure_api_version: settings.azure_api_version,
            };
            return { context, profile, api, payload };
        }

        return {
            async readApiProfile(profileId) {
                const { context, profile, api, payload } = await details(profileId);
                let url = payload.reverse_proxy || profile['api-url'] || '';
                let apiKey = '';
                let usesProfileSecret = Boolean(profile['secret-id']);
                if (api?.source === 'custom') url = payload.custom_url || '';
                if (api?.source === 'openai') url = payload.reverse_proxy || 'https://api.openai.com/v1';
                if (api?.source === 'openai' && payload.reverse_proxy) {
                    apiKey = payload.proxy_password || '';
                    usesProfileSecret = false;
                } else if (['openai', 'custom'].includes(api?.source)) {
                    // 宿主禁止展示密钥时，仍保留原连接的引用以便正常请求。
                    const { findSecret, SECRET_KEYS } = await context.getApiProfileResources();
                    const value = await findSecret(SECRET_KEYS[api.source.toUpperCase()], profile['secret-id']);
                    apiKey = typeof value === 'string' ? value : '';
                    usesProfileSecret = value == null;
                }
                return { name: profile.name || '', url, apiKey, model: profile.model || '', profileId, usesProfileSecret };
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
                // 状态接口只读取模型，不切换当前连接，也不发送生成请求。
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

    Object.assign(globalThis.YaKitWorkbench ||= {}, { createApiProfiles, normalizeApiUrl });
})();
