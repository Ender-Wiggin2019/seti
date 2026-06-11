# Todo

## Task: correct refine v2 full-page background composition

Assumptions:
- The Mission Hub top scene must use the full refine v2 reference image at `packages/client/public/assets/seti/refine/v2/f9f13fde-db71-41e7-9212-4a06f64d7427.png`, not a sliced sprite tile.
- The page background is a three-part composition: top full reference image, middle dark gradient, and bottom/footer scene image.
- The footer/all-pages background image is `packages/client/public/assets/seti/refine/v2/c05187fa-4c06-467f-a10e-1bd942f2a1f6.png`.

Plan:
- [ ] Add/adjust Mission Hub assertions so the hero image and footer/background assets are the requested refine v2 files.
  - Verify: focused MissionHub test catches accidental fallback to sprite tiles.
- [ ] Move Mission Hub from local card texture usage to the requested full-page background model.
  - Verify: `/lobby` visually shows the full top image, dark middle bridge, and bottom/footer image.
- [ ] Sync design-system docs and lessons with the corrected asset rule.
  - Verify: `.impeccable.md`, `docs/home-redesign-style.md`, and `docs/lessons.md` record the full-image-vs-sprite distinction.
- [ ] Run focused client tests, typecheck, and a browser smoke screenshot.
  - Verify: test/typecheck pass and browser evidence shows the corrected background.

Review:
- Pending implementation.

## Task: code review staged diff 2026-06-11

Assumptions:
- Review scope is the currently staged, uncommitted diff (`git diff --cached`), plus review fixes applied as unstaged changes on top.
- Mode is review-and-fix because the request did not ask for read-only review.
- The highest-risk areas are event sourcing / turn snapshots, gateway animation delivery, lobby room visibility, client animation queue/render state, and local E2E/database scripts.
- Binary image assets will be checked for path/reference/script consistency, not full visual art direction.

Tradeoffs to confirm:
- The staged diff is large (190+ files). A full line-by-line review of every test and image would be slow and low-signal; I will review by behavior-critical themes, then use targeted searches and tests to catch cross-cutting issues.
- If I find a defect in staged code, I will make the smallest scoped fix with a focused regression test, preserving unrelated staged changes.

Review Plan:
- [x] Map the staged diff into behavior themes and identify production entry points.
  - Verify: `git diff --cached --name-only` and focused diffs establish the files reviewed.
- [x] Review persistence/event-sourcing path: schemas, repositories, replay, serializer, `GameManager` commit boundaries, undo/cold-load semantics.
  - Verify: repository/replay/serializer/gateway tests cover idempotency, turn snapshots, event ordering, and replay equality.
- [x] Review gateway animation path: event metadata, `AnimationProjector`, WS emission order, client queue/dedupe/reconcile behavior.
  - Verify: server gateway/projector tests and client animation hook/controller tests pass.
- [x] Review lobby/API changes: room visibility, player slots, my-games page/API, DTO validation, e2e helper assumptions.
  - Verify: lobby service/controller/client API/page tests pass.
- [x] Review UI/layout/script changes for obvious regressions: scene background, route wiring, sprite processing, event log rendering, no hand-written rule icon placeholders where existing renderers should be used.
  - Verify: focused client component/script tests pass.
- [x] Fix critical and warning findings in scope, adding tests before/with fixes where behavior can regress.
  - Verify: each fix has a failing-before/passing-after assertion or a concrete rationale when the issue is static/type-level.
- [x] Run final targeted verification and typecheck, then write `docs/review/diff-2026-06-11.md`.
  - Verify: commands and residual risk are recorded in the review report.

Review:
- Completed review-and-fix pass. Report: `docs/review/diff-2026-06-11.md`.
- Fixed critical issues in turn-complete event persistence history and local E2E database URL isolation.
- Fixed warnings in E2E trace-slot selection, client animation self-batch skipping, Lobby/Home aggregate player telemetry, legacy room-list pagination handling, and sprite generator dependency/docs clarity.
- Verification passed:
  - `pnpm --filter @seti/server test -- __tests__/engine/event/EventLog.test.ts __tests__/gateway/GameManager.test.ts __tests__/persistence/replay/GameEventReplay.test.ts __tests__/scripts/runE2eLocalScript.test.ts __tests__/lobby/lobby.service.test.ts __tests__/lobby/lobby.controller.test.ts`
  - `pnpm --filter @seti/client test -- __tests__/features/board/animation/useAnimationQueue.test.tsx __tests__/features/board/animation/animationController.test.ts __tests__/api/lobbyApi.test.ts __tests__/scripts/processSetiSceneSprite.test.ts __tests__/pages/lobby/MyGamesPage.test.tsx`
  - `pnpm --filter @seti/client typecheck`
  - `pnpm --filter @seti/server typecheck`
  - `pnpm --filter @seti/e2e typecheck`
  - `pnpm -w typecheck`
  - `git diff --check`
  - `git diff --cached --check`
