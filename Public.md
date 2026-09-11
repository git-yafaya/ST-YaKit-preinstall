# ST-YaKit-preinstall 开发说明

这是 YaKit 系列的 SillyTavern 提示词工作台，使用原生 JavaScript、HTML 和 CSS，无依赖安装和构建步骤。

## 仓库结构

```text
ST-YaKit-preinstall/
├── .gitignore                  # 排除本地资料、测试、环境配置及缓存
├── README.md                   # 用户安装、配置与使用说明
├── Public.md                   # 模块、数据流与接口契约
├── manifest.json               # 酒馆扩展入口、版本及兼容性声明
├── index.js                    # 发布宿主适配入口并按需挂载工作台
├── preview.html                # 直接加载本地演示的页面入口
├── app.js                      # 加载组件、挂载控制器并管理环境刷新
├── style.css                   # 工作台全部局部样式入口
├── styles/
│   ├── controls.css                # 操作与展开按钮、输入、选项弹层及滚动条
│   ├── launcher.css                # 菜单图标、弹窗尺寸与进退场
│   ├── navigation.css              # 顶栏、导航指示器与切页轨道
│   ├── pages.css                   # 五页卡片、编辑与阅读布局
│   ├── settings.css                # 设置分组、二级滑轨与编辑页常驻底栏
│   ├── theme.css                   # 四套主题与工作台变量映射
│   └── toast.css                   # 纪实同款底部轻提示与状态颜色
├── core/
│   ├── judgement.js                # 裁判指令、结构化证据校验与历史评分恢复
│   ├── prompt-defaults.js          # 七类默认引导、已保存文本读取与旧默认场景文案
│   ├── presets.js                  # 预设读取与复制、版本应用、原版恢复与开关动作
│   ├── prompts.js                  # 可编辑生成引导与固定协议、答复解析和反馈指令
│   ├── scenarios.js                # 模块连接解析、专用提示词编写与场景生成两阶段编排
│   ├── settings.js                 # 可选副 API 配置、旧数据迁移与各环节提示词存取
│   ├── state.js                    # 设置校验、API 路由派生、记录恢复与保存快照
│   ├── test-tasks.js               # 场景提示词留存、测试采样、匿名盲评和人工偏好
│   └── workbench.js                # 并发设计、版本与自动命名、测试任务接入及异步状态控制
├── host/
│   ├── api-profiles.js             # 连接来源解析、字段回填与模型列表
│   ├── api.js                      # 同批设计并发、采样调度与主通道占用
│   ├── local-host.js               # 离线演示请求及浏览器独立存储
│   ├── preset-order.js             # 生效顺序、开关权限与目标开关更新
│   ├── presets.js                  # 酒馆预设读取、试作副本保存、正文及开关写回
│   ├── requests.js                 # 独立主副 API 请求及真实 n 多候选解析
│   ├── st-host.js                  # 酒馆设置、环境及模型和预设适配器入口
│   └── trial-context.js            # 独立消息或聊天模式的请求条件快照
├── preview/
│   ├── examples.js                 # 原有演示需求、提示词与两版正文
│   └── preview.js                  # 通过本地适配器挂载同一套界面
├── ui/
│   ├── dialog-motion.js            # 统一关闭动画与重新打开状态
│   ├── judgement-view.js           # 需求清单、并列排名和逐篇审查证据展示
│   ├── launcher.js                 # 扩展菜单、唯一弹窗与首次按需加载
│   ├── navigation-view.js          # 五页常驻导航、程序切页与键盘焦点
│   ├── preset-entries-view.js      # 条目编辑、开关、逐条保存与输入保留
│   ├── preset-prompt-view.js       # 原版及测试版本选择、只读预览与应用
│   ├── preset-template.js          # 预设预览与复制按钮
│   ├── preset-view.js              # 预设选择、复制与重读
│   ├── select-view.js              # 触屏下拉再次点击收起与事件清理
│   ├── settings-api-view.js        # API 编辑草稿、连接回填与模型选择
│   ├── settings-prompt-view.js     # 提示词草稿、重置及修改标记
│   ├── settings-template.js        # 设置二级页、滚动编辑区与共用操作按钮
│   ├── settings-view.js            # 导航设备适配、设置子页与操作按钮布局
│   ├── shell-template.js           # 正式窗口和预览共用顶栏与挂载容器
│   ├── theme-view.js               # 同步当前容器的主题选择
│   ├── toast.js                    # 轻提示创建、自动消失及卸载清理
│   ├── trial-template.js           # 空卡、场景、样本和盲评页面
│   ├── trial-view.js               # 场景、任务、评分、偏好及反馈控件
│   ├── versions-template.js        # 提示词名称、版本选择、改名删除与原文页面
│   ├── versions-view.js            # 名称同步、记录选择与改名删除确认
│   ├── workbench-template.js       # 五页轨道、导航与含生成数量的工作台模板
│   ├── workbench-messages-view.js  # 讨论展示、逐条展开复制和保存操作
│   ├── workbench-view.js           # 主视图渲染、数量输入、模块挂载、通知与导出
│   └── workbench.svg               # 扩展菜单的工作台图标
├── tests/                     # 本地忽略目录，不随仓库分发
│   ├── api-profiles.mjs            # 连接回填、模型列表及离线接口检查
│   ├── core.test.mjs               # 核心状态与业务边界检查
│   ├── design-count.mjs            # 数量保存、并发结果、部分失败及取消编辑保护
│   ├── design-entries.test.mjs     # 独立需求、自动命名、旧稿留存与来源隔离检查
│   ├── design-prompts.test.mjs     # 新建修订协议与默认提示词迁移检查
│   ├── dialog-motion.mjs           # 关闭、重新打开与减少动效检查
│   ├── isolated-host.mjs           # 独立连接、真实 n、空卡隔离与取消检查
│   ├── host-parallel.test.mjs      # 主连接并发、请求参数固定与聊天串行检查
│   ├── host-design-concurrency.mjs # 同批设计并发、用途隔离与失败取消后的占用
│   ├── judgement-core.test.mjs     # 审查证据、历史恢复、任务并发与失败检查
│   ├── judgement-ui.test.mjs       # 需求、排名、证据及历史评分展示检查
│   ├── launcher.test.mjs           # 单次挂载、失败重试与弹窗事件检查
│   ├── native-styles.test.mjs      # 局部样式、关闭隐藏与主题范围检查
│   ├── navigation.test.mjs         # 切页、键盘焦点与输入保留检查
│   ├── preset-copy.test.mjs        # 试作编号、完整复制、失败与忙碌状态检查
│   ├── preset-display.test.mjs     # 复制按钮、逐条编辑、保存和切换后的输入保留检查
│   ├── preset-preview-ui.mjs       # 版本切换、删除快照、开关与预览事件检查
│   ├── prompt-requests.test.mjs    # 七类提示词实际请求与任务快照检查
│   ├── prompt-settings.test.mjs    # 提示词默认值、保存恢复及旧内容保留检查
│   ├── presets-core.test.mjs       # 默认预设、草稿来源与写回状态检查
│   ├── presets-host.test.mjs       # 预设读取、冲突校验与宿主写回检查
│   ├── preview-host.test.mjs       # 独立演示、旧数据、取消与入口隔离
│   ├── select-toggle.test.mjs      # 触屏下拉事件边界与卸载检查
│   ├── settings-core.test.mjs      # 配置迁移、空连接回退、导航与提示词请求检查
│   ├── settings-ui.test.mjs        # 设置草稿、底栏操作、过期请求与自动导航检查
│   ├── st-host.test.mjs            # 宿主适配器与请求契约检查
│   ├── test-pipeline.test.mjs      # 固定场景、采样盲评、失败恢复与偏好检查
│   ├── theme.test.mjs              # 主题同步与宿主变量检查
│   ├── toast-routing.test.mjs      # 提示去重、数量输入、提交与取消事件检查
│   ├── toast.test.mjs              # 轻提示文本、显示时序与卸载清理
│   ├── trial-record.test.mjs       # 试写条件的版本归属、保存恢复与导出
│   ├── trial-ui.test.mjs           # 任务、评分、排序和偏好控件检查
│   ├── versions-core.test.mjs      # 命名、编号、改名删除和恢复检查
│   ├── versions-ui.test.mjs        # 版本选择、命名和删除确认检查
│   └── workbench-messages.test.mjs  # 逐条结果复制、保存、写回目标与展开状态检查
└── AGENTS.md                   # 本机共享规则软链接，不入库
```

## 加载与数据流

扩展菜单入口显示「工作台」，图标由 `styles/launcher.css` 以 CSS 遮罩引用 `ui/workbench.svg`，使用 1em 尺寸和 `currentColor` 跟随菜单文字；图标设置 `aria-hidden`，按钮名称由文字提供。页面顶栏固定显示同一 SVG 图标与「预设工作台」，由 `styles/navigation.css` 设置排版与主题颜色；对话框的可访问名称为「预设工作台」。

