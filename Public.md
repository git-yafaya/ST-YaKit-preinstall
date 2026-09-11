# ST-YaKit-preinstall 开发说明

这是 YaKit 系列的 SillyTavern 提示词工作台，使用原生 JavaScript、HTML 和 CSS，无依赖安装和构建步骤。

## 仓库结构

```text
ST-YaKit-preinstall/
├── .gitignore                 # 排除本地资料、测试、环境配置及缓存
├── README.md                  # 用户安装、配置与使用说明
├── Public.md                  # 模块、数据流与接口契约
├── manifest.json              # 酒馆扩展入口、版本及兼容性声明
├── index.js                   # 发布宿主上下文桥并挂载入口
├── index.html                 # 同源页面、共用顶部控件与脚本加载顺序
├── app.js                     # 创建宿主适配器、核心和视图
├── style.css                  # 主题、控件、页面与导航样式加载入口
├── styles/
│   ├── theme.css              # 四套主题与工作台变量映射
│   ├── controls.css           # 按钮、输入、选项弹层与滚动条
│   ├── pages.css              # 四页卡片、编辑与阅读布局
│   ├── navigation.css         # 顶栏、导航指示器与切页轨道
│   └── launcher.css           # 菜单图标、弹窗尺寸与进退场
├── core/
│   ├── state.js               # 设置校验、记录恢复与保存快照
│   ├── prompts.js             # 设计消息、答复解析与反馈指令
│   └── workbench.js           # 草稿、版本、试写及异步状态控制
├── host/
│   ├── api.js                 # 主副 API 设计与主 API 正文请求
│   └── st-host.js             # 酒馆设置读写与当前环境查询
├── ui/
│   ├── workbench.svg          # 扩展菜单的工作台图标
│   ├── launcher.js            # 扩展菜单、样式加载与弹窗事件绑定
│   ├── dialog-motion.js       # 统一关闭动画与重新打开状态
│   ├── workbench-template.js  # 四页轨道、顶部导航与工作台模板
│   ├── workbench-view.js      # 状态渲染、事件、复制与下载
│   ├── navigation-view.js     # 四页切换、导航收放与键盘焦点
│   ├── trial-template.js      # 独立试写与反馈页面
│   ├── versions-template.js   # 版本选择、原文预览与导出页面
│   ├── settings-template.js   # API 与主题设置模板
│   ├── settings-view.js       # 设置提交与主题渲染调用
│   └── theme-view.js          # 内外主题同步与酒馆配色监听
├── tests/                     # 本地忽略目录，不随仓库分发
│   ├── core.test.mjs          # 核心状态与业务边界检查
│   ├── st-host.test.mjs       # 宿主适配器与请求契约检查
│   ├── theme.test.mjs         # 主题同步与宿主变量检查
│   ├── navigation.test.mjs    # 切页、键盘焦点与输入保留检查
│   ├── launcher.test.mjs      # 原生下拉与退出键事件检查
│   └── dialog-motion.mjs      # 关闭、重新打开与减少动效检查
└── AGENTS.md                  # 本机共享规则软链接，不入库
```

## 加载与数据流

扩展菜单入口显示「工作台」，图标由 `styles/launcher.css` 以 CSS 遮罩引用 `ui/workbench.svg`，使用 1em 尺寸和 `currentColor` 跟随菜单文字；图标设置 `aria-hidden`，按钮名称由文字提供。

