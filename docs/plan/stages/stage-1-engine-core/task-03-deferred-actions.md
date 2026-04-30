# Task 1-3: DeferredAction 队列系统

## Title
实现 DeferredAction 延迟行动队列 + 优先级排序

## 描述
实现延迟行动（DeferredAction）基类和优先级队列。这是引擎的核心驱动机制——所有游戏效果（花费、核心效果、奖励、结算）都通过入队 + 逐一排水的方式执行，支持在执行过程中产生新的 PlayerInput 暂停等待玩家输入。

## 功能说明

### DeferredAction 基类
- `player: IPlayer` — 行动的执行者
- `priority: EPriority` — 优先级
- `execute(game: IGame): PlayerInput | undefined` — 执行行动，可返回需要玩家决策的 Input

### EPriority 枚举
优先级从高到低：
```
COST = 0
ROTATION
CORE_EFFECT
IMMEDIATE_REWARD
CARD_TRIGGER
SECTOR_COMPLETION
DEFAULT
HAND_LIMIT
END_OF_ROUND_CARD
MILESTONE
DISCOVERY
TURN_HANDOFF
```

### DeferredActionsQueue
- 内部使用优先级排序的数组/堆
- `push(action)` — 入队
- `pushMultiple(actions)` — 批量入队
- `drain(game): PlayerInput | undefined` — 逐一执行队列中的行动，直到遇到需要玩家输入的行动或队列为空
- `isEmpty()` — 是否为空
- `peek()` — 查看队首

### SimpleDeferredAction
- 便捷子类，接收一个 `(game) => PlayerInput | undefined` 回调
- 用于快速创建简单的延迟行动

### 涉及文件
```
packages/server/src/engine/deferred/
├── DeferredAction.ts
├── DeferredAction.test.ts
├── DeferredActionsQueue.ts
├── DeferredActionsQueue.test.ts
├── Priority.ts
├── Priority.test.ts
└── SimpleDeferredAction.ts
```

## 技术实现方案

1. 定义 `EPriority` 枚举（数值越小优先级越高）
2. 实现 `DeferredAction` 抽象基类
3. 实现 `SimpleDeferredAction` 便捷子类
4. 实现 `DeferredActionsQueue`：
   - `push` 时按 priority 插入排序
   - `drain` 循环：shift → execute → 如果返回 PlayerInput 则暂停并返回
   - drain 过程中新 push 的 action 正确排序
5. 后续 task (Stage 2/3) 实现具体 DeferredAction 子类 (GainResources, MarkSignal 等)

## 测试要求
- `Priority.test.ts`: 验证优先级顺序正确
- `DeferredAction.test.ts`: 验证 SimpleDeferredAction 回调被正确执行
- `DeferredActionsQueue.test.ts`:
  - 按优先级排序执行
  - drain 遇到 PlayerInput 暂停
  - drain 过程中新增 action 正确排序
  - 空队列 drain 返回 undefined
  - 多个相同优先级按 FIFO 执行

## 完成标准
- [ ] DeferredAction 基类和队列实现完整
- [ ] 优先级排序正确
- [ ] drain 暂停/恢复机制工作
- [ ] 所有单测通过
