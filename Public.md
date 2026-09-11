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
│   ├── settings.css                # 设置分组、二级滑轨与编辑控件
│   ├── theme.css                   # 四套主题与工作台变量映射
│   └── toast.css                   # 纪实同款底部轻提示与状态颜色
├── core/
│   ├── presets.js                  # 预设读取、版本应用、原版恢复与开关动作
│   ├── prompts.js                  # 独立条目与修订协议、答复解析和反馈指令
│   ├── scenarios.js                # 场景输入、模块连接解析与冲突场景设计
│   ├── settings.js                 # 多套 API 配置、旧数据迁移与设计提示词
│   ├── state.js                    # 设置校验、记录与版本编号恢复、保存快照
│   ├── test-tasks.js               # 测试任务、独立采样、匿名盲评和人工偏好
│   └── workbench.js                # 草稿版本、测试任务接入及异步状态控制
├── host/
│   ├── api-profiles.js             # 连接回填、模型列表与接口地址归一
│   ├── api.js                      # 模型与采样调度、空卡及聊天模式边界
│   ├── local-host.js               # 离线演示请求及浏览器独立存储
│   ├── preset-order.js             # 生效顺序、开关权限与目标开关更新
│   ├── presets.js                  # 酒馆预设读取、正文及开关写回
│   ├── requests.js                 # 独立主副 API 请求及真实 n 多候选解析
│   ├── st-host.js                  # 酒馆设置、环境及模型和预设适配器入口
│   └── trial-context.js            # 独立消息或聊天模式的请求条件快照
├── preview/
│   ├── examples.js                 # 原有演示需求、提示词与两版正文
│   └── preview.js                  # 通过本地适配器挂载同一套界面
├── ui/
│   ├── dialog-motion.js            # 统一关闭动画与重新打开状态
│   ├── launcher.js                 # 扩展菜单、唯一弹窗与首次按需加载
│   ├── navigation-view.js          # 五页切换、快捷入口与键盘焦点
│   ├── preset-entries-view.js      # 条目编辑、开关、逐条保存与输入保留
│   ├── preset-prompt-view.js       # 原版及测试版本选择、只读预览与应用
│   ├── preset-template.js          # 预设预览页与草稿来源保存控件
│   ├── preset-view.js              # 预设选择、重读与草稿来源展示
│   ├── select-view.js              # 触屏下拉再次点击收起与事件清理
│   ├── settings-api-view.js        # API 编辑草稿、连接回填与模型选择
│   ├── settings-prompt-view.js     # 提示词草稿、重置及修改标记
│   ├── settings-template.js        # 界面、API 与提示词设置及二级页模板
│   ├── settings-view.js            # 设置导航、配置列表与顶栏保存操作
│   ├── shell-template.js           # 正式窗口和预览共用顶栏与挂载容器
│   ├── theme-view.js               # 同步当前容器的主题选择
│   ├── toast.js                    # 轻提示创建、自动消失及卸载清理
│   ├── trial-template.js           # 空卡、场景、样本和盲评页面
│   ├── trial-view.js               # 场景、任务、评分、偏好及反馈控件
│   ├── versions-template.js        # 提示词名称、版本选择、改名删除与原文页面
│   ├── versions-view.js            # 名称同步、记录选择与改名删除确认
│   ├── workbench-template.js       # 五页轨道、文字图标导航与工作台模板
│   ├── workbench-view.js           # 主视图渲染、模块挂载、通知与导出
│   └── workbench.svg               # 扩展菜单的工作台图标
├── tests/                     # 本地忽略目录，不随仓库分发
│   ├── api-profiles.mjs            # 连接回填、模型列表及离线接口检查
│   ├── core.test.mjs               # 核心状态与业务边界检查
│   ├── design-entries.test.mjs     # 独立需求、旧稿留存与来源隔离检查
│   ├── design-prompts.test.mjs     # 新建修订协议与默认提示词迁移检查
│   ├── dialog-motion.mjs           # 关闭、重新打开与减少动效检查
│   ├── isolated-host.mjs           # 独立连接、真实 n、空卡隔离与取消检查
│   ├── launcher.test.mjs           # 单次挂载、失败重试与弹窗事件检查
│   ├── native-styles.test.mjs      # 局部样式、关闭隐藏与主题范围检查
│   ├── navigation.test.mjs         # 切页、键盘焦点与输入保留检查
│   ├── preset-display.test.mjs     # 逐条编辑、保存和切换后的输入保留检查
│   ├── preset-preview-ui.mjs       # 版本切换、删除快照、开关与预览事件检查
│   ├── presets-core.test.mjs       # 默认预设、草稿来源与写回状态检查
│   ├── presets-host.test.mjs       # 预设读取、冲突校验与宿主写回检查
│   ├── preview-host.test.mjs       # 独立演示、旧数据、取消与入口隔离
│   ├── select-toggle.test.mjs      # 触屏下拉事件边界与卸载检查
│   ├── settings-core.test.mjs      # 配置迁移、切换、提示词请求与导出检查
│   ├── settings-ui.test.mjs        # 设置草稿、过期请求与上下导航检查
│   ├── st-host.test.mjs            # 宿主适配器与请求契约检查
│   ├── test-pipeline.test.mjs      # 固定场景、采样盲评、失败恢复与偏好检查
│   ├── theme.test.mjs              # 主题同步与宿主变量检查
│   ├── toast-routing.test.mjs      # 状态提示去重、重复操作及错误优先
│   ├── toast.test.mjs              # 轻提示文本、显示时序与卸载清理
│   ├── trial-record.test.mjs       # 试写条件的版本归属、保存恢复与导出
│   ├── trial-ui.test.mjs           # 任务、评分、排序和偏好控件检查
│   ├── versions-core.test.mjs      # 命名、编号、改名删除和恢复检查
│   └── versions-ui.test.mjs        # 版本选择、命名和删除确认检查
└── AGENTS.md                   # 本机共享规则软链接，不入库
```

## 加载与数据流

扩展菜单入口显示「工作台」，图标由 `styles/launcher.css` 以 CSS 遮罩引用 `ui/workbench.svg`，使用 1em 尺寸和 `currentColor` 跟随菜单文字；图标设置 `aria-hidden`，按钮名称由文字提供。页面顶栏固定显示同一 SVG 图标与「预设工作台」，由 `styles/navigation.css` 设置排版与主题颜色；对话框的可访问名称为「预设工作台」。

1. 酒馆通过 `manifest.json` 加载 `index.js`，发布 `YaKitWorkbenchHost.getContext()`，提供实时酒馆上下文、生成状态、试写背景、预设刷新和连接资源。随后创建扩展菜单入口、共用顶栏和原生 `dialog#yakit-workbench-dialog.yakit-workbench`，样式入口 `style.css` 按地址去重加载。
2. 首次打开弹窗时按需导入 `app.js`，它通过 ES 模块导入现有状态、提示词、设置、预设、宿主及视图组件；同一模块在酒馆窗口中只执行一次。入口创建 `createSillyTavernHost(getContext)`，再调用 `mountApp(container, host)`，恢复记录并向容器内的 `#yakit-wb-app` 挂载五页工作台。工作组件尚在加载时重复打开共用一次请求，失败只在内容区显示错误，关闭按钮继续可用，重开后可重试。
3. 关闭弹窗保留工作台实例、输入和滚动位置，重新打开与窗口获得焦点时更新聊天、连接及可试写状态。设置二级页的未确认草稿继续按原规则丢弃。独立演示入口 `preview.html` 直接加载 `preview/preview.js`，用相同的 `shell-template.js`、`app.js` 和本地适配器创建界面；演示只返回内置内容。卸载函数解除环境刷新监听并释放视图订阅及提示计时器。
4. 需求与草稿输入立即更新内存并排队保存，保留首尾空格和换行。设计请求固定开始时的设置快照，第一个系统消息为最新保存的内置提示词与破限提示词，第二个声明条目范围和返回契约；其后仅为本次需求背景、当前参考条目及本次要求。默认生成独立条目，只有本次明确要求修改当前条目时才修订。历史讨论保留展示，不再逐轮发送；普通设计不附带聊天或试写正文，反馈修订只传关联版本及本次反馈。
5. 四个模块分别通过 `moduleApis` 解析开始时的连接快照。设计、场景、盲评和空卡样本使用独立消息通道：主聊天补全与自定义接口使用 `ChatCompletionService.processRequest`，主文本补全使用 `TextCompletionService.processRequest`，保存连接使用 `ConnectionManagerRequestService.sendRequest` 并关闭 `includePreset/includeInstruct`。不走宿主聊天组装、宏替换或 `generateRaw` 的扩展提示事件。请求关闭流式；副 API 上限 4096 token，主聊天补全采用当前答复长度；适用的 OpenAI 模型使用 `max_completion_tokens`。
6. 设计答复为 `{action, prompt, explanation}` JSON，也接受完整 JSON 代码围栏。`action` 为 `create` 或 `revise`，缺省兼容为 `create`，非法值拒绝采用；`prompt` 必须为单条完整的非空提示词。原始答复保留在讨论，界面展示说明和「查看提示词」。成功采用前，如果现有非空草稿与结果不同，且没有逐字相同的已保存版本，就以「自动保留 N」新增版本，再替换草稿。新建解除选中版本和预设来源，普通修订保留当前来源；显式传入源稿的反馈修订解除预设来源。取消、格式错误或生成期间修改草稿、需求、版本时不自动留存。手动与自动保存共用独立 ID、名称、递增编号和时间；已保存正文保持不变，名称可单独修改。手动保存的空名称使用「未命名提示词」。
7. 测试要求选定版本与草稿完全一致，且填写原始需求。`trial(input)` 先保存任务快照，再固定手填场景或调用场景模块生成场景，随后生成 1—6 份样本并盲评。默认空卡消息严格为 `[{role:"system",content:候选原文},{role:"user",content:场景}]`；正文请求不含需求、讨论、角色、世界书、作者注释或其他样本。关闭空卡时才使用主 API 的 `generateQuietPrompt`，明确本次场景优先，聊天背景仍由酒馆组装。正文只保存到工作台，不追加聊天消息。
8. 各样本记录关联发起时的 `versionId/taskId/sampleIndex`、场景和 `context`。`context.capturedAt` 为请求开始时间，记录 `createdAt` 为入库时间。独立模式主 API 串行、副 API 并行，每份完成后保存；单次模式传真实 `n` 并读取原始 `choices`，不拆分同一答复。全部成功后将原始需求、场景和随机标签的正文交给裁判，校验结果并映射回样本。初次盲评默认选最高分，同分按任务原顺序；不自动写人工偏好。反馈仍按试写源版本修订，只传本次意见及引用或完整正文。
9. 新建议进入草稿，保存后成为下一版。「版本记录」以提示词名称为主要标识，编号后置，选择后载入草稿并只读显示保存原文和时间；可直接保存名称。删除先在同页展示目标和关联试写数量，确认后删除选中版本及其测试任务、试写、评分和反馈，保留当前草稿。该页导出从当前内存生成 JSON，排除 `secondaryKey` 和每套 API 配置的 `apiKey`；「工作台」中的复制取当前草稿。
10. 初始化调用 `refreshPresets()` 获取聊天补全预设列表；当前预设名属于可用列表且宿主提供 `readPreset` 时读取条目。「预设预览」按宿主生效角色的顺序展示全部条目，包括未启用、未列入顺序及标记条目，并返回开关状态及可切换原因。有预设时选单列出可用预设，无预设时显示「暂无可用预设」；刷新后当前目标被删除时，保留标注「不在列表中」的原名称。切换预设及「重新读取」读取对应内容，「刷新列表」保留已选预设、条目与草稿来源。
11. 每条使用原生 `details` 展开正文，`summary` 显示为条目名称按钮；非标记条目可直接编辑，点击「保存条目」调用 `savePresetContent(identifier, content, expectedContent)`，不改动工作台草稿与版本。视图按预设、标识及同标识出现次数保留编辑器节点，切页、切换预设和状态通知不清空输入。保存一条只推进本条基线；明确重新读取成功后采用新原文基线并保留本地编辑。点击「载入草稿」使用核心已读取的内容并跳转工作台，之后可通过「保存到原条目」写回草稿。
12. 每条的来源选单只更新本地预览；「应用提示词」调用 `applyPresetPrompt(identifier, versionId, expectedContent)`，空版本 ID 表示原版，其他 ID 必须属于已保存版本。首次应用测试版时记录原文；后续替换保留同一原文，应用原版或手动保存正文成功后清除该条替换记录。不同预设和条目分别记录，保存失败保留此前记录；已应用测试版被删除后仍可查看快照和恢复原版。原版编辑器与测试预览分开保留，应用期间不覆盖原版输入。
13. 条目开关位于折叠控件外，调用 `setPresetEntryEnabled(identifier, enabled)` 即保存，不触发展开。核心传回读取时的启用状态和 `presetOrderCharacterId` 校验冲突；宿主只修改目标 `order.enabled`，目标未加入顺序时按酒馆 `appendPrompt` 规则插入开头。保存当前预设时同步活动设置和列表，保存其他预设保持当前选择。