1. 酒馆根据 `manifest.json` 加载 ES 模块 `index.js`。入口读取 `/script.js` 的 `isGenerating`，将实时 `SillyTavern.getContext()` 包装为 `globalThis.YaKitWorkbenchHost.getContext()`，并挂载扩展菜单入口。
2. 用户首次打开「工作台」时，同源 iframe 加载 `index.html`；关闭对话框仅隐藏容器，保留页面和未提交输入。顶部控件静态位于 `#app` 外，`launcher.js` 在 iframe 加载后将关闭按钮绑定到统一退场函数，应用启动报错时仍保留关闭入口。宿主加载限定到工作台弹窗的 `theme.css` 与 `launcher.css`；iframe 通过 `style.css` 加载界面样式，脚本按 `state → prompts → workbench → api → st-host → settings-template → theme-view → settings-view → trial-template → versions-template → workbench-template → navigation-view → workbench-view → app` 顺序加载，内部协作命名空间为 `globalThis.YaKitWorkbench`。
3. `app.js` 通过父页面桥创建 `createSillyTavernHost(getContext)`，再创建控制器、恢复保存记录并读取连接列表和当前聊天。页面重新获得焦点时刷新环境；脱离酒馆直接打开页面会显示入口错误。
4. 需求与草稿输入立即更新内存并排队保存，保留首尾空格和换行。设计请求固定开始时的设置快照，将需求、源草稿、历史设计讨论及本次要求组成消息数组，不附带当前聊天或此前试写正文。
5. 主 API 设计使用 `generateRaw({prompt, instructOverride: true, trimNames: false})`；副 API 连接配置使用 `ConnectionManagerRequestService.sendRequest`；自定义接口使用 `ChatCompletionService.processRequest`。副 API 请求均关闭流式输出、输出上限为 4096 token。
6. 设计答复必须是含 `prompt` 和 `explanation` 字符串的 JSON，也接受完整 JSON 代码围栏。原始答复进入讨论记录，界面显示修改说明并提供「查看提示词」折叠区，解析成功后更新草稿。保存版本时生成独立 ID、名称和时间，已保存版本保持不变。
7. 试写要求选定版本与当前草稿完全一致。请求仅传 `{content, input}`，适配器通过主 API 的 `generateQuietPrompt`，把候选提示词与试写要求放进 `quietPrompt`，使用当前聊天背景、世界书及作者注释。返回正文写入工作台记录，不自动追加聊天消息。
8. 每次试写保存请求开始时的 `versionId`、输入、时间和聊天来源。按反馈修改时找回该试写的源版本，仅在用户提交后将评价、意见及引用片段交给设计模型；没有片段时交回该次完整正文。
9. 新建议进入草稿，保存后成为下一版。「版本记录」选择已有版本并只读显示其原文和保存时间，选择行为仍将该版本载入草稿。该页导出从当前内存生成 JSON，排除 `secondaryKey`；「工作台」中的复制取当前草稿。

### 边界与持久化

| 情况 | 当前处理 |
| --- | --- |
| 空需求、空设计要求、空草稿或空试写要求 | 提交失败并显示错误；编辑时允许暂存空白 |
| 副 API 连接未选、已失效或列表为空 | 明确报错，不回退主 API，也不自动选择其他连接 |
| 自定义地址或模型缺失 | 发起设计前阻止请求；地址只接受 HTTP(S)，适配器还拒绝地址内嵌凭据和密钥换行 |
| 自定义密钥为空 | 显式发送空认证头，不借用酒馆已有自定义接口密钥 |
| 未打开角色或群组聊天、主 API 未连接 | 禁用试写或在请求时提示；已打开角色的新聊天可试写 |
| 主 API 正在生成 | 拒绝并行主 API 请求；副 API 通过各自服务请求 |
| 草稿与选中版本不同 | 阻止试写，要求先保存新版本 |
| 生成期间修改需求、草稿或选择版本 | 答复保留在讨论，避免覆盖期间编辑 |
| 生成期间更新 API 设置 | 已开始请求继续使用开始时的设置快照 |
| 试写期间改变版本 | 结果仍关联请求开始时的版本 |
| 取消操作 | 核心清空忙碌状态并忽略迟到答复；副 API 传递 AbortSignal，主 API 等宿主请求结束后释放占用 |
| 答复格式不正确 | 原始答复保留在讨论，既有草稿不改动 |
| 未评价或修改意见为空 | 阻止按反馈修改；评价可以单独保存 |
| 引用不属于该次正文 | 拒绝保存，保留此前反馈 |
| 当前版本与反馈来源不同 | 按试写记录的 `versionId` 使用原版本 |
| 保存调用失败 | 保留内存内容并提示导出；后续保存成功清除对应旧错误 |
| 读取保存内容失败 | 显示错误，仍可编辑和导出 |
| 部分历史记录不完整 | 过滤缺少必要字段的记录及找不到原版本的试写 |
| 旧配置与试写记录 | `profileId` 映射到 `secondaryProfileId`；保留旧试写 `context`，新请求不再使用插入位置与深度字段 |

记录位于 `extensionSettings.yakitPromptWorkbench`，经 `saveSettingsDebounced()` 交给酒馆保存。核心按顺序提交完整深拷贝，防止旧保存覆盖新编辑；宿主的防抖保存不提供逐次落盘确认，工作台只能感知读取或调用阶段抛出的错误。

持久化内容包括设置、需求、草稿、讨论、版本、试写、反馈和选中记录。`profiles/mainApiLabel/contextLabel/canTrial/busy/error/notice` 不持久化。主题切换立即保存，其余 API 设置通过「保存设置」提交。未提交的设计要求、试写要求、版本名称和反馈编辑框属于视图临时内容。

