# alien/plugins/DummyAlienPlugin.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/alien/plugins/DummyAlienPlugin.ts`
- 对应单测：`packages/server/__tests__/engine/alien/plugins/DummyAlienPlugin.test.ts`
- 模块职责：外星人模块（外星板块、插件、注册与结算）
- 关键导出：DummyAlienPlugin

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- awards 3 VP to each discoverer on discover
- computes end-game score from dummy alien board trace count
- returns 0 when dummy alien board is absent

### 2.2 边界场景处理
- returns 0 when dummy alien board is absent

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