### 测试任务与数据隔离

`testTasks` 保存任务原始需求、候选原文、版本标识、固定场景、运行开关、模块配置 ID、样本 ID、评分和人工偏好。场景在采样前保存；任务状态依次为 `scenario`（需要生成场景时）、`generating`、`judging`、`completed`。失败为 `error`，取消或刷新中断为 `cancelled`；部分样本重评成功为 `partial`，保留 `generationError`。请求期间使用已解析的连接副本，密钥不写入任务。

场景生成只接收固定的压力测试指令、原始需求和候选提示词，要求具体冲突、信息差、违规诱因和可检验的角色/玩家边界。手动模式不能为空；AI 模式已有文本就沿用，留空才自动生成。`generateScenario()` 可单独生成并供编辑；请求期间修改需求、草稿、场景或来源时不覆盖新输入。`combineDesignScenario` 仅在 AI 场景模式生效，设计和场景解析出的连接必须相同；设计答复额外要求非空 `scenario` 字段，手填模式保持场景不变。

裁判的请求严格为固定评分系统消息，以及 `{goal, scenario, samples:[{label,content}]}` 的用户消息。`goal` 是创建任务时工作台的原始需求；不会发送候选提示词、版本名称、模型身份、设计讨论、内置/破限提示词或宿主预设。每次评分重新随机打乱样本并给出匿名标签。答复必须完整覆盖各标签，不能重复或新增，分数必须是 0—100 的有限数字，理由为字符串，违例为字符串数组。失败保留样本和原有评分；重评使用当时所选裁判 API。`preferredTrialId` 仅由用户主动选择设置，重评不改写。

### 边界与持久化

五页的现有 `state.notice`、`state.error` 以及复制、导出和设置保存反馈统一由视图转换为 Toast。订阅与异常捕获不会重复显示同一次错误；普通渲染不重播旧提示，再次执行保存、复制或失败操作仍可显示同文案。错误存在时不将状态中的成功文案当作新结果显示。未选正文就点击引用时显示提醒。Toast 不改变核心状态和保存流程。

