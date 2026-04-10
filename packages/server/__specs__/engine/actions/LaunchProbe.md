# actions/LaunchProbe.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/actions/LaunchProbe.ts`
- 对应单测：`packages/server/__tests__/engine/actions/LaunchProbe.test.ts`
- 模块职责：主动作（Main Action）规则入口与动作对象封装
- 关键导出：ILaunchProbeResult、LaunchProbeAction

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- returns true with 2+ credits and probes below limit
- returns true with exactly 2 credits
- returns false with only 1 credit
- returns false with 0 credits
- returns false when probes in space equals limit
- returns true with doubled probe limit

### 2.2 边界场景处理
- returns false with only 1 credit
- returns false with 0 credits
- returns false when probes in space equals limit
- returns true when double-probe tech is owned

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
