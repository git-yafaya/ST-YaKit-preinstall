# ST-YaKit-preinstall 开发说明

这是 YaKit 系列的 SillyTavern 提示词工作台，使用原生 JavaScript、HTML 和 CSS，无依赖安装和构建步骤。

## 仓库结构

```text
ST-YaKit-preinstall/
├── .gitignore                 # 排除本地资料、测试、环境配置及缓存
├── README.md                  # 用户安装、配置与使用说明
├── Public.md                  # 模块、数据流与接口契约
├── manifest.json              # 酒馆扩展入口、版本及兼容性声明
├── index.js                   # 发布宿主、试写条件及预设刷新桥并挂载入口
├── index.html                 # 同源页面、共用标题和顶部控件与脚本加载顺序
├── preview.html               # 独立演示入口，转到显式预览模式
├── app.js                     # 按入口选择适配器并创建核心和视图
├── style.css                  # 主题、控件、页面、导航与轻提示样式入口
├── styles/
│   ├── theme.css              # 四套主题与工作台变量映射
│   ├── controls.css           # 操作与展开按钮、输入、选项弹层及滚动条
│   ├── pages.css              # 五页卡片、编辑与阅读布局
│   ├── navigation.css         # 顶栏、导航指示器与切页轨道
│   ├── toast.css              # 纪实同款底部轻提示与状态颜色
│   └── launcher.css           # 菜单图标、弹窗尺寸与进退场
├── core/
│   ├── state.js               # 设置校验、记录恢复与保存快照
│   ├── prompts.js             # 设计消息、答复解析与反馈指令
│   ├── presets.js             # 预设读取、草稿载入与两种条目写回入口
│   └── workbench.js           # 草稿、版本、试写及异步状态控制
├── host/
│   ├── api.js                 # 主副 API 设计与主 API 正文请求
│   ├── presets.js             # 酒馆聊天补全预设读取与单条写回
│   ├── trial-context.js       # 请求开始时的连接、位置和上下文快照
│   ├── local-host.js          # 离线演示请求及浏览器独立存储
│   └── st-host.js             # 酒馆设置、环境及模型和预设适配器入口
├── preview/
│   └── examples.js            # 原有演示需求、提示词与两版正文
├── ui/
│   ├── workbench.svg          # 扩展菜单的工作台图标
│   ├── launcher.js            # 扩展菜单、样式加载与弹窗事件绑定
│   ├── dialog-motion.js       # 统一关闭动画与重新打开状态
│   ├── workbench-template.js  # 五页轨道、顶部导航与工作台模板
│   ├── workbench-view.js      # 状态渲染、通知分发、事件、复制与下载
│   ├── toast.js               # 轻提示创建、自动消失及卸载清理
│   ├── preset-template.js     # 预设展示页与草稿来源保存控件
│   ├── preset-view.js         # 预设选择、重读与草稿来源展示
│   ├── preset-entries-view.js # 全部条目编辑、逐条保存与本次编辑保留
│   ├── navigation-view.js     # 五页切换、快捷入口与键盘焦点
│   ├── trial-template.js      # 独立试写与反馈页面
│   ├── versions-template.js   # 版本选择、原文预览与导出页面
│   ├── settings-template.js   # API 与主题设置模板
│   ├── settings-view.js       # 设置提交与主题渲染调用
│   └── theme-view.js          # 内外主题同步与酒馆配色监听
├── tests/                     # 本地忽略目录，不随仓库分发
│   ├── core.test.mjs          # 核心状态与业务边界检查
│   ├── presets-core.test.mjs  # 默认预设、草稿来源与写回状态检查
│   ├── presets-host.test.mjs  # 预设读取、冲突校验与宿主写回检查
│   ├── preset-display.test.mjs # 逐条编辑、保存和切换后的输入保留检查
│   ├── st-host.test.mjs       # 宿主适配器与请求契约检查
│   ├── trial-record.test.mjs  # 试写条件的版本归属、保存恢复与导出
│   ├── preview-host.test.mjs  # 独立演示、旧数据、取消与入口隔离
│   ├── theme.test.mjs         # 主题同步与宿主变量检查
│   ├── navigation.test.mjs    # 切页、键盘焦点与输入保留检查
│   ├── launcher.test.mjs      # 原生下拉与退出键事件检查
│   ├── toast.test.mjs         # 轻提示文本、显示时序与卸载清理
│   ├── toast-routing.test.mjs # 状态提示去重、重复操作及错误优先
│   └── dialog-motion.mjs      # 关闭、重新打开与减少动效检查
└── AGENTS.md                  # 本机共享规则软链接，不入库
```

