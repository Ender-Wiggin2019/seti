# Task 1-5: Turn Loop 与回合生命周期

## Title
实现完整的回合循环、GameSetup 初始化 + EventLog 事件日志

## 描述
将 Game、Player、DeferredActionsQueue、PlayerInput 组合成完整的游戏回合循环。实现 GameSetup 执行初始化序列，EventLog 记录所有状态变更，以及回合间的转换逻辑。

## 功能说明

### GameSetup
执行 PRD §5 的初始化序列：
1. 构建棋盘组合体（此阶段 stub，具体实现在 Stage 2）
2. 选择 2 个隐藏外星种族
3. 洗牌主牌堆，翻开 3 张到卡牌行
4. 填充扇区初始数据
5. 放置 4 个金色计分板块
6. 放置中立里程碑标记（按人数）
7. 构建 12 个科技堆叠
8. 构建 4 个回合末卡牌堆
9. 每个玩家初始化（4 信用, 3 能量, 5 张手牌, 1 张塞入, 初始分数）

### Turn Loop 核心流程
```
AWAIT_MAIN_ACTION
  → 接收 main action
  → 验证合法性
  → 入队 deferred actions (COST → CORE_EFFECT → IMMEDIATE_REWARD)
  → drain 队列 (可能暂停等待 PlayerInput)
  → IN_RESOLUTION
  → 检查 sector completion → 入队
  → drain
  → 检查 mission triggers → 入队
  → drain
  → BETWEEN_TURNS
  → 入队 MILESTONE → DISCOVERY
  → drain
  → TURN_HANDOFF → 下一个玩家 或 END_OF_ROUND
```

### 回合结束 (END_OF_ROUND)
1. 所有玩家获得收入
2. 起始玩家前移
3. 旋转提醒标记移动
4. 清除 pass 标记
5. 如果是第 5 轮后 → FINAL_SCORING → GAME_OVER

### EventLog
- 所有状态变更记录为 typed event
- `append(event: TGameEvent)` — 记录事件
- `recent(count)` — 获取最近 N 条
- 用于审计、回放、Client 显示

### 涉及文件
```
packages/server/src/engine/
├── GameSetup.ts
├── GameSetup.test.ts
├── event/
│   ├── GameEvent.ts
│   ├── GameEvent.test.ts
│   ├── EventLog.ts
│   └── EventLog.test.ts
```

## 技术实现方案

1. 实现 `EventLog` 类 + `TGameEvent` 类型定义
2. 实现 `GameSetup` 类，编排初始化序列
   - 子系统具体初始化在 Stage 2 实现，此处用 stub/factory 方法预留
3. 在 `Game` 类中实现回合循环方法：
   - `processMainAction(playerId, action)` — 主入口
   - `processFreeAction(playerId, action)` — 自由行动入口
   - `processInput(playerId, response)` — 输入响应入口
   - 内部调用 deferred queue drain + phase transition
4. 实现回合结束序列
5. 实现 `advanceToNextPlayer()` — 跳过 passed 玩家

## 测试要求
- `EventLog.test.ts`: append/recent 功能 + 容量限制
- `GameEvent.test.ts`: 各事件类型构造正确
- `GameSetup.test.ts`:
  - 2/3/4 人初始化参数正确
  - 玩家初始资源/分数按座位设置
  - 中立里程碑按人数放置
- `Game.test.ts` (扩展):
  - 完整回合循环 stub 测试
  - processMainAction → drain → phase transition
  - 回合结束 → 收入 → 下一轮
  - 第 5 轮结束 → FINAL_SCORING → GAME_OVER

## 完成标准
- [ ] GameSetup 执行完整初始化序列（子系统可 stub）
- [ ] Turn Loop 能驱动一个完整回合
- [ ] EventLog 正确记录事件
- [ ] 回合结束逻辑正确
- [ ] 所有单测通过
