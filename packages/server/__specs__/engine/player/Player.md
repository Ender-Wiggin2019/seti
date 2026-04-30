# player/Player.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/player/Player.ts`
- 对应单测：`packages/server/__tests__/engine/player/Player.test.ts`
- 模块职责：玩家状态（资源/数据/电脑板/手牌）与行为
- 关键导出：Player

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- creates a player with default setup state
- supports custom initialization and subsystem options
- flushes stash data into data pool at turn end
- applies round income to resources and move stash
- discards move stash automatically at turn end
- binds game reference via bindGame

### 2.2 边界场景处理
- 当前单测以主路径/规则正确性为主，边界由同目录其它单测与集成测试共同兜底。
- 建议后续优先补充非法输入、空集合、重复执行三类边界。

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