## 加载与数据流

扩展菜单入口显示「工作台」，图标由 `styles/launcher.css` 以 CSS 遮罩引用 `ui/workbench.svg`，使用 1em 尺寸和 `currentColor` 跟随菜单文字；图标设置 `aria-hidden`，按钮名称由文字提供。页面顶栏固定显示同一 SVG 图标与「预设工作台」，由 `styles/navigation.css` 设置排版与主题颜色；浏览器标题、宿主对话框和 iframe 名称同步为「预设工作台」。

1. 酒馆根据 `manifest.json` 加载 ES 模块 `index.js`。入口读取 `/script.js` 的 `isGenerating` 和 `getMaxContextTokens`、`/scripts/textgen-settings.js` 的 `getTextGenModel`、世界书模块的当前选择及 Prompt Manager 中启用的静默提示条目。将这些只读能力与实时 `SillyTavern.getContext()` 包装为 `globalThis.YaKitWorkbenchHost.getContext()`，再挂载扩展菜单入口。
2. 用户首次打开「工作台」时，同源 iframe 加载 `index.html`；关闭对话框仅隐藏容器，保留页面和未提交输入。顶部控件静态位于 `#app` 外，`launcher.js` 在 iframe 加载后将关闭按钮绑定到统一退场函数，应用启动报错时仍保留关闭入口。宿主加载限定到工作台弹窗的 `theme.css` 与 `launcher.css`；iframe 通过 `style.css` 加载界面样式，脚本按 `state → prompts → core/presets → workbench → api → host/presets → st-host → settings-template → theme-view → settings-view → trial-template → versions-template → preset-template → workbench-template → navigation-view → preset-entries-view → preset-view → toast → workbench-view → app` 顺序加载，内部协作命名空间为 `globalThis.YaKitWorkbench`。
3. 普通入口由 `app.js` 通过父页面桥加载 `host/trial-context.js` 并创建 `createSillyTavernHost(getContext)`，再创建控制器、恢复保存记录并读取连接列表和当前聊天。页面重新获得焦点时刷新环境；普通入口缺少酒馆桥时显示错误。独立入口 `preview.html` 转到 `index.html?mode=preview`，显式加载示例与 `createLocalHost()`，复用同一套视图；演示请求只返回内置内容。
4. 需求与草稿输入立即更新内存并排队保存，保留首尾空格和换行。设计请求固定开始时的设置快照，将需求、源草稿、历史设计讨论及本次要求组成消息数组，不附带当前聊天或此前试写正文。
5. 主 API 设计使用 `generateRaw({prompt, instructOverride: true, trimNames: false})`；副 API 连接配置使用 `ConnectionManagerRequestService.sendRequest`；自定义接口使用 `ChatCompletionService.processRequest`。副 API 请求均关闭流式输出、输出上限为 4096 token。
6. 设计答复必须是含 `prompt` 和 `explanation` 字符串的 JSON，也接受完整 JSON 代码围栏。原始答复进入讨论记录，界面显示修改说明并提供「查看提示词」折叠区，解析成功后更新草稿。保存版本时生成独立 ID、名称和时间，已保存版本保持不变。
7. 试写要求选定版本与当前草稿完全一致。请求仅传 `{content, input}`，适配器检查候选非空并保留其原始空白，通过主 API 的 `generateQuietPrompt` 把候选提示词、两个换行和试写要求组合为 `quietPrompt`。使用当前聊天背景、世界书及作者注释，返回正文写入工作台记录，不自动追加聊天消息。
8. 主 API 的取消、忙碌和连接检查通过后，在调用宿主生成之前同步深拷贝试写条件。成功答复关联发起时的 `versionId`、输入和 `context`，`context.capturedAt` 是条件采集时间，记录的 `createdAt` 是答复入库时间。期间切换连接、聊天或版本不改写已采集条件。按反馈修改时找回该试写的源版本，仅在用户提交后将评价、意见及引用片段交给设计模型；没有片段时交回该次完整正文。
9. 新建议进入草稿，保存后成为下一版。「版本记录」选择已有版本并只读显示其原文和保存时间，选择行为仍将该版本载入草稿。该页导出从当前内存生成 JSON，排除 `secondaryKey`；「工作台」中的复制取当前草稿。
10. 初始化调用 `refreshPresets()` 获取聊天补全预设列表；当前预设名属于可用列表且宿主提供 `readPreset` 时读取条目。「预设展示」按宿主返回的顺序展示全部条目，包括未启用、未列入默认顺序及标记条目。有预设时选单列出可用预设，无预设时显示「暂无可用预设」；刷新后当前目标被删除时，保留标注「不在列表中」的原名称。切换预设及「重新读取」读取对应内容，「刷新列表」保留已选预设、条目与草稿来源。
11. 每条使用原生 `details` 展开正文，`summary` 显示为条目名称按钮；非标记条目可直接编辑，点击「保存条目」调用 `savePresetContent(identifier, content, expectedContent)`，不改动工作台草稿与版本。视图按预设、标识及同标识出现次数保留编辑器节点，切页、切换预设和状态通知不清空输入。保存一条只推进本条基线；明确重新读取成功后采用新原文基线并保留本地编辑。点击「载入草稿」使用核心已读取的内容并跳转工作台，之后可通过「保存到原条目」写回草稿。