1. 酒馆通过 `manifest.json` 加载 `index.js`，发布 `YaKitWorkbenchHost.getContext()`，提供实时酒馆上下文、生成状态、试写背景、预设刷新和连接资源。随后创建扩展菜单入口、共用顶栏和原生 `dialog#yakit-workbench-dialog.yakit-workbench`，样式入口 `style.css` 按地址去重加载。
2. 首次打开弹窗时按需导入 `app.js`，它通过 ES 模块导入现有状态、提示词、设置、预设、宿主及视图组件；同一模块在酒馆窗口中只执行一次。入口创建 `createSillyTavernHost(getContext)`，再调用 `mountApp(container, host)`，恢复记录并向容器内的 `#yakit-wb-app` 挂载五页工作台。工作组件尚在加载时重复打开共用一次请求，失败只在内容区显示错误，关闭按钮继续可用，重开后可重试。
3. 关闭弹窗保留工作台实例、输入和滚动位置，重新打开与窗口获得焦点时更新聊天、连接及可试写状态。设置二级页的未确认草稿继续按原规则丢弃。独立演示入口 `preview.html` 直接加载 `preview/preview.js`，用相同的 `shell-template.js`、`app.js` 和本地适配器创建界面；演示只返回内置内容。卸载函数解除环境刷新监听并释放视图订阅及提示计时器。
4. 需求输入立即更新内存并排队保存，保留首尾空格和换行；当前草稿由生成、版本选择或讨论结果保存更新。「生成数量」通过 `designCount` 保存，默认 1，接受正安全整数。设计固定开始时的数量、设置、消息和载入条目名称，按数量同时发起独立 `host.design` 请求，各次使用同一取消信号及内容相同的消息和设置副本，通过 `Promise.allSettled` 等待完成。第一个系统消息为最新保存的破限提示词与补充提示词，第二个先读取已保存的 `assistPrompts.design`，再追加固定的 JSON 返回契约和操作约束；其后仅为本次需求背景、当前参考条目及本次要求。每次请求默认生成独立条目，只有本次明确要求修改当前条目时才修订。历史讨论保留展示，不再逐轮发送；普通设计不附带聊天或试写正文，反馈修订只传关联版本及本次反馈，且始终只发起一次请求。
5. 四个模块分别通过 `moduleApis` 解析工作台配置快照，默认均为 `default`，沿用所选副 API；没有选择或连接字段全部为空时使用酒馆当前 API。`designApi` 仅为请求内部标志，由连接字段派生，不再作为可编辑或持久化开关。设计、场景、盲评和空卡样本使用独立消息通道：聊天补全使用 `ChatCompletionService.processRequest`，文本补全使用 `TextCompletionService.processRequest`。保存连接先通过 `resolveApiProfile` 解析来源和连接参数，再调用对应服务；仅提取预设中的连接字段，不载入预设正文或指令模板。不走宿主聊天组装、宏替换或 `generateRaw` 的扩展提示事件。请求关闭流式；副 API 上限 4096 token，酒馆聊天补全采用当前答复长度；适用的 OpenAI 模型使用 `max_completion_tokens`。
6. 每份设计答复为 `{action, prompt, explanation}` JSON，也接受完整 JSON 代码围栏。`action` 为 `create` 或 `revise`，缺省兼容为 `create`，非法值拒绝采用；`prompt` 必须为单条完整的非空提示词。原始答复按返回顺序立即保存到讨论，格式错误的原文也保留，界面展示说明和「查看提示词」，旁边并排提供「复制提示词」「保存到原条目」「保存为版本」。展开按钮以 `aria-expanded` 和 `aria-controls` 关联正文；普通状态刷新保留展开状态。多份生成的有效答复逐份保存为独立版本；全部结束后按请求顺序采用第一份有效结果并选中对应版本。单份结果继续作为待保存草稿。采用前，如果现有非空草稿与结果不同，且没有逐字相同的已保存版本，就按自动命名规则新增版本。两类自动保存均使用「预设条目名称-number-YYYYMMDD」：条目名称取设计开始时的 `presetSource.name`，去除首尾空白，未载入条目或名称空白时使用「提示词」；编号取该版本的全局递增 `number`，日期由同一版本的 `createdAt` 按设备本地时区转换。已有版本恢复时保留原名称。新建解除原选中版本和预设来源，普通修订保留当前来源；反馈修订解除预设来源。取消、全部无效或期间修改草稿、需求、版本时不替换草稿和选择，也不自动留存旧草稿；已收到的多份有效版本继续保留，取消后的迟到答复忽略。手动与自动保存共用独立 ID、名称、递增编号和时间；已保存正文保持不变，名称可单独修改。手动保存的空名称使用「未命名提示词」。
7. 测试要求选定版本与草稿完全一致，且填写原始需求。`trial(input)` 先保存任务快照，再固定手填场景或调用场景模块生成场景，随后生成 1—6 份样本并盲评。默认空卡消息为 `[{role:"system",content:破限提示词 + "\n\n" + 候选原文},{role:"user",content:场景}]`；正文请求不含需求、讨论、角色、世界书、作者注释或其他样本。关闭空卡时才使用主 API 的 `generateQuietPrompt`，明确本次场景优先，聊天背景仍由酒馆组装。正文只保存到工作台，不追加聊天消息。
8. 各样本记录关联发起时的 `versionId/taskId/sampleIndex`、场景和 `context`。`context.capturedAt` 为请求开始时间，记录 `createdAt` 为入库时间。空卡独立样本统一并发，任务层用 `Promise.allSettled` 等待各份完成并逐份保存；当前聊天模式逐次生成。单次模式传真实 `n` 并读取原始 `choices`，不拆分同一答复。全部成功后将原始需求、场景和随机标签的正文交给裁判，由 `judgement` 校验需求清单及每条证据，再映射回样本。初次盲评默认选最高分，同分按任务原顺序；不自动写人工偏好。反馈仍按试写源版本修订，只传本次意见及引用或完整正文，当前需求框为空也可修订历史反馈。
9. 新建议进入草稿，保存后成为下一版。「版本记录」选单以提示词名称为主要标识，编号后置，选择后载入草稿并在下方只读显示保存原文；名称编辑、保存和删除集中在顶部工具栏，未选中版本时隐藏。删除先在工具栏下方展示目标和关联试写数量，确认后删除选中版本及其测试任务、试写、评分和反馈，保留当前草稿。该页导出从当前内存生成 JSON，排除 `secondaryKey` 和每套 API 配置的 `apiKey`；「工作台」中的复制取所点击讨论结果的正文，不修改草稿。讨论中的「保存为版本」先将该结果设为当前草稿，再调用原保存接口；已有同文版本时沿用其名称，否则使用默认名称。保存期间锁定讨论中的保存按钮。「保存到原条目」仅在已有来源、该结果等于当前草稿且不同于来源原文时启用，继续调用原写回接口。
10. 初始化调用 `refreshPresets()` 获取聊天补全预设列表；当前预设名属于可用列表且宿主提供 `readPreset` 时读取条目。「预设预览」按宿主生效角色的顺序展示全部条目，包括未启用、未列入顺序及标记条目，并返回开关状态及可切换原因。有预设时选单列出可用预设，无预设时显示「暂无可用预设」；刷新后当前目标被删除时，保留标注「不在列表中」的原名称。切换预设及「重新读取」读取对应内容，「刷新列表」保留已选预设、条目与草稿来源。
11. 每条使用原生 `details` 展开正文，`summary` 显示为条目名称按钮；非标记条目可直接编辑，点击「保存条目」调用 `savePresetContent(identifier, content, expectedContent)`，不改动工作台草稿与版本。视图按预设、标识及同标识出现次数保留编辑器节点，切页、切换预设和状态通知不清空输入。保存一条只推进本条基线；明确重新读取成功后采用新原文基线并保留本地编辑。点击「载入草稿」使用核心已读取的内容并跳转工作台，明确要求修订后，可在对应讨论结果旁通过「保存到原条目」写回。
12. 每条的来源选单只更新本地预览；「应用提示词」调用 `applyPresetPrompt(identifier, versionId, expectedContent)`，空版本 ID 表示原版，其他 ID 必须属于已保存版本。首次应用测试版时记录原文；后续替换保留同一原文，应用原版或手动保存正文成功后清除该条替换记录。不同预设和条目分别记录，保存失败保留此前记录；已应用测试版被删除后仍可查看快照和恢复原版。原版编辑器与测试预览分开保留，应用期间不覆盖原版输入。
13. 条目开关位于折叠控件外，调用 `setPresetEntryEnabled(identifier, enabled)` 即保存，不触发展开。核心传回读取时的启用状态和 `presetOrderCharacterId` 校验冲突；宿主只修改目标 `order.enabled`，目标未加入顺序时按酒馆 `appendPrompt` 规则插入开头。保存当前预设时同步活动设置和列表，保存其他预设保持当前选择。
14. 「复制预设」调用 `copyPreset()`，宿主深拷贝所选预设的完整已保存内容，以「原名-试作编号」保存。原名去掉末尾的 `-试作数字`，取同原名现有最大试作编号加一，没有时从 1 开始。保存成功后酒馆原生列表选中副本，核心同步预设列表、名称、条目及生效顺序，并解除草稿来源绑定；草稿正文与原预设的本地编辑继续保留。

### 测试任务与数据隔离

`testTasks` 保存任务原始需求、候选原文、版本标识、专用场景提示词、固定场景、运行开关、模块配置 ID、样本 ID、评分和人工偏好。专用提示词在场景执行前保存，场景在采样前保存；任务状态依次为 `scenario`（包含提示词编写与场景生成两步）、`generating`、`judging`、`completed`。失败为 `error`，取消或刷新中断为 `cancelled`；部分样本重评成功为 `partial`，保留 `generationError`。任务开始时解析工作台各模块配置；空卡主连接另固定本轮模型、地址、答复长度和请求参数，所有样本复用。请求参数留在内存，密钥不写入任务。保存连接仍交给宿主按 ID 解析，服务端密钥由宿主管理；其他阶段使用调用时的宿主主连接。

场景流程由 `scenarios.generate()` 顺序调用两次 AI。第一步 `scenario-prompt` 接收破限文案、场景编写引导及 `{goal,candidate}`，按本次原始需求逐句编写完整的专用提示词；每项需求分别写清适用条件、行为边界、冲突诱因、可观察事实和用户已规定的优先级，题材与角色由需求决定。第二步 `scenario` 接收同次破限文案、AI 返回的专用提示词及同一份 `{goal,candidate}`，只生成供被测模型响应的冲突场景，不附需求分析、评分规则或达标答案。两个阶段共用开始时深拷贝的工作台场景 API 设置及引导词，首步失败、保存失败或取消后不会进入后续请求。

手动模式不能为空；AI 模式已有文本就沿用，留空才自动生成。`generateScenario()` 每次重新编写专用提示词，并先把本次需求与提示词存入讨论，再生成场景；第二步失败或取消时保留讨论和原场景。自动任务在第二步前保存 `task.scenarioPrompt`，成功后固定同一场景供所有样本使用。请求期间修改需求、草稿、场景或来源时不覆盖当前输入；这些字段改变、切换版本或载入预设条目会清空当前 `scenarioPrompt` 关联，已保存任务和讨论继续保留。

`combineDesignScenario` 仅在 AI 场景模式生效，设计和场景解析出的连接必须相同；每份设计答复额外要求非空 `scenarioPrompt` 字段。所有设计请求结束后，先保存按请求顺序采用的首份有效条目及其专用提示词，再执行一次 AI 场景请求，避免与同批主 API 设计请求争用通道。其余专用提示词保留在原始设计答复中；设计期间发生编辑时只保留设计结果。第二步失败或取消会保留已采用条目和专用提示词；执行期间发生编辑时不覆盖新输入。手填模式保持场景不变；旧答复中的 `scenario` 仍可解析供历史展示，新合并请求以 `scenarioPrompt` 为契约。

裁判的请求为已保存的破限提示词与裁判提示词合成的系统消息，以及 `{goal, scenario, samples:[{label,content}]}` 的用户消息。`goal` 是创建任务时「你希望改善什么？」输入框的快照，设计时的补充要求不会自动合并；不会发送候选提示词、版本名称、模型身份、设计讨论、补充提示词或宿主预设。每次评分重新随机打乱样本并给出匿名标签。

裁判先拆解原始需求，再逐篇引用证据，按需求符合度独立给出 0—100 分及比较理由。明确禁令优先于表达效果，多项违例先看严重程度再看次数；疑点单独列出，不直接当作确定违例扣分。允许同分及低分第一名，最终采用由用户决定。这些评判规则交给模型执行，业务代码负责数据与证据校验，不另行计算扣分。

| 裁判答复字段 | 契约 |
| --- | --- |
| `requirements` | 非空需求数组，每项为 `{id,text,kind}`；`id` 唯一，`text` 非空，`kind` 为 `hard` 或 `quality` |
| `results` | 每个输入标签对应一项，标签齐全且唯一，不接受新增标签 |
| `results[].score` / `reason` | 0—100 的有限数字与非空的总评、比较理由 |
| `results[].violations` | 明确违例数组，每项为 `{requirementId,quote,reason}` |
| `results[].doubts` | 待用户核实的疑点数组，每项为 `{requirementId,quote,reason}`；无疑点时为空数组 |
| 每条证据 | `requirementId` 必须存在，`quote` 必须非空且逐字来自对应范本，`reason` 必须非空 |

七类可编辑引导由 `prompt-defaults.js` 提供默认值，并通过 `assistPrompts` 保存、恢复和导出。生成与修改引导由 `assistPrompts.design` 保存，普通生成、多份生成、合并生成与反馈修订统一读取；旧存档缺失时补齐默认内容，空白确认后恢复默认，自定义文本原样保存、恢复和导出。破限提示词随所有模型生成请求发送，设计与反馈沿用原有首条系统消息，场景两阶段分别以破限原文作为首条系统消息，裁判在系统消息前拼接破限原文，正文通过 `builtinPrompt` 传递。任务开始时在内存固定破限、场景编写、裁判和聊天试写文案；初次评分使用该快照，重评读取最新保存的破限与裁判文案。反馈引导随人工意见一起组装，版本及正文归属仍由代码确定。设计和合并生成的返回字段、操作约束、动态数据标签及评分解析继续由业务代码管理。空卡正文使用破限提示词、候选原文和固定场景；候选业务原文保持独立，聊天试写的 `quietPrompt` 同样以前述破限原文开头。场景引导仅在逐字匹配旧默认时迁移为新编写引导，用户自定义内容原样保留。

试写页在原生折叠区展示需求清单，按分数显示样本排名、实际样本编号和匿名标签，允许并列。排名按钮选择对应正文，不设置人工偏好。逐篇评分将明确违例与疑点分开展示，原句、对应要求和原因全部作为纯文本写入；未发现问题时显示空态，历史评分提示缺少需求清单或独立疑点。沿用五页共用窗口、按钮、主题和动效。

