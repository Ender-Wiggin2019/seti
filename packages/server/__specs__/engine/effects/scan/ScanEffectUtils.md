# effects/scan/ScanEffectUtils.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/effects/scan/ScanEffectUtils.ts`
- 对应单测：`packages/server/__tests__/engine/effects/scan/ScanEffectUtils.test.ts`
- 模块职责：规则效果执行器（探测器、扫描、科技、收入等）
- 关键导出：getSectorAt、findSectorById、findSectorByColor、findAllSectorsByColor、findSectorIdByStarName、getSectorIndexByPlanet、getSectorByPlanet、getAllSectors

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- gets sector by index and color
- extracts sector color from card-like object
- returns the sector matching the given ID
- returns null when no sector matches
- returns all sectors of a given color
- returns empty array when no sector matches

### 2.2 边界场景处理
- returns null when no sector matches
- returns empty array when no sector matches
- returns undefined for null setup

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