### 边界与持久化

五页的现有 `state.notice`、`state.error` 以及复制、导出和设置保存反馈统一由视图转换为 Toast。订阅与异常捕获不会重复显示同一次错误；普通渲染不重播旧提示，再次执行保存、复制或失败操作仍可显示同文案。错误存在时不将状态中的成功文案当作新结果显示。未选正文就点击引用时显示提醒。Toast 不改变核心状态和保存流程。

| 情况 | 当前处理 |
| --- | --- |
| 空需求、空设计要求、保存版本时空草稿或空试写要求 | 提交失败并显示错误；编辑时允许暂存空白，预设条目允许清空保存 |
| 副 API 连接未选、已失效或列表为空 | 明确报错，不回退主 API，也不自动选择其他连接 |
| 自定义地址或模型缺失 | 发起设计前阻止请求；地址只接受 HTTP(S)，适配器还拒绝地址内嵌凭据和密钥换行 |
| 自定义密钥为空 | 显式发送空认证头，不借用酒馆已有自定义接口密钥 |
| 未打开角色或群组聊天、主 API 未连接 | 禁用试写或在请求时提示；已打开角色的新聊天可试写 |
| 主 API 正在生成 | 拒绝并行主 API 请求；副 API 通过各自服务请求 |
| 草稿与选中版本不同 | 阻止试写，要求先保存新版本 |
| 生成期间修改需求、草稿或选择版本 | 答复保留在讨论，避免覆盖期间编辑 |
| 生成期间更新 API 设置 | 已开始请求继续使用开始时的设置快照 |
| 试写期间改变版本 | 结果仍关联请求开始时的版本 |
| 取消生成 | 核心清空忙碌状态并忽略迟到答复；副 API 传递 AbortSignal，主 API 等宿主请求结束后释放占用 |
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
| 预设写回期间发生编辑 | 不支持取消写回；保留期间的草稿与宿主新编辑，切换版本解除草稿来源绑定 |
| 活动预设的目标条目有未保存修改 | 写回前拒绝提交，要求处理酒馆中的修改后重新读取；其他未保存参数保持不变 |
| 预设文件已保存但活动设置保存或列表刷新失败 | 返回成功结果及 `notice`，说明文件已保存并提示在酒馆确认 |
| 预设没有 `prompts` 数组 | 读取失败；存在数组但没有合法条目时返回空列表 |
| 部分历史记录不完整 | 过滤缺少必要字段的记录及找不到原版本的试写 |
| 旧配置与试写记录 | `profileId` 映射到 `secondaryProfileId`；旧试写 `context` 原样恢复，新试写位置按实际静默生成入口记录 |
| 试写期间切换聊天、连接或修改背景 | 保存请求开始时的深拷贝；宿主后续裁剪、宏替换和扩展处理仍由酒馆执行 |
| 宿主没有公开模型、服务地址或世界书选择 | 对应信息为 `null`；不根据已有配置猜测实际值 |
| 本地演示中填写主、副 API 设置 | 仍返回原有示例；条件的 `source`、连接和位置均标识 `local-preview` |
| 本地演示存储为空或已有旧数据 | 空存储加载原演示需求；旧存储键及记录继续使用，读写错误沿用核心保存错误处理 |

