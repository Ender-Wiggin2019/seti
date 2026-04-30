# freeActions/ExchangeResources.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/freeActions/ExchangeResources.ts`
- 对应单测：`packages/server/__tests__/engine/freeActions/ExchangeResources.test.ts`
- 模块职责：免费动作规则与派发处理
- 关键导出：IExchangeResult、ExchangeResourcesFreeAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true with 2+ credits
- returns false when all below 2
- spends 2 credits and gains 1 energy
- spends 2 energy and gains 1 credit
- discards 2 cards and gains 1 credit
- spends 2 credits and draws 1 card

### 2.2 边界场景处理
- returns false when all below 2
- throws when from === to
- throws for invalid resource type
- throws when not enough credits

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
