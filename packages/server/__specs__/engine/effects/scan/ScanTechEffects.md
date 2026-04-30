# effects/scan/ScanTechEffects.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/effects/scan/ScanTechEffects.ts`
- 对应单测：`packages/server/__tests__/engine/effects/scan/ScanTechEffects.test.ts`
- 模块职责：规则效果执行器（探测器、扫描、科技、收入等）
- 关键导出：IScanEarthNeighborOptions、IScanMercurySignalOptions、IScanHandSignalResult、IScanHandSignalOptions、TEnergyLaunchChoice、IScanEnergyLaunchResult、IScanEnergyLaunchOptions、ScanEarthNeighborEffect

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- computes adjacent sectors from earth sector
- resolves selected adjacent sector for earth neighbor effect
- throws when earth neighbor selection is not adjacent
- spends publicity and marks mercury signal
- discards hand card and marks signal by card sector color
- allows choosing move in energy launch effect

### 2.2 边界场景处理
- throws when earth neighbor selection is not adjacent

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