记录位于 `extensionSettings.yakitPromptWorkbench`，经 `saveSettingsDebounced()` 交给酒馆保存。核心按顺序提交完整深拷贝，防止旧保存覆盖新编辑；宿主的防抖保存不提供逐次落盘确认，工作台只能感知读取或调用阶段抛出的错误。

独立演示使用 `localStorage['yakit.prompt-workbench.preview.v1']`，保留历史演示数据，与酒馆设置分开。通过本地静态服务打开 `preview.html`；该入口与普通酒馆入口均复用 `index.html`，没有独立 UI 副本。

持久化内容包括设置、需求、草稿、讨论、版本、试写、反馈和选中记录。`profiles/mainApiLabel/contextLabel/canTrial/presets/selectedPresetName/presetEntries/presetSource/busy/error/notice` 不持久化。主题切换立即保存，其余 API 设置通过「保存设置」提交。未提交的设计要求、试写要求、版本名称、反馈和预设条目编辑框属于视图临时内容；预设逐条编辑不进入工作记录持久化或导出。

导出结构为 `{formatVersion: 1, ...savedState}`，其中排除副 API 密钥。预设条目通过独立按钮手动写回；未提供工作记录导入或删除入口。

预设列表、条目和来源不进入工作记录；关闭后重开保留同一个 iframe，重新加载页面才清除写回来源。普通设计可继续修改已载入条目的草稿，保存版本保留来源，选择已有版本则解除来源。预设读取不触发工作记录保存，加载工作记录失败时也不会因初始化读取预设而写回空记录。冲突检查基于当前酒馆内存；宿主保存接口不提供跨窗口事务校验。

## 设置与主题

| 字段 | 默认值或含义 |
| --- | --- |
| `theme` | 默认 `st`（跟随酒馆）；另支持 `forest`（林系风）、`light`（浅色）、`dark`（黑灰深色） |
| `designApi` | `main`；可取 `main`、`secondary` |
| `secondarySource` | `profile`；可取 `profile`、`custom` |
| `secondaryProfileId` | 空字符串；连接管理中可用配置的 ID |
| `secondaryUrl` | 空字符串；OpenAI 兼容接口基础地址 |
| `secondaryModel` | 空字符串；自定义接口的模型名 |
| `secondaryKey` | 空字符串；随酒馆设置保存，导出时剔除 |
| `goal` / `draft` | 空字符串；编辑和保存保留原始空白 |
| `profiles` | 环境提供的真实连接列表，条目为 `{id, name}` |
| `presets` / `selectedPresetName` | 临时预设列表与选中名称；初始化采用酒馆当前聊天补全预设 |
| `presetEntries` / `presetSource` | 临时条目列表与草稿来源 `{presetName, identifier, name, content}`；初始为空数组 / `null` |
| `mainApiLabel` | 当前酒馆 `mainApi`，仅用于展示 |
| `contextLabel` | 当前角色或群组名及聊天 ID；无聊天时显示提示 |
| `canTrial` | 已选角色或群组、具备静默生成接口且主 API 非断开状态时为真 |
| `feedback.status` | 新试写为 `pending`；评价为 `satisfied` 或 `revise` |
| `feedback.note` / `excerpt` | 默认空；提交时去除首尾空白，引用须属于该次正文 |

设置字段统一在核心校验，未知字段和非法枚举拒绝更新。副 API 完整性在发起设计时检查，允许先保存未填完的配置。正文 API 始终使用当前主 API。

顶部导航常驻，提供工作台、预设展示、试写与反馈、版本记录、设置五个页面。工作台在宽屏并排显示需求讨论与提示词编辑，小屏纵向排列；五页共用随宿主视口调整大小的窗口，正文独立滚动。主题、控件与微动效规范与 YaKit 纪实保持一致，样式保存在本仓库。

