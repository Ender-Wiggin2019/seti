# TODO

## Game Layout V2 Legacy Removal Plan

### Assumptions

- Long-term target is one maintained game layout: `GameLayoutV2` in tab/waterfall/mobile modes.
- `tab` mode is the default single-layout game table experience.
- Scope starts in `packages/client`; server/common rule behavior should not change.
- Existing dirty files are user/previous-agent work. This pass will only touch files required for the approved layout migration.

### Success Criteria

- `/game/:gameId`, `/spectate/:gameId`, debug game, server debug, and replay debug all render through `GameLayoutV2`.
- V2 tab mode preserves the gameplay affordances users rely on: persistent player board access, event log access, buy-card confirmation, alien discovery notice, unhandled custom-effect toast, tucked income display, and setup/pending-input recovery.
- `GameLayout` is no longer imported by runtime code; remaining pure helpers live under `features/layout`.
- The player-facing settings no longer expose a legacy/custom system split; it only configures the single layout system.

### Plan

- [x] Add failing V2 regression tests for legacy-only behavior gaps.
  - 验证: tests fail for at least alien discovery notice, unhandled custom-effect toast, tucked income display, event log access outside board tab, and buy-card confirm parity.
- [x] Fill V2 tab-mode behavior gaps with the smallest section/session changes.
  - 验证: V2 focused tests pass while shared gameplay components keep existing payloads.
- [x] Move runtime routes and debug routes to `GameLayoutV2`.
  - 验证: `GamePage`, `SpectatePage`, `GameDebugPage`, `ServerDebugPage`, and `DebugReplayPage` no longer import legacy `GameLayout`.
- [x] Remove the legacy/custom display switch from layout settings and make tab mode the default single-layout experience.
  - 验证: layout settings tests assert no Standard Display / Custom Display split; persisted layout snapshots still import/export safely.
- [x] Move or delete remaining helper/test imports from legacy `GameLayout`, then delete the legacy component.
  - 验证: `rg "pages/game/GameLayout"` finds no runtime imports; helper tests import from `features/layout`.
- [x] Run focused client tests, typecheck, biome, and browser smoke for game/debug routes.
  - 验证: record exact commands and residual risks in this TODO review.

### Review

- 完成：`/game/:gameId`、`/spectate/:gameId`、local debug、server debug、replay debug 都直接渲染 `GameLayoutV2`；旧的 `packages/client/src/pages/game/GameLayout.tsx` 已删除。
- 完成：layout settings 移除了 Standard/Custom/Legacy system split，`layoutStore` 也移除了 persisted `enabled` 开关，默认只保留 `tab` / `waterfall` 模式选择。
- 完成：V2 补齐原先只在旧实现里有的能力：alien discovered notice、unhandled custom-effect toast、全局 event drawer、Cards tab 内买卡确认、tucked income 传递、debug runtime options、pending-input focus/recovery。
- 完成：helper/test import 已迁到 `features/layout/sectionInputs` 和 `features/layout/sessionHelpers`；`rg "@/pages/game/GameLayout|pages/game/GameLayout|../GameLayout|GameLayout.tsx"` 无结果。
- 验证通过：`pnpm --filter @seti/client test -- layoutV2Regression.test.tsx UserLayoutSettingsDialog.test.tsx GamePage.test.tsx GameDebugPage.test.tsx GameLayoutRouting.test.tsx milestoneItems.test.ts GameLayout.test.tsx`，6 files / 87 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：touched-file `pnpm --dir packages/client exec biome check ...`，31 files passed。
- 浏览器 smoke：Vite `http://127.0.0.1:5173/` + Playwright opened `/debug/game` and confirmed V2 shell, tabs, action bar, hand, player board, solar system, and event drawer mounted; screenshot saved at `/tmp/seti-game-layout-v2-smoke.png`。
- 剩余风险：没有跑完整 e2e/auth/backend real-room 流程；本轮用 debug route smoke 覆盖实际浏览器渲染，用 focused unit/integration tests 覆盖游戏交互 parity。

## Alien Trace Hotspot Anchor Alignment Plan

### Assumptions

- Scope stays in `packages/client`; server trace slot ids remain the submit payload source, while visual geometry should use calibrated hotspot anchor ids.
- Alien board image-mode trace anchors are the source of truth for both player markers and selectable attention hotspots.
- Discovery/overflow text-mode trace columns are unaffected by image-board calibration.

### Plan

- [x] Identify every alien-board trace renderer that can split anchor, marker, and selectable hotspot ids.
  - 验证: Anomalies and shared `TraceMarkerOverlay` image paths are both accounted for.
- [x] Add failing regression tests for marker/attention hotspot alignment with saved anchor overrides.
  - 验证: old implementation fails because marker/selectable hotspot does not use the trace anchor geometry.
- [x] Implement the smallest client-side fix so visual markers/buttons resolve geometry from the printed trace slot anchor id.
  - 验证: marker remains centered on the anchor; selectable hotspot still submits the server slot id.
- [x] Run focused tests, typecheck, and biome.
  - 验证: evidence covers marker alignment and real pending-input attention hotspot alignment at component/layout level.
- [ ] Browser/E2E verification for `/debug/hotspots` plus a real game route.
  - 验证: deferred because user asked not to run E2E in this pass.
- [x] Review remaining loopholes and record confidence.
  - 验证: this section includes commands run, browser evidence, and any residual risk.

### Review