- Remaining risk: full browser E2E was not rerun; the changed E2E helper is typechecked, but a live two-browser trace placement flow would be the next strongest check.

## Task: lobby room management, My Games, and public player profile

Assumptions:
- "Delete room" means the host can delete only a `waiting` room. Started or finished games remain game history and are not destructively removed.
- Lobby pagination should be server-driven (`page`, `pageSize`, `total`) so large room lists do not require fetching every room on the client.
- Solo hidden rooms should be controlled at room creation time and persisted on the `games` row. Hidden solo rooms are excluded from the public lobby list but still visible to participants in My Games.
- "My Games" is a new authenticated page because the current client has `/lobby`, `/room/$roomId`, and `/profile`, but no implemented My Games route.
- Public user info should not expose email. Room player name/avatar clicks should show a dialog with callsign, join date/public id, and recent game summaries.
- Recent data can be derived from existing `games` + `game_players` rows first: recent rooms/games, status, host/participant role, mode, and timestamps. Detailed win rate/final scores should wait until a stable persisted scoring projection exists.

Tradeoffs to confirm:
- Minimal DB change is adding `visible_in_lobby boolean not null default true` to `games`. Keeping visibility in `options` avoids a migration but makes room listing/filtering less clean.
- A dialog in the room is lower-impact than a full public profile route. A route can be added later if public profiles need sharing/bookmarking.
- My Games can reuse the room-card visual language but should include hidden solo games and any game where the current user is in `game_players`.

Plan:
- [x] Add RED server tests for lobby pagination, hidden solo room exclusion, My Games inclusion, host-only waiting-room deletion, and public player profile/recent games.
  - Verify: targeted server lobby/auth tests fail because the endpoints and persistence fields do not exist yet.
- [x] Add RED client API/component tests for paged room lists, delete calls, hidden-solo create option, My Games data, pagination controls, and player profile dialog.
  - Verify: targeted client tests fail before implementation.
- [x] Add the minimal persistence/API surface.
  - Verify: `games.visible_in_lobby` migration/schema exists; `GET /lobby/rooms` returns paged public rooms; `GET /lobby/my-games` returns current user's rooms/games; `DELETE /lobby/rooms/:id` only works for the host while waiting; `GET /lobby/players/:id/profile` returns public profile plus recent games.
- [x] Update client room creation, lobby list, room page, My Games page, navigation, and public profile dialog.
  - Verify: hidden solo toggle appears only for solo creation, lobby pagination is usable, hosts can delete waiting rooms, My Games shows hidden solo rooms, and clicking player name/avatar opens public info without exposing email.
- [x] Run focused verification and one real UI E2E path.
  - Verify: focused server/client tests pass, typecheck passes for touched packages, and E2E proves hidden solo is absent from Lobby but present in My Games plus room player profile opens from real UI.

Review:
- Implemented server-driven lobby pagination with `visible_in_lobby` persistence, a `GET /lobby/my-games` page, host-only `DELETE /lobby/rooms/:id`, and `GET /lobby/players/:id/profile` public profile/recent game data. Delete is intentionally limited to waiting rooms so started/finished games remain history.
- Updated client API normalization, Lobby/Home pagination, solo-only "Show in Lobby" creation toggle, My Games route/nav/page, host delete action, hidden-room badge, and clickable room player slots that open a public profile dialog.
- Added/updated focused server, client, and real UI E2E coverage. Verification passed:
  - `pnpm --filter @seti/server test -- __tests__/lobby/lobby.controller.test.ts __tests__/lobby/lobby.service.test.ts`
  - `pnpm --filter @seti/client test -- __tests__/api/lobbyApi.test.ts __tests__/components/CreateRoomDialog.test.tsx __tests__/components/MissionHub.test.tsx __tests__/components/PlayerSlot.test.tsx __tests__/pages/lobby/MyGamesPage.test.tsx`
  - `pnpm --filter @seti/server test -- __tests__/scripts/drizzleMigrations.test.ts __tests__/persistence/schemaReadiness.test.ts`
  - `pnpm --filter @seti/server typecheck`
  - `pnpm --filter @seti/client typecheck`
  - `pnpm --filter @seti/e2e typecheck`
  - `pnpm --filter @seti/e2e test -- tests/lobby.spec.ts`

