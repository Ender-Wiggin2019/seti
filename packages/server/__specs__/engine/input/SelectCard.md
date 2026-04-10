# input/SelectCard.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/input/SelectCard.ts`
- 对应单测：`packages/server/__tests__/engine/input/SelectCard.test.ts`
- 模块职责：玩家输入模型与交互约束
- 关键导出：ISelectCardConfig、SelectCard

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns selected card ids via callback
- throws when selected id is not in options

### 2.2 边界场景处理
- throws when selected id is not in options

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
