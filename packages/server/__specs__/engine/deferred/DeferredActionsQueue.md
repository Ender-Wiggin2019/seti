# deferred/DeferredActionsQueue.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/deferred/DeferredActionsQueue.ts`
- 对应单测：`packages/server/__tests__/engine/deferred/DeferredActionsQueue.test.ts`
- 模块职责：延迟动作队列与优先级调度
- 关键导出：DeferredActionsQueue

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- executes actions by priority order
- pauses drain when an action returns PlayerInput
- keeps new actions sorted when pushed during drain
- returns undefined when draining an empty queue
- preserves FIFO order for equal priorities

### 2.2 边界场景处理
- returns undefined when draining an empty queue

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
