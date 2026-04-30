# scoring/Milestone.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/scoring/Milestone.ts`
- 对应单测：`packages/server/__tests__/engine/scoring/Milestone.test.ts`
- 模块职责：终局与里程碑/金色计分逻辑
- 关键导出：MilestoneState

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- triggers gold milestone when threshold reached
- resolves simultaneous players in seat order from current player
- resolves neutral milestones after gold milestones
- does not retrigger same milestone when score passes 100

### 2.2 边界场景处理
- does not retrigger same milestone when score passes 100

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
