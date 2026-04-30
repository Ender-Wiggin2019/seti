# freeActions/ConvertEnergyToMovement.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/freeActions/ConvertEnergyToMovement.ts`
- 对应单测：`packages/server/__tests__/engine/freeActions/ConvertEnergyToMovement.test.ts`
- 模块职责：免费动作规则与派发处理
- 关键导出：IConvertEnergyResult、ConvertEnergyToMovementFreeAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true when player has energy
- returns false when player has no energy
- converts 1 energy to 1 movement
- converts multiple energy at once
- throws when not enough energy
- throws for invalid amount

### 2.2 边界场景处理
- returns true when player has energy
- returns false when player has no energy
- throws when not enough energy
- throws for invalid amount

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