| 界面项 | 当前规则 |
| --- | --- |
| 窗口尺寸 | 宽度 `calc(100vw - 24px)`，高度 `calc(100dvh - 24px)`；五页共用，四周各留 12px，随宿主视口变化同步调整 |
| 顶栏与卡片 | 顶栏高 56px，关闭按钮为 32px；窗口圆角 20px，卡片圆角 12px |
| 页面分区 | 五页省去重复的分区标题行，通过 `aria-label` 保留区域名称；预设条目数和版本数显示在选择框标签中，导出位于版本操作区 |
| 操作按钮 | 复制、引用、刷新、跳转、导出及取消共用次按钮；主操作沿用主按钮，关闭按钮显示主题底色和边框 |
| 展开与反馈 | 原生 `summary` 与单选项共用按钮样式；展开箭头跟随 `details[open]`，反馈选中态跟随 `input:checked`，键盘焦点清晰可见 |
| 页面留白 | 默认上下 20px、左右 24px；iframe 视口不超过 480px 时为 14px |
| 切页 | 五页常驻同一轨道，正文与导航指示器同步平移；240ms，`cubic-bezier(0.16, 1, 0.3, 1)` |
| 窗口进退场 | 240ms 淡入或淡出，缩放从或至 0.98；关闭按钮、Esc、遮罩共用退场函数 |
| Toast | 底部居中，距底部 24px，间隔 8px；内边距 10px / 18px，圆角 12px，字号 13px；停留 2300ms 后淡出，300ms 后移除 |
| 减少动态效果 | 停用过渡与动画，关闭直接完成 |

顶栏固定留在正文上方，显示入口图标、「预设工作台」标题和关闭按钮；另保留仅供读屏的当前页面名称。顶部导航始终显示，窄屏长页签显示省略号，完整名称保留在文字和 `title` 中。切页通过 `inert` 和 `aria-hidden` 隔离非当前页，不重建内容，保留草稿和各页滚动位置。页签支持左右方向键、Home、End；快捷入口聚焦目标页。当前页只保留在当前 iframe，重新加载后回到工作台。Esc 尊重控件已取消的事件，展开的原生下拉优先关闭选项；旧浏览器无法判断下拉展开状态时，焦点位于下拉框内由系统处理 Esc。遮罩关闭要求按下与松开均位于窗口外，退出期间再次打开会清除待关闭状态。

主题由 iframe 根元素和宿主弹窗的 `data-theme` 同步控制；`st` 模式从父页面正文读取 `--SmartThemeBodyColor`、`--SmartThemeBlurTintColor`、`--SmartThemeChatTintColor`、`--SmartThemeBorderColor`、`--SmartThemeQuoteColor`、`--SmartThemeEmColor` 和 `--mainFontFamily`，监听父根元素与正文的 `style/class/data-theme` 变化。林系风、浅色的 `--yakit-*` 颜色与纪实一致；深色使用黑灰背景和浅灰强调色，并通过 `--on-accent` 为主按钮配置深色文字。现有组件变量映射到这些主题值，深色导航选中项使用 `--selected` 背景和 `--text` 文字。宿主样式只匹配工作台弹窗，iframe 样式只匹配带 `yakit-workbench` 类的根元素；主题仍使用本工作台的设置保存。

按钮沿用主页的圆角、间距、150ms 颜色过渡与按下缩放，禁用态继续由原有状态控制。预设条目名称可换行，操作按钮行空间不足时自动换行。非提交按钮显式使用 `type="button"`；设计和设置表单仍由提交按钮触发。折叠入口保留原生 `details/summary`，反馈保留原生单选输入，键盘操作由浏览器处理。

设置、预设、版本和试写记录共用原生 `select`。支持 `appearance: base-select` 与 `::picker(select)` 时，弹层跟随控件宽度、限制在 iframe 视口内，最高为 `min(320px, 60dvh)`，超长名称换行、过多选项滚动；背景取 `--paper` 的不透明颜色，选中、悬停与焦点使用主题变量，入场为 160ms 淡入与 4px 位移。原生键盘选择、表单提交和动态连接选项保持原有行为。不支持该特性时使用系统选单，并提供选项文字和背景色；系统可能忽略部分样式。

五页正文、讨论区、文本框和选项弹层共用 `controls.css` 的细滚动条与透明轨道。悬停或焦点进入时显示滑块，触屏常显；浅色使用中性灰，其他主题由强调色生成滑块色。支持 WebKit 滚动条伪元素时宽高均为 4px，其余支持标准属性的浏览器使用 `thin`。