- 根因 1：shared alien-board image markers had their own hotspot ids and hard-coded geometry, so saved trace slot anchors moved without their player markers.
- 根因 2：Anomalies selectable attention hotspots used server `slotId` as `data-hotspot-id`, bypassing the calibrated printed trace anchor id.
- 修复：shared `TraceMarkerOverlay` now gives markers a `data-trace-anchor-hotspot-id` and resolves their center from the printed trace slot anchor geometry; marker size and overflow stacking stay marker-specific.
- 修复：Anomalies printed trace anchors, selectable attention hotspots, and markers now share the same visual anchor id while still submitting the original server trace slot id through `data-server-trace-slot-id` / `optionId`.
- 验证通过：red test first failed for marker center and Anomalies hotspot id; then `pnpm --filter @seti/client test -- AlienBoardView.test.tsx -t "calibrated printed trace"` passed.
- 验证通过：`pnpm --filter @seti/client test -- AlienBoardView.test.tsx`、`pnpm --filter @seti/client test -- GameLayout.test.tsx -t "alien"`、`pnpm --filter @seti/client test -- HotspotsDebugPage.test.tsx`、`pnpm --filter @seti/client test -- AlienBoardView.test.tsx GameLayout.test.tsx HotspotsDebugPage.test.tsx`、`pnpm --filter @seti/client typecheck`、`pnpm exec biome check packages/client/src/features/board/alienBoards/TraceMarkerOverlay.tsx packages/client/src/features/board/alienBoards/AnomaliesBoardArt.tsx packages/client/__tests__/features/board/AlienBoardView.test.tsx`。
- 剩余风险：未跑浏览器/E2E；按用户要求本轮先停在单测、layout 回归、typecheck 和 biome 证据。

## Alien Card Draw Input And Trace Interaction Plan

### Assumptions

- Scope stays in `packages/common`, `packages/server`, and `packages/client`.
- Drawing a face-up alien card should render the actual alien card via the existing client `CardRender` path, not as a text-only option.
- Selecting a concrete alien trace slot is frontend in-game interaction: backend only exposes pending input/options; frontend decides tab switch, scroll/focus, and hotspot attention.
- Backend events like `ALIEN_DISCOVERED` remain independent from frontend interaction routing such as "go to alien tab/board".

### Plan

- [x] Extend option metadata for card-backed choices.
  - 验证: server draw-alien input model includes the face-up alien card id in structured metadata; random/deck option remains text-only.
- [x] Render card-backed option metadata in `SelectOptionInput`.
  - 验证: the Oumuamua face-up draw option uses `CardRender`; choosing either option still submits the same `optionId`.
- [x] Make alien trace slot option inputs in-game interactive.
  - 验证: option inputs whose ids are alien trace slots render `pending-input-ingame`, not the blocking option dialog.
- [x] Keep trace navigation as frontend-only routing.
  - 验证: `GameLayout` derives an "alien board target" from pending input and switches to the Aliens tab; no backend event is introduced for this.
- [x] Verify hotspot attention and click submission on alien trace slots.
  - 验证: focused client test shows selectable alien trace hotspot has `data-hotspot-attention="true"` and clicking it submits the option response.
- [x] Run focused tests and typecheck.
  - 验证: client/server tests and typecheck pass, or exact blockers are documented in this TODO review.

### Review

- 修复：`SelectOption` 协议支持可选 `cardId` metadata；alien face-up draw source 会把当前明面外星人卡 id 投影给 client，随机抽牌仍保持文本 option。
- 修复：`SelectOptionInput` 优先消费 `option.cardId` 并复用 `CardRender`，保留旧 `[[card:id]]` fallback。
- 修复：alien trace slot `OPTION` 输入改为 `IN_GAME_INTERACTIVE`，`GameLayout` 继续仅从 pending input 语义前端跳转 Aliens tab，没有新增后端导航事件。
- 修复：可点击 alien trace hotspot 带 attention 状态并通过现有 option input response 提交。
- 补充修复：discovery/overflow/generic trace column slots 也会消费同一组 `selectableSlotIds`，所以 `Place Yellow trace` 这类落在 alien discovery 区的输入不再只有提示文案而没有可点目标。
- 验证通过：`pnpm --filter @seti/client test -- SelectOptionInput.test.tsx inputPresentation.test.ts GameLayout.test.tsx`、`pnpm --filter @seti/server test -- drawCard.test.ts SelectOption.test.ts`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/server typecheck`、`pnpm --filter @ender-seti/common typecheck`、touched-file `pnpm exec biome check ...`。
- 追加验证通过：`pnpm --filter @seti/client test -- GameLayout.test.tsx AlienBoardView.test.tsx`、`pnpm exec biome check packages/client/src/features/board/AlienBoardView.tsx packages/client/src/features/board/alienBoards/AlienBoardTraceGrid.tsx packages/client/__tests__/pages/game/GameLayout.test.tsx`、`pnpm --filter @seti/client typecheck`。

## Alien Reveal Notice And Hand Dock Plan

### Assumptions

- Scope stays in the existing SETI monorepo packages: `packages/client`, `packages/common`, and `packages/server`.
- The reveal notice should be server-driven but must not set `player.waitingFor` or block gameplay.
- The hand dock should keep the same controls and selection behavior; only the collapse direction/layering changes.

### Plan

- [x] Audit current pending-input, z-index, hand dock, and alien discovery event paths.
  - 验证: identify the exact client/server/common files carrying each behavior.
- [x] Fix player-input/hand layering and hand collapse direction with minimal client changes.
  - 验证: focused client tests assert the prompt control is above hand and the dock rail stays at the bottom.
- [x] Emit and consume an alien discovered notice event without blocking player input.
  - 验证: server event-log test proves reveal emits `ALIEN_DISCOVERED`; client test proves it opens an acknowledge-only dialog.
- [x] Run focused tests and typecheck where practical.
  - 验证: record passing commands or exact blockers in this TODO review.

### Review

- 修复：新增 `GAME_Z_INDEX.pendingInput = 500`，pending input 的 ingame/floating control 高于 hand 的 `200`；modal overlay 仍为 `900`。
- 修复：`HandDock` 改成内容在上、rail 在下，收起时手牌向下折叠到底边，rail 始终可点击。
- 修复：`ResolveDiscovery` 继续保留旧 `ACTION: ALIEN_DISCOVERED` 日志，同时追加结构化 `ALIEN_DISCOVERED` event；`GameLayout` 消费该事件并排队显示 acknowledge-only dialog，关闭只移除本地 notice，不发送 input。
- 验证通过：`pnpm --filter @seti/client test -- GameLayout.test.tsx`、`pnpm --filter @seti/server test -- ResolveDiscovery.test.ts`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/server typecheck`、client touched-file `biome check`。
- 备注：server touched-file `biome check` 返回通过但报告了该测试文件既有 non-null assertion warnings，和本次新增代码无关。

