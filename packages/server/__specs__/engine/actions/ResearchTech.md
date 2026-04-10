# actions/ResearchTech.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/actions/ResearchTech.ts`
- 对应单测：`packages/server/__tests__/engine/actions/ResearchTech.test.ts`
- 模块职责：主动作（Main Action）规则入口与动作对象封装
- 关键导出：IResearchTechActionResult、ResearchTechAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true with enough publicity and available techs
- returns false without enough publicity
- returns false when no techs are available
- returns false when techBoard is null
- returns true with isCardEffect when publicity is too low (skips publicity check)
- spends publicity (6) when not a card effect

### 2.2 边界场景处理
- returns false without enough publicity
- returns false when no techs are available
- returns false when techBoard is null
- returns true with isCardEffect when publicity is too low (skips publicity check)

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