## Task: refine v2 general design system and scene sprites

Assumptions:
- The v2 visual north star is `packages/client/public/assets/seti/refine/v2/f9f13fde-db71-41e7-9212-4a06f64d7427.png` and the new scene sprite sheet is `packages/client/public/assets/seti/refine/v2/sprite/dc5059d8-0be3-496b-967b-c8e6940f0e38.png`.
- Current committed scripts do not include a scene sprite splitter; `scripts/build-anomalies-token-sprite.mjs` is anomaly-token-specific and must not be reused for this sheet.
- Unless a separate script path is provided before implementation, add a small committed splitter script that uses the available `cwebp` binary to keep future v2 sprite updates repeatable.
- "Remove v1 sprite" means stop deriving `packages/client/public/assets/seti/sprites/*.webp` from the old v1 1254x1254 refine sheets and remove obsolete v1 scene-sheet source files that are no longer referenced.

Tradeoffs to confirm:
- Lowest-impact path keeps the public `terrain_*` and `objects_*` filenames stable, regenerating both sets from the single v2 sheet so existing UI references do not need a broad rename.
- A cleaner naming path would collapse `objects_*` into one new `scene_*` naming scheme, but that touches more components and tests for little user-visible gain.

Plan:
- [x] Add a focused failing test for the scene sprite splitter behavior.
  - Verify: test fails because the scene sprite splitter script does not exist yet.
- [x] Implement the minimal scene sprite splitter and generate v2 WebP tiles from the new 3x3 sheet.
  - Verify: generated `terrain_00_00.webp` ... `terrain_02_02.webp` and `objects_00_00.webp` ... `objects_02_02.webp` are all `256x256` WebP and visually come from the v2 sheet.
- [x] Remove obsolete v1 scene sprite source sheets and update design-system references from legacy screenshot language to refine v2.
  - Verify: `rg` finds no design-system references to old v1 scene-sheet filenames or obsolete palette values outside historical docs if intentionally retained.
- [x] Sync general design tokens/docs and `.impeccable.md` to the refine v2 palette, scene asset rules, and component guidance.
  - Verify: `packages/client/src/config/theme.ts`, `packages/client/src/styles/globals.css`, `docs/home-redesign-style.md`, and `.impeccable.md` agree on the v2 color/source names.
- [x] Run focused verification.
  - Verify: scene splitter test, MissionHub/RoomCard/Auth/Profile tests, and `pnpm --filter @seti/client typecheck` pass or unrelated pre-existing failures are documented.

Review:
- Added `scripts/process-seti-scene-sprite.mjs`, a white-border-aware 3x3 PNG splitter that defaults to the refine v2 scene sheet and writes existing public `terrain_*` / `objects_*` WebP filenames via `cwebp`.
- Added `packages/client/__tests__/scripts/processSetiSceneSprite.test.ts`; red failure was missing script, green verifies 1254x1254 source, 418x418 cells, white-border-trimmed crops, and 18 output entries.
- Regenerated all `packages/client/public/assets/seti/sprites/*.webp` from the v2 sprite sheet at `256x256`.
- Removed the three obsolete v1 scene sprite source sheets from `packages/client/public/assets/seti/refine/`.
- Updated `.impeccable.md`, `docs/home-redesign-style.md`, `packages/client/src/config/theme.ts`, and `packages/client/src/styles/globals.css` to the refine v2 palette: deep space blue, star track blue, energy orange, orbit white, and star gray.
- Updated primary/selected UI styling: main CTA uses energy orange; selected create-room options use star-track blue.
- Verification passed:
  - `pnpm --filter @seti/client test -- __tests__/scripts/processSetiSceneSprite.test.ts`
  - `pnpm --filter @seti/client test -- __tests__/scripts/processSetiSceneSprite.test.ts __tests__/components/MissionHub.test.tsx __tests__/components/RoomCard.test.tsx __tests__/components/CreateRoomDialog.test.tsx __tests__/pages/auth/AuthPage.test.tsx __tests__/pages/profile/ProfilePage.test.tsx`
  - `pnpm --filter @seti/client typecheck`
  - `node scripts/process-seti-scene-sprite.mjs --dry-run --json`
  - `file packages/client/public/assets/seti/sprites/*.webp`
  - `sips -g pixelWidth -g pixelHeight packages/client/public/assets/seti/sprites/*.webp`
  - `rg` check for old v1 scene filenames and obsolete palette values returned no matches in active design/client/script files.
  - Playwright visual smoke against local Vite app with mocked lobby API confirmed Mission Hub loads, CTA is energy orange (`rgb(242, 106, 33)`), and hero/room scene WebP tiles complete loading.

