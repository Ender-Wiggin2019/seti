# tech/TechBoard.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/tech/TechBoard.ts`
- 对应单测：`packages/server/__tests__/engine/tech/TechBoard.test.ts`
- 模块职责：科技树、科技条目与修正器
- 关键导出：ITechTile、ITechStack、ITakeResult、TechBoard

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- initializes 12 stacks with 4 tiles each
- covers all category + level combinations
- returns true for any tech on a fresh board
- returns false if player already owns the tech
- allows different players to research the same tech
- returns false when stack is depleted

### 2.2 边界场景处理
- returns false if player already owns the tech
- returns false when stack is depleted
- throws when player already owns the tech
- throws when stack is empty

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
