# deck/Deck.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/deck/Deck.ts`
- 对应单测：`packages/server/__tests__/engine/deck/Deck.test.ts`
- 模块职责：牌库抽取与弃牌重洗逻辑
- 关键导出：Deck

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- creates an empty deck by default
- initializes with provided items
- does not mutate the original array
- draws from the top (front) of the draw pile
- returns undefined when empty
- throws when deck is empty

### 2.2 边界场景处理
- creates an empty deck by default
- returns undefined when empty
- throws when deck is empty
- returns top items without removing them

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
