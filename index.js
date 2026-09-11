import { isGenerating, getMaxContextTokens } from '/script.js';
import { getTextGenModel } from '/scripts/textgen-settings.js';
import { selected_world_info, world_info } from '/scripts/world-info.js';
import { promptManager } from '/scripts/openai.js';
import { mountLauncher } from './ui/launcher.js';

globalThis.YaKitWorkbenchHost = {
    getContext: () => ({ ...SillyTavern.getContext(), isGenerating, getTextGenModel, getMaxContextTokens,
        // 只暴露试写条件需要的世界书选择，正文命中仍由酒馆处理。
        getTrialWorldInfo: () => ({ globalSelection: selected_world_info, characterLore: world_info.charLore }),
        getQuietPromptOverride: () => {
            // 只读取本次静默生成启用的条目，不提前执行其中的宏。
            const entry = promptManager?.getPromptOrderEntry(promptManager.activeCharacter, 'quietPrompt');
            const prompt = promptManager?.getPromptById('quietPrompt');
            return entry?.enabled && promptManager.shouldTrigger(prompt, 'quiet') ? prompt : null;
        },
        refreshPresetEditor: () => promptManager?.render(false),
        // 顺序与可切换范围沿用酒馆当前配置，包含酒馆允许开关的占位条目。
        getPresetPromptContext: () => promptManager ? {
            characterId: promptManager.configuration.promptOrder.strategy === 'global'
                ? promptManager.configuration.promptOrder.dummyId : promptManager.activeCharacter?.id,
            isToggleAllowed: entry => promptManager.isPromptToggleAllowed(entry),
        } : null,
        getApiProfileResources: async () => {
            const [{ proxies, chat_completion_sources }, { findSecret, SECRET_KEYS }, { textgen_types }] = await Promise.all([
                import('/scripts/openai.js'), import('/scripts/secrets.js'), import('/scripts/textgen-settings.js'),
            ]);
            return { proxies, findSecret, SECRET_KEYS, chat_completion_sources, textgen_types };
        },
    }),
};

mountLauncher(async container => {
    // 首次打开才加载工作台组件，后续打开复用已创建的界面。
    const { mountApp } = await import('./app.js');
    const host = globalThis.YaKitWorkbench.createSillyTavernHost(globalThis.YaKitWorkbenchHost.getContext);
    return mountApp(container, host);
});
