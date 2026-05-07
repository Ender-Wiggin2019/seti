# TODO

## 当前任务：修复 Biome / lint / tsc 验证链

假设与权衡：
- 当前 `pnpm typecheck` 已通过；`@seti/e2e` 没有 root typecheck 脚本，需要单独用 `tsc -p packages/e2e/tsconfig.json --noEmit` 验证。
- `pnpm lint` 的失败集中在 Biome import/export 排序、格式化和一个 `noNonNullAssertion` warning；先做 Biome 建议的最小修复，不扩大重构。
- `pnpm format:check` 把 `backend-reference` 参考目录扫入 Biome，触发旧语法/JSONC 解析错误；优先把明显非项目源码的 reference 目录排除，而不是改参考代码。
- 只修改能直接解释为“让 lint/format/typecheck 通过”的行；已有大量未提交改动保持原样，不回滚。

- [x] 建立失败基线
  - 验证: `pnpm lint` 失败于 `packages/common/src/index.ts` export 排序；分包 lint 还暴露 client/server Biome 格式和 import 排序问题
- [x] 建立类型检查基线
  - 验证: `pnpm typecheck` 通过；`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit` 通过
- [x] 收窄 root Biome format 扫描范围
  - 验证: `pnpm format:check` 不再进入 `backend-reference` 参考目录
- [x] 修复 Biome 排序、格式化和 lint warning
  - 验证: common/client/server 分包 lint 通过
- [x] 跑最终验证
  - 验证: `pnpm lint`、`pnpm typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm format:check` 全部通过
- [x] 记录 review
  - 验证: 在本段末尾补充实际改动和残余风险

Review:
- `biome.json` 为 formatter 单独限定可格式化的项目源码/配置路径，避免 `biome format .` 扫描 `backend-reference`、截图、本地 agent 状态等非项目源码；`format:check` 当前检查 1253 个文件。
- 修复 common export 排序、client/server 已有改动中的 Biome 格式问题，并把 server probe movement 的 `solarSystem!` 改成显式初始化 guard。
- 执行 `pnpm format` 后，项目内已有未格式化测试文件被 Biome 机械格式化；未修改 reference 目录内容。
- 验证通过：`pnpm lint`、`pnpm typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm format:check`。
- 残余风险：root `pnpm typecheck` 仍不包含 `@seti/e2e` 包，后续如果希望纳入统一链路，需要给 `packages/e2e/package.json` 增加 typecheck 脚本并接入 turbo。

## 当前任务：修正 Anomalies token 与 alien board trace 渲染

假设与权衡：
- `solarSystem.alienTokens[].rewards` 已经包含奖励数据；本次只修 client 渲染，不改协议和规则结算。
- 规则奖励图标必须走 `DescRender` / `EffectFactory` 链路，不能用颜色块、alien 图片或手写临时图形替代。
- Alien board trace 的视觉顺序和槽形状属于 UI 语义问题，优先用组件测试锁定，再用目标 E2E 截图复查。
- Hand 中出现多张 Anomalies card 需要先解释来源；只有确认不是规则/测试副作用后才改实现。

- [x] 先写失败测试：solar anomaly token 必须是 rounded-full pill，左右显示 trace 色，中间通过 desc reward 渲染 `credit-1` / `energy-1`
  - 验证: `SolarSystemView` 单测能防止退回方形图片、纯色点或非 desc 渲染
- [x] 先写失败测试：alien board trace slot 使用 trace 同色圆形 border，奖励并排显示，且不显示 index
  - 验证: `AlienBoardView` 单测覆盖固定 slot、无限 slot 和 draw alien card 专用 token
- [x] 先写失败测试：board trace 顺序为低 index 在最底部
  - 验证: trace column / anomaly reward ladder 使用反向纵向布局
- [x] 实现最小 UI 修复
  - 验证: 只改 board 组件、cards export 和必要测试 mock