| 情况 | 当前处理 |
| --- | --- |
| 首次加载期间重复打开 | 共享同一次组件挂载，关闭后加载完成不会自行重开窗口 |
| 工作台加载失败 | 内容区显示错误，保留关闭按钮；下次打开重新尝试挂载 |
| 空需求、空设计要求、保存版本时空草稿或空试写要求 | 提交失败并显示错误；编辑时允许暂存空白，预设条目允许清空保存 |
| 副 API 连接未选、已失效或列表为空 | 明确报错，不回退主 API，也不自动选择其他连接 |
| 自定义地址或模型缺失 | 发起设计前阻止请求；地址只接受 HTTP(S)，拒绝内嵌凭据、查询参数、片段和密钥换行；去除尾部斜杠与 `/chat/completions` |
| 自定义密钥为空 | 显式发送空认证头，不借用酒馆已有自定义接口密钥 |
| 未打开角色或群组聊天 | 空卡可用，不读取角色背景；关闭空卡时需要聊天和已连接的主 API |
| 主 API 未连接 | 使用主 API 的模块报错；已配置的副 API 独立可用，不要求主 API 在线 |
| 主 API 正在生成 | 拒绝并行主 API 请求；副 API 通过各自服务请求 |
| 草稿与选中版本不同 | 阻止试写，要求先保存新版本 |
| 提示词名称为空 | 新保存使用「未命名提示词」；对已有版本改名时拒绝空白名称 |
| 同名提示词 | 允许保存多个独立版本，选择项与试写归属通过后置编号区分 |
| 版本改名 | 只更新名称，保留 ID、编号、正文、时间及试写关联；输入期间普通状态刷新保留未提交名称 |
| 删除提示词版本 | 同时删除关联测试任务、试写、评分与反馈；仅清空被删记录的选中 ID，保留当前草稿、预设来源及其他记录，不自动载入另一版本 |
| 操作忙碌时改名或删除 | 界面禁用，核心拒绝；避免生成返回后产生找不到版本的试写 |
| 删除最新或全部版本 | 编号计数器继续保存，新版本不复用已删编号 |
| 旧版本没有编号 | 按原记录顺序补号，保留原名称、正文、ID、时间及试写关联；已有有效编号和计数器优先，新补编号从其后开始 |
| 生成期间修改需求、草稿或选择版本 | 答复保留在讨论，避免覆盖期间编辑 |
| 生成期间更新 API 设置 | 已开始任务的各阶段继续使用创建时的连接快照，后续重评读取新裁判设置 |
| 模块引用已删除配置 | 请求前报错并要求重新选择，不回退到其他 API |
| 手填场景为空 / AI 场景已有文本 | 手填拒绝；AI 已有文本沿用，留空才生成 |
| 合并生成连接不同或返回缺少场景 | 拒绝操作或采用，草稿保留，原始设计答复留在讨论 |
| 单次模式不支持 n / choices 数量不符 | 报错并提示独立请求，不把一条答复拆成多份，也不自动重复付费请求 |
| 主文本补全或当前聊天模式使用单次多样本 | 请求前拒绝，需选择独立请求；副 API 当前聊天模式需改为空卡 |
| 独立样本中途失败 | 保留已完成样本及错误，可对现有样本重评；不会自动重试失败请求 |
| 裁判超时、格式错误、漏评或重复标签 | 保留正文、人工反馈和原有评分，可重新盲评 |
| 重载时任务未结束 | 标记取消，保留已保存的固定场景和样本，不自动恢复网络请求 |
| 旧单次试写 | 保留原记录与 context，可在历史单次试写选项中查看 |
| 配置名称为空或更新目标不存在 | 拒绝保存；地址与模型允许先留空，发起设计时再检查完整性 |
| 旧单套 API 配置 | 恢复为「已有配置」，保留原主副 API 选择；无法恢复任何列表项时回到主 API |
| 连接读取或模型列表返回较晚 | 仅更新仍在编辑的草稿；切换连接、返回或关闭后忽略旧结果，读取期间手填的名称和模型继续保留 |
| 宿主不允许显示密钥 | 保留酒馆连接引用，地址只读；填写自己的密钥后解除引用并允许编辑地址 |
| 连接读取失败或模型列表为空、错误 | 连接失败清空地址与密钥并阻止保存，重新选择或填写自己的密钥后可继续；模型拉取失败仍可手填模型 |
| 内置提示词为空白 | 确认后恢复默认设计提示词；破限提示词允许空白，原样保留空格与换行 |
| 已保存旧版默认提示词 | 仅逐字匹配旧默认内容时迁移到独立条目默认提示词，用户编辑过的内容原样保留 |
| 连续提交独立需求 | 旧讨论不再作为设计上下文累加；被替换且未保存过的非空草稿逐字留为版本 |
| 返回、切换顶级页或关闭设置编辑页 | 放弃未确认的 API 和提示词草稿；已确认的配置与提示词继续保存 |
| 试写期间改变版本 | 结果仍关联请求开始时的版本 |
| 取消生成 | 保留已完成样本，清空忙碌并忽略迟到答复；独立主副 API 均传 AbortSignal，静默聊天请求等待宿主结束才释放主通道占用 |
| 答复格式不正确 | 原始答复保留在讨论，既有草稿不改动 |
| 未评价或修改意见为空 | 阻止按反馈修改；评价可以单独保存 |
| 引用不属于该次正文 | 拒绝保存，保留此前反馈 |
| 当前版本与反馈来源不同 | 按试写记录的 `versionId` 使用原版本 |
| 保存调用失败 | 保留内存内容并提示导出；后续保存成功清除对应旧错误 |
| 读取保存内容失败 | 显示错误，仍可编辑和导出 |
| 当前预设为空或不在可用列表中 | 初始化保留空条目，不自动读取列表第一项；读取失败仍可编辑草稿 |
| 预设读取或刷新 | 不覆盖草稿，也不持久化临时预设状态；重新读取解除草稿的条目来源绑定 |
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
| 本地演示中填写主、副 API 设置 | 仍返回原有示例；条件的 `source`、连接和位置均标识 `local-preview` |
| 本地演示存储为空或已有旧数据 | 空存储加载原演示需求；旧存储键及记录继续使用，读写错误沿用核心保存错误处理 |

记录位于 `extensionSettings.yakitPromptWorkbench`，经 `saveSettingsDebounced()` 交给酒馆保存。核心按顺序提交完整深拷贝，防止旧保存覆盖新编辑；宿主的防抖保存不提供逐次落盘确认，工作台只能感知读取或调用阶段抛出的错误。

独立演示使用 `localStorage['yakit.prompt-workbench.preview.v1']`，保留历史演示数据，与酒馆设置分开。通过本地静态服务打开 `preview.html`；该入口通过 `preview/preview.js` 复用 `app.js` 和 `shell-template.js`，只使用本地适配器。

持久化内容包括设置、需求、草稿、场景输入、讨论、版本、下次版本编号、测试任务、试写、评分、人工偏好、反馈、选中记录及 `presetPromptOverrides` 原文恢复信息。`profiles/mainApiLabel/contextLabel/canTrial/canGenerate/presets/selectedPresetName/presetEntries/presetSource/presetOrderCharacterId/busy/error/notice` 不持久化。主题、导航样式、主副 API 与配置选择立即保存；API 编辑通过顶栏「保存」提交，提示词编辑通过「确认」提交。场景输入即时持久化；未提交的设计要求、提示词名称、反馈和预设条目编辑框属于视图临时内容；预设未保存编辑不进入工作记录，已应用版本的原文快照会保存及导出。

导出结构为 `{formatVersion: 1, ...savedState}`，其中排除副 API 密钥。预设条目通过独立按钮手动写回；版本可单独删除，未提供工作记录导入或整份记录清空入口。

预设列表、条目和来源不进入工作记录；关闭后重开复用同一弹窗与工作台实例，重新加载页面才清除写回来源。普通设计可继续修改已载入条目的草稿，保存版本保留来源，选择已有版本则解除来源。预设读取不触发工作记录保存，加载工作记录失败时也不会因初始化读取预设而写回空记录。冲突检查基于当前酒馆内存；宿主保存接口不提供跨窗口事务校验。

## 设置与主题

