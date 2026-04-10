# missions/MissionReward.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/missions/MissionReward.ts`
- 对应单测：`packages/server/__tests__/engine/missions/MissionReward.test.ts`
- 模块职责：任务定义、触发条件、奖励与进度追踪
- 关键导出：applyMissionRewards

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- applies score and resource rewards
- draws cards for CARD reward and ignores undefined draws

### 2.2 边界场景处理
- draws cards for CARD reward and ignores undefined draws

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
