# Task 8-1: Alien Plugin 接口 + AlienRegistry + 发现流程

## Title
实现外星种族插件系统框架和发现机制

## 描述
实现外星种族的插件架构：IAlienModule 接口定义、AlienRegistry 注册表、AlienState 状态管理、发现流程 (3 个 trace 空间填满 → 发现 → 加载种族规则)。这是可扩展的模块化设计，每个种族作为独立插件。

## 功能说明

### IAlienModule 接口
```typescript
interface IAlienModule {
  readonly type: EAlienType;
  onDiscover(game: IGame, discoverers: IPlayer[]): void;
  onTraceMark?(game: IGame, player: IPlayer, trace: ETrace): void;
  onRoundEnd?(game: IGame): void;
  onGameEndScoring?(game: IGame, player: IPlayer): number;
  getAlienCards(): ICard[];
  getAlienBoardState(): IAlienBoardState;
}
```

### AlienRegistry
- 注册所有可用的 alien module
- 按 EAlienType 查找

### AlienState
- `candidateSpecies: [EAlienType, EAlienType]` — 隐藏的 2 个种族
- 每个种族的 6 个发现空间 (3 红/黄/蓝)
- 溢出空间标记
- 发现标记 (boolean)
- `markTrace(trace, playerId)` — 放置痕迹标记
- `checkDiscovery()` — 3 个空间满 → 触发发现
- `resolveDiscovery(game)` — 加载种族模块

### Guard Pattern
```typescript
AlienModule.ifDiscovered(game, alienType, (mod) => mod.onTraceMark(...));
```

### ResolveDiscovery DeferredAction
- 发现时入队 (priority: DISCOVERY)
- 执行: 揭示种族面板 → 加载规则 → 发现者奖励
- 时机: 在里程碑之后

### 涉及文件
```
packages/server/src/engine/alien/
├── IAlienModule.ts
├── AlienRegistry.ts
├── AlienRegistry.test.ts
├── AlienState.ts
├── AlienState.test.ts
└── AlienGuard.ts

packages/server/src/engine/deferred/
├── ResolveDiscovery.ts
├── ResolveDiscovery.test.ts
├── MarkTrace.ts
└── MarkTrace.test.ts
```

## 技术实现方案

1. 定义 IAlienModule 接口
2. 实现 AlienRegistry (Map<EAlienType, () => IAlienModule>)
3. 实现 AlienState (发现空间管理 + 痕迹放置)
4. 实现 Guard pattern (ifDiscovered helper)
5. 实现 MarkTrace DeferredAction:
   - 放置痕迹 → 检查溢出 (+3 VP) → 检查发现
6. 实现 ResolveDiscovery DeferredAction:
   - 加载 module → onDiscover → 卡牌注入

## 测试要求
- `AlienRegistry.test.ts`: 注册/查找/不存在抛异常
- `AlienState.test.ts`:
  - 初始 2 个候选种族
  - markTrace 放置到正确空间
  - 3 空间满 → checkDiscovery true
  - 溢出 +3 VP
  - 中立标记仅放基础 6 空间
- `ResolveDiscovery.test.ts`:
  - 发现后 module.onDiscover 被调用
  - 发现者获得奖励
  - 在里程碑之后执行
- `MarkTrace.test.ts`:
  - 正常放置 + 溢出处理

## 完成标准
- [ ] IAlienModule 接口定义完整
- [ ] AlienRegistry 注册和查找工作
- [ ] 发现流程 (trace → check → resolve) 完整
- [ ] Guard pattern 工作
- [ ] 所有单测通过