| 字段 | 默认值或含义 |
| --- | --- |
| `theme` | 默认 `st`（跟随酒馆）；另支持 `forest`（林系风）、`light`（浅色）、`dark`（黑灰深色） |
| `navigationStyle` | 默认 `top`；可取 `top`（上方文字）或 `bottom`（下方图标），无效值恢复上方 |
| `designApi` | `main`；可取 `main`、`secondary`，作为模块 `default` 的连接来源 |
| `moduleApis` | `{design:'default',scenario:'default',sample:'main',judge:'default'}`；每项可为 `main`、`default` 或已保存 API 配置 ID |
| `scenarioText` / `sceneSource` | 空字符串 / `manual`；AI 模式为 `ai`，已有场景会复用 |
| `emptyCardMode` | `true`；仅候选 system 和固定场景 user 消息 |
| `sampleCount` / `sampleRequestMode` | `3` / `parallel`；数量 1—6，`parallel` 表示独立请求，`single` 表示一次真实 n 个结果 |
| `combineDesignScenario` | `false`；仅 AI 场景且设计/场景连接相同时生效 |
| `testTasks` / `selectedTestTaskId` | 默认空数组 / 空字符串；任务快照及当前任务，空 ID 可查看历史单次试写 |
| `trials[].taskId` / `sampleIndex` | 所属任务及请求序号；旧记录没有这两个字段 |
| `testTasks[].judgement` | 初始 `null`；`{createdAt,results:[{trialId,label,score,reason,violations}]}` |
| `testTasks[].preferredTrialId` | 初始空字符串；用户选择的最喜欢样本 ID |
| `secondaryApiConfigs` | 默认 `[]`；每项含 `id/name/url/apiKey/model/profileId`，密钥不进入导出 |
| `activeSecondaryApiId` | 默认空字符串；当前选中的副 API 配置 ID |
| `assistPrompts.builtin` | 默认设计提示词，要求返回 `action/prompt/explanation` JSON；新需求默认独立条目，空白确认后恢复默认 |
| `assistPrompts.custom` | 默认空字符串；界面显示为破限提示词，与内置内容合并到设计系统消息 |
| `secondarySource` | `profile`；可取 `profile`、`custom` |
| `secondaryProfileId` | 空字符串；连接管理中可用配置的 ID |
| `secondaryUrl` | 空字符串；OpenAI 兼容接口基础地址 |
| `secondaryModel` | 空字符串；自定义模型名或酒馆连接的模型覆盖值 |
| `secondaryKey` | 空字符串；随酒馆设置保存，导出时剔除 |
| `goal` / `draft` | 空字符串；编辑和保存保留原始空白 |
| `versions[].label` / `number` | 玩家填写的名称与稳定正整数编号；名称可改，编号在整个工作记录中递增 |
| `nextVersionNumber` | 默认 `1`；下次保存使用的编号，删除版本不回退，恢复时至少高于所有现存编号 |
| `profiles` | 环境提供的真实连接列表，条目为 `{id, name}` |
| `presets` / `selectedPresetName` | 临时预设列表与选中名称；初始化采用酒馆当前聊天补全预设 |
| `presetEntries` / `presetSource` | 临时条目列表与草稿来源 `{presetName, identifier, name, content}`；初始为空数组 / `null` |
| `presetOrderCharacterId` | 临时生效角色顺序 ID，字符串或 `null`；开关保存时用于校验读取目标 |
| `presetPromptOverrides` | 默认 `[]`；每项 `{presetName, identifier, originalContent, appliedContent, versionId}`，保存及导出原文恢复信息 |
| `mainApiLabel` | 当前酒馆 `mainApi`，仅用于展示 |
| `contextLabel` | 当前角色或群组名及聊天 ID；无聊天时显示提示 |
| `canTrial` | 已选角色或群组、具备静默生成接口且主 API 非断开状态时为真 |
| `canGenerate` | 存在聊天补全、文本补全或连接独立请求服务；与是否选择角色和主 API 在线状态分开 |
| `feedback.status` | 新试写为 `pending`；评价为 `satisfied` 或 `revise` |
| `feedback.note` / `excerpt` | 默认空；提交时去除首尾空白，引用须属于该次正文 |

设置字段统一在核心校验，未知字段和非法枚举拒绝更新。各模块的 API 完整性在发起操作时检查，允许先保存未填完的配置；模块中的失效 ID 要重新选择。正文连接由 `moduleApis.sample` 决定。

设置一级页提供默认收起的「界面设置」「副 API」「模块 API」「提示词」分组。API 选择框下列出已存配置卡片；新增后立即选中并使用副 API，编辑保留 ID、列表位置和当前主副模式，编辑非激活项不改变当前连接。删除激活项后选择剩余首项，删除最后一项回主 API。选择和编辑同步 `secondary*` 旧字段，旧 `update` 调用修改这些字段时也同步当前列表项。

API 和提示词编辑共用二级滑动轨道与顶栏操作，使用主页的 240ms 动效；一级、二级独立滚动，非当前页设为 `inert` 与 `aria-hidden`。API 表单读取酒馆连接并回填地址、可读取密钥和模型，模型列表通过宿主状态接口拉取；填写自己的地址或密钥会解除原连接引用。返回保留滑出画面，下次进入重新读取已保存内容；切换顶级页或关闭时清理草稿。提示词入口按已保存正文、编辑页按当前草稿逐字比较默认内容，偏离时标红并显示「已修改」；重置只改草稿，确认才保存。

常驻导航提供工作台、预设预览、试写与反馈、版本记录、设置五个页面，上方显示文字，下方显示图标并保留可访问名称。工作台在宽屏将需求讨论与提示词编辑等宽等高铺满可用区域，小屏纵向排列；五页共用随宿主视口调整大小的窗口，正文独立滚动。主题、控件与微动效规范与 YaKit 纪实保持一致，样式保存在本仓库。

| 界面项 | 当前规则 |
| --- | --- |
| 窗口尺寸 | 宽度 `calc(100vw - 24px)`，高度 `calc(100dvh - 24px)`；五页共用，四周各留 12px，随宿主视口变化同步调整 |
| 顶栏与卡片 | 顶栏高 56px，关闭按钮为 32px；窗口圆角 20px，卡片圆角 12px |
| 页面分区 | 五页省去重复的分区标题行，通过 `aria-label` 保留区域名称；预设条目数和版本数显示在选择框标签中，「版本记录」工具栏提供「导出工作记录」，通过常驻导航进入「工作台」编辑或「试写与反馈」试写 |
| 工作台双栏 | 视口宽度 ≥960px 时，两栏使用 `repeat(2,minmax(0,1fr))` 等宽铺开并拉伸至页面可用高度；左侧需求框填充剩余空间，补充要求与操作保持自然高度，讨论区最多 320px 并可滚动；内容超高时卡片内滚动。小于 960px 时上下排列 |
| 操作按钮 | 复制、引用、刷新、跳转、导出及取消共用次按钮；主操作沿用主按钮，关闭按钮显示主题底色和边框 |
| 展开与反馈 | 原生 `summary` 与单选项共用按钮样式；展开箭头跟随 `details[open]`，反馈选中态跟随 `input:checked`，键盘焦点清晰可见 |
| 页面留白 | 默认上下 20px、左右 24px；浏览器视口不超过 480px 时为 14px |
| 切页 | 五页常驻同一轨道，正文与导航指示器同步平移；240ms，`cubic-bezier(0.16, 1, 0.3, 1)` |
| 窗口进退场 | 240ms 淡入或淡出，缩放从或至 0.98；关闭按钮、Esc、遮罩共用退场函数 |
| Toast | 底部居中，距底部 24px，间隔 8px；内边距 10px / 18px，圆角 12px，字号 13px；停留 2300ms 后淡出，300ms 后移除 |
| 减少动态效果 | 停用过渡与动画，关闭直接完成 |

顶栏固定留在正文上方，显示入口图标、「预设工作台」标题和关闭按钮；另保留仅供读屏的当前页面名称。设置二级页顶栏增加返回、保存或确认，以及对应的删除或重置；窄屏进入编辑页时让标题为操作区留出空间。导航常驻于设置选择的上方或下方，上方长页签显示省略号，下方图标保留读屏名称和 `title`。切页通过 `inert` 和 `aria-hidden` 隔离非当前页，不重建工作内容并保留滚动位置，设置编辑草稿按上文规则清理。页签支持左右方向键、Home、End；快捷入口聚焦目标页。当前页只保留在本次工作台实例，重新加载后回到工作台。Esc 尊重控件已取消的事件，展开的原生下拉优先关闭选项；旧浏览器无法判断下拉展开状态时，焦点位于下拉框内由系统处理 Esc。遮罩关闭要求按下与松开均位于窗口外，退出期间再次打开会清除待关闭状态。

