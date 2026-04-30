# missions/MissionCondition.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/missions/MissionCondition.ts`
- 对应单测：`packages/server/__tests__/engine/missions/MissionCondition.test.ts`
- 模块职责：任务定义、触发条件、奖励与进度追踪
- 关键导出：matchesFullMissionTrigger、checkQuickMissionCondition

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- matches CARD_PLAYED requirement with cost and resource type
- matches ORBIT_OR_LAND requirement on landing event
- returns false for empty requirements
- prioritizes custom checkCondition when provided
- evaluates fulfill-sector condition against game sectors

### 2.2 边界场景处理
- returns false for empty requirements

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
