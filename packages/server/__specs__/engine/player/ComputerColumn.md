# player/ComputerColumn.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/player/ComputerColumn.ts`
- 对应单测：`packages/server/__tests__/engine/player/ComputerColumn.test.ts`
- 模块职责：玩家状态（资源/数据/电脑板/手牌）与行为
- 关键导出：TECH_TOP_REWARD、ITechPlacement、IComputerColumnState、ComputerColumn

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- uses config top reward before tech placement and TECH_TOP_REWARD after placement
- enforces top-before-bottom placement order
- throws when placing tech on non-tech column
- clear resets filled state but keeps placed tech

### 2.2 边界场景处理
- throws when placing tech on non-tech column

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