保存时 `judgement` 增加 `createdAt`，每项结果记录匿名 `label` 及真实 `trialId`。新结构随任务保存、恢复和导出；历史字符串 `violations` 继续保留，没有需求清单或疑点的旧记录按历史格式展示。新答复格式或引用错误时保留样本、原评分和人工偏好，供用户重评；损坏的已存评分只舍弃评分，任务正文继续保留。重评使用当时所选裁判 API，`preferredTrialId` 仅由用户主动选择设置。

### 边界与持久化

五页的现有 `state.notice`、`state.error` 以及复制、导出和设置保存反馈统一由视图转换为 Toast。订阅与异常捕获不会重复显示同一次错误；普通渲染不重播旧提示，再次执行保存、复制或失败操作仍可显示同文案。错误存在时不将状态中的成功文案当作新结果显示。未选正文就点击引用时显示提醒。Toast 不改变核心状态和保存流程。

| 情况 | 当前处理 |
| --- | --- |
| 首次加载期间重复打开 | 共享同一次组件挂载，关闭后加载完成不会自行重开窗口 |
| 工作台加载失败 | 内容区显示错误，保留关闭按钮；下次打开重新尝试挂载 |
| 空需求、空设计要求、保存版本时空草稿或空试写要求 | 提交失败并显示错误；编辑时允许暂存空白，预设条目允许清空保存 |
| 生成数量为空、非整数、非正数或超出安全整数范围 | 原生表单阻止提交，核心校验拒绝更新；旧记录缺失或无效数量恢复为 1 |
| 多份提示词部分失败 | 各请求独立完成并保存有效结果，全部结束后报告失败与有效数量；成功结果仍可选用 |
| 多份提示词保存失败 | 有效结果留在内存和导出，提示保存错误；保存失败不计入生成失败数量 |
| 副 API 未选择或连接字段全部为空 | 沿用酒馆当前 API；显式空选择持久化，重新打开不自动选中已有配置 |
| 已选副 API 配置或引用的酒馆连接失效 | 请求前报错并要求重新选择，不自动换用其他连接 |
| 自定义连接只填写了部分信息 | 发起请求前检查地址和模型；地址只接受 HTTP(S)，拒绝内嵌凭据、查询参数、片段和密钥换行；去除尾部斜杠与 `/chat/completions` |
| 自定义密钥为空 | 显式发送空认证头，不借用酒馆已有自定义接口密钥 |
| 未打开角色或群组聊天 | 空卡可用，不读取角色背景；关闭空卡时需要聊天和已连接的主 API |
| 主 API 未连接 | 使用主 API 的模块报错；已配置的副 API 独立可用，不要求主 API 在线 |
| 主 API 正在生成 | 设计、场景、裁判及当前聊天试写继续受主通道占用限制；同一非空 signal 且用途均为 design 的同批请求可以并发，最后一条实际结束才释放；空卡正文走独立请求，可并发 |
| 草稿与选中版本不同 | 阻止试写，要求先保存新版本 |
| 提示词名称为空 | 手动新保存使用「未命名提示词」；对已有版本改名时拒绝空白名称 |
| 自动保存时没有载入预设条目或条目名称为空白 | 使用「提示词-number-YYYYMMDD」；日期取保存当日的设备本地日期，编号持续递增 |
| 同名提示词 | 允许保存多个独立版本，选择项与试写归属通过后置编号区分 |
| 版本改名 | 只更新名称，保留 ID、编号、正文、时间及试写关联；输入期间普通状态刷新保留未提交名称 |
| 删除提示词版本 | 同时删除关联测试任务、试写、评分与反馈；仅清空被删记录的选中 ID，保留当前草稿、预设来源及其他记录，不自动载入另一版本 |
| 操作忙碌时改名或删除 | 界面禁用，核心拒绝；避免生成返回后产生找不到版本的试写 |
| 删除最新或全部版本 | 编号计数器继续保存，新版本不复用已删编号 |
| 旧版本没有编号 | 按原记录顺序补号，保留原名称、正文、ID、时间及试写关联；已有有效编号和计数器优先，新补编号从其后开始 |
| 生成期间修改需求、草稿或选择版本 | 答复保留在讨论，多份有效结果各自保存版本；不覆盖用户草稿、选择及场景 |
| 生成期间更新 API 设置 | 已开始任务保留创建时的工作台模块配置，空卡主连接样本复用本轮请求参数；宿主保存连接按 ID 解析，其他阶段的宿主主连接按调用时读取；后续重评读取新裁判设置 |
| 模块引用已删除配置 | 请求前报错并要求重新选择，不回退到其他 API |
| 手填场景为空 / AI 场景已有文本 | 手填拒绝；AI 已有文本沿用，留空才生成 |
| 合并生成连接不同或返回缺少专用场景提示词 | 拒绝操作或采用，草稿保留，原始设计答复留在讨论 |
| 场景提示词编写失败、空答复或取消 | 不请求场景执行或正文样本；已完成内容继续保存 |
| 场景执行失败、空答复或取消 | 不采样；独立生成保留原场景及讨论中的专用提示词，自动任务和合并设计保留各自已保存的专用提示词 |
| 单次模式不支持 n / choices 数量不符 | 报错并提示独立请求，不把一条答复拆成多份，也不自动重复付费请求 |
| 主文本补全或当前聊天模式使用单次多样本 | 请求前拒绝，需选择独立请求；副 API 当前聊天模式需改为空卡 |
| 独立样本中途失败 | 保留已完成样本及错误，可对现有样本重评；不会自动重试失败请求 |
| 裁判超时、格式错误、漏评、重复标签、未知需求或引用不属于样本 | 保留正文、人工反馈和原有评分，可重新盲评 |
| 恢复旧评分或损坏评分 | 旧字符串违例继续显示；新结构重新校验引用和要求，损坏评分舍弃，保留任务及正文 |
| 重载时任务未结束 | 标记取消，保留已保存的固定场景和样本，不自动恢复网络请求 |
| 旧单次试写 | 保留原记录与 context，可在历史单次试写选项中查看 |
| 配置名称为空或更新目标不存在 | 拒绝保存；地址与模型允许先留空，发起设计时再检查完整性 |
| 旧单套 API 配置 | 恢复为「已有配置」，路由按实际连接字段决定；旧主副开关不再控制请求，旧模块 `main` 值迁移为 `default` |
| 连接读取或模型列表返回较晚 | 仅更新仍在编辑的草稿；切换连接、返回或关闭后忽略旧结果，读取期间手填的名称和模型继续保留 |
| 宿主不允许显示密钥 | 保留酒馆连接引用，地址只读；填写自己的密钥后解除引用并允许编辑地址 |
| 连接读取失败或模型列表为空、错误 | 连接失败清空地址与密钥并阻止保存，重新选择或填写自己的密钥后可继续；模型拉取失败仍可手填模型 |
| 设置中的提示词为空白 | `custom` 补充提示词允许空白；其他用途确认后恢复对应默认文案，非空正文保留空格与换行 |
| 已保存旧版默认提示词 | 仅逐字匹配旧默认内容时迁移到独立条目默认提示词，用户编辑过的内容原样保留 |
| 连续提交独立需求 | 旧讨论不再作为设计上下文累加；被替换且未保存过的非空草稿逐字留为版本 |
| 返回、切换顶级页或关闭设置编辑页 | 放弃未确认的 API 和提示词草稿；已确认的配置与提示词继续保存 |
| 试写期间改变版本 | 结果仍关联请求开始时的版本 |
| 取消生成 | 保留已完成样本及多份设计的有效版本，清空忙碌并忽略迟到答复；独立主副 API 均传 AbortSignal，主 API 同批全部实际结束后才释放占用，静默聊天请求等待宿主结束 |
| 答复格式不正确 | 原始答复保留在讨论，既有草稿不改动 |
| 未评价或修改意见为空 | 阻止按反馈修改；评价可以单独保存 |
| 引用不属于该次正文 | 拒绝保存，保留此前反馈 |
| 当前版本与反馈来源不同 | 按试写记录的 `versionId` 使用原版本 |
| 历史反馈修订时当前需求为空 | 按原试写版本和已保存人工反馈修订，普通设计仍要求当前需求非空 |
| 保存调用失败 | 保留内存内容并提示导出；后续保存成功清除对应旧错误 |
| 读取保存内容失败 | 显示错误，仍可编辑和导出 |
| 当前预设为空或不在可用列表中 | 初始化保留空条目，不自动读取列表第一项；读取失败仍可编辑草稿 |
| 预设读取或刷新 | 不覆盖草稿，也不持久化临时预设状态；重新读取解除草稿的条目来源绑定 |
| 复制预设 | 复制完整已保存快照，包括提示词、开关、顺序与其他设置；未保存输入仍留在原预设编辑器中，需要带入副本时先保存 |
| 复制时没有有效选择、目标已删除或保存失败 | 无有效选择时禁用按钮；宿主拒绝缺失目标，保存失败保留原选择、条目及草稿来源 |
| 复制期间再次写入或取消 | 与条目写回共用保存锁及 `preset-save` 忙碌状态，拒绝重复写入，不将保存显示为已撤销 |
| 展示页多条同时编辑 | 保存一条保留其他条目的输入和原文基线；保存期间继续输入、包括改回旧原文，也不被返回结果覆盖 |
| 展示页明确重读或切换预设 | 成功后更新基线并保留本地编辑；读取失败保留原预设名称、列表与基线；刷新酒馆页面会清除未提交编辑 |
| 直接保存与草稿来自同一条目 | 仅来源仍相同、原文基线匹配且草稿等于本次保存正文时同步来源基线；其他草稿保持原样，后续写回继续校验冲突 |
| 条目载入与保存 | 标记条目不能载入或写回；保留正文空白并允许清空；目标缺失、标识重复或原文已变化时拒绝写回 |
| 原版编辑与测试版预览 | 未保存的原版输入保留，切换来源只读预览测试正文；先保存原版修改才允许应用 |
| 应用测试版后重新读取或刷新页面 | 原文及已应用正文快照随工作记录保存；重新读取保留原文，版本删除也不清除恢复信息 |
| 已应用正文被酒馆外部修改 | 保留原版快照，来源列表增加只读「当前预设内容」；后续写回仍校验当前宿主原文 |
| 条目未加入生效顺序或 `enabled` 缺省 | 读取为关闭；整个角色顺序有效且宿主允许时可开启，首次开启插入该顺序开头 |
| 生效角色顺序缺失、重复或权限不可用 | 开关禁用并提供 `toggleReason`；不猜测酒馆尚未补齐的默认顺序 |
| 开关保存前后角色或目标状态改变 | 提交前拒绝冲突；等待期间保留新的内存修改并返回 `notice`，正文与开关共用保存锁 |
| 预设写回期间发生编辑 | 不支持取消写回；保留期间的草稿与宿主新编辑，切换版本解除草稿来源绑定 |
| 活动预设的目标条目有未保存修改 | 写回前拒绝提交，要求处理酒馆中的修改后重新读取；其他未保存参数保持不变 |
| 预设文件已保存但活动设置保存或列表刷新失败 | 返回成功结果及 `notice`，说明文件已保存并提示在酒馆确认 |
| 预设没有 `prompts` 数组 | 读取失败；存在数组但没有合法条目时返回空列表 |
| 部分历史记录不完整 | 过滤缺少必要字段的记录及找不到原版本的试写 |
| 旧配置与试写记录 | `profileId` 映射到 `secondaryProfileId`；旧试写 `context` 原样恢复，新试写位置区分独立消息与静默聊天入口 |
| 试写期间切换聊天、连接或修改背景 | 保存请求开始时的深拷贝；宿主后续裁剪、宏替换和扩展处理仍由酒馆执行 |
| 宿主没有公开模型、服务地址或世界书选择 | 对应信息为 `null`；不根据已有配置猜测实际值 |
| 本地演示中填写副 API 设置 | 仍返回原有示例；条件的 `source`、连接和位置均标识 `local-preview` |
| 本地演示存储为空或已有旧数据 | 空存储加载原演示需求；旧存储键及记录继续使用，读写错误沿用核心保存错误处理 |