## Task: review player-state architecture runtime readiness

Assumptions:
- The strategy in `docs/player-state-architecture.md` is the target, but todo checkboxes are not accepted as proof until code, migrations, and runtime checks agree.
- This remains a greenfield project, so no historical game-state compatibility is required; however, existing developer databases that already applied the old `0000_sad_redwing` migration must still be able to reach the current schema without manual SQL.
- The reported `relation "turn_snapshots" does not exist` is treated as a blocking runtime defect, not a documentation issue.

Plan:
- [x] Audit schema, migration journal, repositories, GameManager load/persist paths, and client/server animation wiring against M0-M5.
  - Verify: file/line evidence for completed and incomplete parts.
- [x] Reproduce or isolate the missing `turn_snapshots` startup failure.
  - Verify: migration/test evidence explains why the relation can be missing.
- [x] Add a regression test before production changes for the migration gap.
  - Verify: targeted server test fails before the migration fix.
- [x] Add the minimal migration/script fix.
  - Verify: targeted migration test passes and `db:migrate` creates/keeps `turn_snapshots`.
- [x] Run focused and broad checks until no known loopholes remain.
  - Verify: typecheck/tests/startup commands pass, or residual blockers are explicitly named.

Review:
- Root cause fixed: `turn_snapshots`/`game_events` were added by editing baseline migration `0000_sad_redwing.sql`, but databases that already applied the old baseline do not re-run it. Added `0001_player_state_event_sourcing.sql` plus `_journal.json` entry and a migration regression test.
- Startup/migration readiness hardened: `runMigrations()` and the Nest Drizzle pool now assert required player-state tables and key columns. Missing schema now fails with a direct `pnpm --filter @seti/server db:migrate` hint instead of later `relation "turn_snapshots" does not exist`.
- Additional runtime holes fixed with red/green tests:
  - command persistence failures roll back cached game state and version;
  - cold load advances projected `version` after replaying post-snapshot command events;
  - rival automated pass emits/replays a durable `RIVAL_PASS` command;
  - disc animation uses the batch-start angle when same-version authoritative state arrives during earlier steps;
  - multi-batch animation no longer cancels an earlier queued batch just because a later final version already arrived;
  - probe movement duration is split across hops.
- Verification passed:
  - `pnpm --filter @seti/server test -- __tests__/scripts/drizzleMigrations.test.ts __tests__/scripts/migrateDatabase.test.ts __tests__/persistence/schemaReadiness.test.ts __tests__/persistence/replay/GameEventReplay.test.ts __tests__/gateway/GameManager.test.ts __tests__/persistence/repository/GameEventRepository.test.ts __tests__/persistence/repository/TurnSnapshotRepository.test.ts __tests__/persistence/repository/GameRepository.test.ts __tests__/scripts/resetE2eDatabase.test.ts`
  - `pnpm --filter @seti/client test -- __tests__/features/board/animation/StepRendererRegistry.test.ts __tests__/features/board/animation/useAnimationQueue.test.tsx __tests__/api/wsClient.test.ts __tests__/features/board/animation/animationController.test.ts`
  - `pnpm --filter @seti/server typecheck`
  - `pnpm --filter @seti/server db:migrate`
  - direct PostgreSQL column check on database `oushuohuang`: no required `game_events` / `turn_snapshots` columns missing
  - server startup on `PORT=3101` and `GET /health` returned `{"status":"ok"}`
  - one earlier `pnpm --filter @seti/e2e test -- tests/browser-smoke.spec.ts` run passed; a later rerun failed in unrelated lobby code with `list.filter is not a function` while external HMR updates were occurring.
