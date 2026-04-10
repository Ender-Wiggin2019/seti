# actions/Orbit.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/actions/Orbit.ts`
- 对应单测：`packages/server/__tests__/engine/actions/Orbit.test.ts`
- 模块职责：主动作（Main Action）规则入口与动作对象封装
- 关键导出：IOrbitExecutionResult、OrbitAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- spends resources, moves probe from space, and grants first orbit bonus
- only grants +3 VP for the first orbiter on a planet
- rejects orbit when no own probe is on selected planet

### 2.2 边界场景处理
- rejects orbit when no own probe is on selected planet

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
