# freeActions/PlaceData.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/freeActions/PlaceData.ts`
- 对应单测：`packages/server/__tests__/engine/freeActions/PlaceData.test.ts`
- 模块职责：免费动作规则与派发处理
- 关键导出：IPlaceDataResult、PlaceDataFreeAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true when data in pool and computer has space
- returns false when data pool is empty
- returns false when top full and no bottom slots available
- returns true when top full and bottom slot available via tech
- places data from pool to first top slot
- fills top slots left to right across 6 default columns

### 2.2 边界场景处理
- returns true when data in pool and computer has space
- returns false when data pool is empty
- returns false when top full and no bottom slots available
- returns true when top full and bottom slot available via tech

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
