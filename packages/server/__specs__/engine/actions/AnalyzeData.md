# actions/AnalyzeData.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/actions/AnalyzeData.ts`
- 对应单测：`packages/server/__tests__/engine/actions/AnalyzeData.test.ts`
- 模块职责：主动作（Main Action）规则入口与动作对象封装
- 关键导出：AnalyzeDataAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true when computer is full and energy >= 1
- returns false when computer is not full
- returns false when there is no energy
- returns false when computer is only partially full
- returns true with exactly 1 energy when computer is full
- spends 1 energy

### 2.2 边界场景处理
- returns true when computer is full and energy >= 1
- returns false when computer is not full
- returns false when there is no energy
- returns false when computer is only partially full

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
