# missions/QuickMissionConditions.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/missions/QuickMissionConditions.ts`
- 对应单测：`packages/server/__tests__/engine/missions/QuickMissionConditions.test.ts`
- 模块职责：任务定义、触发条件、奖励与进度追踪
- 关键导出：orbitOrLandAt、totalLandings、totalOrbitAndLand、probeOnComet、hasTrace、hasTraceOnAllSpecies、hasMinScore、hasMinPublicity

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- hasTrace checks required color count
- hasTraceOnAllSpecies validates every discovered alien board
- probeOnAsteroidAdjacentToEarth validates adjacency relation
- playedCardsInSameSector handles empty hand edge case
- hasNoCardsInHand checks boundary 0 cards

### 2.2 边界场景处理
- playedCardsInSameSector handles empty hand edge case
- hasNoCardsInHand checks boundary 0 cards

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
