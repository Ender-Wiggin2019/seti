# freeActions/processFreeAction.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/freeActions/processFreeAction.ts`
- 对应单测：`packages/server/__tests__/engine/freeActions/processFreeAction.test.ts`
- 模块职责：免费动作规则与派发处理
- 关键导出：processFreeAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- dispatches movement action
- dispatches buy card action
- throws on unsupported action type

### 2.2 边界场景处理
- throws on unsupported action type

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