记录位于 `extensionSettings.yakitPromptWorkbench`，经 `saveSettingsDebounced()` 交给酒馆保存。核心按顺序提交完整深拷贝，防止旧保存覆盖新编辑；宿主的防抖保存不提供逐次落盘确认，工作台只能感知读取或调用阶段抛出的错误。

独立演示使用 `localStorage['yakit.prompt-workbench.preview.v1']`，保留历史演示数据，与酒馆设置分开。通过本地静态服务打开 `preview.html`；该入口通过 `preview/preview.js` 复用 `app.js` 和 `shell-template.js`，只使用本地适配器。

持久化内容包括设置、需求、草稿、场景输入、讨论、版本、下次版本编号、测试任务、试写、评分、人工偏好、反馈、选中记录及 `presetPromptOverrides` 原文恢复信息。`designApi/profiles/mainApiLabel/contextLabel/canTrial/canGenerate/presets/selectedPresetName/presetEntries/presetSource/presetOrderCharacterId/busy/error/notice` 不持久化。主题、导航样式与副 API 配置选择立即保存；API 编辑通过页面底部「保存」提交，提示词编辑通过页面底部「确认」提交。场景输入即时持久化；未提交的设计要求、提示词名称、反馈和预设条目编辑框属于视图临时内容；预设未保存编辑不进入工作记录，已应用版本的原文快照会保存及导出。

导出结构为 `{formatVersion: 1, ...savedState}`，其中排除副 API 密钥。预设条目通过独立按钮手动写回；版本可单独删除，未提供工作记录导入或整份记录清空入口。

预设列表、条目和来源不进入工作记录；关闭后重开复用同一弹窗与工作台实例，重新加载页面才清除写回来源。普通设计可继续修改已载入条目的草稿，保存版本保留来源，选择已有版本则解除来源。预设读取不触发工作记录保存，加载工作记录失败时也不会因初始化读取预设而写回空记录。冲突检查基于当前酒馆内存；宿主保存接口不提供跨窗口事务校验。

## 设置与主题

| 字段 | 默认值或含义 |
| --- | --- |
| `theme` | 默认 `forest`（林系风）；另支持 `st`（跟随酒馆）、`light`（浅色）、`dark`（黑灰深色）；缺失或无效值恢复林系风，已有合法选择（包括 `st`）保留 |
| `navigationStyle` | 默认 `auto`（按设备选择位置）；另支持 `top`（上方文字）、`bottom`（下方图标）；缺失或无效值恢复自动，已有合法选择保留 |
| `designApi` | 内部派生的 `main` 或 `secondary`，表示酒馆当前 API 或副 API；不接受 `update` 修改，不持久化 |
| `designCount` | 默认 `1`；正安全整数，允许数字或数字字符串输入，保存为数字；只控制工作台独立设计请求数，不加入 API 设置快照，反馈修订始终一次 |
| `moduleApis` | `{design:'default',scenario:'default',sample:'default',judge:'default'}`；每项可为 `default` 或已保存 API 配置 ID，旧 `main` 值按 `default` 处理 |
| `scenarioText` / `sceneSource` | 空字符串 / `manual`；AI 模式为 `ai`，已有场景会复用 |
| `scenarioPrompt` | 默认空字符串；当前 AI 专用场景提示词，随状态保存与导出；需求、草稿、场景或来源改变时清空关联 |
| `emptyCardMode` | `true`；system 为破限原文加双换行及候选原文，user 为固定场景 |
| `sampleCount` / `sampleRequestMode` | `3` / `parallel`；数量 1—6，`parallel` 表示独立请求，`single` 表示一次真实 n 个结果 |
| `combineDesignScenario` | `false`；仅 AI 场景且设计/场景连接相同时生效，首步合并条目与专用提示词编写，次步生成场景 |
| `testTasks` / `selectedTestTaskId` | 默认空数组 / 空字符串；任务快照及当前任务，空 ID 可查看历史单次试写 |
| `testTasks[].scenarioPrompt` | 本次专用提示词原文，第二步前保存；已有场景仅在输入与当前场景逐字相同时继承，旧记录缺失时恢复为空字符串 |
| `trials[].taskId` / `sampleIndex` | 所属任务及请求序号；旧记录没有这两个字段 |
| `testTasks[].judgement` | 初始 `null`；`{createdAt,results:[{trialId,label,score,reason,violations}]}` |
| `testTasks[].preferredTrialId` | 初始空字符串；用户选择的最喜欢样本 ID |
| `secondaryApiConfigs` | 默认 `[]`；每项含 `id/name/url/apiKey/model/profileId`，密钥不进入导出 |
| `activeSecondaryApiId` | 默认空字符串；当前副 API 配置 ID，空值表示沿用酒馆当前 API；清空选择保留配置列表 |
| `assistPrompts.builtin` | 界面显示为破限提示词，随所有模型生成请求发送；初次测试沿用任务开始时的快照，重评采用最新保存值。默认使用 `NARRATIVE SYSTEM INITIALIZATION` 叙事初始化文案，以 `<\|narrative-end\|>` 结束；已保存文本优先，逐字匹配 `LEGACY_INSTRUCTION` 的旧默认会迁移。重置并确认后采用当前默认值；`action/prompt/explanation` JSON 契约由设计请求单独追加 |
| `assistPrompts.design` | 界面显示为提示词生成与修改提示词；默认按本次需求生成独立条目，仅明确要求时修订指定条目。设计请求第二条系统消息先读取此项，再附加固定 JSON 契约；旧存档缺失或空白时使用默认，编辑仅影响之后发起的请求 |
| `assistPrompts.custom` | 界面显示为补充提示词；默认空字符串，与 `builtin` 合并到设计系统消息，旧正文保留 |
| `assistPrompts.scenario` | AI 编写专用场景提示词的基础引导，三条入口共用；旧默认精确迁移，自定义保留，分阶段输出契约由代码追加 |
| `assistPrompts.judge` | 裁判指令；初次评分采用任务开始时的文案，重评读取最新保存值；解析继续执行原有字段和证据校验 |
| `assistPrompts.feedback` | 人工反馈修订的引导；对应版本、评价、意见和交回正文由代码附加 |
| `assistPrompts.chatScenario` | 当前聊天试写的场景优先引导；空卡请求不附加该内容 |
| `secondarySource` | `profile`；可取 `profile`、`custom` |
| `secondaryProfileId` | 空字符串；连接管理中可用配置的 ID |
| `secondaryUrl` | 空字符串；OpenAI 兼容接口基础地址 |
| `secondaryModel` | 空字符串；自定义模型名或酒馆连接的模型覆盖值 |
| `secondaryKey` | 空字符串；随酒馆设置保存，导出时剔除 |
| `goal` / `draft` | 空字符串；编辑和保存保留原始空白 |
| `versions[].label` / `number` | 手动填写或自动生成的名称与稳定正整数编号；自动名称为「预设条目名称-number-YYYYMMDD」，名称可改，编号在整个工作记录中递增 |
| `nextVersionNumber` | 默认 `1`；下次保存使用的编号，删除版本不回退，恢复时至少高于所有现存编号 |
| `profiles` | 环境提供的真实连接列表，条目为 `{id, name}` |
| `presets` / `selectedPresetName` | 临时预设列表与选中名称；初始化采用酒馆当前聊天补全预设 |
| `presetEntries` / `presetSource` | 临时条目列表与草稿来源 `{presetName, identifier, name, content}`；初始为空数组 / `null` |
| `presetOrderCharacterId` | 临时生效角色顺序 ID，字符串或 `null`；开关保存时用于校验读取目标 |
| `presetPromptOverrides` | 默认 `[]`；每项 `{presetName, identifier, originalContent, appliedContent, versionId}`，保存及导出原文恢复信息 |
| `mainApiLabel` | 当前酒馆 `mainApi`，仅用于展示 |
| `contextLabel` | 当前角色或群组名及聊天 ID；无聊天时显示提示 |
| `canTrial` | 已选角色或群组、具备静默生成接口且主 API 非断开状态时为真 |
| `canGenerate` | 存在聊天补全或文本补全独立请求服务；与是否选择角色和主 API 在线状态分开 |
| `feedback.status` | 新试写为 `pending`；评价为 `satisfied` 或 `revise` |
| `feedback.note` / `excerpt` | 默认空；提交时去除首尾空白，引用须属于该次正文 |

设置字段统一在核心校验，未知字段和非法枚举拒绝更新。各模块的 API 完整性在发起操作时检查，允许先保存未填完的配置；连接 ID、地址、模型和密钥全部为空时沿用酒馆当前 API，半填配置及失效 ID 要补全或重新选择。正文连接由 `moduleApis.sample` 决定。

设置一级页提供默认收起的「界面设置」「副 API」「模块 API」「内置提示词」分组。副 API 选择框始终提供「留空，沿用酒馆当前 API」，下方列出已存配置卡片；新增后立即选中，编辑保留 ID、列表位置，编辑非激活项不改变当前连接。清空选择保留全部配置并在重载后继续留空；删除激活项后选择剩余首项，删除最后一项沿用酒馆当前 API。四个模块提供沿用选项及已保存配置。选择和编辑同步 `secondary*` 旧字段，旧 `update` 调用修改这些字段时也同步当前列表项；请求路由始终按连接字段派生。

API 和提示词编辑共用二级滑动轨道，使用主页的 240ms 动效；一级、二级独立滚动，非当前页设为 `inert` 与 `aria-hidden`。两类编辑卡片占满可用高度，编辑区独立滚动，底栏常驻：API 页左侧返回与删除、右侧保存，新建时隐藏删除；七类提示词页左侧返回与重置、右侧确认。操作按钮由设置模板创建，打开 API 编辑时移入对应底栏，离开时移回提示词底栏，沿用原事件和禁用状态；进入编辑页时对应编辑区滚动归零。

API 表单读取酒馆连接并回填地址、可读取密钥和模型，模型列表通过宿主状态接口拉取；填写自己的地址或密钥会解除原连接引用。返回保留滑出画面，下次进入重新读取已保存内容；切换顶级页或关闭时清理草稿。提示词入口按已保存正文、编辑页按当前草稿逐字比较默认内容，偏离时标红并显示「已修改」；重置只改草稿，确认才保存。

常驻导航依次提供预设预览、工作台、试写与反馈、版本记录、设置五个页面，页面轨道采用相同顺序；上方显示文字，下方显示图标并保留可访问名称。工作台在宽屏将左侧需求输入与生成操作、右侧修改讨论等宽等高铺满可用区域，小屏上下排列；五页共用随宿主视口调整大小的窗口，正文独立滚动。主题、控件与微动效规范与 YaKit 纪实保持一致，样式保存在本仓库。

生成按钮旁的原生数量输入沿用现有字段样式，输入中允许暂时清空，合法值变更及提交前保存；提交与生成期间禁用，避免重复发起。

自动导航由设置视图读取所属文档的 `navigator`：`userAgentData.mobile` 为真、UA 含 `Android/iPhone/iPad/iPod/Mobile`，或 UA 含 `Macintosh` 且 `maxTouchPoints > 1`（iPadOS）时使用 `bottom`，其余使用 `top`。手动选择直接使用对应位置；自动模式始终保存并选中 `auto`，渲染时才写入现有 `data-navigation-style`，共用原有样式与切页动画。窗口缩放和手机横竖屏切换不改变设备分类；触屏 Windows 电脑保持上方导航。

