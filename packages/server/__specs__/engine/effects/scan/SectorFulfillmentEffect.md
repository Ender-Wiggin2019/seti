# effects/scan/SectorFulfillmentEffect.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/effects/scan/SectorFulfillmentEffect.ts`
- 对应单测：`packages/server/__tests__/engine/effects/scan/SectorFulfillmentEffect.test.ts`
- 模块职责：规则效果执行器（探测器、扫描、科技、收入等）
- 关键导出：ISectorFulfillmentResult、SectorFulfillmentEffect

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns undefined when no sectors are fulfilled
- resolves a single fulfilled sector
- awards +1 publicity to all participants
- resolves multiple fulfilled sectors in index order
- calls onComplete after all sectors resolved
- skips non-fulfilled sectors

### 2.2 边界场景处理
- returns undefined when no sectors are fulfilled
- skips non-fulfilled sectors
- resets sector data with second-place marker at index 0

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
