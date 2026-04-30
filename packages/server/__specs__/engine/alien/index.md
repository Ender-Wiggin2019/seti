# alien/index.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/alien/index.ts`
- 对应单测：`packages/server/__tests__/engine/alien/index.test.ts`
- 模块职责：外星人模块（外星板块、插件、注册与结算）
- 关键导出：（以模块副作用/类型导出为主）

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- exports public members
- registers dummy plugin as side effect

### 2.2 边界场景处理
- 当前单测以主路径/规则正确性为主，边界由同目录其它单测与集成测试共同兜底。
- 建议后续优先补充非法输入、空集合、重复执行三类边界。

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