| 界面项 | 当前规则 |
| --- | --- |
| 窗口尺寸 | 宽度 `calc(100vw - 24px)`，高度 `calc(100dvh - 24px)`；五页共用，四周各留 12px，随宿主视口变化同步调整 |
| 顶栏与卡片 | 顶栏高 56px，关闭按钮为 32px；窗口圆角 20px，卡片圆角 12px |
| 页面分区 | 五页省去重复的分区标题行，通过 `aria-label` 保留区域名称；预设条目数和版本数显示在选择框标签中，「版本记录」工具栏提供「导出工作记录」，通过常驻导航进入「工作台」编辑或「试写与反馈」试写 |
| 版本记录工具栏 | 视口宽度 ≥960px 时，左侧上下排列版本选择和名称输入，右侧在导出按钮下方并排放置保存名称与删除提示词；小于 960px 时依次竖排，按钮可换行。正文区域直接展示提示词原文 |
| 工作台双栏 | 视口宽度 ≥960px 时，两栏使用 `repeat(2,minmax(0,1fr))` 等宽铺开并拉伸至页面可用高度；左侧需求框填充剩余空间，补充要求与操作保持自然高度；右侧讨论列表使用标题下方的剩余空间并独立滚动。小于 960px 时上下等分，内容超高时各区独立滚动 |
| 设置编辑底栏 | API 页左侧返回与删除、右侧保存，新建时隐藏删除；提示词页左侧返回与重置、右侧确认。编辑区滚动时底栏常驻，按钮沿用主页尺寸、主题和按压反馈 |
| 操作按钮 | 讨论结果的查看、复制、写回和保存版本并排显示，窄屏自然换行；查看箭头共用原折叠旋转效果。复制、引用、刷新、导出及取消共用次按钮；主操作沿用主按钮，关闭按钮显示主题底色和边框；五页通过常驻导航切换 |
| 文本输入框 | 五页共用文本输入样式，聚焦时通过原有边框变色提示，不显示外圈高亮；按钮、下拉框、复选框和单选项保留键盘焦点提示 |
| 数字输入框 | `.yakit-workbench` 内所有 `input[type="number"]` 隐藏浏览器原生上下步进按钮，直接输入数值；保留数字类型及 `min`、`max`、`step` 校验 |
| 复选框 | 「空卡模式」「按 AI 分数排序（允许并列）」及设置中的「合并生成」共用 `styles/pages.css` 的 `.test-toggle input` 原生样式；重置宿主自绘伪元素、网格、变换与滤镜，保持 16px 尺寸、主题强调色、原生键盘操作、焦点及禁用状态 |
| 展开与反馈 | 原生 `summary` 与单选项共用按钮外观；折叠标题保持尺寸稳定，使用悬停颜色与展开箭头反馈，箭头跟随 `details[open]`；设置标题始终预留 1px 下边框，展开只切换边框颜色；反馈选中态跟随 `input:checked`，键盘焦点清晰可见 |
| 页面留白 | 默认上下 20px、左右 24px；浏览器视口不超过 480px 时为 14px |
| 切页 | 五页常驻同一轨道，正文与导航指示器同步平移；240ms，`cubic-bezier(0.16, 1, 0.3, 1)` |
| 窗口进退场 | 240ms 淡入或淡出，缩放从或至 0.98；关闭按钮、Esc、遮罩共用退场函数 |
| Toast | 底部居中，距底部 24px，间隔 8px；内边距 10px / 18px，圆角 12px，字号 13px；停留 2300ms 后淡出，300ms 后移除 |
| 减少动态效果 | 停用过渡与动画，关闭直接完成 |

顶栏固定留在正文上方，显示入口图标、「预设工作台」标题和关闭按钮；另保留仅供读屏的当前页面名称。API 编辑页在卡片底部提供返回、删除和保存；提示词编辑页在卡片底部提供返回、重置和确认。导航常驻于设置选择的上方或下方，上方长页签显示省略号，下方图标保留读屏名称和 `title`。切页通过 `inert` 和 `aria-hidden` 隔离非当前页，不重建工作内容并保留滚动位置，设置编辑草稿按上文规则清理。页签支持左右方向键、Home、End；程序切页聚焦目标页。当前页只保留在本次工作台实例，重新加载后回到工作台。Esc 尊重控件已取消的事件，展开的原生下拉优先关闭选项；旧浏览器无法判断下拉展开状态时，焦点位于下拉框内由系统处理 Esc。遮罩关闭要求按下与松开均位于窗口外，退出期间再次打开会清除待关闭状态。

主题由所属 `.yakit-workbench` 容器的 `data-theme` 控制；`st` 模式直接继承酒馆的 `--SmartThemeBodyColor`、`--SmartThemeBlurTintColor`、`--SmartThemeChatTintColor`、`--SmartThemeBorderColor`、`--SmartThemeQuoteColor`、`--SmartThemeEmColor` 和 `--mainFontFamily`。主题切换只更新工作台容器，不修改酒馆根元素，也不创建主题监听器。林系风、浅色与纪实一致，深色使用黑灰背景及浅灰强调色。全部页面与控件选择器限定在 `.yakit-workbench` 内，菜单入口使用独立 ID；控件 ID、标签关联及单选组名统一带 `yakit-wb-` 前缀，避免和酒馆或其他插件共用标识。

按钮沿用主页的圆角、间距、150ms 颜色过渡与按下缩放，禁用态继续由原有状态控制。设置页的「配置 API」按钮位于「使用配置」选择框右侧，两者同高对齐。预设条目名称可换行，操作按钮行空间不足时自动换行。非提交按钮显式使用 `type="button"`；设计表单由提交按钮触发，API 编辑由底栏保存，提示词编辑由底栏确认。折叠入口保留原生 `details/summary`，反馈和导航位置保留原生单选输入，键盘操作由浏览器处理。

设置、预设、版本和试写记录共用原生 `select`。下拉框外边距固定为零，控件间距由所在布局控制，优先于宿主主题的外边距设置。支持 `appearance: base-select` 与 `::picker(select)` 时，弹层跟随控件宽度、限制在浏览器视口内，最高为 `min(320px, 60dvh)`，超长名称换行、过多选项滚动；背景取 `--paper` 的不透明颜色，选中、悬停与焦点使用主题变量，入场为 160ms 淡入与 4px 位移。原生键盘选择、表单提交和动态连接选项保持原有行为。不支持该特性时使用系统选单，并提供选项文字和背景色；系统可能忽略部分样式。

