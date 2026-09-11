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
                    mainApiLabel: '本地离线示例',
                    contextLabel: '本地预览 · 伊恩与丢失的钥匙 · 预置场景',
                    canTrial: true,
                };
            },
            async readApiProfile(profileId) {
                if (profileId !== 'local-example') throw new Error('找不到所选的本地示例连接。');
                return { name: '工作台示例', url: 'https://example.invalid/v1', apiKey: '',
                    model: '本地预置设计', profileId, usesProfileSecret: false };
            },
            async fetchApiModels({ profileId = '' } = {}) {
                if (profileId && profileId !== 'local-example') throw new Error('找不到所选的本地示例连接。');
                // 预览只返回固定名称，不向填写的地址发起请求。
                return ['本地预置设计', '本地预置正文'];
            },
            async design(messages, { signal } = {}) {
                await pause(signal);
                // ponytail: 离线示例仅按反馈入口切换第二版，理解自由输入需要真实模型。
                const revised = messages[1]?.content.includes('本次操作：revise。');
                return JSON.stringify({
                    action: revised ? 'revise' : 'create',
                    prompt: revised ? examples.revisedPrompt : examples.firstPrompt,
                    explanation: (revised
                        ? '已载入预置第二版示例。保存后试写，对比正文并留下反馈。'
                        : '已载入预置第一版示例。保存后试写，再由你决定是否修改。')
                        + (revised || messages[2]?.content.startsWith(`本次需求背景：\n${examples.goal}\n\n`)
                            ? '' : '当前演示固定为 NPC 认知边界，输入已记录，可手动编辑草稿。'),
                });
            },
            async trial(request, { signal } = {}) {
                // 在请求开始时保存候选和条件，等待期间的编辑不会改写本次记录。
                const revised = request.content.includes('把线索与结论分开');
                const result = {
                    content: revised ? examples.revisedStory : examples.firstStory,
                    context: {
                        source: 'local-preview',
                        capturedAt: new Date().toISOString(),
                        connection: { api: 'local-preview', model: '本地预置正文' },
                        // 仅记录待试写的内容；本地示例没有实际宿主注入位置或聊天历史。
                        injection: { entryPoint: 'local-preview', placement: 'local-preview', role: null,
                            depth: null, quietToLoud: false, skipWIAN: false,
                            prompt: `${request.content}\n\n${request.input}` },
                        chat: { context: examples.scene, character: '伊恩', messageCount: 0 },
                        model: '本地预置正文',
                        scenario: examples.scene,
                        requestedScenario: request.input,
                        sample: revised ? '追问与调查' : '钥匙的位置',
                        explanation: '本地演示的预置正文，用于体验版本对比和人工反馈。'
                            + (request.input?.trim() !== examples.scene
                                ? '本次仍显示钥匙场景，输入已保留。' : ''),
                    },
                };
                await pause(signal);
                return result;
            },
        };
    }

    globalThis.YaKitWorkbench.createLocalHost = createLocalHost;
})();
