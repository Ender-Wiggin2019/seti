# TODO

## 当前任务：Anomaly token 渲染真实 icon

假设与权衡：
- Server 已经通过 `solarSystem.alienTokens` 下发 anomaly token，问题在 client Board marker 只显示颜色和字母，不需要改 common/server 协议。
- 使用现有 alien 资源图 `/seti-assets/aliens/anomalies.webp` 作为 token icon；保留 trace color 小角标，表达该 token 对应红/黄/蓝 trace。
- 只修 solar-system alien token marker 和对应组件测试；E2E 继续用现有真实流程截图验证。

- [x] 先写失败测试：solar-system anomaly token 必须渲染 icon image
  - 验证: `SolarSystemView` 单测在只有文字/颜色点时失败
- [x] 实现最小 UI 修复
  - 验证: token 内出现 Anomalies icon，trace 颜色仅作为角标/描边
- [x] 重新跑组件测试、typecheck、目标 E2E 并确认截图
  - 验证: 单测/typecheck/E2E 通过，Board tab token 截图能看到 icon

Review:
- `SolarSystemView` 的 solar alien token marker 改为渲染 alien icon image；Anomalies 使用 `/seti-assets/aliens/anomalies.webp`，红/黄/蓝 trace color 继续作为描边和角标保留。
- `SolarSystemView` 单测新增断言：Anomalies token 内必须有可访问的 `img`，防止退回只显示字母/颜色点。
- 重新生成 `05-anomaly-tokens-board-p1.png`，Board tab 上的 anomaly token 已可见 icon。
- 验证通过：`pnpm --filter @seti/client test -- SolarSystemView.test.tsx`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`./scripts/run-e2e-local.sh tests/alien-discovery-real-flow.spec.ts`。

## 当前任务：补齐 main action 与 alien 关键流程 E2E

假设与权衡：
- 现有 `packages/e2e/tests/main-action-*.spec.ts` 已经分别覆盖了 `PLAY_CARD`、`RESEARCH_TECH`、`ORBIT`、`LAND`、`ANALYZE_DATA`，本任务不重复堆同类断言，优先补“真实用户流里没有闭环证明”的部分。
- `debug-replay` / `debug-snapshot` 已覆盖部分 alien 规则，但按 E2E 约束不能把 debug endpoint、localStorage 注入或直接 WS 驱动算作生产路径覆盖。
- 若自然走完整游戏路径过长，允许使用稳定 seed/现有 UI 房间配置来降低随机性；不新增 debug-only 测试入口。

- [x] 复核现有 E2E 覆盖和可复用 helper
  - 验证: 列出每个 main action/free action 已覆盖 spec，确认新增测试只补缺口
- [x] 先写失败测试：真实 UI 完成 mark trace 后在 Aliens tab 可观察到 trace slot 占用
  - 验证: 定向运行新增/修改 spec，先失败在缺少断言或缺少可定位 UI 状态处
- [x] 先写失败测试：真实 UI 填满 alien discovery 三色槽并在 end turn 后 reveal alien board
  - 验证: `alien-*-hidden-board` 消失，具体 alien board/deck/规则区出现，双方页面同步
- [x] 先写失败测试：发现后的 alien 专属规则至少覆盖一个可交互规则路径
  - 验证: 通过可见 UI 操作触发规则结果，例如 Anomalies token/column、Mascamites sample、Oumuamua trace column 中最短可稳定的一条
- [x] 补最小实现或 helper
  - 验证: 不使用 `/debug/*`、不注入 auth、不中途直接发 WS action；只加必要 selector/testid/helper
- [x] 跑定向 E2E 与相关单测
  - 验证: `./scripts/run-e2e-local.sh <target spec>` 通过；如改了 client/server helper，再跑对应单测或 typecheck

Review:
- 新增 `packages/e2e/tests/alien-discovery-real-flow.spec.ts`，用真实 UI 完成注册、建房、加入、开局、launch probe、play card、mark red/yellow traces、pass/end-of-round、play/data corner、填电脑槽、analyze data、mark blue trace、Anomalies reveal。
- 新测试不使用 `/debug/*`、localStorage auth 注入或直接 WS action；只通过 UI 操作和房间创建请求中的稳定 seed 降低随机性。
- 为 alien trace occupant 增加稳定 `data-testid`，使 E2E 能观察到 trace slot 被玩家占用；同时在测试 helper 内处理放数据触发的真实 tuck-for-income 选牌提示。
- 新增 7 个通过态截图附件：红 trace、黄 trace、电脑填满、蓝 trace、Board tab anomaly tokens、P1 Anomalies reveal、P2 Anomalies reveal。
- 验证通过：`./scripts/run-e2e-local.sh tests/alien-discovery-real-flow.spec.ts`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`./scripts/run-e2e-local.sh tests/main-action-play-card.spec.ts tests/main-action-research-tech.spec.ts tests/main-action-orbit-land.spec.ts tests/main-action-analyze-data.spec.ts tests/alien-discovery-real-flow.spec.ts`。

