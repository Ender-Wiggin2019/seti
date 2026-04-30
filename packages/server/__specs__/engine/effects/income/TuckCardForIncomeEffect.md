# effects/income/TuckCardForIncomeEffect.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/effects/income/TuckCardForIncomeEffect.ts`
- 对应单测：`packages/server/__tests__/engine/effects/income/TuckCardForIncomeEffect.test.ts`
- 模块职责：规则效果执行器（探测器、扫描、科技、收入等）
- 关键导出：TuckCardForIncomeEffect

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- canExecute is false when hand is empty
- returns SelectCard input when player has cards
- tucks selected card and applies immediate income gain

### 2.2 边界场景处理
- canExecute is false when hand is empty

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
