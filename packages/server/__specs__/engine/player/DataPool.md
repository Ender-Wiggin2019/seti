# player/DataPool.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/player/DataPool.ts`
- 对应单测：`packages/server/__tests__/engine/player/DataPool.test.ts`
- 模块职责：玩家状态（资源/数据/电脑板/手牌）与行为
- 关键导出：DATA_POOL_MAX、DataPool

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- validates constructor constraints
- adds and removes data within bounds
- caps additions at max and returns actual added amount
- supports zero changes
- throws when removing more than available
- throws validation error for negative operation amounts

### 2.2 边界场景处理
- throws when removing more than available
- throws validation error for negative operation amounts

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
