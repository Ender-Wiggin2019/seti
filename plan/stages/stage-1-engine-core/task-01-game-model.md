# Task 1-1: Game 聚合根 + GameOptions + Phase 状态机

## Title
实现 Game 聚合根、游戏配置与阶段状态机

## 描述
实现 `engine/Game.ts` 作为游戏的聚合根（Aggregate Root），包含 `IGame` 接口定义、`GameOptions` 配置模型、`Phase` 枚举和基本的阶段转换逻辑。这是整个引擎的骨架，后续所有子系统挂载在 Game 上。

## 功能说明

### IGame 接口
- 包含所有游戏全局状态字段（见 arch-server.md §4.1）
- `readonly` 约束 id、options、players
- 可变字段：phase, round, activePlayer, startPlayer
- 子系统引用：solarSystem, planetaryBoard, techBoard, sectors
- 卡牌相关：mainDeck, cardRow, endOfRoundStacks
- 系统引用：deferredActions, eventLog, random
- 控制标记：rotationCounter, hasRoundFirstPassOccurred

### Game 类
- **私有构造函数** + `static create(players, options, seed)` 工厂方法
- 工厂方法内执行初始化（此阶段先 stub 各子系统，后续 task 填充）
- 阶段转换方法：`transitionTo(phase)`
- 获取当前活跃玩家、下一个玩家等辅助方法

### GameOptions
- playerCount (2-4)
- alienModulesEnabled (boolean[])
- undoAllowed (boolean)
- timerPerTurn (seconds, 0 = no timer)
- expansions (enum[])

### EPhase 状态机
```
SETUP → PLAY
  PLAY 内部: AWAIT_MAIN_ACTION → IN_RESOLUTION → BETWEEN_TURNS
  → END_OF_ROUND → (next round or FINAL_SCORING)
FINAL_SCORING → GAME_OVER
```

### 涉及文件
```
packages/server/src/engine/
├── Game.ts
├── Game.test.ts
├── IGame.ts
├── GameOptions.ts
├── GameOptions.test.ts
├── Phase.ts
└── Phase.test.ts
```

## 技术实现方案

1. 定义 `IGame` 接口（引用 `@ender-seti/common` 的 protocol types）
2. 定义 `IGameOptions` 接口 + 默认值
3. 实现 `EPhase` 枚举 + 合法转换表（Map<EPhase, EPhase[]>）
4. 实现 `Game` 类骨架，子系统用 `null!` 占位（或空实例），供后续 task 填充
5. 实现 `Game.create()` 工厂，调用 `GameSetup`（此阶段 stub）
6. 实现阶段转换 `transitionTo()` + 非法转换抛 GameError

## 测试要求
- `Phase.test.ts`: 验证合法阶段转换、非法转换抛异常
- `GameOptions.test.ts`: 验证默认值、playerCount 范围校验
- `Game.test.ts`: 验证 `Game.create()` 返回正确初始状态；验证阶段转换；验证 activePlayer 获取

## 完成标准
- [ ] `IGame` 接口定义完整
- [ ] `Game.create()` 能创建游戏实例
- [ ] Phase 状态机合法/非法转换正确
- [ ] 所有单测通过
