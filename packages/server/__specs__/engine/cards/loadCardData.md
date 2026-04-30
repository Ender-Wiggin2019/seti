# cards/loadCardData.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/cards/loadCardData.ts`
- 对应单测：`packages/server/__tests__/engine/cards/loadCardData.test.ts`
- 模块职责：卡牌定义、行为执行、注册与描述效果处理
- 关键导出：loadCardData、loadAllCardData、hasCardData

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- loads known card by id
- throws for unknown card id
- exposes existence check and full list

### 2.2 边界场景处理
- throws for unknown card id

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