主题由所属 `.yakit-workbench` 容器的 `data-theme` 控制；`st` 模式直接继承酒馆的 `--SmartThemeBodyColor`、`--SmartThemeBlurTintColor`、`--SmartThemeChatTintColor`、`--SmartThemeBorderColor`、`--SmartThemeQuoteColor`、`--SmartThemeEmColor` 和 `--mainFontFamily`。主题切换只更新工作台容器，不修改酒馆根元素，也不创建主题监听器。林系风、浅色与纪实一致，深色使用黑灰背景及浅灰强调色。全部页面与控件选择器限定在 `.yakit-workbench` 内，菜单入口使用独立 ID；控件 ID、标签关联及单选组名统一带 `yakit-wb-` 前缀，避免和酒馆或其他插件共用标识。

按钮沿用主页的圆角、间距、150ms 颜色过渡与按下缩放，禁用态继续由原有状态控制。预设条目名称可换行，操作按钮行空间不足时自动换行。非提交按钮显式使用 `type="button"`；设计表单由提交按钮触发，设置编辑由顶栏按钮确认。折叠入口保留原生 `details/summary`，反馈和导航位置保留原生单选输入，键盘操作由浏览器处理。

设置、预设、版本和试写记录共用原生 `select`。支持 `appearance: base-select` 与 `::picker(select)` 时，弹层跟随控件宽度、限制在浏览器视口内，最高为 `min(320px, 60dvh)`，超长名称换行、过多选项滚动；背景取 `--paper` 的不透明颜色，选中、悬停与焦点使用主题变量，入场为 160ms 淡入与 4px 位移。原生键盘选择、表单提交和动态连接选项保持原有行为。不支持该特性时使用系统选单，并提供选项文字和背景色；系统可能忽略部分样式。

