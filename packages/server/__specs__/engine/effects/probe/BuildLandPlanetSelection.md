# effects/probe/BuildLandPlanetSelection.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/effects/probe/BuildLandPlanetSelection.ts`
- 对应单测：`packages/server/__tests__/engine/effects/probe/BuildLandPlanetSelection.test.ts`
- 模块职责：规则效果执行器（探测器、扫描、科技、收入等）
- 关键导出：ILandSelectionOptions、buildLandPlanetSelection

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns undefined when no land targets are available
- builds options and triggers player.land on select
- includes skip option by default

### 2.2 边界场景处理
- returns undefined when no land targets are available
- includes skip option by default

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
