# GameOptions.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/GameOptions.ts`
- 对应单测：`packages/server/__tests__/engine/GameOptions.test.ts`
- 模块职责：游戏引擎核心规则模块
- 关键导出：EExpansion、IGameOptions、DEFAULT_GAME_OPTIONS、validateGameOptions、createGameOptions

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- uses defaults when no options provided
- throws when playerCount is out of range

### 2.2 边界场景处理
- uses defaults when no options provided
- throws when playerCount is out of range

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