导出结构为 `{formatVersion: 1, ...savedState}`，其中排除副 API 密钥。未提供导入、记录删除或直接写回预设的入口。

## 设置与主题

| 字段 | 默认值或含义 |
| --- | --- |
| `theme` | 默认 `st`（跟随酒馆）；另支持 `forest`（林系风）、`light`、`dark` |
| `designApi` | `main`；可取 `main`、`secondary` |
| `secondarySource` | `profile`；可取 `profile`、`custom` |
| `secondaryProfileId` | 空字符串；连接管理中可用配置的 ID |
| `secondaryUrl` | 空字符串；OpenAI 兼容接口基础地址 |
| `secondaryModel` | 空字符串；自定义接口的模型名 |
| `secondaryKey` | 空字符串；随酒馆设置保存，导出时剔除 |
| `goal` / `draft` | 空字符串；编辑和保存保留原始空白 |
| `profiles` | 环境提供的真实连接列表，条目为 `{id, name}` |
| `mainApiLabel` | 当前酒馆 `mainApi`，仅用于展示 |
| `contextLabel` | 当前角色或群组名及聊天 ID；无聊天时显示提示 |
| `canTrial` | 已选角色或群组、具备静默生成接口且主 API 非断开状态时为真 |
| `feedback.status` | 新试写为 `pending`；评价为 `satisfied` 或 `revise` |
| `feedback.note` / `excerpt` | 默认空；提交时去除首尾空白，引用须属于该次正文 |

设置字段统一在核心校验，未知字段和非法枚举拒绝更新。副 API 完整性在发起设计时检查，允许先保存未填完的配置。正文 API 始终使用当前主 API。

顶部导航提供工作台、试写与反馈、版本记录、设置四个页面。工作台在宽屏并排显示需求讨论与提示词编辑，小屏纵向排列；四页共用固定窗口和独立滚动正文。界面规范与 YaKit 纪实保持一致，样式保存在本仓库。

| 界面项 | 当前规则 |
| --- | --- |
| 窗口尺寸 | 高度 `min(680px, 100dvh - 24px)`；宿主视口不足 960px 时宽 `min(560px, 92vw)`，达到 960px 后宽 `min(1040px, 92vw)` |
| 顶栏与卡片 | 顶栏高 56px，导航开关与关闭按钮均为 32px；窗口圆角 20px，卡片圆角 12px |
| 页面留白 | 默认上下 20px、左右 24px；iframe 视口不超过 480px 时为 14px |
| 切页 | 四页常驻同一轨道，正文与导航指示器同步平移；240ms，`cubic-bezier(0.16, 1, 0.3, 1)` |
| 窗口进退场 | 240ms 淡入或淡出，缩放从或至 0.98；关闭按钮、Esc、遮罩共用退场函数 |
| 减少动态效果 | 停用过渡与动画，关闭直接完成 |

顶栏固定留在正文上方，保留导航开关与关闭按钮，当前页面名称仅供读屏。导航开关在导航挂载前禁用；收起后导航不占布局空间，也不可通过键盘聚焦。切页通过 `inert` 和 `aria-hidden` 隔离非当前页，不重建内容，保留草稿和各页滚动位置。页签支持左右方向键、Home、End；快捷入口聚焦目标页。当前页与导航收放状态只保留在当前 iframe，重新加载后回到工作台和展开导航。Esc 尊重控件已取消的事件，展开的原生下拉优先关闭选项；旧浏览器无法判断下拉展开状态时，焦点位于下拉框内由系统处理 Esc。遮罩关闭要求按下与松开均位于窗口外，退出期间再次打开会清除待关闭状态。

主题由 iframe 根元素和宿主弹窗的 `data-theme` 同步控制；`st` 模式从父页面正文读取 `--SmartThemeBodyColor`、`--SmartThemeBlurTintColor`、`--SmartThemeChatTintColor`、`--SmartThemeBorderColor`、`--SmartThemeQuoteColor`、`--SmartThemeEmColor` 和 `--mainFontFamily`，监听父根元素与正文的 `style/class/data-theme` 变化。林系风、浅色、深色的 `--yakit-*` 颜色与纪实一致；现有组件变量映射到这些主题值。宿主样式只匹配工作台弹窗，iframe 样式只匹配带 `yakit-workbench` 类的根元素；主题仍使用本工作台的设置保存。