## Client Move Hotspot Interaction Audit Plan

### Assumptions

- Scope starts with `packages/client`, `packages/common`, and `packages/server` move/pending-input paths.
- Visible interactive hotspots must be backed by a client submit handler and by a server-accepted response payload.
- The bug may be caused by protocol mismatch, stale client action mapping, overlay/pointer-event interception, or presentation-mode gating.

### Plan

- [x] Trace current move/hotspot/input protocol from server state to client click handler.
  - 验证: list every concrete path where a move target becomes a visible hotspot and where clicks are submitted.
- [x] Add a failing regression test for visible move hotspots that cannot submit.
  - 验证: old implementation fails for the reported class of visible-but-dead hotspot.
- [x] Implement the smallest client/server/common fix needed to unify visible hotspots with valid actions.
  - 验证: hotspot rendering and submit payload share the same option/action source.
- [x] Run focused tests, typecheck, and re-review for remaining loopholes.
  - 验证: relevant client/server/common tests pass or blockers are documented with exact residual risk.
- [x] Record review results and confidence.
  - 验证: this TODO section includes fixed root cause, checks run, and remaining risks.

### Review

- 根因 1：`HotspotButton` 在 debug/calibration 可见时，普通点击会在 `pointerdown` 阶段被吞掉；因此页面上确实显示了 hotspot，但点击不会触发原本的 `onClick`。
- 根因 2：move action 的可用性判断在 common/client/server 三侧不一致。common/client 把“有 energy 可转换”也当作 `Move Probe` 可用，但 server `Movement.execute` 实际只消费 movement stash；结果是客户端能进入/保留 move mode，却没有任何合法移动可提交。
- 修复：debug 模式只在 resize 或实际拖动校准时阻止普通点击；普通 debug 点击仍走业务 `onClick`。`Move Probe` 现在在 common/server/client 都要求真实 `movementPoints > 0`，energy 只通过 `CONVERT_ENERGY_TO_MOVEMENT` 单独处理；move mode 在 movement points 归零后自动清理，并且 0 movement 时不再绘制 move source affordance。
- 额外修复：move source 按钮层级高于 probe/token/debug anchor，避免可视 anchor 盖住真正的 source button。
- 验证通过：`pnpm --filter @seti/client test -- HotspotButton.test.tsx SolarSystemView.test.tsx FreeActionBar.test.tsx`、`pnpm --filter @seti/server test -- Movement.test.ts`、`pnpm --filter @seti/client test -- HotspotButton.test.tsx SolarSystemView.test.tsx FreeActionBar.test.tsx GameLayout.test.tsx layoutV2Regression.test.tsx`、`pnpm --filter @seti/server test -- Movement.test.ts GameSerializer.test.ts`、`pnpm --filter @ender-seti/common typecheck`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/server typecheck`、client/server/common touched-file biome checks。
- 剩余风险：没有发现当前 move hotspot 协议上的未闭环路径；server `Movement.test.ts` 文件仍有既存 non-null assertion lint warning，和本次改动无关。

## Game Z-Index Layering Plan

### Assumptions

- Scope stays in `packages/client`; no server/common rule behavior changes.
- Desired global order is: game background < game board accessories/probes/data < UI chrome/components < dialogs/toasts.
- Solar-system internal layering can keep local detail, but must not compete with global hand/action/modal layers.

### Plan

- [x] Audit current game z-index usage and identify leaking local layers.
  - 验证: list the concrete files/values where solar/board internals exceed hand/UI chrome.
- [x] Add a small semantic z-index contract for game UI and solar-system internals.
  - 验证: hand/top/action/dev panel/dialog/toast use named values instead of scattered magic numbers.
- [x] Isolate the solar board stacking context and replace local solar magic values with named local layers.
  - 验证: solar probes/data/debug overlays remain ordered inside the board, but cannot render above hand.
- [x] Run focused verification and browser inspection.
  - 验证: typecheck/biome pass; real game or debug game route shows hand above solar system and dialogs above hand.

- [x] 梳理真实 game、`debug/solar`、`debug/solar-system` 的 solar system 数据投影与渲染路径
- [x] 找到 image mode/text mode 旋转后可能分叉的具体代码点
- [x] 先写一个旧实现会失败的聚焦回归测试
- [x] 做最小修复并跑相关测试
- [x] 记录验证结果和剩余风险

## Legacy Review

- 根因：game 页面里 solar-system 和 hotspot 组件长期使用 60/70/80/90 这类局部魔法值，但没有把 board 变成独立 stacking context，导致这些局部层级可以和 hand、action bar、debug 浮层直接比较。
- 修复：新增 `packages/client/src/styles/zIndex.ts` 作为 game 全局层级契约；`LayoutShell`、legacy `GameLayout`、`GameLayoutV2`、`PendingInputPrompt`、`Dialog`、`Toast`、`Select`、`LayoutDevPanel`、`SectorGrid`、`SolarSystemView`、`WheelLayer`、`HotspotAnchor/Button` 改为读语义层级；solar/section frame 统一加 `isolate`。
- 验证通过：`pnpm --dir packages/client exec biome check ...`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/client test -- GameLayout.test.tsx layoutV2Regression.test.tsx`。
- 浏览器验证：在本地 5174/3100 环境下，真实 `/game/{gameId}` 页面最初的 pending input overlay 为 `z-index: 900`；最小化后，hand wrapper 为 `z-index: 200`，solar board/section 都是 `isolate`，`elementFromPoint` 在 hand/board 重叠点命中 hand；lobby 的 `CreateRoomDialog` overlay 为 `z-index: 1000`。
- 剩余风险：`Dialog` 的 role 容器本身没有独立 z-index，真正承载层级的是其 overlay 包装层；这与当前实现一致，但后续若有新的 portal 组件应继续挂到同一层级契约上。

