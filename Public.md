# ST-YaKit-preinstall 开发说明

这是 YaKit 提示词工作台的独立交互预览，使用原生 JavaScript、HTML 和 CSS，无依赖安装和构建步骤，打开 `index.html` 即启动。

## 仓库结构

```text
ST-YaKit-preinstall/
├── .gitignore                 # 排除本地资料、测试、环境配置及缓存
├── README.md                  # 用户体验流程与当前能力
├── Public.md                  # 模块、数据流及预览内部契约
├── index.html                 # 页面入口与脚本加载顺序
├── app.js                     # 创建本地适配器、核心和视图
├── style.css                  # 页面主题、布局、响应式及微动效
├── core/
│   ├── state.js               # 数据校验、恢复与保存快照
│   ├── prompts.js             # 设计消息、答复解析与反馈指令
│   └── workbench.js           # 草稿、版本、试写及异步状态控制
├── preview/
│   ├── examples.js            # NPC 认知边界的预置需求、提示词与正文
│   └── local-host.js          # 本地保存和可取消的示例响应
├── ui/
│   ├── workbench-template.js  # 工作台静态界面模板
│   └── workbench-view.js      # 状态渲染、事件绑定、复制与下载
├── tests/                     # 本地忽略目录，不随仓库分发
│   ├── core.test.mjs          # 核心状态及业务边界检查
│   └── preview.test.mjs       # 本地示例适配器与流程检查
└── AGENTS.md                  # 本机共享规则软链接，不入库
```

## 加载与数据流

1. `index.html` 通过 `defer` 按顺序载入 `state → prompts → workbench → examples → local-host → template → view → app`。各脚本使用 IIFE，并将协作接口挂到 `globalThis.YaKitPreview`；本地文件直接打开无需模块服务器。
2. `app.js` 创建本地适配器，再调用 `createWorkbench(host)`。首次打开装入 NPC 认知边界需求，草稿和记录为空；存在本地数据时先恢复，随后读取演示连接与场景信息。
3. 需求和草稿每次输入同步更新内存，再顺序写入本地存储，保留首尾空格和换行。用户提交设计要求后，核心构造需求、源草稿、历史设计讨论和本次要求的消息数组。
4. 本地适配器延迟约 650 毫秒展示示例响应。源草稿包含第一版或第二版的特定标记时返回第二版，否则返回第一版；修改需求或意见不会产生任意新稿，继续修订仍使用这两份预置提示词。
5. 设计答复以 `{prompt, explanation}` JSON 返回，也接受完整 JSON 代码围栏。核心保留原始答复，解析成功后更新草稿；保存版本时生成新 ID、名称和时间，将当时草稿作为独立快照。
6. 试写必须选择已保存且与草稿一致的版本。核心在请求开始时固定版本、场景输入和使用位置；适配器按提示词是否包含第二版标记返回一份预置正文。记录保存 `versionId`、正文、输入、生成时间、示例来源及本次条件。
7. 用户对某次试写选择满意或需改，保存意见与可选引用。点击按反馈修改时，核心使用该试写的原始版本，连同意见及引用片段构造新指令；未引用片段时明确交回该次完整正文。
8. 新建议进入草稿，用户再次保存形成下一版。历史版本、试写和反馈继续保留；复制取当前草稿，导出取当前内存快照。

### 边界与持久化

| 情况 | 当前处理 |
| --- | --- |
| 空需求、空设计要求、空草稿或空试写场景 | 对应提交失败并显示错误；编辑器允许暂存空白内容 |
| 草稿与选定版本不同 | 阻止试写，要求先保存新版本 |
| 已保存版本被重新选择 | 将该版本正文恢复到草稿；版本自身保持不变 |
| 生成期间继续编辑需求、草稿或切换版本 | 已返回的建议保留在讨论中，不覆盖期间的编辑 |
| 试写期间草稿或版本改变 | 结果仍关联请求开始时的版本与条件 |
| 同时发起多个生成操作 | 只允许一个活动操作，其余返回忙碌提示 |
| 取消操作 | 发出 `AbortSignal`，清空忙碌状态，保留草稿和记录；迟到结果不写入 |
| 答复为空、结构不正确或发生错误 | 保留既有草稿；可用的原答复保留在讨论中供查看 |
| 尚未评价或修改意见为空 | 阻止按反馈修改；满意/需改的评价可以单独保存 |
| 引用不属于该条正文 | 拒绝保存反馈，保留此前反馈 |
| 当前选中版本与反馈来源版本不同 | 按试写记录的 `versionId` 找回源版本进行修改 |
| 修改了演示场景 | 同时保留用户输入与实际预置场景，说明正文仍来自固定示例 |
| 本地保存失败 | 内存中的编辑与记录保留，提示导出；后续保存成功会清除对应旧错误 |
| 本地数据无法读取或 JSON 损坏 | 显示读取失败，提供可继续编辑和导出的空工作台 |
| 部分记录不完整 | 恢复时过滤缺少必要字段的记录，以及找不到原版本的试写 |