Toast 根节点位于工作台 iframe 的 `body`，五页共用，不挤占正文，也不拦截点击；提示以纯文本写入，通过 `aria-live="polite"` 播报。正常提示使用 `--yakit-text` 背景和 `--yakit-bg` 文字，提醒为纪实的黄色，错误为红底白字。最大宽度为视口减 28px，长文本自动换行。淡入与淡出沿用纪实的 12px 位移和 300ms 过渡，减少动态效果设置继续由共用样式处理。卸载工作台时移除根节点并清理未完成的帧和计时器。

## 公开 API

当前未发布供其他插件消费的稳定 API。以下是内部组件契约，宿主桥位于父页面，控制器与视图位于工作台 iframe。

| 接口 | 职责 |
| --- | --- |
| `YaKitWorkbenchHost.getContext()` | 返回酒馆当前上下文，并提供生成状态、上下文上限、文本模型、世界书选择与静默提示覆盖的只读查询，以及 `refreshPresetEditor()` 刷新预设条目列表 |
| `YaKitWorkbench.createApi(getContext)` | 创建模型请求适配器 |
| `YaKitWorkbench.createPresets(getContext)` | 创建聊天补全预设列表、读取与条目写回适配器 |
| `YaKitWorkbench.createSillyTavernHost(getContext)` | 创建保存、环境、模型及预设适配器 |
| `YaKitWorkbench.createLocalHost()` | 创建原有示例请求与独立浏览器存储适配器，仅预览入口加载 |
| `YaKitWorkbench.captureTrialContext(host, options, scenario)` | 同步深拷贝主 API 连接、实际注入参数和请求开始时的背景条件 |
| `YaKitWorkbench.createWorkbench(host)` | 恢复记录、读取环境并返回控制器 |
| `YaKitWorkbench.mountWorkbench(controller, root)` | 挂载五页工作台，返回解除订阅、主题监听与 Toast 清理函数 |
| `YaKitWorkbench.createToast(document)` | 创建当前文档的轻提示，返回 `{show, dispose}`；`show(message, {type, durationMs})` 默认 `success` / 2300ms，另支持 `warning` 和 `error`，卸载后调用不再显示 |
| `YaKitWorkbench.mountPresets(controller, root, {run, openPage})` | 绑定预设选择、明确重读与草稿写回控件，返回 `{render}` |
| `YaKitWorkbench.mountPresetEntries(controller, root, {run, openPage})` | 绑定全部条目的编辑、逐条保存与草稿载入，返回 `{render, rebase}`；`rebase(state)` 在明确重读成功后更新原文基线 |
| `YaKitWorkbench.mountNavigation(root)` | 返回 `{openPage}`，绑定五页常驻导航与快捷入口；从 `root.ownerDocument` 读取读屏页名，管理键盘焦点与隐藏页 |
| `YaKitWorkbench.mountTheme(controller)` | 返回 `{sync, dispose}`；同步 iframe 与宿主弹窗主题，并可解除宿主主题监听 |
| `YaKitWorkbench.state` / `.prompts` | 状态校验、保存快照、设计消息和答复解析 |

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
| `update(fields)` | 原子校验并更新允许编辑的字段 |
| `design(instruction)` | 使用当前配置、需求、草稿和讨论生成提示词 |
| `saveVersion(label)` | 保存草稿为独立版本；空名称自动编号 |
| `selectVersion(id)` | 选择版本并恢复到草稿，解除此前预设来源绑定 |
| `trial(input)` | 使用主 API 试写选定版本并保存关联 |
| `selectTrial(id)` | 选择已有试写记录 |
| `setFeedback(id, {status, note, excerpt})` | 校验并保存人工反馈 |
| `reviseFromFeedback(id)` | 根据该次试写原版本和已存反馈修订 |
| `cancel()` | 取消生成或忽略迟到的预设读取结果；读取取消不保存工作记录，预设写回期间不执行取消 |
| `exportData()` | 同步返回排除密钥的 JSON 字符串 |

除 `getState`、`subscribe`、`exportData` 外，以上操作返回 Promise；失败时更新 `state.error` 并拒绝 Promise。编辑先同步更新内存，再等待宿主保存调用完成。