- [x] 跑组件测试、typecheck、目标 E2E 并核对截图
  - 验证: `AlienBoardView` / `SolarSystemView` 相关测试通过，目标 E2E 通过并能说明截图含义
- [x] 记录结果与 hand anomaly card 数量原因
  - 验证: TODO Review 写明 ET.16 抽牌导致 hand 中多张 anomaly card 的来源

Review:
- `SolarSystemView` 的 anomaly token 已改为 `rounded-full` pill：左右两侧是 trace 颜色，中间用 `DescRender` 渲染 `{credit-1}` 等 reward desc。
- `AlienBoardView` 的 trace reward 容器统一为 trace 同色 border：固定槽保持圆形，`maxOccupants === -1` 的不限数量槽改为纵向长条 `rounded-full`。
- Anomalies board reward ladder 删除可见 index，使用 `flex-col-reverse` 保证低 index 在最底部；普通 trace column 同样反向纵向排列。
- draw alien card reward 继续由 common presentation 产出 `{draw-alien-card-1}`，client 通过 `DescRender` 渲染，避免退回普通 draw card 图标。
- Hand 中出现多张 Anomalies card 的来源是 E2E 在 reveal 后按规则打出 `ET.16`：先打出 1 张，再从 Anomalies face-up/deck 抽 3 张，手牌净增 2，属于本次 card 结算断言的一部分。
- 验证通过：`pnpm --filter @seti/client test -- AlienBoardView.test.tsx SolarSystemView.test.tsx`（实际运行 client 全量 53 files / 176 tests）、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`./scripts/run-e2e-local.sh tests/alien-discovery-real-flow.spec.ts`。
- 使用 @浏览器 打开 `http://localhost:5173/debug/replay` 复核并截图，输出：`browser-anomalies-vertical-trace-collapsed.png`。

## 当前任务：Anomaly token reward icon 修正

假设与权衡：
- Server 已经通过 `solarSystem.alienTokens[].rewards` 下发 anomaly token 奖励，问题在 client Board marker 的视觉语义，不需要改 common/server 协议。
- Anomaly token 在 solar board 上代表奖励，不代表 alien 身份；渲染必须优先走现有 reward/desc icon 路径（`EffectFactory`），trace color 只作为辅助状态。
- 只修 solar-system alien token marker 和对应组件测试；E2E 继续用现有真实流程截图验证。

- [x] 先写失败测试：solar-system anomaly token 必须渲染 `token.rewards` 对应的 reward icon
  - 验证: `SolarSystemView` 单测在渲染 alien 头像时失败，缺少 `trace-reward-icon-credit-1`
- [x] 实现最小 UI 修复
  - 验证: token 内出现 reward icon，trace 颜色仅作为角标/描边
- [x] 重新跑组件测试、typecheck、目标 E2E 并确认截图
  - 验证: 单测/typecheck/E2E 通过，Board tab token 截图能看到类似 desc 的 reward icon

Review:
- `SolarSystemView` 的 solar alien token marker 已从 alien 头像改为 `token.rewards` -> `toTraceRewardPresentations` -> `EffectFactory`，颜色仅保留为 trace 辅助角标和描边。
- `SolarSystemView` 单测新增断言：Anomalies token 内必须有 `trace-reward-icon-credit-1`，防止退回头像、字母或纯色点。
- 已验证组件测试：`pnpm --filter @seti/client test -- SolarSystemView.test.tsx` 通过（实际运行 client 全量 53 files / 176 tests）。
- 重新生成 `05-anomaly-tokens-board-p1.png`，确认 Board tab 上的 anomaly token 显示类似 desc 的 reward icon，而不是 alien 头像。

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
- [x] 补 Anomalies 卡结算断言
  - 验证: 真实 UI reveal 后打出 `ET.16`，玩家 Anomalies hand card 数量按 “打出 1 张、抽 3 张” 净增 2
