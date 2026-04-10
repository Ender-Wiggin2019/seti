# player/Computer.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/player/Computer.ts`
- 对应单测：`packages/server/__tests__/engine/player/Computer.test.ts`
- 模块职责：玩家状态（资源/数据/电脑板/手牌）与行为
- 关键导出：EComputerRow、IComputerPosition、Computer

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- creates default 6-column computer
- validates empty column configs
- fills top row from left to right and reports connected/full status
- is connected when top full but not full when bottom slot exists
- throws when top row is not filled sequentially
- throws when top position is invalid or already occupied

### 2.2 边界场景处理
- validates empty column configs
- throws when top row is not filled sequentially
- throws when top position is invalid or already occupied
- throws when bottom slot is duplicated or out of range

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