| 宿主适配器方法 | 参数与结果 |
| --- | --- |
| `loadState()` | `Promise<object\|null>`，返回酒馆保存记录 |
| `saveState(data)` | `Promise<void>`，更新扩展设置并触发防抖保存 |
| `getEnvironment()` | 返回 `{profiles, mainApiLabel, contextLabel, canTrial}` |
| `listPresets()` | 返回 `{presets: [{name}], selectedPresetName}`；未提供预设管理器时返回空列表与空名称 |
| `readPreset(name)` | 返回 `{name, entries}`；条目含 `identifier/name/content/marker` 和可选 `role`，按默认角色顺序排列 |
| `savePresetEntry({presetName, identifier, content, expectedContent})` | 校验原文后只写目标内容，返回更新后的条目及可选 `notice`；不切换酒馆预设 |
| `design(messages, {settings, signal})` | `Promise<string>`，返回包含 `prompt` 与 `explanation` 的 JSON 文本 |
| `trial({content, input}, {signal})` | 返回 `{content, context}`；条件结构见下表，候选提示词保留原始空白 |

预设适配器方法均返回 Promise。条目优先按 `prompt_order` 中 `character_id: 100001` 的顺序排列，未列入该顺序的条目依次附在后面；不改变原始顺序数据。`marker: true` 的条目可显示但不能载入草稿或保存。保存的 `expectedContent` 必须是载入时原文，`content` 允许空字符串且保留首尾空白。

`messages` 条目为 `{role, content}`，role 取 `system/user/assistant`；`settings` 是上表主题及 API 配置的独立快照。连接配置设计使用配置内的模型、预设和 instruct；自定义接口按所填地址、模型、密钥请求，不读取酒馆已有自定义接口密钥。

### 试写条件

`context` 随试写记录保存、恢复并导出；普通设计消息不包含这些条件。成功返回才建立试写记录，失败或取消不生成正文记录。

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

工作台已打开后，在开发者工具中选择其 iframe 执行以下只读示例：

```javascript
const api = globalThis.YaKitWorkbench;
const host = api.createSillyTavernHost(parent.YaKitWorkbenchHost.getContext);
const saved = await host.loadState();
console.table(api.state.initialState(saved).versions.map(({ id, label }) => ({ id, label })));
const { selectedPresetName } = await host.listPresets();
if (selectedPresetName) console.table((await host.readPreset(selectedPresetName)).entries);
```

## 当前接入状态

| 项目 | 已实现内容与限制 |
| --- | --- |
| 酒馆入口 | 扩展菜单与同源 iframe 工作台；独立 `preview.html` 提供离线演示 |
| 主 API 设计 | 通过 `generateRaw` 仅传设计消息，沿用当前主 API 的生成参数 |
| 副 API 设计 | 支持连接管理配置和自定义 OpenAI 兼容接口，均为非流式请求 |
| 正文试写 | 通过 `generateQuietPrompt` 使用当前聊天，`quietToLoud: false`、`skipWIAN: false` |
| 试写条件 | 开始时记录连接、位置、聊天统计、作者注释及世界书选择，保存恢复和导出保持原快照 |
| 独立演示 | 原有两版提示词及正文、独立 localStorage、反馈与取消；不调用真实模型 |
| 版本与反馈 | 原文保存、不可变版本、正文引用、准确归因及按反馈修订 |
| 预设条目 | 初始化读取当前聊天补全预设；「预设展示」列出全部条目，支持切换预设、逐条编辑保存、载入草稿与写回；独立演示不提供预设接口 |
| 保存与导出 | 使用 `extensionSettings` 与 `saveSettingsDebounced`，支持复制及不含密钥的导出 |
| 尚未接入 | 工作记录导入或删除、条目新增/删除/排序及名称/角色/开关编辑、其他类型预设；未提供独立的跨设备同步功能 |
| 取消限制 | 主 API 无独立 AbortSignal 入口，不调用宿主全局停止接口；取消仅忽略结果，仍等待宿主完成 |
| 兼容性 | 最低 SillyTavern 1.18.0；依赖上述生成与连接服务、宿主上下文，以及现代浏览器的 structuredClone、crypto.randomUUID、AbortController |
| 验收状态 | 本地契约检查已覆盖核心和适配器；真实主副 API 调用及界面交互待用户人工验收 |

