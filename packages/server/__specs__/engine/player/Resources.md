# player/Resources.ts 规则说明

## 1、文件主要功能
- 源文件：`packages/server/src/engine/player/Resources.ts`
- 对应单测：`packages/server/__tests__/engine/player/Resources.test.ts`
- 模块职责：玩家状态（资源/数据/电脑板/手牌）与行为
- 关键导出：IResourceBundle、TPartialResourceBundle、IDataResourceController、Resources

## 2、单测测试点，以及边界场景处理
### 2.1 核心测试点
- exposes scalar getters and data from controller
- gains and spends resource bundles
- checks affordability and supports canAfford alias
- throws insufficient resources error when spending over capacity
- throws validation errors for negative amounts
- caps publicity gain at 10 and allows explicit set

### 2.2 边界场景处理
- throws insufficient resources error when spending over capacity
- throws validation errors for negative amounts
- caps publicity gain at 10 and allows explicit set

### 2.3 一一对应关系确认
- 本文档、源文件、单测文件保持同一路径同名映射（仅后缀不同）。