- [x] 补 mark trace 奖励结算断言
  - 验证: 真实 UI 选择 discovery trace slot 后玩家 publicity 增加 slot reward，证明 mark trace 结算执行

Review:
- 新增 `packages/e2e/tests/alien-discovery-real-flow.spec.ts`，用真实 UI 完成注册、建房、加入、开局、launch probe、play card、mark red/yellow traces、pass/end-of-round、play/data corner、填电脑槽、analyze data、mark blue trace、Anomalies reveal。
- 新测试不使用 `/debug/*`、localStorage auth 注入或直接 WS action；只通过 UI 操作和房间创建请求中的稳定 seed 降低随机性。
- 为 alien trace occupant 增加稳定 `data-testid`，使 E2E 能观察到 trace slot 被玩家占用；同时在测试 helper 内处理放数据触发的真实 tuck-for-income 选牌提示。
- 真实 UI trace placement 现在额外断言 discovery slot reward 已结算：每次选择 discovery trace slot 后玩家 publicity 增加 1。
- 真实 UI reveal 后额外打出 Anomalies `ET.16`，断言 Anomalies hand cards 按 “打出 1 张、抽 3 张” 净增 2，覆盖 alien card 结算。
- 新增 8 个通过态截图附件：红 trace、黄 trace、电脑填满、蓝 trace、Board tab anomaly tokens、P1 Anomalies reveal、P2 Anomalies reveal、P1 Anomalies card settled。
- 验证通过：`./scripts/run-e2e-local.sh tests/alien-discovery-real-flow.spec.ts`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`./scripts/run-e2e-local.sh tests/main-action-play-card.spec.ts tests/main-action-research-tech.spec.ts tests/main-action-orbit-land.spec.ts tests/main-action-analyze-data.spec.ts tests/alien-discovery-real-flow.spec.ts`。

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

## 当前修正：Anomalies trace 布局

- [x] 修正 Anomalies board 外层 red/yellow/blue trace 始终横向排列
- [x] 保持单条 trace 内部 reward slot 纵向排列
- [x] 跑相关单测
- [x] 用 in-app browser 截图确认

## 当前修正：Anomalies trace 紧凑与 icon 可读性

- [x] 放大 Anomalies reward 内的 desc icon
- [x] 压缩单条 trace 的 padding 和 reward slot 宽度
- [x] 提前 alien board 双列布局断点，尽量在窄视口放下两个 board
- [x] 跑相关单测
- [x] 用 in-app browser 截图确认

## 当前修正：未发现 alien board 占位

- [x] 将未发现 alien 的 board 区改为纯黑占位背景
- [x] 删除未发现 board 内的伪 red/yellow/blue trace 列
- [x] 保留 Discovery/Overflow 区
- [x] 跑相关单测
- [x] 用 in-app browser 截图确认

## 当前修正：hidden board 高度对齐

- [x] 将未发现 hidden board 的占位高度对齐已展示 board
- [x] 跑相关单测
- [x] 用 in-app browser 截图确认

Review:
- Hidden board 仍然是纯黑未知占位，不渲染伪 red/yellow/blue trace 列。
- 占位最小高度调整为 `360px`，浏览器截图确认右侧未知 board 和左侧 Anomalies board 底部对齐。

## 当前任务：E2E 实现结构与覆盖 review

假设与权衡：
- 本次只做 review，不修改 e2e 测试实现。
- 重点检查 `packages/e2e` 的测试结构、helper 分层、覆盖有效性和冗余度；必要时参考 Stage 9-4 E2E 任务标准与项目 lessons。
- Debug replay/snapshot 用例可以作为调试覆盖，但不能替代真实生产路径 E2E。

- [x] 盘点 e2e spec、helper、Playwright 配置和运行入口
  - 验证: 能归类真实 UI 流、API/WS/debug 辅助流、主动作/free action/房间/auth 覆盖