设置、版本和试写记录共用原生 `select`。支持 `appearance: base-select` 与 `::picker(select)` 时，弹层跟随控件宽度、限制在 iframe 视口内，最高为 `min(320px, 60dvh)`，超长名称换行、过多选项滚动；背景取 `--paper` 的不透明颜色，选中、悬停与焦点使用主题变量，入场为 160ms 淡入与 4px 位移。原生键盘选择、表单提交和动态连接选项保持原有行为。不支持该特性时使用系统选单，并提供选项文字和背景色；系统可能忽略部分样式。

四页正文、讨论区、文本框和选项弹层共用 `controls.css` 的细滚动条与透明轨道。悬停或焦点进入时显示滑块，触屏常显；浅色使用中性灰，其他主题由强调色生成滑块色。支持 WebKit 滚动条伪元素时宽高均为 4px，其余支持标准属性的浏览器使用 `thin`。

## 公开 API

当前未发布供其他插件消费的稳定 API。以下是内部组件契约，宿主桥位于父页面，控制器与视图位于工作台 iframe。

| 接口 | 职责 |
| --- | --- |
| `YaKitWorkbenchHost.getContext()` | 返回酒馆当前上下文及 `isGenerating` |
| `YaKitWorkbench.createApi(getContext)` | 创建模型请求适配器 |
| `YaKitWorkbench.createSillyTavernHost(getContext)` | 创建保存、环境及模型适配器 |
| `YaKitWorkbench.createWorkbench(host)` | 恢复记录、读取环境并返回控制器 |
| `YaKitWorkbench.mountWorkbench(controller, root)` | 挂载四页工作台，返回解除订阅与主题监听函数 |
| `YaKitWorkbench.mountNavigation(root)` | 绑定四页导航、快捷入口与导航收放；从 `root.ownerDocument` 读取顶部开关和读屏页名，管理键盘焦点与隐藏页 |
| `YaKitWorkbench.mountTheme(controller)` | 返回 `{sync, dispose}`；同步 iframe 与宿主弹窗主题，并可解除宿主主题监听 |
| `YaKitWorkbench.state` / `.prompts` | 状态校验、保存快照、设计消息和答复解析 |

| 控制器方法 | 参数与结果 |
| --- | --- |
| `getState()` | 返回完整状态深拷贝，外部改动不写回核心 |
| `subscribe(listener)` | 状态变化时提供快照，返回取消订阅函数 |
| `refreshEnvironment()` | 更新连接列表、主 API 类型与当前聊天信息 |
| `update(fields)` | 原子校验并更新允许编辑的字段 |
| `design(instruction)` | 使用当前配置、需求、草稿和讨论生成提示词 |
| `saveVersion(label)` | 保存草稿为独立版本；空名称自动编号 |
| `selectVersion(id)` | 选择版本并恢复到草稿 |
| `trial(input)` | 使用主 API 试写选定版本并保存关联 |
| `selectTrial(id)` | 选择已有试写记录 |
| `setFeedback(id, {status, note, excerpt})` | 校验并保存人工反馈 |
| `reviseFromFeedback(id)` | 根据该次试写原版本和已存反馈修订 |
| `cancel()` | 取消当前工作台操作并保存已有状态 |
| `exportData()` | 同步返回排除密钥的 JSON 字符串 |

除 `getState`、`subscribe`、`exportData` 外，以上操作返回 Promise；失败时更新 `state.error` 并拒绝 Promise。编辑先同步更新内存，再等待宿主保存调用完成。

| 宿主适配器方法 | 参数与结果 |
| --- | --- |
| `loadState()` | `Promise<object\|null>`，返回酒馆保存记录 |
| `saveState(data)` | `Promise<void>`，更新扩展设置并触发防抖保存 |
| `getEnvironment()` | 返回 `{profiles, mainApiLabel, contextLabel, canTrial}` |
| `design(messages, {settings, signal})` | `Promise<string>`，返回包含 `prompt` 与 `explanation` 的 JSON 文本 |
| `trial({content, input}, {signal})` | 返回 `{content, context}`；context 含 `source/api/chatId/character/groupId/scenario` |

`messages` 条目为 `{role, content}`，role 取 `system/user/assistant`；`settings` 是上表主题及 API 配置的独立快照。连接配置设计使用配置内的模型、预设和 instruct；自定义接口按所填地址、模型、密钥请求，不读取酒馆已有自定义接口密钥。

工作台已打开后，在开发者工具中选择其 iframe 执行以下只读示例：