## 当前任务：Anomaly token reward icon 修正

- [x] 先写失败测试：solar board 上 anomaly token 必须渲染 `token.rewards` 对应的 desc/reward icon
  - 验证: `pnpm --filter @seti/client test -- SolarSystemView.test.tsx` 失败在缺少 `trace-reward-icon-credit-1`，当前 DOM 仍是 alien 头像
- [ ] 将 token 视觉从 alien 头像改为 reward presentation icon，颜色仅作为 trace 辅助状态
  - 验证: 同一测试通过，DOM 内出现 `trace-reward-icon-credit-1`
- [ ] 重跑 typecheck 和 alien discovery E2E，更新 Board tab anomaly token 截图
  - 验证: 新截图显示类似 desc 的 reward icon，例如 `1 credit`

## 当前任务：Sector image mode 数据对齐复核

- [x] 检查 server/common 的 sector tile 定义与运行时 setup 回显
  - 验证: 4 个 sector tile 分别为 `procyon/vega`, `sirius-a/barnards-star`, `kepler-22/proxima-centauri`, `61-virginis/beta-pictoris`
- [x] 确认 text mode 按 server 回显的 sectorId/name 顺序渲染
  - 验证: 浏览器或组件测试中 8 个 sector 名称与 tile pairing 一致
- [x] 复现并定位 image mode 两个 sector 拼图内的数据槽/热点是否串位
  - 验证: 浏览器截图或失败单测能指出哪一个 tile/sector 的数据不一致
- [x] 未确认数据串位 bug，跳过业务代码修复
  - 验证: 不写猜测性失败测试/修复，保留现有最小影响面
- [x] 用相关单测和浏览器 image/text mode 复查
  - 验证: `SectorView`/相关 board 测试通过，浏览器可见结果与 server 回显一致

Review:
- Server/common canonical tile data matches the expected pairs: sector tile 1 `procyon/vega`, tile 2 `sirius-a/barnards-star`, tile 3 `kepler-22/proxima-centauri`, tile 4 `61-virginis/beta-pictoris`.
- `/debug/server` public state echoes `solarSystemSetup.tilePlacements` and `sectors` consistently; browser text mode matched the same server state names, colors, and data capacities.
- Browser image mode kept the paired tile images together and rendered per-half data counts matching server state, e.g. tile 2 rendered `6/5` data slots for `sirius-a/barnards-star`. No production bug was confirmed in this pass, so no business code was changed.
- Residual risk: image-mode data dots/hotspots still use shared local offsets per tile half rather than per-asset calibrated coordinates; this is a visual alignment risk, not a reproduced server/client data mismatch.

## 当前任务：Game UI 审查与修复

- [x] 复现并截图定位非 text mode 下 sector data 未落到对应 data slot 的问题
- [x] 定位并移除 sector 上非预期的 `11/11` 等调试/计数文字
- [x] 修复 mark signal 后 solar system 出现玩家颜色小点的问题
- [x] 审查同一屏可见的其他 board UI 异常，只修和本次问题同源或低风险的项
- [x] 补充或更新最小测试，先确认失败再实现修复
- [x] 用浏览器截图复查，并跑相关测试

Review:
- 截图确认 image mode 中 `9/9`、`11/11`、`5/5` 等生成计数已移除；mark signal 后 sector slot 保留空位但不再渲染玩家色 marker。
- 发现 debug toolbar 会覆盖输入区，属于 `/debug/game` 调试壳层问题，未纳入本次 board overlay 修复范围。

## 高优先级

- [x] 重构 alien board / Anomalies 的状态模型与 UI 协议
  - 文件：`packages/common/src/types/protocol/gameState.ts`, `packages/server/src/engine/alien/AlienBoard.ts`, `packages/server/src/engine/alien/AlienState.ts`, `packages/server/src/persistence/serializer/GameSerializer.ts`, `packages/client/src/features/board/AlienBoardView.tsx`
  - 当前仍用通用 `slots` 承载 discovery zone、overflow、alien 专属 board slot、anomaly column、anomaly token 等不同概念，容易出现 hidden board 泄漏、UI 错误渲染和规则语义混淆。需要拆分公共协议和服务端内部数据结构：未 discovery 时只公开 3 个 discovery zone + 不限数量 overflow，hidden board 不暴露任何内容；reveal 后按 alien 类型展示独立注册的 board 组件。
  - Anomalies 需要专门建模为 3 列 trace board（red/yellow/blue 各一列）、独立 anomaly token 区域、alien deck / discard / face-up card 区域，并补齐 alien card 分发结算的集成测试和 debug replay 截图验证。

