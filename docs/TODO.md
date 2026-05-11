# TODO

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
