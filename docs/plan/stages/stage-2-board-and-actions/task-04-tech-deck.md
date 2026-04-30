# Task 2-4: TechBoard + Deck 系统

## Title
实现科技面板 (12 堆叠) + 通用 Deck 牌堆系统

## 描述
实现 TechBoard（12 个科技堆叠，每堆 4 张面朝下 + 1 个 2VP 板块）和通用 Deck 数据结构（用于主牌堆、弃牌堆等）。

## 功能说明

### TechBoard 类
- `stacks: Map<ETech, TechStack>` — 12 个科技堆叠 (4 种 × 3 色)

### TechStack
- tiles: ITechTile[] (面朝下堆叠)
- twoPVTileAvailable: boolean (首取 +2 VP)
- takenBy: Map<string, ITechTile> (已获取记录，防重复)

### TechBoard 方法
- `canResearch(playerId, tech)` — 检查是否有可用且未持有
- `take(playerId, tech)`:
  - 取走顶部 tile
  - 首取时移除 2VP tile 并返回 +2 VP
  - 记录已获取
  - 返回 { tile, vpBonus }
- `getAvailableTechs(playerId)` — 列出玩家可研究的科技

### Deck<T> 通用牌堆
- drawPile: T[] — 抽牌堆
- `draw(count)` — 抽取顶部 N 张
- `shuffle(rng)` — 用 SeededRandom 洗牌
- `addToTop(items)` / `addToBottom(items)`
- `peek(count)` — 查看顶部
- `isEmpty()` / `size`
- `reshuffleFrom(discardPile)` — 弃牌堆洗入

### MainDeck (extends Deck<ICard>)
- 预填充基础卡牌集
- 与 `@ender-seti/common` 的卡牌数据集成

### 涉及文件
```
packages/server/src/engine/board/
├── TechBoard.ts
└── TechBoard.test.ts

packages/server/src/engine/deck/
├── Deck.ts
├── Deck.test.ts
├── MainDeck.ts
├── MainDeck.test.ts
├── AlienDeck.ts
└── AlienDeck.test.ts
```

## 技术实现方案

1. 实现 `Deck<T>` 泛型类
   - 内部数组 + SeededRandom 洗牌
   - draw/shuffle/peek/reshuffle
2. 实现 `TechStack` 数据结构
3. 实现 `TechBoard`
   - 初始化 12 个堆叠，每堆 4 张 tile + 2VP
   - take 时检查重复持有
4. 实现 `MainDeck` 继承 `Deck<ICard>`
5. `AlienDeck` 占位（Stage 8 填充）

## 测试要求
- `Deck.test.ts`:
  - draw 正确取出 + 剩余数量更新
  - shuffle 同 seed 确定性
  - reshuffleFrom 弃牌堆洗入
  - draw 超出数量边界处理
  - isEmpty 状态正确
- `TechBoard.test.ts`:
  - take: 正确取走顶部 + 首取 +2 VP
  - take: 同玩家不能重复取同类型
  - canResearch: 已持有返回 false
  - getAvailableTechs: 列出正确可用列表
  - 堆叠耗尽后 canResearch 返回 false
- `MainDeck.test.ts`: 初始化正确数量的卡牌

## Common Rules Layer 要求

> 详见 `arch-server.md` §4.10。本任务实现时需**同步**将纯规则函数导出到 `@ender-seti/common/rules/`。

### 需要导出到 Common 的函数

新建 `packages/common/src/rules/tech.ts`：

```typescript
// rules/tech.ts — 科技可用性检查
function canResearchTechType(
  techType: ETech,
  player: IPublicPlayerState,
  techBoard: IPublicTechBoardState,
): boolean;

function getAvailableTechs(
  player: IPublicPlayerState,
  techBoard: IPublicTechBoardState,
): ETech[];

function isTechStackEmpty(techBoard: IPublicTechBoardState, techType: ETech): boolean;

function hasTwoPVBonus(techBoard: IPublicTechBoardState, techType: ETech): boolean;
```

### 实现建议

1. `canResearchTechType` 检查: 堆叠非空 + 玩家未持有同类型
2. `getAvailableTechs` 遍历所有堆叠返回可用列表
3. Server 的 `TechBoard.canResearch` 和 `TechBoard.getAvailableTechs` 可调用 common 函数
4. 添加 common 规则函数的单测

## 完成标准
- [ ] Deck<T> 通用牌堆完整
- [ ] TechBoard 12 堆叠逻辑正确
- [ ] 首取 2VP 机制正确
- [ ] 重复获取防护正确
- [ ] `common/rules/tech.ts` 纯函数已实现并导出
- [ ] 所有单测通过（含 common 规则函数单测）