- Not 100% complete:
  - `pnpm -w test` is not a clean acceptance signal right now: full e2e previously hit port/process interference, and the latest browser smoke failure is in lobby pagination handling, not player-state persistence.
  - AC2/M4 still lacks a true two-client opponent-animation E2E assertion.
  - AC9 remains partial because `RESOURCE_DELTA`, `SCORE_DELTA`, and `TRACE_PLACE` client renderers are still waits rather than visible number/trace animations.
  - Undo analytics semantics are still ambiguous: raw `game_events` includes reverted events plus `UNDO`; analytics that need effective history must fold undo ranges or use an explicit effective-event query.

## Task: harden player-state turn-boundary persistence transaction

Assumptions:
- Incomplete or rejected commands must not persist command events.
- A completed command that crosses a turn boundary must durably write its appended events and the new `turn_snapshots` row in the same DB transaction.
- Undo also writes an `UNDO` event plus a restored turn snapshot, so it must use the same transaction boundary and restore memory if the transaction fails.
- Commands that do not create a turn snapshot should continue to append only events, without unnecessary transaction wrapping.

Plan:
- [x] Add RED `GameManager` regression tests proving turn-boundary persistence and undo persistence use a single DB transaction for event append plus snapshot save.
  - Verify: the tests failed on the old implementation because `processEndTurn` and `undoToTurnStart` wrote through manager-level repositories outside `db.transaction`.
- [x] Update `GameManager` persistence flow with the smallest transaction-aware helper.
  - Verify: turn-boundary commands and undo call repository methods bound to the transaction handle; same-turn commands still append events only.
- [x] Run focused and full server verification.
  - Verify: `GameManager` tests, focused player-state persistence suite, full server tests, and server typecheck pass.

Review:
- Added `GameManager.persistEventsAndMaybeTurnSnapshot()` and `persistEventsAndTurnSnapshotInTransaction()` so commands that cross a turn boundary append events and upsert `turn_snapshots` inside one `db.transaction`.
- Routed automated rival turn persistence through the same helper.
- Routed `undoToTurnStart` through the mutation rollback guard and the same transaction helper, covering both DB atomicity and in-memory rollback when undo persistence fails.
- Added regression tests for turn-boundary transaction use, undo transaction use, undo transaction failure rollback, and turn snapshot failure rollback under the new transaction boundary.
- Verification passed:
  - `pnpm --filter @seti/server test -- __tests__/gateway/GameManager.test.ts`
  - `pnpm --filter @seti/server typecheck`
  - `pnpm -w typecheck`
  - `pnpm --filter @seti/server test -- __tests__/scripts/drizzleMigrations.test.ts __tests__/scripts/migrateDatabase.test.ts __tests__/persistence/schemaReadiness.test.ts __tests__/persistence/replay/GameEventReplay.test.ts __tests__/gateway/GameManager.test.ts __tests__/persistence/repository/GameEventRepository.test.ts __tests__/persistence/repository/TurnSnapshotRepository.test.ts __tests__/persistence/repository/GameRepository.test.ts __tests__/scripts/resetE2eDatabase.test.ts`
  - `pnpm --filter @seti/server test`

## Task: switch player-state persistence to turn-complete commit

Assumptions:
- A player turn is tentative until all end-turn/between-turn/reveal/pending-input work settles and the engine enters the next turn.
- If the server crashes mid-turn, recovering from the previous committed turn snapshot is acceptable; users can redo the lost tentative actions.
- In-memory state remains authoritative while the server process is alive, so same-turn actions still work normally without DB writes.
- Undo before commit should be an in-memory rollback only; committed turns cannot be undone.

Plan:
- [x] Add RED `GameManager` tests for the new persistence boundary.
  - Verify: same-turn actions and end-turn flows that do not change `turnIndex` write no DB rows; turn completion commits the whole turn event batch; undo writes no DB rows.
- [x] Change `GameManager` to track the last committed event seq and commit only at completed turn boundaries.
  - Verify: the committed batch includes events accumulated earlier in the turn, not just the final command's events.
