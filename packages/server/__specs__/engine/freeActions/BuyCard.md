# freeActions/BuyCard.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/freeActions/BuyCard.ts`
- 对应单测：`packages/server/__tests__/engine/freeActions/BuyCard.test.ts`
- 模块职责：免费动作规则与派发处理
- 关键导出：IBuyCardResult、BuyCardFreeAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true with publicity >= 3
- returns false with publicity < 3
- takes a specific card from the row and refills
- takes first card when no cardId specified
- does not refill when deck is empty
- throws when card not in row

### 2.2 边界场景处理
- returns true with publicity >= 3
- returns false with publicity < 3
- takes first card when no cardId specified
- does not refill when deck is empty

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
