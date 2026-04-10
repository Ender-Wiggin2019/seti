# actions/Land.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/actions/Land.ts`
- 对应单测：`packages/server/__tests__/engine/actions/Land.test.ts`
- 模块职责：主动作（Main Action）规则入口与动作对象封装
- 关键导出：LandAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- lands on a planet, spends energy, gains center VP and first data bonus
- uses reduced landing cost when any orbiter is already present
- enforces moon unlock and single occupancy through Land action
- applies rover discount tech to reduce landing energy cost by 1
- allows landing on moon with probe moon tech even when moon is locked

### 2.2 边界场景处理
- uses reduced landing cost when any orbiter is already present

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
