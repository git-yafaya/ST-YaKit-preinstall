(() => {
    'use strict';

    const SETTINGS_KEY = 'yakitPromptWorkbench';

    function createSillyTavernHost(getContext) {
        const context = () => {
            const value = getContext();
            if (!value?.extensionSettings) throw new Error('请从酒馆扩展菜单打开提示词工作台。');
            return value;
        };
        const api = globalThis.YaKitWorkbench.createApi(context);
        return {
            ...globalThis.YaKitWorkbench.createPresets(context),
            ...globalThis.YaKitWorkbench.createApiProfiles(context),
            async loadState() {
                const saved = context().extensionSettings[SETTINGS_KEY];
                return saved ? structuredClone(saved) : null;
            },
            async saveState(state) {
                const host = context();
                if (typeof host.saveSettingsDebounced !== 'function') throw new Error('酒馆设置保存接口不可用。');
                host.extensionSettings[SETTINGS_KEY] = structuredClone(state);
                host.saveSettingsDebounced();
            },
            async getEnvironment() {
                const host = context();
                let profiles = [];
                if (!host.extensionSettings.disabledExtensions?.includes('connection-manager')
                    && Array.isArray(host.extensionSettings.connectionManager?.profiles)) {
                    // 省略 API 的连接会沿用当前来源，不能用宿主的独立请求列表过滤掉它们。
                    profiles = host.extensionSettings.connectionManager.profiles
                        .filter(profile => profile && typeof profile.id === 'string' && typeof profile.name === 'string'
                            && globalThis.YaKitWorkbench.resolveProfileApi(host, profile))
                        .map(({ id, name }) => ({ id, name }));
                }
                const group = host.groups?.find(item => String(item.id) === String(host.groupId));
                const character = host.characters?.[host.characterId];
                const hasChat = Boolean(group || character);
                const name = group?.name || character?.name || '';
                return {
                    profiles, promptTargets: [], mainApiLabel: host.mainApi || '未选择',
                    contextLabel: hasChat ? `${name} · ${host.chatId || '新聊天'}` : '请先打开角色或群组聊天',
                    canGenerate: Boolean(host.ChatCompletionService?.processRequest || host.TextCompletionService?.processRequest),
                    canTrial: hasChat && typeof host.generateQuietPrompt === 'function'
                        && host.onlineStatus !== 'no_connection',
                };
            },
            design: api.design,
            prepareTrialSettings: api.prepareTrialSettings,
            trial: api.trial,
        };
    }

    (globalThis.YaKitWorkbench ||= {}).createSillyTavernHost = createSillyTavernHost;
})();
