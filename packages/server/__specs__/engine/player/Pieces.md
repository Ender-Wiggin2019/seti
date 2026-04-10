# player/Pieces.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/player/Pieces.ts`
- 对应单测：`packages/server/__tests__/engine/player/Pieces.test.ts`
- 模块职责：玩家状态（资源/数据/电脑板/手牌）与行为
- 关键导出：EPieceType、IPieceInventory、Pieces

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- uses default inventory when omitted
- rejects invalid inventory amounts
- deploys and returns pieces while tracking availability
- throws when deploying unavailable piece
- throws when returning non-deployed piece

### 2.2 边界场景处理
- rejects invalid inventory amounts
- throws when deploying unavailable piece
- throws when returning non-deployed piece

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
