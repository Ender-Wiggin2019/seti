# Task 3-1: Card 体系 (基类, Behavior DSL, Registry)

## Title
实现卡牌基类层级、Behavior 声明式效果 DSL 和 CardRegistry

## 描述
实现 SETI 的卡牌系统架构：卡牌类层级（ICard → Card → IBaseCard / IMissionCard / IEndGameScoringCard）、Behavior DSL 用于声明式描述卡牌效果、BehaviorExecutor 执行器、Requirements 需求检查、以及 CardRegistry 卡牌注册表。

## 功能说明

### 卡牌层级
```
ICard (root interface)
├── IBaseCard          — 普通卡 (打出后弃牌)
├── IMissionCard       — 任务卡 (条件型/触发型, 留在面前)
├── IEndGameScoringCard — 终局计分卡 (金色盒, 留在面前)
└── IAlienCard         — 种族特定卡 (Stage 8 扩展)
```

### Card 抽象基类 (Template Method)
- `canPlay(player)`: checkRequirements → checkBehaviorFeasibility → bespokeCanPlay
- `play(player)`: 执行 behavior → bespokePlay
- `bespokeCanPlay(player)` — 子类覆写
- `bespokePlay(player)` — 子类覆写, 返回 PlayerInput 或 undefined

### Behavior DSL
```typescript
interface IBehavior {
  gainResources?: Partial<IResourceBundle>;
  spendResources?: Partial<IResourceBundle>;
  gainScore?: number;
  gainMovement?: number;
  gainIncome?: EResource;
  drawCards?: number;
  launchProbe?: boolean;
  orbit?: boolean;
  land?: boolean;
  scan?: IScanBehavior;
  researchTech?: ETech;
  markTrace?: ETrace;
  rotateSolarSystem?: boolean;
  custom?: string;  // fallback for unique effects
}
```

### BehaviorExecutor
- 解释 IBehavior 对象并执行对应效果
- 将效果转换为 DeferredAction 入队

### Requirements
- 卡牌打出条件 (资源、科技、棋盘状态等)
- `checkRequirements(player, game)` — 返回 boolean

### CardRegistry
- `factories: Map<string, () => ICard>` — 卡牌 ID → 工厂函数
- `register(id, factory)` — 注册
- `create(id)` — 创建实例
- `createAll(ids)` — 批量创建
- 基础卡和外星卡各自有 manifest，启动时注册

### 涉及文件
```
packages/server/src/engine/cards/
├── ICard.ts
├── Card.ts
├── Card.test.ts
├── Behavior.ts
├── Behavior.test.ts
├── BehaviorExecutor.ts
├── BehaviorExecutor.test.ts
├── Requirements.ts
├── Requirements.test.ts
├── CardRegistry.ts
├── CardRegistry.test.ts
├── base/             # Stage 3 Task 3-2 填充
└── alien/            # Stage 8 填充
```

## 技术实现方案

1. 定义 ICard 和各子接口
2. 实现 Card 抽象基类的 Template Method 模式
3. 实现 IBehavior 类型定义
4. 实现 BehaviorExecutor: 遍历 behavior 字段 → 入队对应 DeferredAction
5. 实现 Requirements: 解析条件表达式 → 检查 player/game 状态
6. 实现 CardRegistry: Map-based 注册/查找/创建

## 测试要求
- `Card.test.ts`:
  - canPlay 模板方法调用顺序正确
  - requirements 不满足时 canPlay 返回 false
  - play 时 behavior 被执行
  - bespokePlay 的 PlayerInput 被返回
- `Behavior.test.ts`: IBehavior 类型合法性
- `BehaviorExecutor.test.ts`:
  - gainResources → Resources.gain 调用
  - spendResources → Resources.spend 调用
  - drawCards → Deck.draw 调用
  - 复合 behavior (多个字段同时存在)
- `Requirements.test.ts`:
  - 资源需求检查
  - 科技需求检查
  - 棋盘状态需求检查
- `CardRegistry.test.ts`:
  - register + create 正确
  - 未注册 ID 抛异常
  - createAll 批量创建

## 完成标准
- [ ] 卡牌层级定义完整
- [ ] Template Method 模式工作
- [ ] Behavior DSL + Executor 工作
- [ ] CardRegistry 注册和创建正确
- [ ] 所有单测通过
