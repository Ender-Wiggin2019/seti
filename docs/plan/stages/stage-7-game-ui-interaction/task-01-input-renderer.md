# Task 7-1: InputRenderer 分发器 + 全部 Input 组件

## Title
实现 PlayerInput 渲染分发器和全部输入类型组件

## 描述
实现 InputRenderer 作为 PlayerInput 到 UI 组件的分发器，以及 11 个具体输入类型的渲染组件。每个组件读取 IPlayerInputModel 的选项信息，渲染交互 UI，收集用户选择后构建 IInputResponse 发回服务器。

## 功能说明

### InputRenderer (分发器)
- 根据 `model.type` switch 到对应组件
- 处理嵌套输入 (OrOptions, AndOptions)
- 提供统一的 submit handler

### 11 个 Input 组件

| 组件 | UI 形式 | 用户操作 | 响应 |
|------|---------|---------|------|
| SelectOptionInput | 按钮组 | 点击按钮 | `{ type: 'option', index }` |
| SelectCardInput | 卡牌网格 + 多选 | 选择 min..max 卡, 确认 | `{ type: 'card', cardIds }` |
| SelectSectorInput | 扇区高亮 | 点击扇区 | `{ type: 'sector', sectorId }` |
| SelectPlanetInput | 行星高亮 | 点击行星 | `{ type: 'planet', planet }` |
| SelectTechInput | 科技堆叠高亮 | 点击堆叠 | `{ type: 'tech', tech }` |
| SelectGoldTileInput | 金色板块 + 位置 | 选择板块和位置 | `{ type: 'goldTile', tileId }` |
| SelectResourceInput | 资源图标按钮 | 点击资源类型 | `{ type: 'resource', resource }` |
| SelectTraceInput | 发现轨道 + 颜色 | 选择痕迹颜色 | `{ type: 'trace', trace }` |
| SelectEndOfRoundCardInput | 回合末卡牌展开 | 选择一张 | `{ type: 'endOfRound', cardId }` |
| OrOptionsInput | Tab/Accordion 子输入 | 选择一个 tab 填写 | `{ type: 'or', index, response }` |
| AndOptionsInput | Stepper 逐步填写 | 填完每步推进 | `{ type: 'and', responses[] }` |

### 集成点
- InputRenderer 显示在 GameLayout 底部右侧 action area
- 同时影响棋盘组件的高亮状态 (通过 GameContext.pendingInput)
- 提交后调用 `sendInput(response)` → WebSocket

### 涉及文件
```
packages/client/src/features/input/
├── InputRenderer.tsx
├── InputRenderer.test.tsx
├── SelectOptionInput.tsx + test
├── SelectCardInput.tsx + test
├── SelectSectorInput.tsx + test
├── SelectPlanetInput.tsx + test
├── SelectTechInput.tsx + test
├── SelectGoldTileInput.tsx + test
├── SelectResourceInput.tsx + test
├── SelectTraceInput.tsx + test
├── SelectEndOfRoundCardInput.tsx + test
├── OrOptionsInput.tsx + test
└── AndOptionsInput.tsx + test
```

## 技术实现方案

1. InputRenderer: switch on model.type → 渲染对应组件
2. 每个 Input 组件:
   - 接收 `model: IPlayerInputModel`
   - 渲染选项 UI (使用 shadcn 组件)
   - 内部 state 管理选择
   - submit → `useGameActions().sendInput(response)`
3. OrOptionsInput: shadcn Tabs → 选择 tab → 渲染子 Input
4. AndOptionsInput: stepper (step indicator + current input)
5. 棋盘高亮: 通过 `useGameContext().pendingInput` 共享状态

## 测试要求

每个 Input 组件需测试:
- 从 model 正确渲染选项
- 用户选择后视觉反馈
- submit 构建正确的 response
- 选项约束 (min/max, 互斥)
- 空选项 / 单选项边界

### 重点测试
- `InputRenderer.test.tsx`: 各 type 路由到正确组件
- `OrOptionsInput.test.tsx`: tab 切换 + 子输入嵌套
- `AndOptionsInput.test.tsx`: step 推进 + 回退

### E2E 可行性
- 完整 input 流程: 收到 waiting → 渲染 input → 用户选择 → submit → 状态更新
- 嵌套 input: Or → 选择 tab → 子 input → submit
- 非常适合 E2E 测试

## 参考代码 & 静态资源

### 参考文件（重要）
- **`frontend-reference/.../seti/states.js`** — 核心参考！每个 state 定义了：
  - `message` — 提示文字（可参考各 state 的 message 作为 Input 组件的 prompt）
  - `buttons` — 按钮名称和文字（对应 SelectOptionInput 的选项）
  - `behavior.evalClick()` — 点击处理逻辑（理解每种 input 的交互模式）
  - `isClickable()` — 高亮判定（理解棋盘组件在 input 期间的行为）
  - 重点关注：`"do action"`, `"gain tech"`, `"place signals"`, `"complete mission"`, `"start income"`
- **`frontend-reference/.../seti/moveManager.js`** — `evalClick()`, `evalGameEvent()` — 从 UI 事件到游戏操作的分发逻辑
- **`frontend-reference/.../seti/highlight.js`** — `isClickable()` 的完整实现，展示每种 input 对应哪些棋盘元素应高亮

### 状态 → Input 类型映射
| Reference State | Our Input Type |
|---|---|
| `"do action"` buttons | `OrOptions` (8 个 main action) |
| `"gain tech"` evalClick | `SelectTech` |
| `"place signals"` evalClick | `SelectSector` |
| `"complete mission"` | `SelectCard` (选择完成哪个任务) |
| `"start income"` evalClick | `SelectEndOfRoundCard` |
| `"effect queue"` buttons | `SelectOption` (确认效果) |

## 完成标准
- [ ] InputRenderer 分发所有 11 种类型
- [ ] 每个 Input 组件渲染和交互正确
- [ ] Or/And 嵌套工作
- [ ] 与棋盘高亮集成
- [ ] 所有单测通过
