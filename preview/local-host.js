(() => {
    'use strict';

    const STORAGE_KEY = 'yakit.prompt-workbench.preview.v1';
    const examples = globalThis.YaKitPreview.examples;

    function pause(signal) {
        // 短暂延时用于展示取消和忙碌状态，所有响应均来自本地示例。
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(new DOMException('操作已取消', 'AbortError'));
            const onAbort = () => {
                clearTimeout(timer);
                reject(new DOMException('操作已取消', 'AbortError'));
            };
            const timer = setTimeout(() => {
                signal?.removeEventListener('abort', onAbort);
                resolve();
            }, 650);
            signal?.addEventListener('abort', onAbort, { once: true });
        });
    }

    function createLocalHost() {
        return {
            async loadState() {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : structuredClone(examples.initial);
            },
            async saveState(state) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            },
            async getEnvironment() {
                return {
                    profiles: [{ id: 'local-example', name: '工作台示例' }],
                    promptTargets: [{ id: 'sample-rule', name: '角色行为约束' }],
                    contextLabel: '伊恩与丢失的钥匙 · 预置场景',
                    canTrial: true,
                };
            },
            async design(messages, { signal }) {
                await pause(signal);
                // ponytail: 只识别当前草稿的示例标记；真实理解需求时再接入模型。
                // 不读取旧讨论中的标记，避免清空草稿后仍被旧版本推进到第二版。
                const content = messages[1]?.content.split('\n\n本次修改的提示词：\n').at(-1) || '';
                const revised = content.includes('当有人问起未知事实时')
                    || content.includes('把线索与结论分开');
                return JSON.stringify({
                    prompt: revised ? examples.revisedPrompt : examples.firstPrompt,
                    explanation: (revised
                        ? '已载入预置第二版示例。保存后试写，对比正文并留下反馈。'
                        : '已载入预置第一版示例。保存后试写，再由你决定是否修改。')
                        + (messages[1]?.content.startsWith(`需求：\n${examples.goal}\n\n本次修改的提示词：\n`)
                            ? '' : '当前演示固定为 NPC 认知边界，输入已记录，可手动编辑草稿。'),
                });
            },
            async trial(request, { signal }) {
                await pause(signal);
                const revised = request.content.includes('把线索与结论分开');
                return {
                    content: revised ? examples.revisedStory : examples.firstStory,
                    context: {
                        source: 'local-example',
                        model: '本地预置正文',
                        scenario: examples.scene,
                        requestedScenario: request.input,
                        sample: revised ? '追问与调查' : '钥匙的位置',
                        explanation: '预置正文，用于体验版本对比和人工反馈。'
                            + (request.input?.trim() !== examples.scene
                                ? '本次仍显示钥匙场景，输入已保留。' : ''),
                    },
                };
            },
        };
    }

    globalThis.YaKitPreview.createLocalHost = createLocalHost;
})();
