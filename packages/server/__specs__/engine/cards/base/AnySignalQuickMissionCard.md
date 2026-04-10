# cards/base/AnySignalQuickMissionCard.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/cards/base/AnySignalQuickMissionCard.ts`
- 对应单测：`packages/server/__tests__/engine/cards/base/AnySignalQuickMissionCard.test.ts`
- 模块职责：卡牌定义、行为执行、注册与描述效果处理
- 关键导出：AnySignalQuickMissionCard

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- card 32 marks Mercury sector twice without extra input
- card 115 asks for signal color and then sector when color is ambiguous
- card 88 marks probe sector twice when only one probe sector exists
- card 134 lets player choose between multiple probe sectors

### 2.2 边界场景处理
- card 32 marks Mercury sector twice without extra input

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
