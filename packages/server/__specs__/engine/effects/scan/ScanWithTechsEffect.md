# effects/scan/ScanWithTechsEffect.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/effects/scan/ScanWithTechsEffect.ts`
- 对应单测：`packages/server/__tests__/engine/effects/scan/ScanWithTechsEffect.test.ts`
- 模块职责：规则效果执行器（探测器、扫描、科技、收入等）
- 关键导出：IScanTechActivationResult、IScanWithTechsResult、IScanWithTechsOptions、ScanWithTechsEffect

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- runs base scan without tech menu
- presents sector choice for earth signal
- marks signal in chosen adjacent sector
- allows choosing earth sector itself
- offers tech activation after base scan
- activates mercury signal and spends publicity

### 2.2 边界场景处理
- runs base scan without tech menu
- allows skipping mercury signal with done
- skips mercury signal when publicity is insufficient
- allows activating some techs and skipping others

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
