# board/Sector.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/board/Sector.ts`
- 对应单测：`packages/server/__tests__/engine/board/Sector.test.ts`
- 模块职责：棋盘与太阳系/行星区域状态建模
- 关键导出：IDataSignal、IPlayerSignal、TSectorSignal、ISectorMarkSignalResult、ISectorCompletionResult、DEFAULT_FIRST_WIN_BONUS、DEFAULT_REPEAT_WIN_BONUS、ISectorInit

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- replaces rightmost data with player marker and gains data
- replaces rightmost data (not leftmost) progressively
- appends marker when no data remains (no data gain)
- sets completed=true when all data displaced
- returns false when data remains
- returns true when no data remains

### 2.2 边界场景处理
- appends marker when no data remains (no data gain)
- sets completed=true when all data displaced
- returns false when data remains
- returns true when no data remains

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
