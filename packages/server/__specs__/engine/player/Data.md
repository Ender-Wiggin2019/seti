# player/Data.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/player/Data.ts`
- 对应单测：`packages/server/__tests__/engine/player/Data.test.ts`
- 模块职责：玩家状态（资源/数据/电脑板/手牌）与行为
- 关键导出：IDataState、IDataInit、Data

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- tracks pool, computer, stash and total capacities
- adds incoming data into stash with overflow discard
- flushes stash into pool at turn end with discard overflow
- moves data from pool or stash into computer slots
- spends data from stash then pool then computer
- throws on invalid data usage

### 2.2 边界场景处理
- throws on invalid data usage
- uses default 6-column config when no configs specified

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
