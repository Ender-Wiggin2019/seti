# cards/base/AliceCard.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/cards/base/AliceCard.ts`
- 对应单测：`packages/server/__tests__/engine/cards/base/AliceCard.test.ts`
- 模块职责：卡牌定义、行为执行、注册与描述效果处理
- 关键导出：Alice

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- is registered as MISSION card kind
- has the correct card id and name
- provides QUICK mission def
- mission def has a single branch with checkCondition
- false when player has no traces at all
- false when player has traces of other colors but no blue

### 2.2 边界场景处理
- false when player has no traces at all
- false when player has traces of other colors but no blue
- false when blue trace on only 1 of 2 species
- false even with many blue traces all on 1 species

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
