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
├── index.html                 # 同源工作台页面与脚本加载顺序
├── app.js                     # 创建宿主适配器、核心和视图
├── style.css                  # 四页共用的主题、布局、滚动条及微动效
├── core/
│   ├── state.js               # 设置校验、记录恢复与保存快照
│   ├── prompts.js             # 设计消息、答复解析与反馈指令
│   └── workbench.js           # 草稿、版本、试写及异步状态控制
├── host/
│   ├── api.js                 # 主副 API 设计与主 API 正文请求
│   └── st-host.js             # 酒馆设置读写与当前环境查询
├── ui/
│   ├── launcher.js            # 扩展菜单入口与工作台容器
│   ├── workbench-template.js  # 页面容器、侧栏与工作台双栏模板
│   ├── workbench-view.js      # 状态渲染、事件、复制与下载
│   ├── navigation-view.js     # 四页切换与侧栏显示控制
│   ├── trial-template.js      # 独立试写与反馈页面
│   ├── versions-template.js   # 版本选择、原文预览与导出页面
│   ├── settings-template.js   # API 与主题设置模板
│   └── settings-view.js       # 设置提交与酒馆主题同步
├── tests/                     # 本地忽略目录，不随仓库分发
│   ├── core.test.mjs          # 核心状态与业务边界检查
│   └── st-host.test.mjs        # 宿主适配器与请求契约检查
└── AGENTS.md                  # 本机共享规则软链接，不入库
```

## 加载与数据流

1. 酒馆根据 `manifest.json` 加载 ES 模块 `index.js`。入口读取 `/script.js` 的 `isGenerating`，将实时 `SillyTavern.getContext()` 包装为 `globalThis.YaKitWorkbenchHost.getContext()`，并挂载扩展菜单入口。
2. 用户首次打开「YaKit 提示词工作台」时，同源 iframe 加载 `index.html`；关闭对话框仅隐藏容器，保留页面和未提交输入。iframe 隔离工作台 CSS，脚本按 `state → prompts → workbench → api → st-host → settings-template → settings-view → trial-template → versions-template → workbench-template → navigation-view → workbench-view → app` 顺序加载，内部协作命名空间为 `globalThis.YaKitWorkbench`。
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
| `theme` | `st`；可取 `st`、`light`、`dark` |
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

侧栏提供工作台、试写与反馈、版本记录、设置四个页面。工作台为需求讨论和提示词编辑双栏，保存版本的操作留在草稿下方；试写页单独承载正文阅读和反馈。所有页面共用 `style.css` 的尺寸、留白、按钮及 160 毫秒过渡规则。

主区工具栏中的按钮控制侧栏显隐；收起时侧栏不占布局空间，也不可通过键盘聚焦，展开按钮保持可见。导航用 `hidden` 切换现有页面节点，保留未提交输入；页面选择及侧栏状态只保留在当前 iframe，重新加载后默认工作台和展开侧栏。各页快捷入口复用同一切页方法。

根元素 `data-theme` 控制主题；`st` 模式同步父页面的 `--SmartThemeBodyColor`、`--SmartThemeBlurTintColor`、`--SmartThemeChatTintColor`、`--SmartThemeBorderColor`、`--SmartThemeQuoteColor` 和 `--mainFontFamily`，监听父根元素的 `style/class/data-theme` 变化。浅色与深色使用本地主题值；响应式布局和 `prefers-reduced-motion` 规则统一应用。

iframe 根页面、讨论区与文本框共用随主题配色的细滚动条，轨道透明；样式位于 `style.css`，统一覆盖四个页面。滑块颜色使用 `--muted`；支持 WebKit 滚动条伪元素的浏览器使用 8px 宽高及圆角，悬停时使用 `--accent`，并重置标准属性以免覆盖伪元素样式；其余支持标准属性的浏览器使用 `thin` 宽度。

## 公开 API

当前未发布供其他插件消费的稳定 API。以下是内部组件契约，宿主桥位于父页面，控制器与视图位于工作台 iframe。

| 接口 | 职责 |
| --- | --- |
| `YaKitWorkbenchHost.getContext()` | 返回酒馆当前上下文及 `isGenerating` |
| `YaKitWorkbench.createApi(getContext)` | 创建模型请求适配器 |
| `YaKitWorkbench.createSillyTavernHost(getContext)` | 创建保存、环境及模型适配器 |
| `YaKitWorkbench.createWorkbench(host)` | 恢复记录、读取环境并返回控制器 |
| `YaKitWorkbench.mountWorkbench(controller, root)` | 挂载四页工作台，返回解除订阅与主题监听函数 |
| `YaKitWorkbench.mountNavigation(root)` | 绑定四页导航、快捷入口和侧栏显隐，页面状态保留在当前界面 |
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

UI 代码位于 `ui/`、`style.css` 和页面模板；业务代码位于 `core/`、`host/`。修改 UI 不改业务逻辑，修改业务不改 UI；新增注释使用通俗中文。用户可感知功能同步更新 README，模块、数据流和接口变化同步更新本文。

本地测试由 `.gitignore` 忽略，不随仓库分发：

| 脚本 | 覆盖内容 |
| --- | --- |
| `tests/core.test.mjs` | 版本、反馈归因、正文隔离、取消、格式错误、保存恢复、编辑保护、API 设置快照、密钥导出排除及历史恢复；6 项通过 |
| `tests/st-host.test.mjs` | 模拟宿主验证请求参数、连接选用、持久化与取消边界；契约检查通过，不调用真实模型 |

在保留本地测试的工作目录运行：

```bash
node --test tests/*.test.mjs
for file in index.js app.js core/*.js host/*.js ui/*.js; do node --check "$file" || exit; done
git diff --check
```

6 项核心测试、宿主契约检查、全部 JavaScript 语法检查与 `git diff --check` 已通过。本机已核对运行中的 Docker 为 SillyTavern 1.18.0，并确认 `script.js`、`st-context.js`、`extensions/shared.js` 与本地参考源码哈希一致。静态和模拟宿主检查不代表真实模型或界面验收完成。

v0.2.1 分区调整另已通过 UI 脚本语法、入口加载顺序、模板标签嵌套与控件引用、CSS 语法检查。

SillyTavern 验收遵循本机 `AGENTS.md` 的人工流程。用户从扩展菜单打开工作台，确认四页切换、侧栏收放与主题；在三种主题下检查长页面、讨论区和长文本框的滚动条配色与滚动操作。分别尝试主 API 和所需副 API，完成两版提示词及对应试写、反馈，再检查取消、复制、导出和重新打开恢复。
