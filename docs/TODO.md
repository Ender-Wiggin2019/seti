# TODO

## Global error management confidence loop - 2026-05-11

Success criteria:
- Common protocol carries enough error semantics for server/client to distinguish silent, warning/business, error, and blocking failures.
- Server WebSocket and HTTP boundaries map known business/auth/not-found/system errors into the shared error payload without leaking unexpected internal messages.
- Stale or duplicate game input responses are silent at the client boundary and do not mutate/persist state; ordinary illegal game actions are warnings, not error toasts.
- Client global error handling uses shared semantics: silent errors are ignored, warning/business errors render warning toasts, blocking errors stay visible until dismissed.
- Focused tests fail on the old behavior and pass after the implementation; final review records any residual risk.

- [x] Add failing common tests for error classification defaults and explicit payload normalization.
- [x] Add failing server tests for missing game mapping, stale input silence, GameError payload metadata, and sanitized internal websocket errors.
- [x] Add failing client tests for silent/warning/blocking `game:error` handling and warning toast rendering.
- [x] Implement shared protocol/error classification and server/client boundary mapping with minimal API changes.
- [x] Run targeted common/server/client tests and type checks, then re-review loopholes.

Review:
- 新增 common 错误语义：`EErrorSeverity` / `EErrorCategory` / `EErrorDisplay`、`CONNECTION_ERROR`、`STALE_INPUT_RESPONSE`、`classifyErrorCode`、`normalizeErrorPayload`。默认分类将 stale input 设为 silent，游戏规则拒绝设为 warning/business，transport/auth/not-found/internal 设为 blocking。
- 修复 server 边界：`GameError` 现在携带 normalized payload；WebSocket auth/handler 错误统一发 shared payload；未知 WS/HTTP 异常脱敏为 `Internal server error`；`GameManager.getGame` 返回 `GAME_NOT_FOUND`；外部 input 无 prompt 或 inputId mismatch 返回 silent `STALE_INPUT_RESPONSE` 且不推进 version/persist。
- 修复 HTTP 边界：新增 `HttpErrorFilter` 并在 `main.ts` 全局挂载，Nest exceptions / `GameError` / unknown errors 都映射为 shared payload。
- 修复 client 展示：`useGameError` 按 shared classification 处理 silent/warning/blocking；toast 支持 `warning` 与 persistent `duration: null`；HTTP interceptor 优先展示 server payload message；Socket.IO connect/reconnect failure 映射为 blocking `CONNECTION_ERROR`；`GameLayout` 本地游戏内业务阻断从 error toast 改为 warning toast。
- 验证通过：common 全量 13 files / 142 tests；server 全量 298 files / 1887 tests；client 全量 62 files / 213 tests；common/server/client typecheck；本轮 touched files Biome check；`git diff --check`。client 全量测试仍输出既有 jsdom `window.scrollTo` warning，但测试通过，且与本轮错误系统无关。

## Rule FAQ implementation confidence loop - 2026-05-11

Success criteria:
- Every ruling in `docs/arch/rule-faq.md` is mapped to concrete implementation and/or test evidence, or explicitly marked not implemented/out of scope with reason.
- Every confirmed mismatch has a minimal proposed fix and a focused regression test/check that would fail on the old behavior.
- The fix plan is recorded before production changes; any skipped confirmation gate is explicitly noted.
- After confirmed fixes, targeted tests/type checks prove the FAQ behavior; any residual risk is explicitly recorded.

- [x] Read `docs/arch/rule-faq.md` line-by-line and convert it into a checklist by rules domain.
- [x] Compare Actions/Land/Scan/Analyze/Probe/Tech FAQ rulings with server/common/client implementation and tests.
- [x] Compare Missions/Milestones/Gold scoring/Cards FAQ rulings with implementation and tests.
- [x] Compare Alien species/Solo FAQ rulings with implementation and tests.
- [x] Aggregate all loopholes, separate confirmed bugs from unimplemented/out-of-scope features, and propose minimal fixes/tests.
- [x] Record the implementation plan before production code; explicit confirmation was superseded by the active-goal continuation instruction.
- [x] Implement confirmed fixes only, with focused regression coverage.
- [x] Run targeted verification, repeat the review loop, and record final confidence/review result.