- [x] Update docs to distinguish committed `game_events` from tentative in-memory events.
  - Verify: `docs/player-state-architecture.md` no longer says per-action/input events are appended to DB.
- [x] Run focused and broad verification.
  - Verify: `GameManager` tests, player-state persistence focused suite, server typecheck, and workspace typecheck pass.

Review:
- `GameManager` now tracks a per-game commit watermark (`lastCommittedSeqs` / `lastCommittedTurnIndexes`). Same-turn actions, free actions, inputs, and undo no longer touch the DB; `commitIfTurnComplete` runs once after each settled command and, only when the engine has advanced past the committed turn with no pending input, commits every event since the watermark plus the new `turn_snapshots` row in a single transaction.
- Rival auto-turns no longer persist per turn; the whole player+rival span commits once when control settles back. `prepareTurnTracking` initializes the watermark and refreshes the in-memory undo checkpoint at the genuine turn start, so undo restores the true turn-start state.
- Undo is in-memory only: it restores the turn-start checkpoint, realigns the watermark, and returns an ephemeral `UNDO` log event that is never appended to the durable stream or written to the DB.
- Fixed a latent serialization fragility: `MissionTracker.getAllMissions` / `getCompletableQuickMissions` / `getMissionState` lazily materialized empty `missionsByPlayer` entries on the read/projection path, making post-undo serialization diverge from the pre-action snapshot. These reads are now non-mutating.
- Updated `docs/player-state-architecture.md` (§3 persistence box, §4.2.5d timing table, AC6–AC8) to describe turn-complete commit and ephemeral undo.
- Verification passed:
  - `pnpm --filter @seti/server test -- __tests__/gateway/GameManager.test.ts __tests__/engine/missions/MissionTracker.test.ts`
  - `pnpm --filter @seti/server test -- __tests__/scripts/drizzleMigrations.test.ts __tests__/persistence/schemaReadiness.test.ts __tests__/persistence/replay/GameEventReplay.test.ts __tests__/persistence/repository/GameEventRepository.test.ts __tests__/persistence/repository/TurnSnapshotRepository.test.ts __tests__/persistence/repository/GameRepository.test.ts __tests__/persistence/serializer/GameSerializer.test.ts __tests__/gateway/game.gateway.test.ts`
  - `pnpm --filter @seti/server test` (340 files, 2285 tests)
  - `pnpm -w typecheck`

## Task: implement `docs/player-state-architecture.md`

Assumptions:
- This is a greenfield migration for runtime/persistence shape; no historical snapshot or DB compatibility path is required.
- The implementation should follow the design doc's source-of-truth direction: events are the behavior log, turn snapshots are materialized recovery/undo anchors, public state is a projection.
- Existing rule behavior should not be rewritten except where an effect site must emit a semantic event.

Tradeoffs to confirm:
- Full AC1-AC11 is a large cross-package change. I will implement by milestones, keeping each milestone compiling and tested before moving on.
- M2 cold-load replay requires a replay mechanism from persisted events. If current events do not yet carry enough information to rebuild every mutation, the first implementation should add event payloads at the affected effect sites instead of reintroducing per-action snapshots.

## Implementation Plan

- [x] M0 Protocol scaffolding
  - [x] Add required event base fields (`id`, `seq`, `turnIndex`, `round`, `actorId`, `level`) and rename event types to the design shape (`RESOURCE_CHANGED`, `SCORE_CHANGED`, `PROBE_MOVED`, `DISC_ROTATED`).
  - [x] Add `packages/common/src/types/protocol/animation.ts` with animation step and batch types.
  - [x] Add `game:animation` payload typing and `version` on `IPublicGameState`.
  - [x] Red/green verification: common protocol/type tests and package typecheck.

- [x] M1 Server event production, animation projection, and broadcast
  - [x] Extend `EventLog` with `seq`, `since(seq)`, and append-time turn context.
  - [x] Extend `GameEvent` factories for probe movement, disc rotation, resource before/after, score before/after, and trace placement under the new base.
  - [x] Emit `PROBE_MOVED` from rival movement and player movement free action.
  - [x] Emit `DISC_ROTATED` from solar disc rotation effects.
  - [x] Add `gateway/AnimationProjector.ts` with event-to-step registry.
  - [x] Change `GameManager` to capture precise appended event deltas and return `animationBatches`.
  - [x] Change `game.gateway.ts` to emit `game:animation` before per-player `game:state`.
  - [x] Red/green verification: focused `EventLog`, `GameEvent`, projector, `GameManager`, and gateway tests prove ordered events and one batch per rival/opponent turn.