## Review

- 根因：真实 game 从 snapshot 反序列化后丢失 solar-system wheel `layers`；后续旋转只更新 disc angle/occupants，元素层不再随轮盘移动，导致 image mode 的轮盘图片和 text/public state 偶发不同步。debug 新建内存路径保留 layers，所以表现正常。
- 修复：snapshot DTO/serializer/deserializer 将 `layers` 作为必需字段保存并恢复；不再提供缺失 `layers` 的旧 snapshot 兼容路径。
- 验证通过：`pnpm --filter @seti/server test -- GameDeserializer.test.ts`、`pnpm --filter @seti/server test -- GameSerializer.test.ts`、`pnpm --filter @seti/server typecheck`、`pnpm --dir packages/server exec biome check src/persistence/serializer/GameDeserializer.ts src/persistence/serializer/GameSerializer.ts src/persistence/dto/GameStateDto.ts __tests__/persistence/serializer/GameDeserializer.test.ts`。
- 剩余风险：不考虑旧 snapshot 兼容时，当前 snapshot 协议路径未发现剩余风险；真实 game reload 后保留完整 layer stack，后续 rotate 与内存新建 game 使用同一套数据模型。

## Oumuamua Solar System Follow-up

- [x] 补充 debug rotate 回归：Oumuamua tile metadata 与 solar-system planet location 同步
- [x] 修复 debug rotate endpoint，让 Oumuamua tile/sector 随 alien rotation hook 更新
- [x] 让 `/debug/solar-system` 明确呈现 Oumuamua 的当前 space/sector
- [x] 跑相关 client/server 测试和类型检查

## Oumuamua Solar System Review

- 根因：`/debug/solar-system` 的 direct rotate endpoint 只旋转 `SolarSystem`，没有触发 `alienState.onSolarSystemRotated(game)`；Oumuamua 的 planet element 会随 wheel layer 移动，但 alien board 上缓存的 `tile.spaceId` / `sectorId` 没有同步，导致 sector data list 和 image overlay 锚在旧位置。
- 修复：debug `solarRotate` / `solarRotateNext` 旋转后调用同一套 alien rotation hook；debug 页面新增 Oumuamua 当前 `spaceId / sectorId` readout，便于验证 reveal 后的位置。
- 验证通过：`pnpm --filter @seti/server test -- debug.service.test.ts`、`pnpm --filter @seti/client test -- SolarSystemCompareDebugPage.test.tsx`、`pnpm --filter @seti/server typecheck`、`pnpm --filter @seti/client typecheck`、`pnpm exec biome check ...`。

## Client Mission Hub UI Reference Alignment Plan

### Assumptions

- Scope stays in `packages/client`; no changes to `packages/web`.
- The user-provided `2223.PNG` is the north-star for Mission Hub and core UI primitives.
- Existing SETI game-card rendering remains sacred; do not restyle card-rendering classes or game card components.
- Use existing image assets under `packages/client/public/assets/seti/sprites`; do not introduce a new image dependency unless current assets cannot represent the requested look.

### Plan

- [x] Update `.impeccable.md` so button, card, and scene-asset guidance matches the reference image instead of the current metal-gradient-heavy interpretation.
  - 验证: 文档明确要求 cyan filled primary / outline secondary / dark ghost, and forbids JS-crafted fragmented collage when a normal image can carry the scene.
- [x] Tighten shared client UI primitives used by Mission Hub: `Button`, `Badge`, `Tabs`, inputs/selects if needed.
  - 验证: components still expose the same variants/API, but visual states match the reference design-system panel.
- [x] Rework Mission Hub scene composition to use normal image-backed scene panels rather than many layered decorative fragments.
  - 验证: first viewport still shows title, mission counts, create action, tabs, and room list; no central/lower-middle overblocking.
- [x] Improve mission stat tiles and room cards toward the reference card effect: cropped low-poly background, subtle dark overlay, status dot/tag, compact metadata.
  - 验证: existing tests for `MissionHub` and `RoomCard` still pass; visual screenshot shows cards closer to the provided reference.
- [x] Run focused verification.
  - 验证: `pnpm --filter @seti/client test -- MissionHub.test.tsx RoomCard.test.tsx CreateRoomDialog.test.tsx` and `pnpm --filter @seti/client typecheck`; if local app can run, inspect Mission Hub in browser screenshot.

### Review

- `.impeccable.md` 已更新：主按钮从旧金属渐变收敛为参考图的 cyan filled control；Tabs/选择器 active 态不再使用 metal-gradient face；sprite 资产规则明确优先作为单张 `<img>` scene plate / card background，不再用 JS 拼多碎片制造低多边形感。
- Client UI 已更新：`Button` primary/danger 改为平直填充控制，`Badge` 改成参考图式小矩形 status tag；Mission Hub hero 改为单张正常场景图并用 mask 融入暗场；统计卡和房间卡使用正常 `<img>` 背景；RoomCard 去掉 room-id hash 随机拼图逻辑。
- 验证通过：`pnpm --filter @seti/client test -- MissionHub.test.tsx RoomCard.test.tsx CreateRoomDialog.test.tsx`、`pnpm --filter @seti/client typecheck`。
- 浏览器检查：用 Node 23 启动 Vite 后打开 `http://127.0.0.1:5173/`，Mission Hub 首屏正常渲染，浏览器 error/warning 日志为空。初次使用 Node 18 启动 dev server 失败，原因是 Vite 需要 Node 20.19+/22.12+。

## Client 2224 Multi-Scene UI Alignment Plan

### Assumptions

- Scope stays in `packages/client`; no server/common rule behavior changes.
- Existing staged Mission Hub / RoomCard alignment is kept and extended rather than rewritten.
- The user-provided `2224.PNG` is the north-star for four page types: auth, profile, room/list surfaces, and live game.
- Image usage should be normal scene imagery: one strong image plate or card background per surface, not JS-selected fragments or collage effects.
- Existing SETI board/card/DescRender imagery remains sacred; this pass changes chrome, layout surfaces, and page composition only.

