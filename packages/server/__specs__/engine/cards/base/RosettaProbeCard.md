# cards/base/RosettaProbeCard.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/cards/base/RosettaProbeCard.ts`
- 对应单测：`packages/server/__tests__/engine/cards/base/RosettaProbeCard.test.ts`
- 模块职责：卡牌定义、行为执行、注册与描述效果处理
- 关键导出：RosettaProbe

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- loads expected card metadata
- builds mission definition from card data

### 2.2 边界场景处理
- 当前单测以主路径/规则正确性为主，边界由同目录其它单测与集成测试共同兜底。
- 建议后续优先补充非法输入、空集合、重复执行三类边界。

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
