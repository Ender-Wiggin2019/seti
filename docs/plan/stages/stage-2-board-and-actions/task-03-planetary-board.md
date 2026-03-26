# Task 2-3: PlanetaryBoard 行星系统

## Title
实现行星面板、轨道/着陆系统、月球机制

## 描述
实现行星面板逻辑，管理各行星的轨道占位、着陆占位、首次到达奖励、月球解锁与着陆。

## 功能说明

### PlanetaryBoard 类
- `planets: Map<EPlanet, PlanetState>` — 每个行星的状态

### PlanetState
- `orbitSlots: { playerId }[]` — 轨道占位列表（无上限）
- `landingSlots: { playerId }[]` — 着陆占位列表（无上限）
- `firstOrbitClaimed: boolean` — 首次轨道奖励是否已领取
- `firstLandDataBonusTaken: boolean[]` — 首次着陆数据奖励（火星有 2 个）
- `moonOccupant: { playerId } | null` — 月球占位（单一）
- `moonUnlocked: boolean` — 月球是否解锁

### 核心方法
- `orbit(planet, playerId)`:
  - 放置轨道者
  - 首次轨道 +3 VP
  - 返回 orbit bonus
- `land(planet, playerId, isMoon?)`:
  - 放置着陆者
  - 行星中心奖励 (含生命痕迹 + VP)
  - 首次着陆数据奖励
  - 月球规则：需解锁 + 单一占位
  - 返回 landing rewards
- `canOrbit(planet, playerId)` — 检查是否有探针在该行星空间
- `canLand(planet, playerId)` — 检查资格 + 能量要求
- `getLandingCost(planet, playerId)` — 3 能量（有轨道者时 2 能量）
- `unlockMoon(planet)` — 通过科技/效果解锁月球

### 涉及文件
```
packages/server/src/engine/board/
├── PlanetaryBoard.ts
└── PlanetaryBoard.test.ts
```

## 技术实现方案

1. 定义 `EPlanet` 枚举 (Mercury, Venus, Mars, Jupiter, Saturn 等)
2. 每个行星初始化各自的 slot 容量和奖励数据
3. orbit/land 方法执行占位 + 奖励计算
4. 月球解锁状态由 Game 层在科技获取时调用 `unlockMoon`
5. 着陆费用根据是否有轨道者动态计算

## 测试要求
- `PlanetaryBoard.test.ts`:
  - orbit: 正常占位 + 首次 +3 VP + 后续无额外
  - land: 正常占位 + 中心奖励 + 首次数据奖励
  - land: 有轨道者时着陆费用降低 (3→2)
  - land: 火星双首次数据奖励
  - moon: 未解锁时 canLand 返回 false
  - moon: 解锁后可着陆 + 单一占位限制
  - 多玩家交叉轨道/着陆

## 🔄 Rework: 提取纯规则函数到 Common

> **原因:** 架构决策要求纯游戏规则函数放在 `@ender-seti/common/rules/` 供 Client 做乐观 UI。详见 `arch-server.md` §4.10。

### 需要提取的函数

新建 `packages/common/src/rules/planet.ts`，从 Server 的 `PlanetaryBoard` 类中提取以下纯函数：

```typescript
// packages/common/src/rules/planet.ts
import type { IPublicPlanetState, IPublicPlayerState, IPublicGameState } from '../types/protocol/gameState';

/** 计算着陆费用 (有轨道者时 2, 否则 3) */
function getLandingCost(planet: IPublicPlanetState, playerId: string): number;

/** 检查某玩家是否可以在该行星入轨 (有探针在该行星空间 + 费用足够) */
function canOrbitPlanet(
  planet: IPublicPlanetState,
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean;

/** 检查某玩家是否可以在该行星着陆 */
function canLandOnPlanet(
  planet: IPublicPlanetState,
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean;

/** 检查月球是否可着陆 (已解锁 + 无占位) */
function canLandOnMoon(planet: IPublicPlanetState): boolean;

/** 获取首次轨道奖励是否仍可用 */
function isFirstOrbitAvailable(planet: IPublicPlanetState): boolean;

/** 获取首次着陆数据奖励剩余 */
function getFirstLandBonusRemaining(planet: IPublicPlanetState): number;
```

### Rework 步骤

1. 在 `packages/common/src/rules/planet.ts` 中实现上述纯函数
2. 修改 Server 的 `PlanetaryBoard` 类，可在 `canOrbit` / `canLand` / `getLandingCost` 中调用 common 纯函数
3. 确保 `IPublicPlanetState` 包含足够信息（`orbitSlots`, `landingSlots`, `firstOrbitClaimed`, `moonUnlocked`, `moonOccupant` 等）
4. 添加 common 规则函数的单测 (`packages/common/src/rules/planet.test.ts`)
5. 从 `packages/common/src/rules/index.ts` 统一导出

### 新增完成标准
- [x] `common/rules/planet.ts` 纯函数已实现
- [x] 纯函数单测通过
- [x] Server 的 PlanetaryBoard 与 common 规则逻辑一致
- [x] `IPublicPlanetState` 字段满足 Client 计算需求

## 完成标准
- [x] PlanetaryBoard 完整实现
- [x] 着陆费用计算正确
- [x] 首次奖励机制正确
- [x] 月球解锁/占位逻辑正确
- [x] 所有单测通过
- [x] 🔄 Common 规则函数提取完成（见上方 Rework 小节）
