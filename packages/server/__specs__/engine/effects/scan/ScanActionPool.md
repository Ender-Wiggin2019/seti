# effects/scan/ScanActionPool.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/effects/scan/ScanActionPool.ts`
- 对应单测：`packages/server/__tests__/engine/effects/scan/ScanActionPool.test.ts`
- 模块职责：规则效果执行器（探测器、扫描、科技、收入等）
- 关键导出：EScanSubAction、IScanSubActionRecord、IScanActionPoolResult、IScanActionPoolOptions、ScanActionPool

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- presents pool with Mark Earth and Mark Card Row
- Mark Earth auto-marks sector 0 (fallback without solar system)
- Mark Earth uses markByPlanet when solar system is present
- Mark Card Row → select card → pick sector → mark target sector
- Done ends scan immediately
- completes when all sub-actions are executed

### 2.2 边界场景处理
- Mark Earth auto-marks sector 0 (fallback without solar system)
- hides Mark Hand when hand is empty
- empty card row hides Mark Card Row
- auto-completes when no sub-actions are affordable

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
