# board/PlanetaryBoard.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/board/PlanetaryBoard.ts`
- 对应单测：`packages/server/__tests__/engine/board/PlanetaryBoard.test.ts`
- 模块职责：棋盘与太阳系/行星区域状态建模
- 关键导出：IOrbitSlot、ILandingSlot、IMoonOccupant、IPlanetState、IOrbitResult、ILandingCenterReward、ILandingResult、PlanetaryBoard

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- orbit places orbiter and grants first-orbit +3 VP once
- land places lander and returns center reward + first data bonus
- landing cost drops from 3 to 2 when planet has any orbiter
- mars has two first-land data bonuses
- cannot land on moon when moon is locked
- moon unlock enables landing and enforces single occupancy

### 2.2 边界场景处理
- cannot land on moon when moon is locked

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
