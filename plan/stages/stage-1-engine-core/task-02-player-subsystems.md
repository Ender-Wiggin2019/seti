# Task 1-2: Player 子系统

## Title
实现 Player 及组合子系统 (Resources, Income, Computer, DataPool, Pieces)

## 描述
实现 `Player` 类及其 5 个组合子系统。每个子系统是独立的类，封装特定领域逻辑。Player 持有这些子系统实例并提供统一的 API。

## 功能说明

### Player 类
- id, name, color, seatIndex (readonly)
- score, publicity (可变)
- hand, playedMissions, completedMissions, endGameCards, tuckedIncomeCards
- techs, passed, probesInSpace, probeSpaceLimit
- 持有 5 个子系统实例
- `game: IGame` 反向引用 (setup 时设置)
- `waitingFor?: PlayerInput` 当前等待的输入

### Resources 子系统
- credits (信用) + energy (能量)
- `spend(bundle)` — 扣除资源，不足则抛异常
- `gain(bundle)` — 增加资源
- `has(bundle)` — 检查是否足够
- `canAfford(bundle)` — 同 has，语义别名

### Income 子系统
- baseIncome (初始固定收入)
- tuckedCardIncome (塞入卡牌提供的收入)
- `computeRoundPayout()` — 计算每轮收入总额
- `addTuckedIncome(resource)` — 塞入一张卡后增加收入

### Computer 子系统
- topSlots (上排槽位, 固定数量)
- bottomSlots (下排槽位, 通过科技扩展)
- `placeData(position)` — 放置数据到指定位置
- `isFull()` — 上排是否全满 (Analyze 条件)
- `clear()` — 清空所有数据 (Analyze 执行后)
- `getPlacedCount()` — 当前已放置数量
- 放置规则：上排从左到右；下排需对应上排已填

### DataPool 子系统
- count (当前数量), max = 6
- `add(amount)` — 增加数据，溢出丢弃，返回实际增加量
- `remove(amount)` — 移除数据
- `isFull()` — 是否达到上限

### Pieces 子系统
- 各棋子类型的可用数量和已部署数量
- probes, orbiters, landers, sectorMarkers
- `deploy(pieceType)` — 部署一个棋子
- `return(pieceType)` — 归还一个棋子
- `available(pieceType)` — 检查可用数量

### 涉及文件
```
packages/server/src/engine/player/
├── Player.ts
├── Player.test.ts
├── IPlayer.ts
├── Resources.ts
├── Resources.test.ts
├── Income.ts
├── Income.test.ts
├── Computer.ts
├── Computer.test.ts
├── DataPool.ts
├── DataPool.test.ts
├── Pieces.ts
└── Pieces.test.ts
```

## 技术实现方案

1. 定义 `IPlayer` 接口
2. 逐一实现 5 个子系统类（每个类独立，无外部依赖）
3. 实现 `Player` 类，构造函数接收初始配置并创建子系统实例
4. 每个子系统内部验证边界条件（不足扣除抛 GameError，溢出截断等）

## 测试要求

每个子系统有独立的 test 文件：
- `Resources.test.ts`: gain/spend/has 正常 + 不足抛异常 + 多种资源组合
- `Income.test.ts`: 基础收入 + 塞入卡收入 + 计算总收入
- `Computer.test.ts`: 顺序放置 + 上排判满 + 清空 + 下排规则
- `DataPool.test.ts`: 添加/移除 + 溢出截断 + 边界 (0/max)
- `Pieces.test.ts`: 部署/归还 + 无可用时抛异常
- `Player.test.ts`: 创建玩家 + 子系统集成 + 初始状态正确

## 完成标准
- [ ] 5 个子系统各自功能完整
- [ ] Player 类能正确创建和初始化
- [ ] 所有单测通过，coverage ≥ 90%
