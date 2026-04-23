# Debug Replay / Checkpoint 设计

> 目标：提供一条可扩展的真实接口调试链路，不依赖 mock，不为每个场景单独做一套 debug 页面。

## 当前入口

- 页面：
  - `/debug/replay`
  - `/debug/alien`
- 接口：
  - `GET /debug/replay-presets`
  - `POST /debug/server/replay-session`

## 抽象模型

### preset

一个 preset 表示一种“可复用调试场景模板”，包含：

- `definition`
  - 页面展示用元数据
  - 字段定义（例如 alien、player seat、round）
  - 可选 checkpoint 列表
- `apply(game, request)`
  - 在真实 `Game` 实例上执行 setup / state 改造
  - 返回当前断点信息

当前实现文件：

- [packages/server/src/debug/debugReplayPresets.ts](/Users/oushuohuang/Documents/demo-a2ui/packages/server/src/debug/debugReplayPresets.ts)

### checkpoint

checkpoint 表示 preset 停止的断点位置，不是快照文件，而是“代码驱动的可重建状态”。

推荐语义：

- `before-*`：动作发生前
- `after-*`：动作发生后
- `await-*`：等待玩家输入

例如：

- `before-end-turn`
- `after-discovery`
- `await-trace-choice`

## 当前第一个 preset

- `anomaly-discovery`
  - 字段：`alienType`
  - checkpoint：`before-end-turn`
  - 效果：
    - 建立真实 game session
    - 自动 resolve setup tucks
    - 重建 alien boards
    - 将选中的 alien discovery 区填满
    - 停在 `AWAIT_END_TURN`
    - 用户点击 `End Turn` 后走真实 discovery 流程

## 扩展规则

新增 preset 时，优先遵守下面约束：

- 不要 mock 网络、socket、状态投影。
- 不要只在 client 里伪造 state。
- setup 逻辑尽量放在 server preset apply 层。
- 复用真实 `Game`, `AlienState`, `GameManager`, `GameContextProvider`。
- 纯结构、可复用协议放在 `common`。

## 推荐扩展方式

当后续增加场景时，优先按下面拆层：

1. `common`
   - 新增 replay 字段定义或响应元数据类型
2. `server/src/debug/debugReplayPresets.ts`
   - 注册新 preset
   - 编写对应 `apply*Replay(...)`
3. `server/__tests__/debug`
   - 为 preset 行为补单测
4. `packages/e2e/tests`
   - 为关键调试路径补端到端验证

## 下一批适合加入的 preset

- `anomaly-trigger-resolution`
  - 停在太阳系旋转后、token 即将结算前
- `alien-card-effect`
  - 停在指定 alien card 可打出或可触发的断点
- `input-branch`
  - 停在某个复杂 `PlayerInput` 分支前
- `round-transition`
  - 停在 `END_OF_ROUND` 或新 round 开始前
