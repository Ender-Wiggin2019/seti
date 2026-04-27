# TODO

## 高优先级

- [ ] 收紧 debug 接口与模块的访问边界
  - 文件：`packages/server/src/debug/debug.controller.ts`, `packages/server/src/app.module.ts`
  - 当前 `/debug/server/session`, `/debug/server/replay-session`, `/debug/server/snapshot-session` 等接口仍是 `@Public()`，且 `DebugModule` 默认加载；需要限制在 dev/test、加认证/内部 guard，或显式 feature flag，避免公开环境可创建和操作调试游戏。

- [ ] 修复 `Game.processInput` 异常路径的 mission checkpoint 泄漏
  - 文件：`packages/server/src/engine/Game.ts`
  - `processInput` 在 `waitingFor.process()` / `runResolutionPipeline()` 抛错时不会调用 `missionTracker.endCheckpoint()`；需要对齐 `processMainAction` 的 try/catch 清理逻辑，并补异常路径单测。

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

- [ ] 补齐 Oumuamua 剩余集成断言
  - 文件：`packages/server/__tests__/engine/actions/Scan.test.ts`, `packages/server/__tests__/engine/cards/BehaviorExecutor.test.ts`
  - 覆盖选择 `oumuamua-sector` 时走普通 sector signal 结算；覆盖 `desc.et-23` / ET.23 的 Oumuamua 专属 icon 集成路径。

- [ ] 清理或实现剩余 alien card 注册 TODO
  - 文件：`packages/server/src/engine/cards/register/registerAlienCards.ts`, `packages/server/src/engine/cards/register/registerSpaceAgencyAliens.ts`
  - 复核 `UNHANDLED_EFFECT(...)` 注释是否仍代表未实现效果；已实现的删除注释，未实现的补齐行为和测试。

- [ ] 补齐 Client 端资源兑换弹窗测试
  - 文件：`packages/client/src/pages/game/GameLayout.tsx`, `packages/client/__tests__/pages/game/GameLayout.test.tsx`
  - 覆盖信用/能量/卡牌资源不足时按钮禁用，以及点击可用选项时发送正确的 `EFreeAction.EXCHANGE_RESOURCES` payload。

## 低优先级

- [ ] 校验 Client 端 snapshot version 输入
  - 文件：`packages/client/src/pages/game/DebugReplayPage.tsx`
  - 拦截负数、小数、0、`NaN` 等无效值，并给出友好的错误提示。

- [ ] 统一 `/debug/alien` 和 `/debug/replay` 路由策略
  - 文件：`packages/client/src/routes.tsx`
  - 选择保留单一路由，或让 `/debug/alien` 带默认 preset 行为，避免 E2E 混用入口。

- [ ] 扩展 `IDebugReplayFieldDefinition.kind`
  - 文件：`packages/common/src/types/protocol/debug.ts`
  - 从仅支持 `'select'` 扩展为 union type，便于后续支持 text/number/player/card 等字段类型。

- [ ] 清理任务链相关测试脆弱点
  - 文件：`packages/server/__tests__/engine/missions/MissionTracker.test.ts`, `packages/server/__tests__/engine/actions/Scan.test.ts`, `packages/server/__tests__/engine/cards/base/ObservationQuickMissionCard.test.ts`
  - 避免从 option id 末尾切分 branch index；替换 monkey-patch `missionTracker.recordEvent` 的断言方式；让 Observation fallback 测试名称和实际断言一致，或恢复真实 card fallback 集成断言。

- [ ] 重审全局 401 拦截策略
  - 文件：`packages/client/src/api/httpClient.ts`
  - 当前非登录/注册请求遇到任意 401 都会 logout 并跳转 `/auth`；需要区分 token 失效和业务级 unauthorized，避免非认证场景误踢用户。