- [x] 识别结构混乱、重复 setup、职责边界不清的具体文件和行号
  - 验证: 每条问题能指向具体代码位置，并说明维护风险
- [x] 判断覆盖是否充分但不冗余
  - 验证: 明确哪些测试应保留为核心闭环，哪些应合并/降级/改名
- [x] 运行低成本验证
  - 验证: 至少执行 e2e TypeScript 编译或说明无法执行原因
- [x] 输出 review 报告
  - 验证: `docs/review/e2e-2026-05-07.md` 包含 severity 汇总、Top findings 和整改建议

Review:
- 已生成 `docs/review/e2e-2026-05-07.md`。结论：当前 E2E 对主动作、free action、多玩家回合和 Anomalies 真实发现闭环覆盖较强，但 suite 分层不清，多个 smoke/journey 用例重复覆盖 `register -> room -> game -> PASS`。
- 主要问题：`auth.spec.ts` API 测试共享 `uniqueEmail` 导致用例顺序依赖；Stage 9-4 的 responsive 和 reconnect 覆盖缺失；seed/scenario 房间创建 helper 在多个 spec 中通过 route body rewrite 重复实现。
- 低成本验证通过：`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`，`pnpm --filter @seti/e2e exec playwright test --list --project=chromium` 列出 54 tests / 31 files。

## 当前任务：优化 E2E review findings

假设与权衡：
- 本次只优化 review 中 4 个 finding，不扩大到业务规则或 UI 外观修复。
- `browser-smoke.spec.ts` 保留为 canonical smoke；主动作/free action/alien 真实闭环保留，重复的基础 journey 合并或删除。
- 新增 responsive/reconnect 覆盖必须走真实浏览器 UI 和真实 server/client，不使用 debug endpoint、localStorage 注入或 raw WS action 驱动玩法。
- seed 注入属于 deterministic UI setup，需要集中到 helper，测试标题和 helper 参数都显式表达；`scenarioPreset` 被 server 明确作为 public room payload 忽略，不能作为真实 UI E2E 前置条件。

- [x] 修复 auth API 用例顺序依赖
  - 验证: `auth.spec.ts` 中每个 API 测试自建前置用户，单独跑 login/duplicate/auth-me 不依赖前一个测试
- [x] 补 responsive 与 reconnect 覆盖
  - 验证: Playwright 能列出 desktop/tablet/mobile 或对应 spec，且 reconnect 测试通过真实页面恢复状态
- [x] 收敛 seed 房间创建 helper，删除无效 scenario-preset E2E
  - 验证: 重复 `createRoomByUiWithSeed` 删除，统一走 `createRoomByUiWithDetails`；依赖 public `scenarioPreset` 的 E2E 删除
- [x] 去重基础 smoke/journey
  - 验证: 删除或合并重复 `register -> room -> game -> PASS` spec，保留覆盖矩阵不倒退
- [x] 运行验证并更新报告
  - 验证: e2e typecheck、相关定向 Playwright spec 通过，review 文档记录最终调整

Review:
- `auth.spec.ts` 已改为每个 API 用例自建前置用户，不再依赖 describe 级共享邮箱和测试执行顺序。
- 新增 `responsive.spec.ts` 覆盖 desktop/tablet/mobile 三个 viewport 的真实 auth/lobby 渲染；新增 `reconnection.spec.ts` 覆盖真实游戏页 reload 后恢复同一 dashboard state。
- `createRoomByUi` / `createRoomByUiWithDetails` 现在集中支持 seed 注入并使用 `try/finally` 清理 route；原本复制的 seed helper 已移除。
- 删除重复基础 journey：`fixed-user-smoke.spec.ts`、`game-debug-session.spec.ts`、`game-flow-behavior.spec.ts`、`game-flow-user-path.spec.ts`。保留 `browser-smoke.spec.ts` 作为 canonical smoke。
- 原依赖 public `scenarioPreset` 的 `free-action-spend-signal-token.spec.ts`、`free-action-deliver-sample.spec.ts` 不再通过 lobby 注入；后续已迁移为 Debug Replay checkpoint setup + 真实 Game UI 点击。
- 验证通过：`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm --filter @seti/e2e exec playwright test --list --project=chromium`（52 tests / 27 files）、`./scripts/run-e2e-local.sh tests/auth.spec.ts tests/responsive.spec.ts tests/reconnection.spec.ts`（14 passed）、`./scripts/run-e2e-local.sh tests/main-action-analyze-data.spec.ts`（1 passed）。