连接列表依赖启用的 `connection-manager`、已保存的连接配置和 `ConnectionManagerRequestService.getSupportedProfiles()`。自定义副 API 依赖 `ChatCompletionService.processRequest()`。主 API 的连接状态与当前生成状态由宿主实时读取。试写条件还读取 `getChatCompletionModel`、`getTextGenModel`、`getTextGenServer`、`getMaxContextTokens`、`getPresetManager`、`chatMetadata`、`extensionPrompts`、当前聊天/角色/群组、`powerUserSettings`、世界书模块的 `selected_world_info` / `world_info.charLore`，以及 Prompt Manager 的 `getPromptOrderEntry` / `getPromptById` / `shouldTrigger`。

预设接入依赖 `getPresetManager('openai')` 的 `getPresetList`、`getSelectedPresetName`、`getCompletionPresetByName` 与 `savePreset`。写回复制已保存预设，只替换目标正文，调用 `savePreset(name, next, {skipUpdate: true})`，避免默认列表更新切换当前预设；成功后更新内存中对应条目。当前活动条目无冲突时同步 `chatCompletionSettings`、触发 `saveSettingsDebounced()` 并通过宿主桥 `refreshPresetEditor()` 调用 `promptManager.render(false)` 刷新列表。保存请求失败前不修改宿主内存。

## 开发与验证

UI 代码位于 `ui/`、`styles/`、`style.css` 和页面模板；业务代码位于 `core/`、`host/`。修改 UI 不改业务逻辑，修改业务不改 UI；新增注释使用通俗中文。用户可感知功能同步更新 README，模块、数据流和接口变化同步更新本文。

本地测试由 `.gitignore` 忽略，不随仓库分发：

| 脚本 | 覆盖内容 |
| --- | --- |
| `tests/core.test.mjs` | 版本、反馈归因、正文隔离、取消、格式错误、保存恢复、编辑保护、API 设置快照、密钥导出排除及历史恢复；6 项通过 |
| `tests/presets-core.test.mjs` | 默认预设、草稿与直接保存的隔离、原文基线、清空、失败及占位和重复标识 |
| `tests/presets-host.test.mjs` | 预设列表与顺序、原文冲突、空内容保存及写回期间的宿主编辑 |
| `tests/preset-display.test.mjs` | 全部条目展示、多条编辑、保存期间继续输入、原文冲突与重读、读取失败及切换后的输入保留 |
| `tests/st-host.test.mjs` | 模拟宿主验证请求参数、连接选用、持久化与取消边界；契约检查通过，不调用真实模型 |
| `tests/trial-record.test.mjs` | 从真实适配器到核心，验证试写期间切换条件后原版本归属、保存恢复与导出 |
| `tests/preview-host.test.mjs` | 演示入口隔离、原两版流程、旧存储恢复、可变请求快照与取消 |
| `tests/theme.test.mjs` | 四主题、双容器同步、宿主颜色变化与监听释放 |
| `tests/navigation.test.mjs` | 页签键盘操作、快捷入口、隐藏页隔离与草稿和滚动保留 |
| `tests/launcher.test.mjs` | 已处理的 Esc、展开或收起的原生下拉及旧浏览器选择器兼容 |
| `tests/toast.test.mjs` | 纯文本输出、2300ms 停留、300ms 淡出、状态样式及卸载清理 |
| `tests/toast-routing.test.mjs` | 普通渲染去重、同文案重复操作、订阅与 catch 去重及错误与本地反馈 |
| `tests/dialog-motion.mjs` | 退场完成后关闭、重复关闭、重开与减少动态效果 |

在保留本地测试的工作目录运行：

```bash
node --test tests/*.test.mjs
node tests/dialog-motion.mjs
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

SillyTavern 验收遵循本机 `AGENTS.md` 的人工流程。从扩展菜单打开工作台，在宽屏与窄屏检查五页尺寸随窗口调整、四周留白、滑动切页、独立滚动、关闭按钮和常驻导航；切换四种主题，核对窗口、控件、滚动条与选项弹层。检查长选项换行、键盘选择、关闭与重新打开保留输入，以及系统减少动态效果设置。在「预设展示」核对全部条目、折叠编辑、逐条保存及载入草稿。真实预设写回、模型调用和完整试写流程继续由用户人工验收。
