# deck/MainDeck.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/deck/MainDeck.ts`
- 对应单测：`packages/server/__tests__/engine/deck/MainDeck.test.ts`
- 模块职责：牌库抽取与弃牌重洗逻辑
- 关键导出：MainDeck

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- initializes with 80 default cards
- accepts custom card ids
- inherits Deck operations (draw, discard, drawSize)
- has first card id 'card-1'
- has last card id 'card-80' in the draw pile order

### 2.2 边界场景处理
- initializes with 80 default cards
- has last card id 'card-80' in the draw pile order

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
