# Task 2-2: Sector 扇区 + 完成结算

## Title
实现 Sector 扇区系统、信号标记、完成结算与重置

## 描述
实现 8 个扇区的完整逻辑：数据槽位管理、信号标记放置、扇区完成判定、多数判定（含平局打破规则）、完成结算（奖励 + 重置）。

## 功能说明

### Sector 类
- id, color (ESector)
- dataSlots: (DataToken | null)[] — 固定容量数据槽
- markerSlots: { playerId, timestamp }[] — 信号标记
- overflowMarkers: { playerId }[] — 溢出标记
- winnerMarkers: { playerId, reward }[] — 胜出标记
- completed: boolean

### 核心方法
- `markSignal(playerId)`:
  - 移除最左数据 token（加入玩家 data pool）
  - 放置标记到下一位置
  - 标记占据第二数据位时 +2 VP
  - 溢出时无数据获取但标记仍计数
  - 返回 `{ dataGained, vpGained }`
- `resolveCompletion()`:
  - 最多标记者胜出
  - 平局由最新标记打破 (latest marker wins)
  - 所有参与者 +1 宣传
  - 胜者放置持久胜出标记 + 获得奖励
  - 第二名留标记在第一位
  - 其余标记归还
  - 重新填充数据到满
  - 返回 `ISectorCompletionResult`
- `isComplete()` — 最后一个数据被移除时
- `reset(secondPlaceId)` — 完成后重置

### 涉及文件
```
packages/server/src/engine/board/
├── Sector.ts
└── Sector.test.ts
```

## 技术实现方案

1. 定义 Sector 数据结构，包含 dataSlots、markerSlots 等
2. `markSignal` 实现左移数据逻辑 + VP 判定
3. `resolveCompletion` 实现多数判定:
   - 按 marker 数量排序
   - 平局看 timestamp (后放的赢)
   - 分配奖励
4. 完成后 reset: 清空 markerSlots, 重新填充 dataSlots

## 测试要求
- `Sector.test.ts`:
  - markSignal: 正常获取数据 + 放置标记
  - markSignal: 第二位置 +2 VP
  - markSignal: 溢出时无数据但标记有效
  - resolveCompletion: 单人最多标记胜出
  - resolveCompletion: 平局由最新标记打破 (PRD §7.4)
  - resolveCompletion: 所有参与者 +1 宣传
  - resolveCompletion: 第二名标记保留
  - reset: 数据重新填满, 标记清空
  - 全流程: 多轮标记 → 完成 → 重置 → 再次标记

## 🔄 Rework: 提取纯规则函数到 Common

> **原因:** 架构决策要求纯游戏规则函数放在 `@ender-seti/common/rules/` 供 Client 做乐观 UI。详见 `arch-server.md` §4.10。

### 需要提取的函数

新建 `packages/common/src/rules/sector.ts`，从 Server 的 `Sector` 类中提取以下纯函数：

```typescript
// packages/common/src/rules/sector.ts
import type { IPublicSectorState } from '../types/protocol/gameState';

/** 扇区是否还能放置信号（还有数据槽未被移除） */
function canPlaceSignal(sector: IPublicSectorState): boolean;

/** 扇区完成进度 (filled = 已移除数据数, total = 总槽数) */
function getSectorProgress(sector: IPublicSectorState): { filled: number; total: number };

/** 扇区是否已完成（所有数据槽已移除） */
function isSectorComplete(sector: IPublicSectorState): boolean;

/** 获取各玩家在扇区的标记数量排名 (用于 UI 展示竞争态势) */
function getSectorStandings(sector: IPublicSectorState): Array<{ playerId: string; markerCount: number }>;
```

### Rework 步骤

1. 在 `packages/common/src/rules/sector.ts` 中实现上述纯函数
2. 修改 Server 的 `Sector` 类，内部方法调用 common 的纯函数（或直接保留内部实现，但确保逻辑一致）
3. 确保 `IPublicSectorState` 包含足够信息（`dataSlots`, `markerSlots`, `completed` 等）
4. 添加 common 规则函数的单测 (`packages/common/src/rules/sector.test.ts`)
5. 从 `packages/common/src/rules/index.ts` 统一导出

### 新增完成标准
- [ ] `common/rules/sector.ts` 纯函数已实现
- [ ] 纯函数单测通过
- [ ] Server 的 Sector 类与 common 规则逻辑一致
- [ ] `IPublicSectorState` 字段满足 Client 计算需求

## 完成标准
- [x] Sector 完整实现
- [x] 完成结算逻辑符合 PRD §7.4
- [x] 平局打破规则正确
- [x] 所有单测通过
- [ ] 🔄 Common 规则函数提取完成（见上方 Rework 小节）