```javascript
const api = globalThis.YaKitWorkbench;
const host = api.createSillyTavernHost(parent.YaKitWorkbenchHost.getContext);
const saved = await host.loadState();
console.table(api.state.initialState(saved).versions.map(({ id, label }) => ({ id, label })));
```

## 当前接入状态

| 项目 | 已实现内容与限制 |
| --- | --- |
| 酒馆入口 | 扩展菜单与同源 iframe 工作台；无独立页面启动模式 |
| 主 API 设计 | 通过 `generateRaw` 仅传设计消息，沿用当前主 API 的生成参数 |
| 副 API 设计 | 支持连接管理配置和自定义 OpenAI 兼容接口，均为非流式请求 |
| 正文试写 | 通过 `generateQuietPrompt` 使用当前聊天，`quietToLoud: false`、`skipWIAN: false` |
| 版本与反馈 | 原文保存、不可变版本、正文引用、准确归因及按反馈修订 |
| 保存与导出 | 使用 `extensionSettings` 与 `saveSettingsDebounced`，支持复制及不含密钥的导出 |
| 尚未接入 | 导入、删除记录、自动写回预设；未提供独立的跨设备同步功能 |
| 取消限制 | 主 API 无独立 AbortSignal 入口，不调用宿主全局停止接口；取消仅忽略结果，仍等待宿主完成 |
| 兼容性 | 最低 SillyTavern 1.18.0；依赖上述生成与连接服务、宿主上下文，以及现代浏览器的 structuredClone、crypto.randomUUID、AbortController |
| 验收状态 | 本地契约检查已覆盖核心和适配器；真实主副 API 调用及界面交互待用户人工验收 |

连接列表依赖启用的 `connection-manager`、已保存的连接配置和 `ConnectionManagerRequestService.getSupportedProfiles()`。自定义副 API 依赖 `ChatCompletionService.processRequest()`。主 API 的连接状态与当前生成状态由宿主实时读取。

## 开发与验证

UI 代码位于 `ui/`、`styles/`、`style.css` 和页面模板；业务代码位于 `core/`、`host/`。修改 UI 不改业务逻辑，修改业务不改 UI；新增注释使用通俗中文。用户可感知功能同步更新 README，模块、数据流和接口变化同步更新本文。

本地测试由 `.gitignore` 忽略，不随仓库分发：

| 脚本 | 覆盖内容 |
| --- | --- |
| `tests/core.test.mjs` | 版本、反馈归因、正文隔离、取消、格式错误、保存恢复、编辑保护、API 设置快照、密钥导出排除及历史恢复；6 项通过 |
| `tests/st-host.test.mjs` | 模拟宿主验证请求参数、连接选用、持久化与取消边界；契约检查通过，不调用真实模型 |
| `tests/theme.test.mjs` | 四主题、双容器同步、宿主颜色变化与监听释放 |
| `tests/navigation.test.mjs` | 页签键盘操作、快捷入口、隐藏页隔离与草稿和滚动保留 |
| `tests/launcher.test.mjs` | 已处理的 Esc、展开或收起的原生下拉及旧浏览器选择器兼容 |
| `tests/dialog-motion.mjs` | 退场完成后关闭、重复关闭、重开与减少动态效果 |

在保留本地测试的工作目录运行：

```bash
node --test tests/*.test.mjs
node tests/dialog-motion.mjs
for file in index.js app.js core/*.js host/*.js ui/*.js; do node --check "$file" || exit; done
git diff --check
```

6 项核心测试、宿主契约检查、全部 JavaScript 语法检查与 `git diff --check` 已通过。本机已核对运行中的 Docker 为 SillyTavern 1.18.0，并确认 `script.js`、`st-context.js`、`extensions/shared.js` 与本地参考源码哈希一致。静态和模拟宿主检查不代表真实模型或界面验收完成。

v0.2.1 分区调整另已通过 UI 脚本语法、入口加载顺序、模板标签嵌套与控件引用、CSS 语法检查。

v0.2.5 已通过四主题同步、导航焦点与输入保留、原生下拉 Esc 和弹窗进退场的模拟检查；已核对模板结构、资源路径、六个样式文件的结构、JavaScript 语法与版本一致性。

SillyTavern 验收遵循本机 `AGENTS.md` 的人工流程。从扩展菜单打开工作台，在宽屏与窄屏检查四页尺寸、滑动切页、独立滚动、顶部控件和导航收放；切换四种主题，核对窗口、控件、滚动条与选项弹层。检查长选项换行、键盘选择、关闭与重新打开保留输入，以及系统减少动态效果设置。真实模型调用和完整试写流程继续由用户人工验收。