Pre-implementation review:
- 当前实现还不能 100% 确认符合 `rule-faq.md`。已确认的行为差异包括：income/tuck 有手牌时被强制执行；card orbit effect 提供 `skip-orbit`；card launch/tech 不可执行时会让整张多效果卡不可打，而不是只跳过该 effect；generic card effect 以固定 priority/字段顺序解析，并且 tech-without-ROTATE 会旋转，和 project note 不一致。
- Scan 存在两个确认漏洞：基础 Scan 在执行 `MARK_EARTH` 后就提供 `DONE`，可跳过 card-row signal；Scan interruption 用任意 OPTION prompt 放行 free action，可能在一个 free action 或子交互未完成时再次插入 free action。
- Orbiter/lander 的真实状态在 `planetaryBoard`，但若干计分/卡牌路径使用 `player.pieces.deployed(ORBITER/LANDER)`；真实 orbit/land effect 没有同步 deploy。影响 gold `other/A`、通用 end-game per-orbit/land 计分，以及依赖 piece inventory 的 return-card 类路径。
- Solo gold milestone 没有限制 Rival 只能占 gold tile 第一格；当所有第一格已被占时，当前筛选仍可让 Rival 占第二格。S.17 Oumuamua 只配置/跟随 lander placement，在 landing 不可用但 orbit 可用的场景可能错误 fallback 到 scan。
- 需要补强但未必是生产逻辑错误的风险：S.15 Saturn/Jupiter movement 配置都为 5，FAQ 写 Saturn up to 4/Jupiter up to 5；S.15 empty sample pool / no reward isolation、S.16 既有人类 marker 的 leading 判定、solo objective 与 triggerable mission 同动作双标记、full mission skip 后再触发、Computer tech arbitrary column 的既有测试稳定性，都需要 focused regression 覆盖。

Proposed minimal fix plan:
- 修正 card effect 执行语义：card `canPlay` 不因 launch/tech 当前不可执行而拒绝整张卡；单个 launch/tech/land/orbit effect 在不可执行时跳过并继续；orbit 有可选目标时不提供 skip；tuck-for-income 在 card effect 场景允许 0 张跳过，但 setup tuck 仍保持强制。
- 修正 card effect 顺序/旋转：至少让 generic card-granted tech 使用 `skipRotation: true`，只由显式 ROTATE effect 旋转；为当前数据中的 rotate+tech、tech-without-rotate、launch-impossible-plus-resource 等路径加回归测试。若左到右顺序需要彻底保证，再把 generic behavior 从聚合字段改为保留 effect sequence 的队列。
- 修正 Scan：`DONE` 只有在 `MARK_EARTH` 和可执行的 `MARK_CARD_ROW` 都完成后才出现；free action interruption 只允许在 Scan action-pool menu 上发生，不能在 SpendSignalToken / MarkSectorSignal / PlaceData 等嵌套输入中再次插入。
- 修正 orbiter/lander 计数来源：以 `planetaryBoard` 作为计分权威来源，替换 gold `other/A` 与 end-game per orbit/land/per orbit-or-land 计数；同时修复 return-card 对真实 board lander/orbiter 的处理，避免依赖未同步的 piece deployed 计数。
- 修正 Solo：Rival gold options 只包含 `claims.length === 0` 的 tile；S.17 对 Oumuamua 使用 land-or-orbit 选择，landing 不可用但 orbit 可用时执行 orbit；为 S.15/S.16/solo objective-mission 并行触发补回归测试。
- 验证：先写能在旧实现失败的 targeted tests，再跑相关 server/common 测试集与 TypeScript check；根据失败继续下一轮 review，直到每个 FAQ 条目都有代码或测试证据。