共用弹层设置 `position-try-order: normal`，覆盖浏览器默认的 `most-block-size` 排序，保留默认下方定位与溢出回退：下方空间足够时向下展开，放不下时再由浏览器尝试其他位置。依据见 [HTML 原生下拉样式](https://html.spec.whatwg.org/multipage/rendering.html#the-select-element-2) 与 [CSS 回退顺序](https://drafts.csswg.org/css-anchor-position-1/#position-try-order-property)。人工验收时检查下方足够但上方更宽敞、靠近视口底部和长列表三种情况；系统选单的展开方向由浏览器或操作系统控制。

`select-view.js` 在工作台根节点委托 `pointerdown`，覆盖各页和动态新增的下拉框，卸载时移除监听。浏览器支持 `base-select` 和 `:open`，且主触点再次按下已展开、启用的 `select` 本身时，取消默认事件，阻止兼容鼠标按下在原生弹层收起后重新打开列表；实际外观为系统选单时跳过。选项及分组、鼠标、触控笔、键盘和 `input/change` 仍走原有处理。取消主 `pointerdown` 抑制兼容鼠标事件的依据见 [Pointer Events 规范](https://www.w3.org/TR/pointerevents/#compatibility-mapping-with-mouse-events)。

`controls.css` 仅为「预设预览」页及其内部控件、可样式化选项弹层保留细滚动条与透明轨道：悬停或焦点进入时显示滑块，触屏常显；浅色使用中性灰，其他主题由强调色生成滑块色。支持 WebKit 滚动条伪元素时宽高均为 4px，其余支持标准属性的浏览器使用 `thin`。基础与触屏滑块规则分别指定 `:vertical`、`:horizontal`，优先于酒馆及自定义主题的方向规则；刷新按钮禁用或失焦后，滑块仍使用工作台的颜色、圆角和阴影规则。悬停、焦点及触屏着色与基础规则优先级相同，按声明顺序生效。标准颜色的状态选择器使用 `:where(:hover,:focus-within)`，让 WebKit 分支的 `scrollbar-color:auto` 始终覆盖它，避免悬停或聚焦时切回原生宽滚动条；共用 `.page-frame` 设置 `scrollbar-gutter:stable`，在内容由不溢出变为溢出时保留滚动槽。其他页面正文、讨论区、文本框、设置子页和可样式化选项弹层隐藏滚动条，保留原有溢出与滚动行为；系统选单由浏览器或操作系统控制。

Toast 根节点 `#yakit-wb-toast-root` 位于工作台弹窗或预览容器中，通过绝对定位显示在容器底部，五页共用，不挤占正文也不拦截点击。提示以纯文本写入并通过 `aria-live="polite"` 播报；正常、提醒和错误继续使用现有主题色、黄色和红色。最大宽度为容器减 28px，长文本换行，入场位移 12px、过渡 300ms；卸载时移除节点并清理帧与计时器。剪贴板回退文本框和下载链接同样临时创建在当前工作台容器内。

## 公开 API

当前未发布供其他插件消费的稳定 API。以下为酒馆同一文档内的宿主适配、组件及控制器契约。

| 接口 | 职责 |
| --- | --- |
| `YaKitWorkbenchHost.getContext()` | 返回酒馆当前上下文、生成与背景只读查询；`refreshPresetEditor()` 刷新预设列表，`getPresetPromptContext()` 返回 `{characterId,isToggleAllowed(entry)}`，`getApiProfileResources()` 异步提供酒馆的 `{proxies,findSecret,SECRET_KEYS,chat_completion_sources,textgen_types}` |
| `YaKitWorkbench.createApi(getContext)` | 返回 `{design,trial,prepareTrialSettings}` 模型请求适配器 |
| `YaKitWorkbench.createApiProfiles(getContext)` | 创建连接解析、回填和模型列表接口，返回 `{resolveApiProfile, readApiProfile, fetchApiModels}` |
| `YaKitWorkbench.resolveProfileApi(context, profile)` | 同步返回有效的 `CONNECT_API_MAP` 项；省略 API 时按当前类型及配置中的预设解析，不可用或不支持时返回 `null` |
| `YaKitWorkbench.createPresets(getContext)` | 创建聊天补全预设列表、读取、试作复制与条目写回适配器 |
| `YaKitWorkbench.createSillyTavernHost(getContext)` | 创建保存、环境、模型及预设适配器 |
| `YaKitWorkbench.createLocalHost()` | 创建原有示例请求与独立浏览器存储适配器，仅预览入口加载 |
| `YaKitWorkbench.captureTrialContext(host, options, scenario)` | 同步深拷贝聊天模式的连接、注入参数和背景条件 |
| `YaKitWorkbench.captureIsolatedContext(host, settings, messages, mode, count, preparedConnection?)` | 返回独立请求连接与消息快照；主连接可采用已固定的连接记录，不读取角色、世界书或聊天元数据 |
| `YaKitWorkbench.createWorkbench(host)` | 恢复记录、读取环境并返回控制器 |
| `YaKitWorkbench.state.apiRoute(settings)` | 连接 ID、地址、模型和密钥全部为空白时返回 `main`，否则返回 `secondary`；完整性由 `designSettings` 检查，沿用酒馆时统一空连接快照 |
| `mountApp(container, host)` | `app.js` 的 ES 导出；向容器内的 `#yakit-wb-app` 挂载工作台，返回释放视图、焦点及重开监听的函数 |
| `mountLauncher(mount)` | `ui/launcher.js` 的 ES 导出；创建唯一原生弹窗，首次打开等待 `mount(container)`，成功后复用实例，失败后可重开重试 |
| `YaKitWorkbench.mountWorkbench(controller, root)` | 显式传入 `#yakit-wb-app`，挂载五页工作台，返回订阅、设置事件、下拉与 Toast 清理函数 |
| `YaKitWorkbench.createToast(document, container = document.body)` | 在指定容器创建轻提示，工作台传入自己的弹窗，返回 `{show, dispose}`；`show(message, {type, durationMs})` 默认 `success` / 2300ms，另支持 `warning` 和 `error`，卸载后调用不再显示 |
| `YaKitWorkbench.mountPresets(controller, root, {run, openPage})` | 绑定预设选择、复制、明确重读与草稿写回控件，返回 `{render}` |
| `YaKitWorkbench.mountPresetEntries(controller, root, {run, openPage})` | 绑定全部条目的编辑、逐条保存与草稿载入，返回 `{render, rebase}`；`rebase(state)` 在明确重读成功后更新原文基线 |
| `YaKitWorkbench.mountNavigation(root, {onPageChange} = {})` | 返回 `{openPage}`，绑定五页常驻导航；切页回调用于清理设置草稿，从所属工作台容器读取读屏页名并管理焦点 |
| `YaKitWorkbench.mountVersions(controller, root, {run})` | 返回 `{render, title}`，负责版本名称同步、选单、详情及同页删除确认，`title(version)` 返回名称和后置编号 |
| `YaKitWorkbench.mountTheme(controller, container)` | 返回 `{sync, dispose}`；仅更新容器的 `data-theme`，酒馆主题变量直接继承，`dispose` 保留空操作契约 |
| `YaKitWorkbench.mountTrials(controller, root, {run, notify, versionTitle})` | 返回 `{render}`；绑定场景、任务、评分、人工偏好和原有反馈控件 |
| `YaKitWorkbench.mountJudgement(controller, root, {run})` | 返回 `{render}`；`render(task,trial,trials,busy)` 展示需求、排名及证据，并返回按样本 ID 索引的排名文字 Map |
| `YaKitWorkbench.scenarios` / `.testTasks` | 场景与模块设置解析、任务恢复和采样盲评动作 |
| `YaKitWorkbench.scenarios.generate(host, options)` | `options` 含 `goal/content/assistPrompts/settings/signal`；顺序编写提示词、等待 `onPrompt(prompt)` 保存再执行场景，返回 `{scenarioPrompt,scenario}`。传入非空 `scenarioPrompt` 可执行已有 AI 编写结果；`isActive()` 或 signal 判断取消，取消返回 `undefined`，其他错误抛出 |
| `YaKitWorkbench.scenarios.promptMessages(...)` / `.messages(...)` | 参数均为 `goal,content,assistPrompts`，分别编写和执行专用提示词；执行另需第四参数 `scenarioPrompt`，空值报错 |
| `YaKitWorkbench.judgement` | `{instruction,parse,restore}`；裁判指令、新答复严格校验及新旧评分恢复 |
| `YaKitWorkbench.promptDefaults` / `.promptText(assistPrompts, kind)` | 七类默认文案及已保存值读取；非法类型名报错，缺失值采用默认，非 `custom` 空白值也采用默认 |
| `YaKitWorkbench.state` / `.prompts` / `.settings` | 状态校验、保存快照、设计消息、答复解析、配置恢复与设置操作 |

| 控制器方法 | 参数与结果 |
| --- | --- |
| `getState()` | 返回完整状态深拷贝，外部改动不写回核心 |
| `subscribe(listener)` | 状态变化时提供快照，返回取消订阅函数 |
| `refreshEnvironment()` | 更新连接列表、主 API 类型与当前聊天信息 |
| `refreshPresets()` | 更新可用预设列表；未选择时补入酒馆当前预设名，不重读已有条目 |
| `readPreset(name)` | 读取指定预设条目，更新名称并解除草稿来源绑定，保留草稿正文 |
| `loadPresetEntry(identifier)` | 将非标记条目的原文载入草稿，记录写回来源并清除选中版本 |
| `copyPreset()` | 复制当前选中的已保存预设；成功更新列表并切换到副本、解除草稿来源绑定，保留草稿正文 |
| `savePresetEntry()` | 按来源和原文快照手动写回当前草稿；成功后更新条目和来源快照 |
| `savePresetContent(identifier, content, expectedContent)` | 保存当前选中预设的唯一非标记条目；正文及原文必须为字符串，允许空白或清空；成功更新条目，不替换草稿或选中版本 |
| `applyPresetPrompt(identifier, versionId, expectedContent)` | 将已保存版本写入唯一非标记条目，保存首次替换前的原文；空版本 ID 恢复原版，成功后更新条目与恢复记录 |
| `setPresetEntryEnabled(identifier, enabled)` | 开关必须为布尔值，条目必须可切换；用读取时状态与角色顺序校验，成功更新条目列表 |
| `update(fields)` | 原子校验并更新允许编辑的字段 |
| `saveApiConfig(fields, id = '')` | 保存 `{name,url,apiKey,model,profileId}`；空 ID 新增并激活，非空 ID 更新已有项 |
| `selectApiConfig(id)` | 选择已保存的副 API；空字符串清空当前选择并保留配置列表，非空目标不存在时拒绝操作 |
| `deleteApiConfig(id)` | 删除已保存的副 API，目标不存在时拒绝操作；删除激活项后选择剩余首项，删空后沿用酒馆当前 API |
| `getPrompt(kind)` | 同步返回 `{text, defaultText}`；`kind` 支持 `builtin/design/custom/scenario/judge/feedback/chatScenario` |
| `savePrompt(kind, text)` | 保存对应环节的提示词；`custom` 允许空白，其他项空白确认后恢复默认；修改仅对之后发起的请求生效 |
| `readApiProfile(profileId)` / `fetchApiModels(fields)` | 透传宿主配置读取和模型列表能力，返回值见下表；失败由设置编辑页显示 |
| `design(instruction)` | 按开始时的 `designCount` 并发请求独立条目，明确修订时修改当前条目；多份逐个存版本，全部结束后按请求顺序选第一份有效结果，成功替换前自动留存未保存旧稿；两类自动保存按开始时载入的条目名称、全局版本编号和本地保存日期命名；部分失败拒绝 Promise 并保留有效结果 |
| `saveVersion(label)` | 保存草稿为独立版本，生成稳定 `number` 并递增 `nextVersionNumber`；名称去除首尾空白，空名称使用「未命名提示词」 |
| `selectVersion(id)` | 选择版本并恢复到草稿，解除此前预设来源绑定 |
| `renameVersion(id, label)` | 只修改目标名称；空白名称、目标不存在或忙碌时拒绝 |
| `deleteVersion(id)` | 删除目标及关联测试任务、试写、评分、反馈，清除被删除的选中 ID，保留草稿、预设来源和其他记录；目标不存在或忙碌时拒绝 |
| `generateScenario()` | 根据原始需求和草稿先编写专用提示词并保存讨论，再生成场景；成功同时更新场景及专用提示词并设 AI 来源，期间编辑保护不覆盖 |
| `trial(input = scenarioText)` | 自动创建任务并执行必要场景生成、固定输入、采样及盲评；失败或取消保留已完成样本 |
| `selectTestTask(id)` | 选择任务及其首个样本；空 ID 选择历史单次试写 |
| `judgeTestTask(id)` | 使用当前裁判 API 重评已有样本，保留正文、反馈与人工偏好 |
| `preferTrial(trialId)` | 将任务内样本设为用户最喜欢的结果 |
| `selectTrial(id)` | 选择试写并同步所属任务；历史试写清空任务选择 |
| `setFeedback(id, {status, note, excerpt})` | 校验并保存人工反馈 |
| `reviseFromFeedback(id)` | 根据该次试写原版本和已存反馈修订，始终请求一份结果 |
| `cancel()` | 取消生成或忽略迟到的预设读取结果；读取取消不保存工作记录，预设写回期间不执行取消 |
| `exportData()` | 同步返回排除密钥的 JSON 字符串 |

除 `getState`、`subscribe`、`getPrompt`、`exportData` 外，以上操作返回 Promise；状态修改失败时更新 `state.error` 并拒绝 Promise，连接与模型读取错误由编辑页接收。编辑先同步更新内存，再等待宿主保存调用完成。

| 宿主适配器方法 | 参数与结果 |
| --- | --- |
| `loadState()` | `Promise<object\|null>`，返回酒馆保存记录 |
| `saveState(data)` | `Promise<void>`，更新扩展设置并触发防抖保存 |
| `getEnvironment()` | 返回 `{profiles, mainApiLabel, contextLabel, canTrial, canGenerate}` |
| `resolveApiProfile(profileId)` | 仅酒馆适配器提供，返回 `{context,profile,api,payload,model}`；`payload` 只含连接字段，可能含代理凭据或自定义请求头，仅供当前请求使用 |
| `readApiProfile(profileId)` | 返回 `{name,url,apiKey,model,profileId,usesProfileSecret}`；无法显示密钥、需要原生来源或额外连接参数时保留连接引用 |
| `fetchApiModels({profileId,url,apiKey,model})` | 返回去重的模型名称数组；空列表或请求错误时拒绝 Promise，模型可手填 |
| `listPresets()` | 返回 `{presets: [{name}], selectedPresetName}`；未提供预设管理器时返回空列表与空名称 |
| `readPreset(name)` | 返回 `{name, entries, orderCharacterId}`；条目含 `identifier/name/content/marker/enabled/toggleable/toggleReason` 和可选 `role`，按生效角色顺序排列 |
| `copyPreset(presetName)` | 完整深拷贝指定已保存预设并按试作编号保存，返回 `{name, entries, orderCharacterId, presets}`；调用原生保存流程更新酒馆列表并选中副本，失败拒绝 Promise |
| `savePresetEntry({presetName, identifier, content, expectedContent})` | 校验原文后只写目标内容，返回更新后的条目及可选 `notice`；不切换酒馆预设 |
| `setPresetEntryEnabled({presetName, identifier, enabled, expectedEnabled, expectedOrderCharacterId})` | 校验布尔开关与原状态，可选角色 ID 校验；只保存目标开关，返回 `{name, entries, orderCharacterId, notice?}` |
| `design(messages, {settings, signal, purpose = 'design'})` | `Promise<string>`；用途为 `design/scenario-prompt/scenario/judge`，host 不附加提示词；主 API 仅共享同一非空 signal 的 design 请求可同批并发，其他用途或不同 signal 仍独占。设计 JSON 为 `{action,prompt,explanation,scenarioPrompt?}`，合并模式必须含 `scenarioPrompt`；独立提示词编写与场景执行均返回纯文本，评分 JSON 为 `{requirements,results}` |
| `prepareTrialSettings(settings)` | 同步返回本轮设置副本，主连接请求参数保存在适配器内部 WeakMap；同轮各次 `trial` 必须传回同一个对象，不能深拷贝后转交或跨适配器复用。本地演示可省略该方法 |
| `trial({content,input,emptyCardMode,sampleCount,sampleRequestMode,builtinPrompt?,chatScenario?}, {settings,signal})` | 返回 `{content,context,samples:[{content,context}]}`，顶层对应首样本；候选保留原始空白，场景去首尾空白。`builtinPrompt` 是调用开始时固定的破限原文，缺失、空白或非字符串时采用默认；空卡 system 和聊天 quietPrompt 都先拼接破限原文及双换行。`chatScenario` 仅用于聊天模式，缺失或空白采用默认，调用开始后固定；旧调用不带模式字段时保留单份聊天试写 |

预设适配器方法均返回 Promise。通过 `getPresetPromptContext()` 读取 Prompt Manager 的实际顺序策略；全局策略取 `configuration.promptOrder.dummyId`（当前酒馆为 `100001`），角色策略取 `activeCharacter.id`。条目优先按该角色的 `prompt_order` 排列，未列入的依次附在后面；读取不修改顺序。`enabled` 与酒馆一样按引用值的真假判断，未引用或缺省为关闭；`toggleable` 同时校验唯一条目、唯一顺序引用和 `isPromptToggleAllowed`。`marker: true` 不可编辑或替换正文，允许开关的标记条目仍可切换。保存的 `expectedContent` 是宿主原文基线，`content` 允许清空且保留首尾空白；原版编辑基线与宿主当前测试版基线分别保存。

`messages` 条目为 `{role, content}`，role 取 `system/user/assistant`；`settings` 为基础设置与已选 API 扁平字段的独立快照，提示词在 `messages` 中。连接请求关闭配置预设和 instruct，设置模型非空时通过 `sendRequest` 第五参数覆盖模型；自定义接口按所填地址、模型、密钥请求，不读取酒馆已有自定义接口密钥。

### 试写条件

`context` 随每份试写保存、恢复并导出；普通设计与盲评不附带这些条件。任务在请求前建立，样本在成功返回后逐份建立；后续失败或取消不会删除已完成的样本。

空卡记录为 `{source,capturedAt,connection,emptyCardMode:true,scenario,sampleRequestMode,sampleCount,injection,chat,explanation}`。`injection` 含 `entryPoint:'isolatedRequest'`、`placement:'messages'`、`role:'system'`、含破限与候选原文的 `prompt` 和实际 `messages`；`chat` 仅含零条数、零正文长度，主连接 `preset` 为 `null`。连接地址移除认证与查询信息，不记录密钥。主文本补全服务会将独立消息正文按顺序拼接，原生协议没有 role 字段；不启用 instruct 模板。

下表描述关闭空卡后的聊天模式及旧试写记录：

| 字段 | 含义与边界 |
| --- | --- |
| `source` / `capturedAt` | 宿主为 `sillytavern`，演示为 `local-preview`；时间为请求开始时的 ISO 字符串 |
| `api` / `chatId` / `character` / `groupId` / `scenario` | 保留既有字段；宿主场景为本次输入，角色是请求开始时选中的角色 |
| `connection.api` / `source` / `model` | 当前主 API、供应商或后端类型、模型；无法读取时为 `null` |
| `connection.preset` / `profile` | 当前预设名、选中的连接配置 `{id, name}`；手动调整后的实际来源和模型以其他连接字段为准 |
| `connection.endpoint` / `maxContext` | 当前服务地址及宿主当前 API 的上下文上限（扣除答复长度前）；地址移除用户名、密码、查询参数和片段，不采集认证头 |
| `injection.entryPoint` / `placement` | `generateQuietPrompt`；Chat Completion 为 `controlPrompts:last`，Text Completion 为 `chat:depth-0` |
| `injection.role` / `depth` | Chat Completion 默认 `system`，有启用的静默条目时读取其角色覆盖；instruct 为 `system`、普通文本为 `null`；入口默认聊天末端深度为 0 |
| `injection.promptManagerOverride` | 启用且可由 `quiet` 触发的 `quietPrompt` 条目中的角色、注入位置、深度和优先级；未配置时为 `null`，不执行条目宏 |
| `injection.prompt` / `quietToLoud` / `skipWIAN` | 实际传入的破限提示词、候选、聊天引导与本次场景；固定 `false` / `false`，由宿主组装聊天背景、世界书和作者注释 |
| `injection.instruct` / `instructSystemSameAsUser` | 当前文本格式设置及 system 是否沿用 user 模板；非 instruct 时后者为 `null` |
| `chat` | 裁剪前聊天条数、正文字符数、用户名、角色 ID/头像、群组名、成员及禁用成员 |
| `chatMetadata` | 只保留 `scenario`、`world_info`、`note_prompt`、`note_interval`、`note_depth`、`note_position`、`note_role` |
| `authorNote` | 请求开始时的 `note_*` 和已登记作者注释的 `value/position/depth/scan/role` |
| `worldInfo` | 全局选择、角色主世界书和附加世界书、聊天绑定及用户角色绑定；桥不可用时全局选择为 `null` |
| `explanation` | 供已有试写说明位置显示的连接、位置与聊天条数摘要 |

这些是请求开始时的条件，不是最终请求的完整副本：不重复保存聊天全文，也不捕获世界书实际命中、宿主最终裁剪结果或群组生成时选定的成员。群组成员列表和请求开始时的角色选择均保留。宿主仍可在生成事件中修改请求；记录不能用于保证逐字重放。

本地演示的 `connection`、`injection`、`chat` 仅描述内置示例；实际位置与角色为 `local-preview` / `null`，没有宿主消息注入。`requestedScenario` 保留本次输入，`scenario` 保留示例场景，说明文字明确标记本地演示。

工作台已打开后，在酒馆页面的开发者工具中执行以下只读示例：

```javascript
const api = globalThis.YaKitWorkbench;
const host = api.createSillyTavernHost(globalThis.YaKitWorkbenchHost.getContext);
const saved = await host.loadState();
console.table(api.state.initialState(saved).versions.map(({ id, label, number }) => ({ id, label, number })));
console.log(saved?.scenarioPrompt || '尚未生成专用场景提示词');
const { selectedPresetName } = await host.listPresets();
if (selectedPresetName) console.table((await host.readPreset(selectedPresetName)).entries);
```

在同一页面执行以下示例，会复制酒馆当前预设并切换到试作副本：

```javascript
const presetHost = globalThis.YaKitWorkbench.createSillyTavernHost(globalThis.YaKitWorkbenchHost.getContext);
const presetName = (await presetHost.listPresets()).selectedPresetName;
if (presetName) console.log((await presetHost.copyPreset(presetName)).name);
```

## 当前接入状态

| 项目 | 已实现内容与限制 |
| --- | --- |
| 酒馆入口 | 扩展菜单在原生 `dialog` 中直接挂载组件，首次打开加载，后续复用；`preview.html` 提供离线演示 |
| 主 API 独立生成 | 主聊天补全/文本补全使用独立服务，只传本模块消息；不载入预设正文、宏或聊天组装内容 |
| 副 API 设计 | 支持连接管理配置和自定义 OpenAI 兼容接口，均为非流式请求 |
| 设置 | 多套副 API 新增、编辑、选择、清空选择和删除，连接回填与模型列表；空选择及自动、上方、下方导航持久化 |
| 设计提示词 | 数量默认 1，可自定义正整数并发生成，多份逐个保存版本；模型用 `action` 区分新建与明确修订，每次请求生成单条；破限和补充提示词可编辑，历史讨论仅供展示 |
| 内置提示词设置 | 破限、提示词生成与修改、补充、场景生成、裁判、反馈修订、聊天试写共用编辑、重置、确认与修改标记；破限随所有模型生成请求发送，其余按用途附加 |
| 正文试写 | 默认空卡并发三份，发送破限、候选与场景；关闭后使用主 API 当前聊天逐次生成，`quietToLoud: false`、`skipWIAN: false` |
| 任务与盲评 | AI 或手填场景、1—6 份样本、真实 n 或独立请求；需求清单、违例与疑点证据校验、独立评分和并列排名、失败保留与重评、用户最优选择 |
| 模块连接 | 四模块默认沿用副 API，未填写时使用酒馆当前 API，也可单独指定已保存配置；场景模块执行两阶段，同连接时可将首步专用提示词编写合入条目设计 |
| 冲突场景 | 三条入口均由 AI 按需求编写专用提示词后执行场景，保存提示词与任务场景；模型对逐项要求的覆盖质量待人工判断 |
| 试写条件 | 开始时记录连接、位置、聊天统计、作者注释及世界书选择，保存恢复和导出保持原快照 |
| 独立演示 | 原有两版提示词及正文、独立 localStorage、反馈与取消；不调用真实模型 |
| 版本与反馈 | 原文快照、自定义名称、稳定编号、改名与确认删除、正文引用、准确归因及按反馈修订 |
| 预设条目 | 初始化读取当前已保存聊天补全预设；「预设预览」支持复制试作副本、逐条开关、编辑、原版与测试版搭配应用、原文恢复及草稿写回；独立演示不提供预设接口 |
| 保存与导出 | 使用 `extensionSettings` 与 `saveSettingsDebounced`，支持复制及不含密钥的导出 |
| 尚未接入 | 失败样本的自动续跑、跨任务统一盲评、文本补全单次 n 多样本；工作记录导入或整份记录清空、条目新增/删除/拖动排序及名称/角色编辑、其他类型预设；未提供独立的跨设备同步功能 |
| 取消限制 | 独立主副 API 传入 AbortSignal；当前聊天静默入口不接收独立信号，不调用宿主全局停止接口，等待其结束再释放主通道 |
| 兼容性 | 最低 SillyTavern 1.18.0；依赖上述生成与连接服务、宿主上下文，以及现代浏览器的 structuredClone、crypto.randomUUID、AbortController |
| 验收状态 | 本地契约检查已覆盖核心和适配器；真实主副 API 调用及界面交互待用户人工验收 |

连接列表依赖启用的 `connection-manager`、`extensionSettings.connectionManager.profiles` 和 `CONNECT_API_MAP`。`resolveProfileApi` 校验显式 API；未录入 API 的配置按当前主 API 类型解析，`mode` 与当前类型不同、来源未知或非聊天/文本补全时不列出。命名预设可提供继承来源，列表保留全部可解析配置的 `{id,name}`。独立聊天补全依赖 `ChatCompletionService.processRequest()`，独立文本补全依赖 `TextCompletionService.processRequest()`；连接参数读取 `getChatCompletionModel/getTextGenModel/getTextGenServer`，请求选项不加载生成预设或指令模板。主 API 的连接状态与当前生成状态由宿主实时读取。试写条件还读取 `getMaxContextTokens`、`getPresetManager`、`chatMetadata`、`extensionPrompts`、当前聊天/角色/群组、`powerUserSettings`、世界书模块的 `selected_world_info` / `world_info.charLore`，以及 Prompt Manager 的 `getPromptOrderEntry` / `getPromptById` / `shouldTrigger`。

预设接入依赖 `getPresetManager('openai')` 的 `getPresetList`、`getSelectedPresetName`、`getCompletionPresetByName` 与 `savePreset`，以及 Prompt Manager 的 `configuration.promptOrder`、`activeCharacter.id` 和 `isPromptToggleAllowed`。写回复制已保存预设，只替换目标正文或生效顺序中的开关，调用 `savePreset(name, next, {skipUpdate: true})`；成功后更新内存中对应字段，不切换当前预设。当前活动条目无冲突时同步 `chatCompletionSettings`、触发 `saveSettingsDebounced()` 并通过宿主桥 `refreshPresetEditor()` 调用 `promptManager.render(false)` 刷新列表。保存请求失败前不修改宿主内存。

整份预设复制复用 `savePreset(newName, structuredClone(saved))` 的默认路径，由宿主 `updateList` 注册并选中副本；编号依据调用时的预设名称列表。原预设的已保存对象保持不变，副本的完整字段独立保存。

API 回填、模型列表及副连接请求共用 `resolveApiProfile`。地址与模型优先取连接中已录入的值，再取命名预设和该来源的酒馆设置；自定义请求头、Azure、Vertex、Workers 等连接字段按来源提取。代理优先取命名代理，再取预设；仅在来源一致时沿用当前代理，当前代理密码还要求地址一致。未录入 `secret-id` 时由酒馆使用该来源当前密钥；已录入时保留原引用。密钥类别通过 `chat_completion_sources/textgen_types` 枚举映射到 `SECRET_KEYS`，`findSecret` 不允许显示密钥时返回空值并保留连接引用。原生来源、自定义请求头等额外参数也要求保留引用。所有读取均不改写或切换酒馆连接。

模型列表使用 `getRequestHeaders()` 调用 `/api/backends/chat-completions/status`，与生成使用相同的来源、地址、密钥引用及连接字段；文本补全连接暂不支持模型列表，其他来源是否返回列表由宿主状态接口决定，失败仍可手填模型。独立接口使用归一化的 OpenAI 兼容地址。离线演示只返回固定的示例连接与模型，不访问填写的地址。

## 开发与验证

UI 代码位于 `ui/`、`styles/`、`style.css` 和页面模板；业务代码位于 `core/`、`host/`。修改 UI 不改业务逻辑，修改业务不改 UI；新增注释使用通俗中文。用户可感知功能同步更新 README，模块、数据流和接口变化同步更新本文。

v0.3.12 已通过提示词存取、实际请求、设置和数量生成检查，以及所改 JavaScript 语法与差异检查。覆盖旧记录补齐默认值、自定义内容保存恢复和导出、空白恢复默认、生成与反馈共用引导，以及编辑、重置、确认与修改标记。刷新酒馆后，在「设置 → 内置提示词 → 提示词生成与修改提示词」检查编辑保存及重新打开，再发起生成核对效果；真实模型输出与界面效果由用户人工验收。

v0.3.11 自动命名已通过 31 项相关本地测试、多份生成专项脚本及所改 JavaScript 语法检查。覆盖条目名称快照、全局编号、跨日保存的本地日期、两类自动保存、来源切换及历史记录恢复；酒馆内的名称显示由人工验收。

工作台分栏与逐条操作已通过 7 项相关本地检查，以及所改 JavaScript 语法和差异检查。人工验收时检查宽屏左右分栏、窄屏上下排列，逐条展开和复制正文、保存版本后选中对应结果，以及当前修改稿写回原条目；窗口尺寸、按钮外观和动效沿用现有规范。

v0.3.10 已通过 43 项相关本地测试、数量生成与主 API 并发及独立宿主三个专项脚本、所改 JavaScript 语法和差异检查。检查覆盖两阶段调用、需求与连接快照、合并结果对应、失败取消保留、旧默认迁移及讨论和任务恢复导出。酒馆中由人工切换两组不同条目需求，核对每次专用提示词逐句覆盖当前要求、执行结果形成对应冲突场景，再检查独立生成、空场景创建任务和合并生成三个入口；真实模型输出质量待人工验收。

本地测试由 `.gitignore` 忽略，不随仓库分发：

| 脚本 | 覆盖内容 |
| --- | --- |
| `tests/core.test.mjs` | 版本、反馈归因、正文隔离、取消、格式错误、保存恢复、编辑保护、API 设置快照、密钥导出排除及历史恢复；6 项通过 |
| `tests/design-prompts.test.mjs` | 可编辑生成引导与固定协议、新旧答复解析、历史讨论隔离、反馈目标隔离、精确默认迁移和离线两版设计 |
| `tests/prompt-settings.test.mjs` | 七项提示词存取与导出、空白恢复、补充空白保留、非法类型与旧内容迁移 |
| `tests/prompt-requests.test.mjs` | 生成引导覆盖普通、多份、合并及反馈修订请求，破限覆盖所有生成环节且仅发送一次、三条场景路径、任务内破限快照、最新破限及裁判重评、反馈版本归属、聊天引导和空卡隔离 |
| `tests/scenario-protocol.test.mjs` | 两阶段顺序、提示词执行、设置与破限快照、取消、空答复及旧默认精确迁移 |
| `tests/scenario-pipeline.test.mjs` | 按需求重新编写、讨论与任务提示词保存恢复导出、两阶段失败取消、编辑保护、同场景采样及盲评隔离 |
| `tests/design-entries.test.mjs` | 连续独立条目、旧稿逐字留存和去重、条目名称与本地保存日期、编号、取消与编辑保护、反馈来源隔离、恢复与导出 |
| `tests/design-count.mjs` | 数量校验、保存恢复与导出、同时发起、乱序回复与即时保存、部分失败、保存失败、取消迟到、手动编辑保护、合并场景分步执行与失败保留、单份兼容 |
| `tests/versions-core.test.mjs` | 名称与编号分离、改名保持快照、删除关联清理与草稿保留、忙碌拒绝、旧数据补号、失败后的导出及删空重开 |
| `tests/versions-ui.test.mjs` | 真实控制器与最小 DOM 检查改名输入保留、同名版本区分、确认与取消、切换及忙碌撤销确认、删除后的空态与焦点 |
| `tests/workbench-messages.test.mjs` | 不同讨论结果分别复制和保存、保存名称沿用、展开状态保留、重复保存拦截、来源及当前草稿写回约束、忙碌禁用 |
| `tests/settings-core.test.mjs` | 导航默认值与持久化、配置迁移与编辑、提示词请求与密钥导出排除；空选择重载、四模块回退与旧值迁移、半填与失效配置、等价空连接合并生成 |
| `tests/settings-ui.test.mjs` | API 底栏按钮、空配置选择与模块选项；PC、手机、平板、iPadOS 自动导航与手动覆盖；连接及模型结果过期、密钥解除引用、输入保留与提示词草稿 |
| `tests/api-profiles.mjs` | 省略 API/模型/密钥继承、预设优先级、各来源连接字段与密钥映射、代理配对、模型列表与错误、地址归一及离线演示 |
| `tests/presets-core.test.mjs` | 默认预设、草稿隔离、原文基线、搭配恢复、版本删除、开关失败和真实适配器联接 |
| `tests/presets-host.test.mjs` | 生效顺序、正文与开关冲突、缺引用启用、标记权限、保存锁和等待期间的宿主编辑 |
| `tests/preset-copy.test.mjs` | 完整复制与独立性、试作编号与重名、复制试作、保存失败、并发忙碌与核心状态同步 |
| `tests/preset-display.test.mjs` | 复制按钮及禁用条件、全部条目展示、多条编辑、保存期间继续输入、原文冲突与重读、读取失败及切换后的输入保留 |
| `tests/preset-preview-ui.mjs` | 原版输入保留、只读测试预览、显式应用、删除版本快照、外部修改和开关事件 |
| `tests/st-host.test.mjs` | 多连接列表与刷新、省略 API 的列举及独立请求、来源过滤、持久化与取消边界；不调用真实模型 |
| `tests/trial-record.test.mjs` | 从真实适配器到核心，验证试写期间切换条件后原版本归属、保存恢复与导出 |
| `tests/test-pipeline.test.mjs` | 固定场景、独立/单次采样、匿名评分隔离、取消、部分失败重评、恢复脱敏与偏好 |
| `tests/isolated-host.mjs` | 无角色空卡、真实 n、主副连接、关闭预设及宏、取消、离线场景与评分 |
| `tests/host-parallel.test.mjs` | 主聊天及文本补全三路并发、模型/地址/答复长度固定、条件记录一致、真实 n、取消与聊天串行 |
| `tests/host-design-concurrency.mjs` | 同批主 API 设计并发、不同信号及用途隔离、失败取消时保持占用、最后结束后释放、宿主生成状态检查及副 API 并发 |
| `tests/judgement-core.test.mjs` | 裁判输入隔离、格式与引用校验、新旧评分恢复及导出、重评失败保留评分、部分样本失败与取消 |
| `tests/judgement-ui.test.mjs` | 需求与证据纯文本展示、并列排名、匿名标签更新、样本选择、历史评分与空态 |
| `tests/trial-ui.test.mjs` | 任务/样本切换、评分排序与偏好显示、原始场景；使用真实模块路由显示副 API 名称、空连接回退和半填错误 |
| `tests/preview-host.test.mjs` | 显式宿主挂载、焦点与重开环境刷新及清理、离线两版流程、旧存储恢复、请求快照和取消 |
| `tests/theme.test.mjs` | 容器主题各自生效，宿主根主题保持不变 |
| `tests/navigation.test.mjs` | 页签键盘操作、程序切页、隐藏页隔离与草稿和滚动保留 |
| `tests/launcher.test.mjs` | 唯一弹窗、并发打开只挂载一次、关闭期间加载完成、失败重试、Esc/cancel 与遮罩 |
| `tests/native-styles.test.mjs` | 样式局部化、原生弹窗关闭隐藏、四主题、窗口尺寸与提示层 |
| `tests/select-toggle.test.mjs` | 触屏首次与再次点击的事件处理、鼠标与键盘、选项冒泡、系统选单、禁用、不支持增强和卸载；不模拟浏览器原生弹层 |
| `tests/toast.test.mjs` | 纯文本输出、2300ms 停留、300ms 淡出、状态样式及卸载清理 |
| `tests/toast-routing.test.mjs` | 普通渲染去重、同文案重复操作、订阅与 catch 去重及错误与本地反馈；数量清空重输、非法输入、提交使用最新数量、重复提交与取消后解除禁用 |
| `tests/dialog-motion.mjs` | 退场完成后关闭、重复关闭、重开与减少动态效果 |

在保留本地测试的工作目录运行：

```bash
node --test tests/*.test.mjs
node tests/api-profiles.mjs
node tests/isolated-host.mjs
node tests/dialog-motion.mjs
node tests/preset-preview-ui.mjs
node tests/design-count.mjs
node tests/host-design-concurrency.mjs
for file in index.js app.js core/*.js host/*.js preview/*.js ui/*.js; do node --check "$file" || exit; done
git diff --check
```

本机已核对运行中的 Docker 为 SillyTavern 1.18.0，`script.js`、`st-context.js`、`extensions/shared.js` 与本地参考源码哈希一致。各项本地检查的覆盖范围见上表，真实模型与界面效果由用户人工验收。

人工验收试写时，核对手填与 AI 场景、无角色空卡、模块 API、合并生成、单次多样本、评分与人工偏好，以及失败后重评保留已有内容。预设复制检查连续编号、副本选中和原文保留；自动导航检查 PC、手机、平板及手动位置的保存。

v0.3.4 已通过全部 63 项本地测试，以及 API 配置、独立请求、弹窗动效、预设预览四个独立脚本、全部 JavaScript 语法及差异检查。新增覆盖空卡主连接三路并发与参数固定、部分失败和取消、裁判输入隔离、逐字引用校验、需求/违例/疑点保存恢复与导出、历史评分兼容、并列排名、匿名标签更新和人工偏好保留。酒馆中需人工核对三份正文与聊天记录隔离，逐项查看需求、原句和排名，选择最喜欢的样本并提交反馈，再重新打开确认结果保留；真实模型评分质量与页面效果尚待人工验收。

设置编辑底栏已通过设置、导航和样式边界共 3 项本地检查，以及相关 JavaScript 语法和差异检查。人工验收时，在宽屏与窄屏新建、编辑 API，滚动到模型名称，核对左侧返回与删除、右侧保存常驻；逐项打开六类提示词，核对长文本滚动时左侧返回与重置、右侧确认常驻，以及返回、重置、确认保存和重新打开后的内容。

v0.3.5 已通过连接列表、继承字段、模型回填与覆盖、密钥映射、独立请求、设置保存、取消与试写隔离的本地检查。使用本机已保存配置结构进行只读检查，6 个连接均可列举、回填并构造一致的模型列表和生成参数；网络请求全部模拟。人工验收时刷新酒馆，进入「设置 → 副 API → 配置 API」，核对原先省略 API 类型的连接已出现，选择后检查地址、模型和密钥复用，保存并实际调用。

SillyTavern 验收遵循本机 `AGENTS.md` 的人工流程。从扩展菜单打开工作台，在宽屏与窄屏检查五页尺寸随窗口调整、四周留白、滑动切页、独立滚动、关闭按钮和常驻导航；切换四种主题，核对窗口、控件与选项弹层。确认仅「预设预览」保留原有滚动条，其他页面正文、讨论区、文本框、设置子页及可样式化选项弹层均隐藏滚动条，并检查滚轮、触屏和键盘仍可滚动。检查长选项换行、键盘选择、关闭与重新打开保留输入，以及系统减少动态效果设置。在「预设预览」核对折叠编辑、逐条保存、开关、不同条目的版本搭配、重新打开后切回原版及载入草稿。真实预设写回、模型调用和完整试写流程继续由用户人工验收。

v0.3.6 已通过全部 65 项本地测试、四个独立检查脚本、全部 JavaScript 语法及差异检查。新增覆盖六类提示词保存恢复与导出、旧内容保留、所有请求入口接线、任务中修改设置的快照、最新裁判重评，以及设置页六项编辑、重置、返回与修改标记。酒馆中需人工核对「设置 → 内置提示词」的六个入口、旧内容和重新打开后的保存结果。

v0.3.8 已通过 26 项相关回归、数量与主 API 并发两个专项脚本、通知和数量事件检查，以及所改 JavaScript 语法和差异检查。检查使用本地模拟请求；酒馆中需人工填写数量 3，核对多份结果可在版本记录切换、取消后保留已完成结果、重新打开数量保留，以及宽窄屏的输入框布局。

v0.3.7 已通过 15 项请求与设置检查，以及设置和试写页两项本地视图接线检查；新增的等价空连接合并生成断言已通过。真实调用及界面效果仍由用户人工验收：副 API 留空时检查四个模块沿用酒馆当前 API，保存副 API 后检查默认沿用与模块单独选择，再清空选择并刷新确认保留空值。
