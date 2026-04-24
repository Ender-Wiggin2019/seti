# TODO

## 高优先级

- [ ] 修复 server 现存测试失败（4 个）
  - `packages/server/__tests__/engine/cards/CardFrameworkStressTest.test.ts`：3 failures
  - `packages/server/__tests__/engine/effects/probe/ProbeEffectUtils.test.ts`：1 failure
  - 当前错误：`game.solarSystem.getPlanetLocation is not a function`
  - 处理方向：补齐测试 mock，或统一 `getSpacesOnPlanet` / `getPlanetLocation` 的兼容边界，确保真实 `SolarSystem` 与测试替身一致。

## 中优先级

- [ ] 补齐 debug snapshot replay E2E 覆盖
  - 文件：`packages/e2e/tests/debug-snapshot-replay.spec.ts`
  - 覆盖无效 `gameId` 错误提示、指定 `version` 加载、snapshot HUD 元数据、加载后的交互操作（end turn / main action）。

- [ ] 补齐 debug replay E2E 覆盖
  - 文件：`packages/e2e/tests/debug-replay.spec.ts`
  - 覆盖切换 preset 后字段更新、`New Replay` 返回表单。

- [ ] 增加 Oumuamua debug replay preset
  - 文件：`packages/server/src/debug/debugReplayPresets.ts`
  - 覆盖 tile signal、exofossil、trace columns 等 Oumuamua 专属调试场景。

## 低优先级

- [ ] 校验 Client 端 snapshot version 输入
  - 文件：`packages/client/src/pages/game/DebugReplayPage.tsx`
  - 拦截负数、小数、0、`NaN` 等无效值，并给出友好的错误提示。

- [ ] 统一 `/debug/alien` 和 `/debug/replay` 路由策略
  - 文件：`packages/client/src/routes.tsx`
  - 选择保留单一路由，或让 `/debug/alien` 带默认 preset 行为，避免 E2E 混用入口。

- [ ] 扩展 `IDebugReplayFieldDefinition.kind`
  - 文件：`packages/common/src/types/protocol/debug.ts`
  - 从仅支持 `'select'` 扩展为 union type，便于后续支持 text input 等字段类型。