`select-view.js` 在工作台根节点委托 `pointerdown`，覆盖各页和动态新增的下拉框，卸载时移除监听。浏览器支持 `base-select` 和 `:open`，且主触点再次按下已展开、启用的 `select` 本身时，取消默认事件，阻止兼容鼠标按下在原生弹层收起后重新打开列表；实际外观为系统选单时跳过。选项及分组、鼠标、触控笔、键盘和 `input/change` 仍走原有处理。取消主 `pointerdown` 抑制兼容鼠标事件的依据见 [Pointer Events 规范](https://www.w3.org/TR/pointerevents/#compatibility-mapping-with-mouse-events)。

`controls.css` 仅为「预设预览」页及其内部控件、可样式化选项弹层保留细滚动条与透明轨道：悬停或焦点进入时显示滑块，触屏常显；浅色使用中性灰，其他主题由强调色生成滑块色。支持 WebKit 滚动条伪元素时宽高均为 4px，其余支持标准属性的浏览器使用 `thin`。其他页面正文、讨论区、文本框、设置子页和可样式化选项弹层隐藏滚动条，保留原有溢出与滚动行为；系统选单由浏览器或操作系统控制。

Toast 根节点 `#yakit-wb-toast-root` 位于工作台弹窗或预览容器中，通过绝对定位显示在容器底部，五页共用，不挤占正文也不拦截点击。提示以纯文本写入并通过 `aria-live="polite"` 播报；正常、提醒和错误继续使用现有主题色、黄色和红色。最大宽度为容器减 28px，长文本换行，入场位移 12px、过渡 300ms；卸载时移除节点并清理帧与计时器。剪贴板回退文本框和下载链接同样临时创建在当前工作台容器内。

## 公开 API

当前未发布供其他插件消费的稳定 API。以下为酒馆同一文档内的宿主适配、组件及控制器契约。

| 接口 | 职责 |
| --- | --- |
| `YaKitWorkbenchHost.getContext()` | 返回酒馆当前上下文、生成与背景只读查询；`refreshPresetEditor()` 刷新预设列表，`getPresetPromptContext()` 返回 `{characterId,isToggleAllowed(entry)}`，`getApiProfileResources()` 异步提供酒馆的 `{proxies,findSecret,SECRET_KEYS}` |
| `YaKitWorkbench.createApi(getContext)` | 创建模型请求适配器 |
| `YaKitWorkbench.createApiProfiles(getContext)` | 创建连接回填和模型列表接口，返回 `{readApiProfile, fetchApiModels}` |
| `YaKitWorkbench.createPresets(getContext)` | 创建聊天补全预设列表、读取与条目写回适配器 |
| `YaKitWorkbench.createSillyTavernHost(getContext)` | 创建保存、环境、模型及预设适配器 |
| `YaKitWorkbench.createLocalHost()` | 创建原有示例请求与独立浏览器存储适配器，仅预览入口加载 |
| `YaKitWorkbench.captureTrialContext(host, options, scenario)` | 同步深拷贝聊天模式的连接、注入参数和背景条件 |
| `YaKitWorkbench.captureIsolatedContext(host, settings, messages, mode, count)` | 返回独立请求连接与消息快照，不读取角色、世界书或聊天元数据 |
| `YaKitWorkbench.createWorkbench(host)` | 恢复记录、读取环境并返回控制器 |
| `mountApp(container, host)` | `app.js` 的 ES 导出；向容器内的 `#yakit-wb-app` 挂载工作台，返回释放视图、焦点及重开监听的函数 |
| `mountLauncher(mount)` | `ui/launcher.js` 的 ES 导出；创建唯一原生弹窗，首次打开等待 `mount(container)`，成功后复用实例，失败后可重开重试 |
| `YaKitWorkbench.mountWorkbench(controller, root)` | 显式传入 `#yakit-wb-app`，挂载五页工作台，返回订阅、设置事件、下拉与 Toast 清理函数 |
| `YaKitWorkbench.createToast(document, container = document.body)` | 在指定容器创建轻提示，工作台传入自己的弹窗，返回 `{show, dispose}`；`show(message, {type, durationMs})` 默认 `success` / 2300ms，另支持 `warning` 和 `error`，卸载后调用不再显示 |
| `YaKitWorkbench.mountPresets(controller, root, {run, openPage})` | 绑定预设选择、明确重读与草稿写回控件，返回 `{render}` |
| `YaKitWorkbench.mountPresetEntries(controller, root, {run, openPage})` | 绑定全部条目的编辑、逐条保存与草稿载入，返回 `{render, rebase}`；`rebase(state)` 在明确重读成功后更新原文基线 |
| `YaKitWorkbench.mountNavigation(root, {onPageChange} = {})` | 返回 `{openPage}`，绑定五页常驻导航与快捷入口；切页回调用于清理设置草稿，从所属工作台容器读取读屏页名并管理焦点 |
| `YaKitWorkbench.mountVersions(controller, root, {run})` | 返回 `{render, title}`，负责版本名称同步、选单、详情及同页删除确认，`title(version)` 返回名称和后置编号 |
| `YaKitWorkbench.mountTheme(controller, container)` | 返回 `{sync, dispose}`；仅更新容器的 `data-theme`，酒馆主题变量直接继承，`dispose` 保留空操作契约 |
| `YaKitWorkbench.mountTrials(controller, root, {run, notify, versionTitle})` | 返回 `{render}`；绑定场景、任务、评分、人工偏好和原有反馈控件 |
| `YaKitWorkbench.scenarios` / `.testTasks` | 场景与模块设置解析、任务恢复和采样盲评动作 |
| `YaKitWorkbench.state` / `.prompts` / `.settings` | 状态校验、保存快照、设计消息、答复解析、配置恢复与设置操作 |

| 控制器方法 | 参数与结果 |
| --- | --- |
| `getState()` | 返回完整状态深拷贝，外部改动不写回核心 |
| `subscribe(listener)` | 状态变化时提供快照，返回取消订阅函数 |
| `refreshEnvironment()` | 更新连接列表、主 API 类型与当前聊天信息 |
| `refreshPresets()` | 更新可用预设列表；未选择时补入酒馆当前预设名，不重读已有条目 |
| `readPreset(name)` | 读取指定预设条目，更新名称并解除草稿来源绑定，保留草稿正文 |
| `loadPresetEntry(identifier)` | 将非标记条目的原文载入草稿，记录写回来源并清除选中版本 |
| `savePresetEntry()` | 按来源和原文快照手动写回当前草稿；成功后更新条目和来源快照 |
| `savePresetContent(identifier, content, expectedContent)` | 保存当前选中预设的唯一非标记条目；正文及原文必须为字符串，允许空白或清空；成功更新条目，不替换草稿或选中版本 |
| `applyPresetPrompt(identifier, versionId, expectedContent)` | 将已保存版本写入唯一非标记条目，保存首次替换前的原文；空版本 ID 恢复原版，成功后更新条目与恢复记录 |
| `setPresetEntryEnabled(identifier, enabled)` | 开关必须为布尔值，条目必须可切换；用读取时状态与角色顺序校验，成功更新条目列表 |
| `update(fields)` | 原子校验并更新允许编辑的字段 |
| `saveApiConfig(fields, id = '')` | 保存 `{name,url,apiKey,model,profileId}`；空 ID 新增并激活，非空 ID 更新已有项 |
| `selectApiConfig(id)` / `deleteApiConfig(id)` | 选择或删除已保存的副 API 配置，目标不存在时拒绝操作 |
| `getPrompt(kind)` | 同步返回 `{text, defaultText}`；`kind` 为 `builtin` 或 `custom` |
| `savePrompt(kind, text)` | 保存提示词原文；空白内置提示词恢复默认，破限提示词允许为空 |
| `readApiProfile(profileId)` / `fetchApiModels(fields)` | 透传宿主配置读取和模型列表能力，返回值见下表；失败由设置编辑页显示 |
| `design(instruction)` | 使用当前配置、本次需求与参考草稿生成独立条目，明确修订时修改当前条目；成功替换前自动留存未保存旧稿 |
| `saveVersion(label)` | 保存草稿为独立版本，生成稳定 `number` 并递增 `nextVersionNumber`；名称去除首尾空白，空名称使用「未命名提示词」 |
| `selectVersion(id)` | 选择版本并恢复到草稿，解除此前预设来源绑定 |
| `renameVersion(id, label)` | 只修改目标名称；空白名称、目标不存在或忙碌时拒绝 |
| `deleteVersion(id)` | 删除目标及关联测试任务、试写、评分、反馈，清除被删除的选中 ID，保留草稿、预设来源和其他记录；目标不存在或忙碌时拒绝 |
| `generateScenario()` | 根据原始需求和草稿生成场景；成功写入输入框并设 AI 来源，期间编辑保护不覆盖 |
| `trial(input = scenarioText)` | 自动创建任务并执行必要场景生成、固定输入、采样及盲评；失败或取消保留已完成样本 |
| `selectTestTask(id)` | 选择任务及其首个样本；空 ID 选择历史单次试写 |
| `judgeTestTask(id)` | 使用当前裁判 API 重评已有样本，保留正文、反馈与人工偏好 |
| `preferTrial(trialId)` | 将任务内样本设为用户最喜欢的结果 |
| `selectTrial(id)` | 选择试写并同步所属任务；历史试写清空任务选择 |
| `setFeedback(id, {status, note, excerpt})` | 校验并保存人工反馈 |
| `reviseFromFeedback(id)` | 根据该次试写原版本和已存反馈修订 |
| `cancel()` | 取消生成或忽略迟到的预设读取结果；读取取消不保存工作记录，预设写回期间不执行取消 |
| `exportData()` | 同步返回排除密钥的 JSON 字符串 |

除 `getState`、`subscribe`、`getPrompt`、`exportData` 外，以上操作返回 Promise；状态修改失败时更新 `state.error` 并拒绝 Promise，连接与模型读取错误由编辑页接收。编辑先同步更新内存，再等待宿主保存调用完成。

| 宿主适配器方法 | 参数与结果 |
| --- | --- |
| `loadState()` | `Promise<object\|null>`，返回酒馆保存记录 |
| `saveState(data)` | `Promise<void>`，更新扩展设置并触发防抖保存 |
| `getEnvironment()` | 返回 `{profiles, mainApiLabel, contextLabel, canTrial, canGenerate}` |
| `readApiProfile(profileId)` | 返回 `{name,url,apiKey,model,profileId,usesProfileSecret}`；无法显示密钥时保留连接引用 |
| `fetchApiModels({profileId,url,apiKey,model})` | 返回去重的模型名称数组；空列表或请求错误时拒绝 Promise，模型可手填 |
| `listPresets()` | 返回 `{presets: [{name}], selectedPresetName}`；未提供预设管理器时返回空列表与空名称 |
| `readPreset(name)` | 返回 `{name, entries, orderCharacterId}`；条目含 `identifier/name/content/marker/enabled/toggleable/toggleReason` 和可选 `role`，按生效角色顺序排列 |
| `savePresetEntry({presetName, identifier, content, expectedContent})` | 校验原文后只写目标内容，返回更新后的条目及可选 `notice`；不切换酒馆预设 |
| `setPresetEntryEnabled({presetName, identifier, enabled, expectedEnabled, expectedOrderCharacterId})` | 校验布尔开关与原状态，可选角色 ID 校验；只保存目标开关，返回 `{name, entries, orderCharacterId, notice?}` |
| `design(messages, {settings, signal, purpose = 'design'})` | `Promise<string>`；用途为 `design/scenario/judge`，host 不附加提示词。设计 JSON 为 `{action,prompt,explanation,scenario?}`，独立场景为原文，评分 JSON 为 `{results}` |
| `trial({content,input,emptyCardMode,sampleCount,sampleRequestMode}, {settings,signal})` | 返回 `{content,context,samples:[{content,context}]}`，顶层对应首样本；候选保留原始空白，场景去首尾空白。旧调用不带模式字段时保留单份聊天试写 |

预设适配器方法均返回 Promise。通过 `getPresetPromptContext()` 读取 Prompt Manager 的实际顺序策略；全局策略取 `configuration.promptOrder.dummyId`（当前酒馆为 `100001`），角色策略取 `activeCharacter.id`。条目优先按该角色的 `prompt_order` 排列，未列入的依次附在后面；读取不修改顺序。`enabled` 与酒馆一样按引用值的真假判断，未引用或缺省为关闭；`toggleable` 同时校验唯一条目、唯一顺序引用和 `isPromptToggleAllowed`。`marker: true` 不可编辑或替换正文，允许开关的标记条目仍可切换。保存的 `expectedContent` 是宿主原文基线，`content` 允许清空且保留首尾空白；原版编辑基线与宿主当前测试版基线分别保存。

`messages` 条目为 `{role, content}`，role 取 `system/user/assistant`；`settings` 为基础设置与已选 API 扁平字段的独立快照，提示词在 `messages` 中。连接请求关闭配置预设和 instruct，设置模型非空时通过 `sendRequest` 第五参数覆盖模型；自定义接口按所填地址、模型、密钥请求，不读取酒馆已有自定义接口密钥。

### 试写条件

`context` 随每份试写保存、恢复并导出；普通设计与盲评不附带这些条件。任务在请求前建立，样本在成功返回后逐份建立；后续失败或取消不会删除已完成的样本。

空卡记录为 `{source,capturedAt,connection,emptyCardMode:true,scenario,sampleRequestMode,sampleCount,injection,chat,explanation}`。`injection` 含 `entryPoint:'isolatedRequest'`、`placement:'messages'`、`role:'system'`、候选 `prompt` 和实际 `messages`；`chat` 仅含零条数、零正文长度，主连接 `preset` 为 `null`。连接地址移除认证与查询信息，不记录密钥。主文本补全服务会将独立消息正文按顺序拼接，原生协议没有 role 字段；不启用 instruct 模板。

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
| `injection.prompt` / `quietToLoud` / `skipWIAN` | 实际传入的候选加本次要求；固定 `false` / `false`，由宿主组装聊天背景、世界书和作者注释 |
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
const { selectedPresetName } = await host.listPresets();
if (selectedPresetName) console.table((await host.readPreset(selectedPresetName)).entries);
```

## 当前接入状态

| 项目 | 已实现内容与限制 |
| --- | --- |
| 酒馆入口 | 扩展菜单在原生 `dialog` 中直接挂载组件，首次打开加载，后续复用；`preview.html` 提供离线演示 |
| 主 API 独立生成 | 主聊天补全/文本补全使用独立服务，只传本模块消息；不载入预设正文、宏或聊天组装内容 |
| 副 API 设计 | 支持连接管理配置和自定义 OpenAI 兼容接口，均为非流式请求 |
| 设置 | 多套 API 新增、编辑、选择和删除，连接回填与模型列表；主副选择和上下导航持久化 |
| 设计提示词 | 新需求默认单条生成，模型用 `action` 区分新建与明确修订；内置和破限提示词可编辑，固定请求契约补充单条范围，历史讨论仅供展示 |
| 正文试写 | 默认空卡，只传候选与场景；关闭后使用主 API 当前聊天，`quietToLoud: false`、`skipWIAN: false` |
| 任务与盲评 | AI 或手填场景、1—6 份样本、真实 n 或独立请求、匿名评分、失败保留与重评、用户最优选择 |
| 模块连接 | 四模块单独选 API；设计与场景同连接时支持一份 JSON 合并生成 |
| 试写条件 | 开始时记录连接、位置、聊天统计、作者注释及世界书选择，保存恢复和导出保持原快照 |
| 独立演示 | 原有两版提示词及正文、独立 localStorage、反馈与取消；不调用真实模型 |
| 版本与反馈 | 原文快照、自定义名称、稳定编号、改名与确认删除、正文引用、准确归因及按反馈修订 |
| 预设条目 | 初始化读取当前已保存聊天补全预设；「预设预览」支持逐条开关、编辑、原版与测试版搭配应用、原文恢复及草稿写回；独立演示不提供预设接口 |
| 保存与导出 | 使用 `extensionSettings` 与 `saveSettingsDebounced`，支持复制及不含密钥的导出 |
| 尚未接入 | 失败样本的自动续跑、跨任务统一盲评、文本补全单次 n 多样本；工作记录导入或整份记录清空、条目新增/删除/拖动排序及名称/角色编辑、其他类型预设；未提供独立的跨设备同步功能 |
| 取消限制 | 独立主副 API 传入 AbortSignal；当前聊天静默入口不接收独立信号，不调用宿主全局停止接口，等待其结束再释放主通道 |
| 兼容性 | 最低 SillyTavern 1.18.0；依赖上述生成与连接服务、宿主上下文，以及现代浏览器的 structuredClone、crypto.randomUUID、AbortController |
| 验收状态 | 本地契约检查已覆盖核心和适配器；真实主副 API 调用及界面交互待用户人工验收 |

连接列表依赖启用的 `connection-manager`、已保存的连接配置和 `ConnectionManagerRequestService.getSupportedProfiles()`。独立主聊天补全与自定义副 API 依赖 `ChatCompletionService.processRequest()`，主文本补全依赖 `TextCompletionService.processRequest()`；主连接还读取 `getChatCompletionModel/getTextGenModel/getTextGenServer` 和连接参数，连接配置调用关闭 `includePreset/includeInstruct`。主 API 的连接状态与当前生成状态由宿主实时读取。试写条件还读取 `getChatCompletionModel`、`getTextGenModel`、`getTextGenServer`、`getMaxContextTokens`、`getPresetManager`、`chatMetadata`、`extensionPrompts`、当前聊天/角色/群组、`powerUserSettings`、世界书模块的 `selected_world_info` / `world_info.charLore`，以及 Prompt Manager 的 `getPromptOrderEntry` / `getPromptById` / `shouldTrigger`。

预设接入依赖 `getPresetManager('openai')` 的 `getPresetList`、`getSelectedPresetName`、`getCompletionPresetByName` 与 `savePreset`，以及 Prompt Manager 的 `configuration.promptOrder`、`activeCharacter.id` 和 `isPromptToggleAllowed`。写回复制已保存预设，只替换目标正文或生效顺序中的开关，调用 `savePreset(name, next, {skipUpdate: true})`；成功后更新内存中对应字段，不切换当前预设。当前活动条目无冲突时同步 `chatCompletionSettings`、触发 `saveSettingsDebounced()` 并通过宿主桥 `refreshPresetEditor()` 调用 `promptManager.render(false)` 刷新列表。保存请求失败前不修改宿主内存。

API 设置读取依赖 `ConnectionManagerRequestService.getProfile/validateProfile`、连接管理列表、`CONNECT_API_MAP`、命名预设，以及酒馆 `openai.js` 的 `proxies` 和 `secrets.js` 的 `findSecret/SECRET_KEYS`。模型列表使用 `getRequestHeaders()` 调用 `/api/backends/chat-completions/status`；连接引用保留其源类型和密钥引用，文本补全连接暂不支持模型列表，独立接口使用归一化的 OpenAI 兼容地址。读取和拉取模型不切换酒馆当前连接。离线演示只返回固定的示例连接与模型，不访问填写的地址。

## 开发与验证

UI 代码位于 `ui/`、`styles/`、`style.css` 和页面模板；业务代码位于 `core/`、`host/`。修改 UI 不改业务逻辑，修改业务不改 UI；新增注释使用通俗中文。用户可感知功能同步更新 README，模块、数据流和接口变化同步更新本文。

本地测试由 `.gitignore` 忽略，不随仓库分发：

| 脚本 | 覆盖内容 |
| --- | --- |
| `tests/core.test.mjs` | 版本、反馈归因、正文隔离、取消、格式错误、保存恢复、编辑保护、API 设置快照、密钥导出排除及历史恢复；6 项通过 |
| `tests/design-prompts.test.mjs` | 新旧答复协议、历史讨论隔离、反馈目标隔离、精确默认迁移和离线两版设计 |
| `tests/design-entries.test.mjs` | 连续独立条目、旧稿逐字留存和去重、编号、取消与编辑保护、反馈来源隔离、恢复与导出 |
| `tests/versions-core.test.mjs` | 名称与编号分离、改名保持快照、删除关联清理与草稿保留、忙碌拒绝、旧数据补号、失败后的导出及删空重开 |
| `tests/versions-ui.test.mjs` | 真实控制器与最小 DOM 检查名称输入保留、同名版本区分、改名、确认与取消、切换及忙碌撤销确认、删除后的空态与焦点 |
| `tests/settings-core.test.mjs` | 旧配置迁移、多配置切换与编辑、默认提示词与下一次实际设计请求、全配置密钥导出排除 |
| `tests/settings-ui.test.mjs` | 连接及模型结果过期、密钥解除引用、读取期间输入保留、提示词草稿与上下导航 |
| `tests/api-profiles.mjs` | 连接与密钥回填、模型空值和错误、地址归一、模型覆盖、主连接不变及离线演示 |
| `tests/presets-core.test.mjs` | 默认预设、草稿隔离、原文基线、搭配恢复、版本删除、开关失败和真实适配器联接 |
| `tests/presets-host.test.mjs` | 生效顺序、正文与开关冲突、缺引用启用、标记权限、保存锁和等待期间的宿主编辑 |
| `tests/preset-display.test.mjs` | 全部条目展示、多条编辑、保存期间继续输入、原文冲突与重读、读取失败及切换后的输入保留 |
| `tests/preset-preview-ui.mjs` | 原版输入保留、只读测试预览、显式应用、删除版本快照、外部修改和开关事件 |
| `tests/st-host.test.mjs` | 模拟宿主验证请求参数、连接选用、持久化与取消边界；契约检查通过，不调用真实模型 |
| `tests/trial-record.test.mjs` | 从真实适配器到核心，验证试写期间切换条件后原版本归属、保存恢复与导出 |
| `tests/test-pipeline.test.mjs` | 固定场景、独立/单次采样、匿名评分隔离、取消、部分失败重评、恢复脱敏与偏好 |
| `tests/isolated-host.mjs` | 无角色空卡、真实 n、主副连接、关闭预设及宏、取消、离线场景与评分 |
| `tests/trial-ui.test.mjs` | 任务/样本切换、评分排序与偏好显示、原始场景和 API 控件 |
| `tests/preview-host.test.mjs` | 显式宿主挂载、焦点与重开环境刷新及清理、离线两版流程、旧存储恢复、请求快照和取消 |
| `tests/theme.test.mjs` | 容器主题各自生效，宿主根主题保持不变 |
| `tests/navigation.test.mjs` | 页签键盘操作、快捷入口、隐藏页隔离与草稿和滚动保留 |
| `tests/launcher.test.mjs` | 唯一弹窗、并发打开只挂载一次、关闭期间加载完成、失败重试、Esc/cancel 与遮罩 |
| `tests/native-styles.test.mjs` | 样式局部化、原生弹窗关闭隐藏、四主题、窗口尺寸与提示层 |
| `tests/select-toggle.test.mjs` | 触屏首次与再次点击的事件处理、鼠标与键盘、选项冒泡、系统选单、禁用、不支持增强和卸载；不模拟浏览器原生弹层 |
| `tests/toast.test.mjs` | 纯文本输出、2300ms 停留、300ms 淡出、状态样式及卸载清理 |
| `tests/toast-routing.test.mjs` | 普通渲染去重、同文案重复操作、订阅与 catch 去重及错误与本地反馈 |
| `tests/dialog-motion.mjs` | 退场完成后关闭、重复关闭、重开与减少动态效果 |

在保留本地测试的工作目录运行：

```bash
node --test tests/*.test.mjs
node tests/api-profiles.mjs
node tests/isolated-host.mjs
node tests/dialog-motion.mjs
node tests/preset-preview-ui.mjs
for file in index.js app.js core/*.js host/*.js preview/*.js ui/*.js; do node --check "$file" || exit; done
git diff --check
```

6 项核心测试、宿主契约检查、全部 JavaScript 语法检查与 `git diff --check` 已通过。本机已核对运行中的 Docker 为 SillyTavern 1.18.0，并确认 `script.js`、`st-context.js`、`extensions/shared.js` 与本地参考源码哈希一致。静态和模拟宿主检查不代表真实模型或界面验收完成。

v0.2.1 分区调整另已通过 UI 脚本语法、入口加载顺序、模板标签嵌套与控件引用、CSS 语法检查。

v0.2.5 已通过四主题同步、导航焦点与输入保留、原生下拉 Esc 和弹窗进退场的模拟检查；已核对模板结构、资源路径、六个样式文件的结构、JavaScript 语法与版本一致性。

v0.2.7 的本地契约检查覆盖真实宿主请求参数、连接和背景快照、候选原文空白、版本切换后的记录归属、保存恢复与导出，以及独立演示入口和取消。宿主调用签名与本机 SillyTavern 1.18.0 源码核对；实际模型和界面验收继续由用户执行。

v0.2.8 的本地检查覆盖预设列表与默认选择、读取不修改工作记录、草稿来源绑定、空白与清空、目标冲突、宿主写回失败及保存期间编辑保留；另检查预设模块加载顺序、模板控件引用和核心与真实适配器之间的模拟联接。真实预设保存和界面操作由用户人工验收。

v0.2.9 已通过 26 项本地检查、弹窗动效检查、全部 JavaScript 语法、五页模板与控件引用和脚本加载顺序检查。新增检查覆盖逐条保存与草稿隔离、多条编辑保留、保存期间改回原文、冲突后重读及切换预设后的输入保留。

v0.2.11 已通过 28 项本地检查、弹窗动效与 JavaScript 语法检查。新增检查覆盖 Toast 显示时序、清理、通知去重和重复操作；已逐项核对 Toast 的原有样式声明与纪实一致。界面效果按项目约定由用户人工验收。

v0.2.12 已通过现有导航、预设编辑与通知路由检查，以及修改脚本语法、五页模板结构、控件引用、按钮样式引用和版本一致性检查；已静态核对按钮换行、展开箭头与反馈选中样式。界面效果继续由用户人工验收。

v0.2.13 已通过下拉事件、原生下拉 Esc 和通知路由共 7 项本地检查，以及相关 JavaScript 语法和差异检查。手机端还需人工检查首次展开、再次点击收起、重新展开、点击外部关闭、选项选择和列表滚动。

v0.2.14 已通过 35 项本地测试、API 配置与模型检查、弹窗动效及全部 JavaScript 语法检查；入口 25 个脚本和 87 个控件 ID 均已核对。新增检查覆盖设置迁移、全部配置密钥导出排除、提示词用于实际设计、二级草稿清理及异步回填。API 新建、切换、编辑、删除、真实模型列表、提示词确认与重置，以及上下导航和二级页动效仍由用户在酒馆人工验收。

v0.2.15 已通过 36 项本地测试、API 配置与弹窗动效检查、全部 JavaScript 语法检查。检查覆盖原生弹窗单次挂载、失败重试、主题与样式作用范围、提示层、重开后环境刷新及离线演示；实际酒馆界面和内存差值待人工验证。

v0.2.16 的独立提交快照已通过 13 项本地检查，覆盖版本编号、改名、确认与取消删除、关联清理、名称输入及草稿保留、旧记录恢复、通知路由和离线试写；相关 JavaScript 语法、组件导入、控件引用与版本一致性检查通过。实际酒馆界面继续由用户人工验收。

v0.2.17 已通过条目请求、旧默认提示词迁移、旧稿留存、来源隔离、取消与并发编辑、保存恢复和导出共 9 项本地检查，以及 JavaScript 语法检查；真实模型对新增与修订的判断待用户人工验收。

v0.2.18 已通过预设核心、宿主、逐条编辑、版本预览与导航共 20 项本地检查，以及相关脚本语法和差异检查。检查覆盖多条搭配、原文恢复与持久化、删除测试版本后的恢复、开关及正文冲突、权限与缺序处理、失败保留和核心到真实适配器的模拟联接。

v0.3.0 已通过本地核心、宿主及视图契约检查，新增覆盖空卡无角色、固定场景、独立样本、真实 n、盲评数据隔离、默认最高分阅读、用户偏好、部分失败重评、取消与恢复；已有检查已适配新模块加载及裁判返回。API 配置、独立请求、弹窗动效、全部 JavaScript 语法与差异检查通过。真实模型是否遵守场景和评分质量、实际接口的 n 支持及酒馆界面仍需人工确认。

人工验证本次流程：填写明确约束并保存提示词，保持空卡，手填与现有聊天冲突的场景，确认三份正文围绕该场景；在无角色时复测。切换 AI 场景生成，检查冲突诱因；为四个环节选择不同 API，再以同连接合并生成提示词与场景。对支持 n 的接口选择单次三份，检查评分、默认推荐阅读与人工偏好；模拟裁判失败后重评，核对已有样本及偏好保留。

SillyTavern 验收遵循本机 `AGENTS.md` 的人工流程。从扩展菜单打开工作台，在宽屏与窄屏检查五页尺寸随窗口调整、四周留白、滑动切页、独立滚动、关闭按钮和常驻导航；切换四种主题，核对窗口、控件与选项弹层。确认仅「预设预览」保留原有滚动条，其他页面正文、讨论区、文本框、设置子页及可样式化选项弹层均隐藏滚动条，并检查滚轮、触屏和键盘仍可滚动。检查长选项换行、键盘选择、关闭与重新打开保留输入，以及系统减少动态效果设置。在「预设预览」核对折叠编辑、逐条保存、开关、不同条目的版本搭配、重新打开后切回原版及载入草稿。真实预设写回、模型调用和完整试写流程继续由用户人工验收。