- [x] M2 Event store and turn snapshot persistence
  - [x] Add `game_events` schema, repository, and migration; `appendMany` must be idempotent on `(gameId, seq)`.
  - [x] Replace `game_snapshots` and `turn_checkpoints` write paths with `turn_snapshots`.
  - [x] Persist appended events during actions/inputs/free actions/end turn; persist exactly one turn snapshot at each turn boundary.
  - [x] Change cold load to latest turn snapshot plus events since snapshot seq.
  - [x] Keep serializer event tail limited to recent log display only, not as analytics source.
  - [x] Red/green verification: repository idempotency, no per-action snapshot writes, replay from a turn snapshot deep-equals live state, undo still persists the rollback event.

- [x] M3 Client animation pipeline
  - [x] Add `wsClient.onAnimation` and handler binding/unbinding.
  - [x] Add animation controller/store with authoritative/render state split.
  - [x] Add step renderer registry for probe move, disc rotate, resource delta, score delta, trace place, and generic wait.
  - [x] Wire `SolarSystemView` to render probe positions from animation render state while preserving current authoritative interaction behavior.
  - [x] Wire `WheelLayer` to support controlled step-by-step disc render angle.
  - [x] Add reconcile/watchdog behavior: higher `version`, timeout, or resync snaps render state to authoritative state.
  - [x] Red/green verification: client unit tests for ws handler, queue order/dedupe, self-skip, resync snap, probe path hops, and disc step rendering.

- [x] M4 Multiplayer opponent animation behavior
  - [x] Skip replay for `batch.actorId === me`; non-acting clients replay the full batch.
  - [x] Verify out-of-order state/batch handling via `finalStateVersion`.
  - [x] Red/green verification: focused hook tests prove actor skips and opponent batches replay through the queue.

- [x] M5 Analytics projection and docs
  - [x] Add repository analytics query helpers (`loadByTurn`, `loadByActor`, `countByType`).
  - [x] Document that analytics uses `game_events`; turn snapshots are contextual materializations.
  - [x] Red/green verification: repository analytics helpers return persisted event payloads/counts in sequence order without duplicates.

## Completion Gates

- [x] AC1 solo rival turn replays in event order and reconciles to authoritative state at the batch/queue/component layer.
- [x] AC2 multiplayer opponent replay works and acting player does not double-play at the queue layer.
- [x] AC3 higher-version state or resync snaps cleanly.
- [x] AC4 `game_events` is unique and queryable by game/player/turn/type.
- [x] AC5 persisted event content matches runtime UI log feed through shared appended-event persistence.
- [x] AC6 no per-action full state writes; one turn snapshot per turn boundary.
- [x] AC7 recovery from `turn_snapshots + loadSince` deep-equals live state at the replay layer.
- [x] AC8 undo semantics remain compatible with current previous-turn-start behavior.
- [x] AC9 adding a new animated action only needs event emission, server registry entry, and client renderer entry.
- [ ] AC10 `pnpm -w test` passes.
- [x] AC11 `pnpm -w typecheck` passes with no new lint errors.

## Review

- M0 completed with TDD:
  - Red: `pnpm --filter @ender-seti/common typecheck` failed on missing animation exports, missing required event base fields, missing `PROBE_MOVED`, missing `game:animation`, and missing public state `version`.
  - Green: `pnpm --filter @ender-seti/common typecheck` passes after adding protocol types and updating common fixtures.
- M1 completed with TDD:
  - Red: focused server tests failed on missing event metadata injection, movement/rotation semantic events, animation projection, and gateway broadcast ordering.
  - Green: `pnpm --filter @seti/server test -- __tests__/engine/event/EventLog.test.ts __tests__/engine/event/GameEvent.test.ts __tests__/gateway/AnimationProjector.test.ts __tests__/gateway/GameManager.test.ts __tests__/gateway/game.gateway.test.ts __tests__/engine/effects/solar/RotateDiscEffect.test.ts __tests__/engine/freeActions/Movement.test.ts __tests__/engine/solo/RivalTurnController.test.ts __tests__/engine/Game.test.ts` passes.
  - Green: `pnpm --filter @seti/server typecheck` passes.