Review:
- 修复 Actions/Card 语义：income tuck 可选择 0 张跳过，setup tuck 仍强制；card `canPlay` 不再因单个 launch/tech 不可执行而拒绝整张卡；不可执行的 launch/tech effect 执行时跳过并继续；orbit effect 可执行时不再提供 skip；通用 `behaviorFromEffects` 保留 left-to-right effect sequence；card-granted tech 只在显式 ROTATE effect 存在时旋转。
- 修复自由行动时机：主行动解析中的 pending input 可被 free action 中断，并在 free action 自身输入完成后恢复原主行动输入；free action interruption wrapper 防止 free action 嵌套 free action；Scan pool 保持 card-row/base mark mandatory，不允许在 MARK_EARTH 后提前 DONE。
- 修复 probe/orbiter/lander 权威状态：orbit/land effect 同步 deployed piece；gold `other/A`、通用 final scoring、Exertians 条件计数以 `planetaryBoard` 为权威并包含 moon occupants；Sample Return 支持真实 board lander/moon occupant。
- 修复 Solo/alien FAQ：Rival gold 只占 gold tile 第一格；S.15 拆为 Saturn 4/Jupiter 5 并保持 sample pool 为空时跳过、样本奖励不发给 Rival；S.16 以最近非 neutral occupant 判断 Rival 是否 leading；S.17 在 Oumuamua landing 不可用但 orbit 可用时执行 orbit；S.19 danger 计数只统计真实 danger slots + face-down cards。
- 补强 mission/objective 证据：triggerable mission 一个 checkpoint 只能 claim 一个 branch；skip 当前 trigger 后必须靠后续 trigger 再 claim；solo objective 与 triggerable mission 可由同一动作同时标记；mission 在卡牌主效果完全解析后才在 played mission 区生效的既有测试保持通过。
- 验证通过：server 全量 297 files / 1882 tests 通过；`pnpm --filter @seti/server typecheck` 通过；common 全量 12 files / 138 tests 通过；`pnpm --filter @ender-seti/common typecheck` 通过；本轮 touched 25 个 TS/TSX 文件 Biome check 通过；`git diff --check` 对本轮 touched 文件通过。
- 残余说明：本轮未改动已有 client/transport dirty files、`bk.config.yml`、`.playwright-mcp/` 等前序工作区改动；未发现剩余可复现的 `rule-faq.md` mismatch。

## Data-driven view/interaction confidence loop - 2026-05-11

Success criteria:
- Server owns canonical game state and projects all client-visible board/player/alien/solo data per viewer, without leaking hidden information.
- Server pending interactions are serialized as `IPlayerInputModel`; client submits only typed `IInputResponse` / action payloads and does not invent rule state outside `common` helpers.
- Client text mode and image mode differ only in presentation assets/layout. Both modes must consume the same projected state and preserve the same click/submit semantics.
- Every confirmed loophole has a focused failing test or observable assertion before production changes.
- Targeted type/tests/lint prove the reviewed contract; any residual risk is explicitly recorded.

- [x] Review server projection and websocket/input lifecycle for stale prompts, hidden data leaks, and missing public fields.
- [x] Review common protocol/types/helpers used by both client and server for duplicated or divergent rule logic.
- [x] Review client board/player/card/solo renderers for data-driven state consumption and text/image mode parity.
- [x] Review existing unit/E2E coverage and identify assertions that would fail if the strategy regressed.
- [x] Confirm the fix plan before changing production code.
- [x] Implement only confirmed minimal fixes, with regression tests.
- [x] Run targeted checks, re-review loopholes, and write the final review result.

Pre-implementation review:
- 当前策略还不能 100% 确认。最大漏洞是 transport response 没有关联 `inputId`：server pending input model 有 `inputId`，但 client 提交的 `IInputResponse` 没有带 id，server 也只校验 response type。过期点击、重复点击或迟到响应只要类型和 payload 符合新 prompt，就可能被当作当前交互处理。
- client `usePlayerInput.respond` 在发送后立即清空 pending input。如果 server 拒绝、网络失败或 stale input 被拦截，客户端会丢掉可重试的 prompt，掩盖真实状态。
- debug server 模式没有复用 websocket 路径的 card normalization。live server state 中部分 card 仍可能是 id string；debug REST 获取后直接 set state/input，可能让数据驱动视图收到未归一化 card。
- text mode / image mode 本轮未发现确认的规则分叉：主要分支集中在 presentation assets/layout，点击与提交语义仍来自同一份 server projection 和 pending input。修复重点应放在交互契约和 debug 数据入口。

