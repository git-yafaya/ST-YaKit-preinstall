import { isGenerating } from '/script.js';
import { mountLauncher } from './ui/launcher.js';

// 工作台在同源框架中运行，通过此入口读取当前酒馆上下文。
globalThis.YaKitWorkbenchHost = {
    getContext: () => ({ ...SillyTavern.getContext(), isGenerating }),
};

mountLauncher(new URL('./index.html', import.meta.url).href);
