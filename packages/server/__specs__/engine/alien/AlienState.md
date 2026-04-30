# alien/AlienState.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/alien/AlienState.ts`
- 对应单测：`packages/server/__tests__/engine/alien/AlienState.test.ts`
- 模块职责：外星人模块（外星板块、插件、注册与结算）
- 关键导出：ITraceTarget、TSingleAlienTraceScope、TAlienTraceScope、IAlienStateInit、AlienState

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- creates boards with 3 discovery slots + 3 color-specific overflow slots per alien
- creates discovery slots for R/Y/B colors
- creates empty state when no aliens
- awards 3 VP when placing trace in matching-color overflow slot
- increments player trace count on overflow
- allows multiple traces in each overflow slot (unlimited)
- getPlayerTraceCount aggregates by player, trace color, and alien scope
- alien scope supports AlienBoard instance, alien index, { alienIndex }, { alienType }, and 'both'/'all'

### 2.2 边界场景处理
- creates empty state when no aliens
- emits TRACE_MARKED event with isOverflow=false for discovery
- places in discovery slot when forceOverflow=false
- skips full discovery slot and falls back to overflow

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