### Recommended Direction

- Use the reference's low-poly deep-space system across all client page shells: compact top chrome, translucent dark panels, cyan active states, amber/violet/green semantic signals, and 6-8px radii.
- Auth and Profile get full-scene background treatments with one normal image plate plus dark overlays.
- Game keeps the playfield dominant: board center remains clear, right personal panel and top action strips become reference-style instruments, and mobile keeps collapsed/stacked behavior.

### Alternatives Considered

- Broad rewrite: recreate all four screens to match the mock one-to-one. Rejected because it would risk game workflow regressions and touch too many unrelated components.
- Theme-only pass: adjust CSS tokens/buttons only. Rejected because Auth/Profile/Game would still read as different products.
- Targeted scene-shell pass: update page composition and shared instrument surfaces while preserving rules UI internals. Recommended because it matches the requested style with the smallest safe blast radius.

### Plan

- [x] Auth page: replace multi-sprite collage with one normal scene plate, tighten the login/register panel to match the reference, and remove terminal/uplink-flavored copy.
  - 验证: auth render test or focused smoke confirms tabs/forms/buttons still work; visual check shows no fragmented image treatment.
- [x] Profile page: convert the account screen to the 2224 profile layout: quiet top area, sidebar-like navigation/readout zone, avatar/stat/readout panels, and a single normal background scene.
  - 验证: profile data/edit/logout controls remain present and reachable.
- [x] Game shell: align `TopBar`, `TopActionBar`, `BoardTabs`, `PersonalColumn`, and shared loading states with the reference game screen without covering the board or changing game actions.
  - 验证: existing `GameLayout.test.tsx` and `GamePage.test.tsx` still pass; board tab keeps `w-fit max-w-full` behavior.
- [x] Shared styling: add small reusable scene/profile/game CSS utilities only where existing classes cannot express the design cleanly.
  - 验证: reused existing `mission-scene`, `mission-panel`, and instrument primitives; no new sacred SETI card/sector CSS changes.
- [ ] Focused verification. _(in progress)_
  - 验证: run `pnpm --filter @seti/client test -- MissionHub.test.tsx RoomCard.test.tsx GameLayout.test.tsx GamePage.test.tsx`; run `pnpm --filter @seti/client typecheck`; start the client and inspect `/auth`, `/profile`, `/lobby`, and a reachable game/debug route in browser if available.

## Create Room / Room Settings UX Plan

### Assumptions

- Scope stays in `packages/client`; room creation payload shape remains unchanged.
- Empty room name should be accepted in the client and converted to a default display name before calling `lobbyApi.createRoom`.
- Solo / multiplayer should be a first-class segmented choice instead of a secondary switch plus disabled player-count select.
- When Space Agency is enabled, all Space Agency submodules should default on: organizations, quick-start cards, new deck, new alien species, and the Space Agency alien modules.

### Plan

- [x] Add failing client tests for empty-name defaulting, easier mode selection, and Space Agency enable-all behavior.
  - 验证: `pnpm --filter @seti/client test -- CreateRoomDialog.test.tsx GameSettingsPanel.editable.test.tsx`
- [x] Update `CreateRoomDialog` to make mode selection direct, make room name optional with default generation, and keep solo difficulty/player count obvious.
  - 验证: focused tests pass; dialog still submits valid `IGameOptions`.
- [x] Update `SpaceAgencyOptionsSection` so enabling Space Agency selects all dependent options and Space Agency aliens by default in both create modal and room settings.
  - 验证: existing disable/dependency behavior still clears children correctly.
- [x] Lightly polish room settings layout to align with the existing dark sci-fi design system without touching game-card or rules UI.
  - 验证: no text overlap in modal/room settings; controls remain accessible by label.
- [x] Run focused verification and record results.
  - 验证: focused tests plus `pnpm --filter @seti/client typecheck`; inspect current local room page in browser if the dev server is reachable.

### Review

- 修复：`CreateRoomDialog` 现在用直接的多人/单人 segmented control；空任务代号会提交本地化默认名；solo 模式只显示 Rival 难度，多人模式只显示玩家数。
- 修复：`SpaceAgencyOptionsSection` 开启太空机构时默认启用组织、快速起步卡、新牌库；只有 Space Agency 外星人可用时才默认启用新外星物种及字形族/变形虫/阿尔霍斯模块，关闭主开关仍会清理依赖项。
- 设计：模式选择和 Space Agency 子选项使用现有深色 instrument selector / recessed well 语言，遵守 `.impeccable.md` 的 Mission Hub 控制风格；未触碰 SETI 卡牌和规则 UI。
- 验证通过：`pnpm --filter @seti/client test -- GameSettingsPanel.test.tsx CreateRoomDialog.test.tsx GameSettingsPanel.editable.test.tsx`、`pnpm --filter @seti/client typecheck`、`pnpm exec biome check ...`。
- 浏览器检查：在 `http://localhost:5173/lobby` 打开创建弹窗，确认中文无英文 fallback、空名 placeholder 为“新任务”、多人/单人切换正确、开启“太空机构”后全部相关开关为 true；在 room 页确认共享设置面板正常渲染。

## Game Pending Input Modal Plan

### Assumptions

- Scope stays in `packages/client`; server/common PlayerInput protocol remains unchanged.
- Existing board-driven pending inputs keep their board highlights and response payloads.
- Close/minimize only changes local UI visibility; it never cancels or resolves the pending input.
- Both legacy `GameLayout` and configurable `GameLayoutV2` must show the same pending-input experience.

### Plan

- [x] Add a shared pending-input prompt component that opens as a modal surface and minimizes to a bottom-left floating button.
  - 验证: generic input renders in the modal, minimize hides the modal, floating button reopens it.
- [x] Replace duplicated inline pending-input panels in legacy and V2 action bars with the shared prompt.
  - 验证: action menu remains hidden while pending input is active; free-action behavior is unchanged.
- [x] Add a compact top-bar status when input is required.
  - 验证: TopBar shows a short pending-input status without changing round/phase/current-player readouts.