Proposed minimal fix:
- 在 common `IInputResponse` 契约中加入 optional `inputId`，client 所有 input renderer 与 board shortcut 提交时带上当前 `model.inputId` / `pendingInput.inputId`；嵌套 AND/OR response 同时携带 root 与 nested input id。
- 在 `GameManager.processInput` 这个外部 transport 边界校验 `response.inputId === player.waitingFor.inputId`，缺失或不匹配时在进入 engine 前拒绝，避免 stale response 改变 game state 或清掉 server prompt。
- 调整 `usePlayerInput`：提交时只发送，不乐观清空；收到 authoritative `game:state` 后清空 pending，后续 `game:waiting` 再设置新 prompt。
- 在 `useServerDebugSession` 中复用 `normalizeGameStateCards` / `normalizePlayerInputCards`，让 debug REST 和 websocket 路径一致。
- 为上述每个漏洞补 focused regression tests，再跑 targeted client/server/common checks。

Review:
- 修复 transport input 关联：`IInputResponse` 增加 `inputId`，所有 client input renderer、board shortcut、debug bot/random input response 都带当前 server-projected input id；`GameManager.processInput` 在进入 engine 和递增 snapshot version 之前拒绝 missing/stale `inputId`。
- 修复 pending input 生命周期：`usePlayerInput.respond` 不再乐观清空 prompt，改为在收到 authoritative `game:state` 后清空，后续 `game:waiting` 继续由 server 设置。
- 修复 debug server 数据入口：`useServerDebugSession` 对 REST state 和 pending input 复用 card normalization，debug server mode 与 websocket mode 不再分叉。
- text mode / image mode 复核：本轮没有发现规则或交互语义分叉；相关 board/layout 测试覆盖了 text/image presentation 下的同一 pending input 语义。
- 验证通过：新增红灯覆盖 missing/stale `inputId`、pending prompt retry、debug REST card normalization、root/nested renderer response id；client input/board/layout 目标集 19 files / 91 tests 通过；client text-mode 目标集 5 files / 35 tests 通过；server gateway/debug 目标集 3 files / 27 tests 通过，额外 `GameManager` 16 tests 通过；common/client/server TypeScript checks 全部通过；本轮 touched TS/TSX 文件 Biome check 通过。
- 残余说明：`Game.processInput` 仍允许无 `inputId` 的内部调用，保留给 engine unit tests、Rival 自动解析和测试 fixture；外部 websocket/debug REST transport 统一由 `GameManager` 强制校验。`bk.config.yml` 与 `.playwright-mcp/` 是本轮开始前已有改动，未纳入本次修复。

## Alien implementation confidence loop - 2026-05-11

Success criteria:
- Every implemented alien species and shared alien mechanism is mapped to `docs/arch/aliens/*.md`, `docs/arch/rule-simple.md`, and FAQ constraints where relevant.
- Every confirmed alien bug has a failing unit/E2E check or equivalent observable assertion before production changes.
- Server/common/client alien behavior stays consistent for hidden information, public projection, card economy, discovery, and species-specific resources.
- The final state is backed by targeted tests/type checks, and any residual risk is explicitly recorded.

- [x] Inventory current alien docs, implementation files, tests, and dirty worktree state.
- [x] Review shared alien infrastructure: setup, discovery, trace selection, deck/face-up flow, serialization, and public state.
- [x] Review Anomalies and Centaurians implementations against rules and tests.
- [x] Review Exertians and Mascamites implementations against rules and tests.
- [x] Review Oumuamua implementation against rules and tests.
- [x] Review client rendering/projection and E2E coverage for alien-specific behavior.
- [x] Patch only confirmed issues with minimal code changes.
- [x] Run targeted tests/type checks and repeat review until no factual gaps remain.