保存使用 `localStorage`，键为 `yakit.prompt-workbench.preview.v1`。每次写入使用完整独立快照并排队执行，防止旧写入覆盖新编辑。保存内容包含需求、草稿、设计讨论、连接/位置选项、版本、试写、反馈及选中记录；环境列表和 `busy/error/notice` 不持久化。

尚未提交的设计输入、试写场景编辑框、版本名称和反馈编辑框属于视图临时内容；只有实际发起操作或保存反馈后，相应内容才进入工作记录。导出返回带 `formatVersion: 1` 的 JSON；当前未提供导入、记录删除或跨浏览器同步入口。

## 设置与主题

| 字段或能力 | 默认值与含义 |
| --- | --- |
| `goal` | 首次装入 NPC 认知边界示例需求，可自由编辑 |
| `draft` | 首次为空，手动编辑或载入示例后形成草稿 |
| `profileId` | `local-example`，唯一演示工作台连接 |
| `injectionMode` | `append`；核心接受 `append` / `replace` |
| `targetPromptId` | `sample-rule`，演示位置“角色行为约束” |
| `depth` | `1`；核心接受非负整数 |
| `contextLabel` | “伊恩与丢失的钥匙 · 预置场景” |
| `canTrial` | 本地示例适配器返回 `true` |
| `feedback.status` | 新试写为 `pending`；用户选择 `satisfied` 或 `revise` |
| `feedback.note` / `excerpt` | 默认空；提交时去除首尾空白，引用需属于原正文 |

当前 UI 展示示例环境，但未提供连接、插入模式、位置或深度的配置控件；这些字段属于核心与适配器的内部约定。本地正文按示例标记选取，位置和深度仅随记录保存。

样式集中在 `style.css`，统一使用 `--accent`、`--accent-dark`、`--line`、`--muted`、`--paper` 和 `--radius` 变量。当前为浅色主题，三栏在窄屏转为两栏或单栏；按钮交互使用约 160 毫秒过渡，忙碌状态使用旋转提示，`prefers-reduced-motion` 时关闭动画与过渡。新增界面应复用主界面的尺寸和动效规则。

## 公开 API

当前没有面向其他插件发布的 API。以下是 **预览内部组件契约**，通过 `globalThis.YaKitPreview` 协作，不代表稳定的对外接口。

| 接口 | 职责 |
| --- | --- |
| `createLocalHost()` | 创建本地存储和示例响应适配器 |
| `createWorkbench(host)` | 异步创建状态控制器，完成恢复和环境读取 |
| `mountWorkbench(controller, root)` | 挂载界面并订阅状态，返回解除状态订阅的函数 |
| `workbenchTemplate` | 静态界面模板字符串 |
| `examples` | 预置需求、场景、两版提示词、两份正文和初始数据 |
| `state` / `prompts` | 核心内部校验、恢复、设计消息及答复解析函数 |

控制器契约：

| 方法 | 参数与结果 |
| --- | --- |
| `getState()` | 返回完整状态深拷贝，调用方修改它不会写回核心 |
| `subscribe(listener)` | 状态变化时传入快照，返回取消订阅函数 |
| `refreshEnvironment()` | 更新连接、目标列表和背景信息 |
| `update(fields)` | 更新允许编辑的字段；类型非法时拒绝 |
| `design(instruction)` | 根据当前需求、草稿和讨论请求下一份示例 |
| `saveVersion(label)` | 保存完整草稿为新版本；空名称自动编号 |
| `selectVersion(id)` | 选择已存版本并恢复其草稿 |
| `trial(input)` | 对选定版本试写并记录绑定关系 |
| `selectTrial(id)` | 选择已有试写记录 |
| `setFeedback(trialId, {status, note, excerpt})` | 校验并保存本次人工反馈 |
| `reviseFromFeedback(trialId)` | 基于该次试写的源版本与已存反馈修改 |
| `cancel()` | 取消当前操作并保存现有状态 |
| `exportData()` | 同步返回工作记录 JSON 字符串 |