## 当前修正：SPEND_SIGNAL_TOKEN / DELIVER_SAMPLE E2E 闭环

假设与权衡：
- `SPEND_SIGNAL_TOKEN` 已经是规则层 free action：只在 scan action pool 中、有 signal token 且 card row 非空时出现；本次不改成 main action 或任务。
- `DELIVER_SAMPLE` 是 Mascamites sample mission 的完成分支，前置链路长；本次不把它误判为普通 move 覆盖，也不重开 public `scenarioPreset`。
- public lobby 继续忽略 `scenarioPreset`；长前置状态改由明确的 Debug Replay checkpoint 准备，E2E 进入 checkpoint 后只通过真实 Game UI 点击动作。

- [x] 复核 common/server/client 对两个 action 的真实实现
  - 验证: 指出 free action gating、server processor、client FreeActionBar/GameLayout 都已存在或补齐缺口
- [x] 为 Debug Replay 增加 free action checkpoint
  - 验证: server 单测先覆盖 `spend-signal-token` 与 `deliver-sample` checkpoint，再让测试通过
- [x] 恢复 UI E2E 闭环
  - 验证: E2E 不再依赖 public `scenarioPreset`，进入 debug replay 后通过真实 UI 点击并断言状态变化
- [x] 更新 review / e2e 文档与 lessons
  - 验证: 文档明确区分 production lobby E2E、debug replay coverage 和 server/client 实现状态
- [x] 跑 targeted 验证
  - 验证: server debug preset 单测、E2E typecheck、两个 free-action E2E 通过