- [x] Keep Orbital Dynamics board-input hint and Done response available through the new prompt.
  - 验证: board target clicks still submit through the existing board path; Done still submits the same option response.
- [x] Run focused tests and attempt browser inspection.

### Review

- 新增 `PendingInputPrompt` 作为共享等待输入 surface：默认弹出 modal，关闭时本地最小化为左下角浮动按钮，按钮带呼吸动画；新的 `inputId` 会自动重新展开。
- 旧 `GameLayout` 与新 `GameLayoutV2` 均改为复用共享 prompt；常规 action menu 在 pending input 期间仍被隐藏，Orbital Dynamics 的 board click 与 Done 响应保持原 payload。
- `TopBar` 新增紧凑 input-required chip，只显示短状态和截断标题，不承载完整输入表单。
- Impeccable 修正：PC modal 扩大到 `64rem` 工作面；浮层改为 `--surface-raised` + hairline metal border；pending 语义统一为 amber signal，减少不符合设计系统的 cyan/glow chrome。
- 验证通过：`pnpm --filter @seti/client test -- GameLayout.test.tsx layoutV2Regression.test.tsx`、`pnpm --filter @seti/client typecheck`、`pnpm --dir packages/client exec biome check ...`。
- Build 验证：`pnpm --filter @seti/client build` 未完成，当前 shell Node 为 `18.17.0`，Vite 7 需要 `20.19+` 或 `22.12+`，失败点为 Node 缺少 `crypto.hash`。
- 浏览器检查：已尝试连接 in-app browser 检查 `localhost`，但当前 Browser URL policy 阻止访问/刷新本地页；未完成可视化浏览器验收。

## Player Input UI Architecture Refactor Plan

### Assumptions

- Scope starts with `packages/common` protocol types and `packages/client` rendering; server rule/input processing stays unchanged unless tests prove a protocol gap.
- Existing real game renderers remain the source of truth: cards use `CardRender`/`HandView`, organizations use `OrganizationCard`, sector/map targets use board hotspots.
- The three current player-input presentation states are explicit enum values: dialog-only, in-game-only, and both.
- Prefer in-game interaction for sector/map inputs; use dialog-only for card/tech/setup choices; reserve both for flows that need a blocking explanation plus board targets.

### Plan

- [x] Add a small input presentation policy with enum values and focused tests.
  - 验证: sector/Orbital Dynamics resolve to in-game/both as intended, card/tech/setup resolve to dialog-only, and layout code no longer uses ad hoc `type !== OR` checks.
- [x] Refactor pending-input prompt rendering to consume that policy.
  - 验证: dialog-only inputs open the modal, in-game-only inputs suppress blocking option lists, both keeps the modal hint plus board target path.
- [x] Make setup organization selection reuse the real `OrganizationCard` visual component.
  - 验证: setup organization input renders `organization-card-*` and submits the same OPTION response.
- [x] Make selectable sector nodes use the shared hotspot breathing affordance instead of local highlight markup.
  - 验证: selectable sectors expose a unified pending-hotspot state and still submit sector/color or sector-id responses.
- [x] Run focused tests and review the diff against the requested interaction model.
  - 验证: relevant client input/layout/board tests pass; typecheck if the touched surface warrants it.

### Review