- [x] 收紧 debug 接口与模块的访问边界
  - 文件：`packages/server/src/debug/debug.controller.ts`, `packages/server/src/app.module.ts`
  - 当前 `/debug/server/session`, `/debug/server/replay-session`, `/debug/server/snapshot-session` 等接口仍是 `@Public()`，且 `DebugModule` 默认加载；需要限制在 dev/test、加认证/内部 guard，或显式 feature flag，避免公开环境可创建和操作调试游戏。

- [x] 修复 `Game.processInput` 异常路径的 mission checkpoint 泄漏
  - 文件：`packages/server/src/engine/Game.ts`
  - `processInput` 在 `waitingFor.process()` / `runResolutionPipeline()` 抛错时不会调用 `missionTracker.endCheckpoint()`；需要对齐 `processMainAction` 的 try/catch 清理逻辑，并补异常路径单测。

## 中优先级

- [x] 补齐 debug snapshot replay E2E 覆盖
  - 文件：`packages/e2e/tests/debug-snapshot-replay.spec.ts`
  - 覆盖无效 `gameId` 错误提示、指定 `version` 加载、snapshot HUD 元数据、加载后的交互操作（end turn / main action）。

- [x] 补齐 debug replay E2E 覆盖
  - 文件：`packages/e2e/tests/debug-replay.spec.ts`
  - 覆盖切换 preset 后字段更新、`New Replay` 返回表单。

- [x] 增加 Oumuamua debug replay preset
  - 文件：`packages/server/src/debug/debugReplayPresets.ts`
  - 覆盖 tile signal、exofossil、trace columns 等 Oumuamua 专属调试场景。

- [x] 补齐 Oumuamua 剩余集成断言
  - 文件：`packages/server/__tests__/engine/actions/Scan.test.ts`, `packages/server/__tests__/engine/cards/BehaviorExecutor.test.ts`
  - 覆盖选择 `oumuamua-sector` 时走普通 sector signal 结算；覆盖 `desc.et-23` / ET.23 的 Oumuamua 专属 icon 集成路径。

- [x] 清理或实现剩余 alien card 注册 TODO
  - 文件：`packages/server/src/engine/cards/register/registerAlienCards.ts`, `packages/server/src/engine/cards/register/registerSpaceAgencyAliens.ts`
  - 复核 `UNHANDLED_EFFECT(...)` 注释是否仍代表未实现效果；已实现的删除注释，未实现的补齐行为和测试。

- [x] 补齐 Client 端资源兑换弹窗测试
  - 文件：`packages/client/src/pages/game/GameLayout.tsx`, `packages/client/__tests__/pages/game/GameLayout.test.tsx`
  - 覆盖信用/能量/卡牌资源不足时按钮禁用，以及点击可用选项时发送正确的 `EFreeAction.EXCHANGE_RESOURCES` payload。

## 低优先级

- [x] 校验 Client 端 snapshot version 输入
  - 文件：`packages/client/src/pages/game/DebugReplayPage.tsx`
  - 拦截负数、小数、0、`NaN` 等无效值，并给出友好的错误提示。

- [x] 统一 `/debug/alien` 和 `/debug/replay` 路由策略
  - 文件：`packages/client/src/routes.tsx`
  - 选择保留单一路由，或让 `/debug/alien` 带默认 preset 行为，避免 E2E 混用入口。

- [x] 扩展 `IDebugReplayFieldDefinition.kind`
  - 文件：`packages/common/src/types/protocol/debug.ts`
  - 从仅支持 `'select'` 扩展为 union type，便于后续支持 text/number/player/card 等字段类型。

- [x] 清理任务链相关测试脆弱点
  - 文件：`packages/server/__tests__/engine/missions/MissionTracker.test.ts`, `packages/server/__tests__/engine/actions/Scan.test.ts`, `packages/server/__tests__/engine/cards/base/ObservationQuickMissionCard.test.ts`
  - 避免从 option id 末尾切分 branch index；替换 monkey-patch `missionTracker.recordEvent` 的断言方式；让 Observation fallback 测试名称和实际断言一致，或恢复真实 card fallback 集成断言。

- [x] 重审全局 401 拦截策略
  - 文件：`packages/client/src/api/httpClient.ts`
  - 当前非登录/注册请求遇到任意 401 都会 logout 并跳转 `/auth`；需要区分 token 失效和业务级 unauthorized，避免非认证场景误踢用户。
