# actions/Pass.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/actions/Pass.ts`
- 对应单测：`packages/server/__tests__/engine/actions/Pass.test.ts`
- 模块职责：主动作（Main Action）规则入口与动作对象封装
- 关键导出：PassAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- always returns true
- sets player.passed when no discard and no end-of-round stack
- rotates the solar system on the first pass of the round
- rotates the solar system on the second pass of the round too
- returns SelectCard when hand exceeds limit
- chains discard → end-of-round card selection

### 2.2 边界场景处理
- sets player.passed when no discard and no end-of-round stack
- works with an empty hand and empty stack
- skips end-of-round card in the last round (no stack)

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