- 新增 `EPlayerInputPresentationMode`：协议模型可显式指定 dialog-only、in-game interactive、dialog-and-in-game；client 默认策略覆盖 sector/planet/Orbital Dynamics/card-row 等真实 board/card-row 路径。
- `PendingInputPrompt` 现在按策略渲染：dialog-only 保留可最小化 modal；in-game interactive 使用非阻塞 `pending-input-ingame` 提示，不再把 sector/move/card-row 选项塞进阻塞弹窗。
- setup organization 选择改为复用真实 `OrganizationCard` 视觉，并用独立 overlay button 提交原有 OPTION response，避免 button 嵌套。
- selectable sector 节点改用 `HotspotButton attention` 统一呼吸 affordance，原本只为 selectable 额外画的本地 highlight span 已收敛。
- card-row 类型的 card input 在候选牌来自真实 card row 时走 in-game interactive，点击 `CardRowView` 提交同一个 CARD response；手牌选卡仍默认 dialog-only。
- Scan/Earth-adjacent 这类 `sector-N` OPTION input 纳入 in-game interactive 策略，直接复用 solar sectors 上的 hotspot 呼吸按钮提交原 OPTION response；原生非 Earth `PLANET` input 继续聚焦真实 planet board。
- 验证通过：`pnpm --filter @seti/client test -- inputPresentation.test.ts SelectOptionInput.test.tsx HotspotButton.test.tsx SectorView.test.tsx layoutV2Regression.test.tsx layoutHelpers.test.ts GameLayoutRouting.test.tsx GameLayout.test.tsx`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @ender-seti/common typecheck`、`pnpm --dir packages/client exec biome check ...`。

## Client Design System Full Review Plan

### Assumptions

- Scope stays in `packages/client` and locale copy under `packages/common/locales`; no game-rule, server, or card-rendering behavior changes.
- `.impeccable.md` is the current design authority. The older Terraforming Mars flavored guidance is not used for this pass.
- “不要目前的渐变形式” means removing the visible ad hoc page/dialog gradients and Tailwind arbitrary gradient backgrounds. Small tokenized hairlines or nearly invisible atmosphere texture may remain only when they read as design-system surface detail rather than a gradient backdrop.
- Game Studio guidance applies most strongly to the live game surface: persistent HUD stays compact, center/lower-middle playfield remains clear, and deeper configuration moves behind dialogs/drawers.
- Existing dirty files are user/previous-agent work. This pass will append to or edit only the files required for the approved plan.

### Findings

- Background drift: Auth, Profile, Mission Hub, Room Page, Room Card, and the shared Dialog overlay still use visible `linear-gradient` / `radial-gradient` compositions instead of one normal scene plate plus tokenized dark surfaces.
- Dialog drift: `DialogContent` still uses `bg-surface-900`, a gradient highlight, and comments/copy that lean “mission-control”; `UserLayoutSettingsDialog` reads like a raw configuration tool with nested boxed settings blocks; free-action dialogs are functional but visually sparse.
- Copy drift: visible strings still include marketing or config-heavy language such as “Explore the unknown, connect the future”, “Layout Settings”, “Game Layout System”, “Configurable”, “Legacy”, “Waterfall”, and raw `settings.json` terminology. Several Chinese strings mix English terms or ASCII punctuation.
- Game UI status: TopBar, pending-input prompt, and z-index layering are close to the new direction. The remaining work should polish overlays and secondary panels without expanding persistent HUD coverage.

### Audit Evidence

- Reusable assets already exist under `packages/client/public/assets/seti`: `refine/2223.PNG`, `refine/2224.PNG`, low-poly `sprites/*`, board backgrounds, icons, tokens, and Space Agency organization card art. No new asset dependency is needed for this pass.
- Page/shell background targets: `AuthPage.tsx`, `ProfilePage.tsx`, `MissionHub.tsx`, `RoomPage.tsx`, `RoomCard.tsx`, `AppShell.tsx`, `globals.css`.
- Dialog/overlay targets: `components/ui/dialog.tsx`, `features/layout/UserLayoutSettingsDialog.tsx`, `features/layout/dialogs.tsx`, `CreateRoomDialog.tsx`, `pages/game/GameOverDialog.tsx`, `features/input/PendingInputPrompt.tsx`.
- Copy targets: `packages/common/locales/en/common.json`, `packages/common/locales/zh-CN/common.json`, and changed-key parity checks for `pt-BR/common.json`.

### Recommended Direction

- Replace page-level gradient backdrops with a small shared scene-background system: image-backed low-poly space plates, star/dust texture, and named surface overlays (`--surface-deep`, `--surface-panel`, `--surface-raised`, `--surface-instrument`).
- Upgrade the dialog primitive first so Create Mission, layout settings, free-action dialogs, and game-over surfaces inherit the same raised Space Agencies panel language.
- Rewrite visible UX copy toward factual Space Agencies language while keeping standard controls plain: Sign In, Save, Cancel, Mission Settings, Layout, Mission Hub, Players.
- Treat layout customization as a player-facing “Mission Display” tool, with advanced JSON import/export tucked behind an advanced section rather than centered in the main flow.

### Alternatives Considered

- Full client visual rewrite: too broad and risky because the game board/card UI is content, not chrome.
- CSS-token-only cleanup: too shallow because the most visible drift is in dialog composition, page scene backgrounds, and copy.
- Targeted system pass: recommended because shared primitives and a small set of page shells give broad visual consistency with the smallest behavioral blast radius.

### Plan

- [x] Add/adjust focused tests for copy and dialog behavior before implementation.
  - 验证: tests assert key player-facing labels for Mission Hub/Profile/Create Mission/Layout Display and confirm dialogs still close with Escape/overlay.
- [x] Create a shared background/surface treatment and remove visible page-level gradient backdrops from Auth, Profile, Mission Hub, Room Page, Room Card, and Dialog overlay.
  - 验证: `rg` no longer finds visible arbitrary `linear-gradient` / `radial-gradient` page backdrops in those surfaces; scene assets still render as normal images.
- [x] Rework shared `Dialog` / `DialogContent` to use `--surface-raised`, tokenized overlay, 6-8px radius, semantic header/footer spacing, and no generic mission-control wording.
  - 验证: Create Mission, pending input, game over, layout settings, and free-action dialogs keep their existing roles/actions and z-index behavior.
- [x] Polish `UserLayoutSettingsDialog` into a readable Mission Display surface: clearer sections, less nested-card feel, plainer labels, and advanced JSON tools visually demoted.
  - 验证: existing layout store behavior, import/export, mode switching, mobile order, and column controls remain unchanged.
- [x] Polish free-action dialogs (`ExchangeResourcesDialog`, `PlaceDataDialog`, `SampleDeliveryDialog`) with real token/resource imagery and clearer option rows.
  - 验证: exchange/place-data/sample-delivery callbacks receive the same payloads as before.
- [x] Update EN/ZH copy for the visible client shell and edited dialogs; update PT-BR only for changed keys when safe, otherwise keep fallback-compatible keys unchanged.
  - 验证: no visible Chinese fallback to English on `/auth`, `/lobby`, room, `/profile`, and layout dialog; JSON locale files stay valid.
- [x] Run focused verification and browser inspection.
  - 验证: `pnpm --filter @seti/client test -- CreateRoomDialog.test.tsx GameLayout.test.tsx layoutV2Regression.test.tsx ProfilePage.test.tsx`; `pnpm --filter @seti/client typecheck`; `pnpm --dir packages/client exec biome check ...`; inspect `/auth`, `/lobby`, a room page, `/profile`, and a reachable game/debug route.

### Review

- 测试：新增 `Dialog.test.tsx` 和 `UserLayoutSettingsDialog.test.tsx`，先验证红灯，再实现；focused suite 通过 11 个文件 / 95 个测试。
- 背景：`AppShell`/body 改为 `--surface-void` + 自绘 `impeccable-atmosphere.svg`；Auth/Profile/MissionHub/RoomPage/RoomCard/Dialog 的可见 page/dialog gradient 背景已移除，scene/card 不再复用 `background.jpg` 做 atmosphere。
- 收尾：MissionHub/Auth/RoomPage 的模糊光斑与 TopBar/GameLayout/Toast/Switch/PlayerSlot 的残留渐变装饰已收敛为图片资产、surface token 或 1px hairline。
- 弹窗：`Dialog` overlay 改为稳定暗场，`DialogContent` 使用 `--surface-raised` 和 `data-surface="raised"`；布局显示弹窗改为 Mission Display 文案，JSON import/export 降级到 Advanced Layout File。
- 游戏 UI：V2 与 legacy free-action dialogs 都使用真实资源图标和 mission satellite 图标，不再用抽象线条或硬编码 `S` 标记；未改变 exchange/place-data/sample-delivery payload。
- 文案：EN/ZH/PT-BR 同步更新改动键；Mission Hub subtitle、Profile settings 入口、Create Mission subtitle、布局显示相关文案已收敛到 Space Agencies 语气，中文 ASCII 逗号已清理。
- 验证通过：`pnpm --filter @seti/client test -- Dialog.test.tsx UserLayoutSettingsDialog.test.tsx AuthPage.test.tsx ProfilePage.test.tsx MissionHub.test.tsx RoomCard.test.tsx CreateRoomDialog.test.tsx FreeActionBar.test.tsx GameOverDialog.test.tsx GameLayout.test.tsx layoutV2Regression.test.tsx`、`pnpm --filter @seti/client typecheck`、`pnpm --dir packages/client exec biome check ...`、locale JSON parse 检查。
- 浏览器检查：使用 bundled Node + Playwright 打开 `http://localhost:5174/` 和 `/auth`，截图确认新背景不再形成显眼色带，旧 subtitle 不再出现；`/lobby` 和 `/profile` 未登录时按预期跳转 `/auth`。`/debug/game` 可渲染但有大量 404 debug 资源请求，记录为既有 debug-route 资产风险，不作为本次 UI pass 完成阻塞。

## Client Layout Follow-up Plan

### Assumptions

- Scope stays in `packages/client`; no server/common rule behavior changes.
- OPTION inputs that mention `[[card:NN]]` should render the real card visual, while non-card options like draw-from-deck remain compact text buttons.
- Income belongs visually above the player board; when organizations exist, income shares their row on the right.

### Plan

- [x] Move income rendering above the player board and align it with organization cards when present.
  - 验证: `PlayerDashboard` DOM order places `income-tracker` before board, and organization rows include income on the right.
- [x] Render card-row option choices with full card visuals.
  - 验证: `SelectOptionInput` renders `card-render-<id>` for labels containing `[[card:NN]]` and still submits the original OPTION payload.
- [x] Reduce V1 text-mode planet/alien board footprint while preserving readable reward icons.
  - 验证: planet text cards use smaller layout classes with larger icon cells; alien board desktop width classes are reduced.
- [x] Run focused client tests/typecheck and record results.
  - 验证: relevant tests pass or blockers are documented.

### Review

- 修复：`PlayerDashboard` 现在先渲染 income，再渲染 player board；存在 organization 时，organization 卡和 played-cards 按钮在左，income 在同一行右侧。
- 修复：普通 OPTION 输入中带 `[[card:NN]]` 的选项会渲染真实 `CardRender`，仍提交原来的 `OPTION` / `optionId` payload；抽牌等非卡牌选项保持紧凑按钮。
- 调整：V1 text mode 的 planet board 外壳、网格间距和 `PlanetCard` padding 缩小；奖励/first data/glyph 图标使用更大的 `DescRender` 尺寸。Alien board 桌面占宽从 60% 收到 52%，外壳与 hidden text board 也同步压缩。
- 验证通过：`pnpm --filter @seti/client test -- SelectOptionInput.test.tsx PlayerDashboard.test.tsx PlanetaryBoardView.test.tsx AlienBoardView.test.tsx`、`pnpm --filter @seti/client typecheck`、touched-file `biome check`。
- 浏览器检查：使用 bundled Node 启动 Vite 于 `http://127.0.0.1:5173/`，Playwright 打开 `/debug/hotspots` 并切到 Personal Board / Planet Board / Aliens；确认关键 DOM 存在、新 class 生效、console error 为空。默认 Node 18.17 无法启动 Vite，需使用 bundled Node 或 Node 20.19+/22.12+。

## Pending Input Freeze Latest Commit Review Plan

### Assumptions

- Scope is the latest commit `9d914b5e` on `feature/server`.
- Review mode is review-and-fix because the request did not ask for read-only review.
- The main risk is not the idea of server-projected pending input; it is incomplete coverage across the legacy/V2 layout split and recovery protocol tests.

### Plan

- [x] Review the latest commit diff across common/server/client pending-input paths.
  - 验证: identify whether projected `pendingInput` is per-viewer, cleared authoritatively, and not leaked across sockets.
- [x] Add failing regression coverage for any loophole found before changing production code.
  - 验证: focused tests fail for the exact current bug.
- [x] Fix scoped production code only where the regression points.
  - 验证: focused tests pass without broad layout refactors.
- [x] Run focused tests/typecheck/biome, then re-review the final diff.
  - 验证: checks pass or exact blockers and residual risks are recorded here.

### Review

- 发现并修复：最新提交声称 sector pending input 会自动聚焦 solar-system tab，但实际只覆盖了 V2 layout；默认 legacy `GameLayout` 仍会停在 `cards` 等非 board tab，导致 `Input Required` 可见但 sector hotspot 不可见。
- 修复：legacy `GameLayout` 复用 `isSolarSystemInput`，对 native `SECTOR` 和 `sector-N` option 输入按 inputId 自动切回 `board` tab；不改 input payload、board 渲染或 server 行为。
- 测试：先让 `GameLayout.test.tsx` 在 activeTab=`cards` 的 sector / sector-option 场景红灯，再实现并通过；补充 V2 helper、TopBar recovery、wsClient resync、gateway resync、serializer per-viewer pendingInput 覆盖。
- 验证通过：`pnpm --filter @seti/client test -- usePlayerInput.test.tsx inputPresentation.test.ts GameLayout.test.tsx layoutHelpers.test.ts wsClient.test.ts`、`pnpm --filter @seti/server test -- game.gateway.test.ts GameSerializer.test.ts`、`pnpm --filter @seti/client test`、`pnpm --filter @seti/server test`、`pnpm --filter @ender-seti/common test`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/server typecheck`、`pnpm --filter @ender-seti/common typecheck`、touched-file `pnpm exec biome check ...`。
- 剩余风险：没有发现当前 pending-input 策略中的未闭环逻辑漏洞；没有跑浏览器 E2E。