- M2 completed with TDD:
  - Red: serializer display-tail regression failed with 64 events when the expected display tail was 50.
  - Green: `pnpm --filter @seti/server test -- __tests__/persistence/repository/GameEventRepository.test.ts __tests__/persistence/repository/TurnSnapshotRepository.test.ts __tests__/persistence/repository/GameRepository.test.ts __tests__/persistence/replay/GameEventReplay.test.ts __tests__/gateway/GameManager.test.ts __tests__/debug/debug.service.test.ts __tests__/scripts/resetE2eDatabase.test.ts __tests__/persistence/serializer/GameSerializer.test.ts` passes: 8 files, 81 tests.
  - Green: `pnpm --filter @seti/client test -- __tests__/features/log/EventEntry.test.tsx __tests__/features/log/EventLog.test.tsx __tests__/hooks/useGameEvents.test.tsx __tests__/features/layout/layoutV2Regression.test.tsx __tests__/pages/game/GameLayout.test.tsx` passes: 5 files, 90 tests.
  - Green: `pnpm --filter @seti/server test -- __tests__/scripts/runE2eLocalScript.test.ts` passes after isolating local E2E ports and database defaults.
  - Green: `pnpm --filter @seti/client test -- __tests__/components/MissionHub.test.tsx` passes after restoring the `lobby-new-mission` selector.
  - Green: `pnpm -w typecheck` passes for all packages.
  - Caveat: `pnpm -w test` is not checked because the long `packages/e2e/tests/alien-discovery-real-flow.spec.ts` flow still fails on older scripted-flow assumptions outside the M2 persistence scope.
- M3/M4 completed with TDD:
  - Red: `wsClient.onAnimation`, animation controller/queue modules, controlled wheel angles, and solar probe render overrides were missing.
  - Green: `pnpm --filter @seti/client test -- __tests__/api/wsClient.test.ts __tests__/features/board/animation/animationController.test.ts __tests__/features/board/animation/useAnimationQueue.test.tsx __tests__/features/board/WheelLayer.test.tsx __tests__/features/board/SolarSystemView.test.tsx __tests__/features/layout/layoutV2Regression.test.tsx __tests__/pages/game/GameLayout.test.tsx __tests__/pages/game/GamePage.test.tsx` passes: 8 files, 131 tests.
  - Green: `pnpm --filter @seti/client typecheck` passes.
- M5 completed with TDD:
  - Red: `GameEventRepository.loadByActor` was missing.
  - Green: `pnpm --filter @seti/server test -- __tests__/persistence/repository/GameEventRepository.test.ts` passes: 1 file, 6 tests.
  - Green: `pnpm --filter @seti/server typecheck` and `pnpm --filter @ender-seti/common typecheck` pass.
  - Green: `pnpm -w typecheck` passes for all packages after the client/server changes.

## Task: client background and base card back assets

Assumptions:
- The app-wide background should use the provided `d55a8a49-1bb0-4fe5-8e92-1af654bbd2fb.png`, converted to webp and moved under `packages/client/public/assets/seti/sky/`.
- The base card back should replace existing `/assets/seti/cards/back_base.jpg` usages with the provided `card_back.png`, converted to webp and moved under `packages/client/public/assets/seti/cards/`.
- "Fixed不用移动" means viewport-fixed background layers should keep using fixed positioning and no scrolling/parallax behavior.

Plan:
- [ ] Convert both provided PNGs to webp in semantic asset folders.
  - Verify: `file` reports webp images in `assets/seti/sky` and `assets/seti/cards`.
- [ ] Point the client-wide background variable and fixed background layers at the new sky webp.
  - Verify: source search has no app background reference to the old refine image or obsolete atmosphere SVG for global chrome.
- [ ] Replace base card back references in card row / pass-card surfaces with the new card webp.
  - Verify: source search has no `/assets/seti/cards/back_base.jpg` references.
- [ ] Run focused client verification.
  - Verify: targeted tests/typecheck pass or any pre-existing unrelated failures are documented.

Review:
- Pending implementation.
