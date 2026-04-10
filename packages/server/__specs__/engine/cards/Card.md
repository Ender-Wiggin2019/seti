# cards/Card.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/cards/Card.ts`
- 对应单测：`packages/server/__tests__/engine/cards/Card.test.ts`
- 模块职责：卡牌定义、行为执行、注册与描述效果处理
- 关键导出：（以模块副作用/类型导出为主）

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- runs template-method canPlay pipeline and calls bespokeCanPlay last
- returns false when requirements are not met
- queues behavior and executes it when deferred queue drains
- returns bespokePlay result

### 2.2 边界场景处理
- returns false when requirements are not met

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
