import { isGenerating, getMaxContextTokens } from '/script.js';
import { getTextGenModel } from '/scripts/textgen-settings.js';
import { selected_world_info, world_info } from '/scripts/world-info.js';
import { promptManager } from '/scripts/openai.js';
import { mountLauncher } from './ui/launcher.js';

// 工作台在同源框架中运行，通过此入口读取当前酒馆上下文。
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
    }),
};

mountLauncher(new URL('./index.html', import.meta.url).href);
