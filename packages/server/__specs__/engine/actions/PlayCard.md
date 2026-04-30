# actions/PlayCard.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/actions/PlayCard.ts`
- 对应单测：`packages/server/__tests__/engine/actions/PlayCard.test.ts`
- 模块职责：主动作（Main Action）规则入口与动作对象封装
- 关键导出：IPlayCardResult、PlayCardAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true when the hand has cards
- returns false when the hand is empty
- removes the card at the given index from hand
- discards the played card via mainDeck.discard
- returns the played card id
- throws when the hand is empty

### 2.2 边界场景处理
- returns true when the hand has cards
- returns false when the hand is empty
- throws when the hand is empty
- throws when card index is out of range

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
