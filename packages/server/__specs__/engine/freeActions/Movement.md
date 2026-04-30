# freeActions/Movement.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/freeActions/Movement.ts`
- 对应单测：`packages/server/__tests__/engine/freeActions/Movement.test.ts`
- 模块职责：免费动作规则与派发处理
- 关键导出：IMovementResult、MovementFreeAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true when probe in space and has move stash
- returns true when probe in space and has energy (convertible)
- returns false when no probes in space
- returns false when solar system is null
- moves probe along a valid 2-step path
- grants publicity when passing through publicity icon space

### 2.2 边界场景处理
- returns true when probe in space and has move stash
- returns true when probe in space and has energy (convertible)
- returns false when no probes in space
- returns false when solar system is null

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
