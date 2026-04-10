# effects/scan/MarkSectorSignalEffect.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/effects/scan/MarkSectorSignalEffect.ts`
- 对应单测：`packages/server/__tests__/engine/effects/scan/MarkSectorSignalEffect.test.ts`
- 模块职责：规则效果执行器（探测器、扫描、科技、收入等）
- 关键导出：IMarkSectorSignalResult、MarkSectorSignalEffect

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- marks sector, emits mission event, and applies data reward
- does not grant data when dataGained is false
- awards VP when position has a reward
- finds sector by ID and marks it
- returns null when sector ID is not found
- resolves star name to sector and marks it

### 2.2 边界场景处理
- does not grant data when dataGained is false
- calls onComplete with null when no sector of that color exists
- calls onComplete immediately for empty color list

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