Review:
- 复核结果：`SPEND_SIGNAL_TOKEN` 已在 common `getAvailableFreeActions`、server `SpendSignalTokenFreeAction` / `Game.assertActionAllowed`、client `FreeActionBar` / `GameLayout` 中作为条件 free action 实现；不是新的 main action，也不是缺失实现。
- 复核结果：`DELIVER_SAMPLE` 已在 common sample delivery gating、server `DeliverSampleFreeAction` / Mascamites plugin、client sample delivery option 中实现；它是 Mascamites sample mission 的交付分支，不应由普通 movement E2E 替代。
- 新增 `free-action-debug` Debug Replay preset，包含 `spend-signal-token` 与 `deliver-sample` 两个 checkpoint；public lobby 仍忽略 `scenarioPreset`。
- 恢复 `free-action-spend-signal-token.spec.ts` 与 `free-action-deliver-sample.spec.ts`，入口改为 Debug Replay，进入 checkpoint 后只通过真实 UI 点击 action 并断言状态变化。
- `run-e2e-local.sh` 本地 E2E 启动时显式设置 `SETI_ENABLE_DEBUG_API=true` 和 `VITE_ENABLE_DEBUG_ROUTES=true`，以支持已有 debug replay/snapshot specs；production 默认不变。
- 验证通过：`pnpm --filter @seti/server typecheck`、`pnpm --filter @seti/server test -- debugReplayPresets.test.ts`（18 passed）、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm --filter @seti/e2e exec playwright test --list --project=chromium`（54 tests / 29 files）、`./scripts/run-e2e-local.sh tests/free-action-spend-signal-token.spec.ts tests/free-action-deliver-sample.spec.ts`（2 passed）。

## 当前任务：实现 E2E review 剩余结构优化

假设与权衡：
- `docs/review/e2e-2026-05-07.md` 中 W-01 到 W-04 已在当前工作区实现并记录；本轮不重复修改这些已完成项。
- 本轮聚焦剩余结构项：helper 分层、debug/API shortcut 边界、suite taxonomy、统一 started-game helper、DB prepare 职责、CI headless 入口。
- 不移动大量 spec 目录，避免无意义 diff；suite taxonomy 优先用 Playwright tag 和文档说明实现。
- 不删除 `injectAuth` / debug API / `WsTestClient`，因为 debug/API 专用测试仍可能需要；只把它们移到明确 test-only/debug 命名边界，降低生产 UI spec 误用风险。

- [x] 拆分 `real-flow.ts` 的职责边界
  - 验证: 新增 auth/room/prompt/game/assertion/session helper 后，`real-flow.ts` 只作为兼容 re-export 或轻量入口；E2E typecheck 通过
- [x] 增加统一 `createStartedGameByUi` helper，并迁移重复 setup
  - 验证: 至少迁移 `game-actions.spec.ts`、`main-action-research-tech.spec.ts`、`main-action-orbit-land.spec.ts`、`free-action-complete-mission.spec.ts` 中重复的两人开局流程
- [x] 隔离 debug/API shortcut helper
  - 验证: debug endpoint helper、localStorage auth 注入、raw websocket client 文件名显式带 debug/test-only/shortcut；`rg` 确认生产 UI specs 不 import 这些 shortcut
- [x] 定义 E2E suite taxonomy
  - 验证: 关键 spec 标题或 describe 包含 `@smoke` / `@real-ui` / `@actions` / `@debug` / `@api` / `@slow`，并在 `docs/tests/e2e.md` 说明如何筛选
- [x] 统一 DB prepare 职责
  - 验证: wrapper 路径只由 `init-e2e-local.sh` 准备 DB，并向 Playwright 传 `SKIP_E2E_DB_PREPARE=1`；直接 Playwright 路径仍由 global setup 准备 DB
- [x] 补 CI headless E2E workflow
  - 验证: workflow 使用 PostgreSQL service、安装依赖/浏览器、运行 E2E typecheck 和 headless Playwright；本地至少通过 YAML/脚本静态检查与 E2E test list
- [x] 更新 review 报告和运行验证
  - 验证: `pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm --filter @seti/e2e exec playwright test --list --project=chromium`、代表性定向 E2E 通过或明确记录阻塞原因

Review:
- `real-flow.ts` 已拆为 `auth-flow.ts`、`room-flow.ts`、`prompt-resolvers.ts`、`game-actions-flow.ts`、`session-flow.ts`，原入口保留 re-export 兼容现有 spec。
- 新增 `createStartedGameByUi`，并迁移 `game-actions.spec.ts`、`main-action-research-tech.spec.ts`、`main-action-orbit-land.spec.ts`、`free-action-complete-mission.spec.ts` 的重复两人开局流程。
- Shortcut helper 边界已显式命名：`debug-api.ts`、`test-only-auth.ts`、`ws-shortcuts.ts`；生产 UI specs 未 import 这些 shortcut。
- E2E suite 已通过 Playwright title tags 标注，并在 `docs/tests/e2e.md` 记录 `--grep` 筛选方式。
- DB prepare 职责已收敛：wrapper 路径由 `init-e2e-local.sh` 准备 DB 并跳过 Playwright global setup；直接 Playwright 路径仍由 `global-setup.ts` 准备 DB。
- 新增 `.github/workflows/e2e.yml`，包含 PostgreSQL service、依赖安装、Playwright Chromium 安装、E2E typecheck 和 headless E2E 运行。
- 验证通过：E2E typecheck、完整 Playwright test list（54 tests / 29 files）、`@smoke` test list（2 tests）、`@api` test list（8 tests）、workflow YAML 解析、`./scripts/run-e2e-local.sh tests/auth.spec.ts tests/game-actions.spec.ts`（12 passed）、兼容 Node runtime 下直接 Playwright API auth（7 passed）。

## 当前任务：Oumuamua 真实冒烟 E2E 覆盖与修复

假设与权衡：
- 本轮以真实 UI 冒烟闭环为主：注册、建房、开局、可见按钮/输入完成 gameplay；不使用 localStorage 注入、debug endpoint 或 raw websocket 驱动生产路径行为。
- Oumuamua 完整发现前置很长；如果 scan/orbit/land/card 需要稳定地进入 Oumuamua 状态，优先用可复现 seed 和真实房间设置，不重新引入 public `scenarioPreset`。
- 覆盖目标不是穷举规则单测，而是证明 Oumuamua 的 tile scan、planet orbit、planet land、alien card 在真实浏览器里能操作并产生可观察状态。
- 若现有 UI 无法通过真实路径稳定到达某个目标，先暴露失败点并定位根因，再决定是修产品还是调整测试路径。

- [x] 复核 Oumuamua 实现入口和 UI locator
  - 验证: 明确 scan/orbit/land/card 各自对应的 server/client/common 文件、test id、输入 option id
- [x] 跑现有相邻 E2E 基线
  - 验证: `alien-pool-config`、`main-action-orbit-land`、`alien-discovery-real-flow` 或定向 Oumuamua spec 的当前结果被记录
- [x] 增加 Oumuamua 真实 UI 冒烟覆盖
  - 验证: 新增/更新 spec 覆盖 Oumuamua tile scan、Oumuamua orbit、Oumuamua land、Oumuamua card 结算
- [x] 修复发现的问题
  - 验证: 如涉及 common/server/client，保持两端动作和渲染一致；无关代码不改
- [x] Subagent 复核覆盖与 shortcut 风险
  - 验证: 复核结论记录到本段 Review，确认没有用 debug/localStorage/raw WS 替代真实 UI
- [x] 运行 targeted 验证并记录结果
  - 验证: E2E typecheck 与 Oumuamua/相邻 Playwright spec 通过，失败则记录具体阻塞原因

Review:
- 新增 `packages/e2e/tests/oumuamua-real-flow.spec.ts`，通过真实注册、建房、开局、主行动、自由行动和输入面板覆盖 Oumuamua tile scan、orbit、land、alien card 路径；没有使用 localStorage 注入、debug endpoint 或 raw websocket 驱动生产行为。
- 修复真实路径暴露的问题：Oumuamua 是动态太阳系行星，不在常规 Planets tab 中选择；因此 Aliens tab 的 Oumuamua landing area 需要在 orbit/land 选择模式下暴露真实 planet target，并复用 common 的 `canOrbitPlanet` / `canLandOnPlanet` 判定。
- 修复主行动可用性问题：common `getAvailableMainActions` 之前只枚举 `planetaryBoard.planets`，导致探测器到达 Oumuamua 后 ORBIT/LAND 仍 disabled；现在当 solar system 已出现 Oumuamua 时纳入动态空行星状态，服务端执行仍走原有真实 action 校验与结算。
- Subagent 复核结论：Oumuamua 不应从常规 Planets view 选取，orbit/land 目标应在 Aliens board 上通过 `planet-target-oumuamua` 暴露；新增 spec 保持真实 UI/后端路径。
- 验证通过：`tsc -p packages/e2e/tsconfig.json --noEmit`；`pnpm --filter @seti/client typecheck`；`./scripts/run-e2e-local.sh tests/oumuamua-real-flow.spec.ts`（3 passed）；`./scripts/run-e2e-local.sh tests/main-action-orbit-land.spec.ts tests/oumuamua-real-flow.spec.ts`（5 passed）；`./scripts/run-e2e-local.sh tests/alien-pool-config.spec.ts tests/alien-discovery-real-flow.spec.ts`（4 passed）。