除 `getState`、`subscribe`、`exportData` 外，上述操作返回 Promise；失败时拒绝 Promise，并更新 `state.error`。简单编辑先同步更新内存，再等待本地保存。

适配器契约：

| 方法 | 参数与返回值 |
| --- | --- |
| `loadState()` | `Promise<object\|null>`，返回保存记录或初始数据 |
| `saveState(data)` | `Promise<void>`，保存快照 |
| `getEnvironment()` | 返回 `{profiles, promptTargets, contextLabel, canTrial}`；列表条目为 `{id, name}` |
| `design(messages, {profileId, signal})` | `Promise<string>`，返回包含 `prompt` 与 `explanation` 的 JSON 文本 |
| `trial({content, input, mode, promptId, depth}, {signal})` | 返回 `{content, context}`；`context` 保存示例来源与实际场景 |

页面已打开后，可在浏览器控制台运行以下内部契约示例，创建独立控制器并导出当前保存的数据：

```javascript
const api = globalThis.YaKitPreview;
const workbench = await api.createWorkbench(api.createLocalHost());
console.log(workbench.getState().versions);
console.log(workbench.exportData());
```

## 当前接入状态

| 项目 | 当前状态与边界 |
| --- | --- |
| 独立预览 | 页面、组件和本地适配器已实现，保留目录结构即可打开 |
| 提示词设计与试写 | 使用两版预置提示词和两份正文；不按任意需求实时生成 |
| 手动编辑与版本 | 已实现原文保存、选择版本和试写归因 |
| 人工反馈与下一版 | 已实现评价、意见、引用、按来源版本修订 |
| 保存与导出 | 已实现本地存储、复制和 JSON 下载；导入与跨设备同步尚未实现 |
| 取消与恢复 | 已实现取消、迟到结果保护及保存失败后内存导出 |
| 模型服务与宿主接口 | 当前运行时使用浏览器 API 和本地示例；真实模型请求及预设写回尚未实现 |
| 兼容性门槛 | 需要 `structuredClone`、`crypto.randomUUID`、`AbortController`、本地存储与 Blob 下载；浏览器最低版本尚未锁定 |
| 发布与验收 | v0.1.0 交互预览，尚未正式发布；浏览器交互验收待确认 |

## 开发与验证

UI 文件与业务逻辑由不同任务修改，业务代码位于 `core/` 和 `preview/`；新增代码使用通俗中文注释。用户可感知功能变化同步更新 README，模块和内部契约变化同步更新本文。

本地测试目录由 `.gitignore` 忽略，当前工作区保留以下可运行脚本：

| 脚本 | 覆盖范围与已确认结果 |
| --- | --- |
| `tests/core.test.mjs` | 版本不可变、反馈来源、正文隔离、取消、格式错误、保存失败与恢复、异步编辑保护、空白原文往返；4 项通过 |
| `tests/preview.test.mjs` | 初始示例、重新打开恢复、人工反馈到下一版、场景来源、取消、预先中止、本地存储故障；5 项通过 |

在当前文件夹运行：

```bash
node --test tests/*.test.mjs
for file in app.js core/*.js preview/*.js ui/*.js; do node --check "$file" || exit; done
git diff --check
```

当前整合验证中，两份测试共 9 项通过，全部 JavaScript 语法检查与 `git diff --check` 通过。`node --check` 仅检查语法，不代表浏览器交互验收。直接打开 `index.html` 后，需检查输入、保存版本、试写、反馈修订、取消、复制、下载与重新打开恢复；当前通过仅绑定 `127.0.0.1:8766` 的临时静态服务打开并查看了初始页面，流程验收结果待确认。内置浏览器的 URL 策略阻止了直接访问 `file://`，因此尚未在该验收环境亲测直接文件打开。SillyTavern 相关验收若进入后续任务，遵循本机 `AGENTS.md` 指定的人工验收流程。