Review:
- 修复 shared alien 流程：discovery 输入完成后会继续解析同一轮后续已 fully marked 的 alien，避免第一个 alien 的交互输入截断发现链。
- 修复 Exertians：solo Rival 发现只按 discovery markers 获得 progress；danger trace 槽不再立即给 VP，游戏结束惩罚从 slot id 解析 danger；所有本轮确认的弃牌路径过滤 Exertian cards。
- 修复 Oumuamua：tile signal 消耗 data token 时给玩家 data；orbit 奖励现在会让玩家选择 sector/tile signal，并在 face-up 与 deck 都可用时选择 alien-card 来源。
- 修复 Mascamites：public sample pools 只投影数量，active capsules 不再投影 hidden sample token id；quick mission 的 comet/asteroid/distance probe 判断包含 Mascamites capsules。
- 修复客户端一致性：Centaurians reward slots 使用现有 desc/icon 渲染链；SelectTraceInput 使用 server-provided title；Mascamites UI 不再展示 active capsule 的 hidden sample id。
- 验证通过：server alien 目标集 11 files / 107 tests；client alien/input 目标集 2 files / 12 tests；common freeActions 1 file / 39 tests；common/server/client TypeScript checks 全部通过；本次相关 21 个文件 Biome check 通过，`GameSerializer.ts` correctness check 通过。
- 残余说明：完整 `@seti/server` lint 仍被既有格式问题阻断，位置在 `GameStateDto.ts`、`GameDeserializer.ts`、`GameSerializer.ts` 的旧格式片段；本轮未做无关格式化。

## Solo implementation confidence loop - 2026-05-11

Success criteria:
- Every confirmed solo bug has a failing test or equivalent observable check before production changes.
- Server/common/client solo behavior agrees with `docs/arch/solo/README.md`.
- The final state is backed by targeted tests, and any residual risk is explicitly recorded.

- [x] Inventory current solo code, docs, tests, and dirty worktree state.
- [x] Review server/common solo rules for impossible-action handling, state mutation, serialization, and rule edge cases.
- [x] Review client solo rendering/projection for hidden information leaks and server-client drift.
- [x] Review solo E2E/unit coverage for assertions that would fail on the identified bugs.
- [x] Patch only confirmed issues with minimal code changes.
- [x] Run targeted tests/type checks and repeat the review loop until no factual gaps remain.

Review:
- 修复 server/common solo 漏洞：probe placement 只能从 Earth probe 出发，跳过不可放置目标时不保留移动/publicity 副作用，probe tech 不提高 Rival 单 probe 发射上限，星球 trace/signal 奖励现在结算，Exertians discovery 卡对 Rival 转为 progress，Rival 金色里程碑输入自动结算，objective stack 先洗后抽样，SOLO.4 阈值改为 9 publicity。
- 修复 client/public projection 漏洞：`IPublicRivalState` 直接投影 Rival tech ids 与 computer slot rewards，`GameLayout` 不再从 public player rows 反推 Rival tech，`RivalPanel` 使用 server 投影的 rewards/techs，image mode objective 显示具体 task marker，data pool 显示完整数量，computer slots 稳定渲染 6 格。
- 覆盖补强：新增/更新 server unit、serializer、client unit、GameLayout 和 solo smoke 断言，确保这些漏洞会先红后绿。
- 验证通过：server 目标集 5 files / 115 tests；client 目标集 2 files / 51 tests；common/server/client/e2e TypeScript checks 全部通过；solo 相关 18 个改动文件 Biome check 通过；solo Playwright smoke/full-flow 3 tests 通过。
- 残余说明：完整 touched set 的 Biome 仍被 `GameSerializer` 既有非空断言和旧格式阻断，本轮未改无关代码。

清理说明：
- 已移除全部已完成任务与历史 Review；需要追溯时查看 git history 或 `docs/review/`。
