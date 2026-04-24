# Code Review: Latest 5 Commits Replay Feature

**Date:** 2026-04-24
**Scope:** `HEAD~5..HEAD` (`964b05e`, `2df9ff4`, `09ae581`, `3dfab8d`, `da2ff3d`) with emphasis on debug replay / snapshot replay.
**Reviewer:** AI Code Review Skill

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| Warning | 4 |
| Suggestion | 3 |

**Overall assessment:** The preset replay direction is reasonable: protocol types live in `common`, server presets mutate a real `Game`, and the client enters the normal `GameContextProvider` / `GameLayout` path instead of mocking state. The snapshot replay path is not yet safe as a general replay feature: it can load unrecoverable mid-input snapshots, exposes public snapshot cloning, and does not persist cloned sessions.

## Critical Issues

### C-01: Snapshot replay can load a dead `IN_RESOLUTION` game

**File:** `packages/server/src/persistence/serializer/GameDeserializer.ts`
**Line(s):** 453-474
**Dimension:** Logic / Quality

`createSnapshotSession()` directly deserializes an arbitrary DB snapshot (`packages/server/src/debug/debug.service.ts:262-278`). However snapshots saved after a main action can contain a pending `PlayerInput`: `GameManager.processAction()` persists immediately after `game.processMainAction(...)` (`packages/server/src/gateway/GameManager.ts:101-116`). The serializer always writes `waitingFor: null` (`packages/server/src/persistence/serializer/GameSerializer.ts:146`), and the deserializer currently rehydrates only setup-tuck inputs.

I verified this with a local tsx probe:

```json
{"before":"option","phase":"IN_RESOLUTION","restoredPhase":"IN_RESOLUTION","restoredWaiting":null,"currentPlayerId":"p1"}
```

That means a snapshot taken after something like `SCAN` can be replay-loaded as `IN_RESOLUTION` with no pending input and an empty deferred queue. The UI renders a session that cannot accept a main action, end turn, or input response.

**Suggested fix:** Either persist and rehydrate resumable pending input descriptors for all deterministic `PlayerInput` types used by persisted snapshots, or make snapshot replay reject/skip unsafe snapshots until it finds a stable boundary (`AWAIT_MAIN_ACTION`, `AWAIT_END_TURN`, `GAME_OVER`, or setup-tuck only). If snapshot replay is intended for arbitrary versions, this must be solved before relying on it.

---

### C-02: Public snapshot replay can mint a token for any game snapshot

**File:** `packages/server/src/debug/debug.controller.ts`
**Line(s):** 49-54
**Dimension:** Quality / Security

`/debug/server/snapshot-session` is marked `@Public()` and takes only `{ gameId, version }`. `DebugModule` is imported unconditionally in `AppModule` (`packages/server/src/app.module.ts:10-17`), and `DebugService.createSnapshotSession()` loads the snapshot then returns a signed JWT for a player in that game (`packages/server/src/debug/debug.service.ts:292-303`).

If this server is ever reachable outside a trusted dev environment, anyone who knows or guesses a game UUID can clone a persisted game snapshot and authenticate as seat 0 for that clone. This is a bigger issue than the existing synthetic debug sessions because it touches real persisted games.

**Suggested fix:** Gate the debug module by environment, require an internal debug secret/guard, or require normal auth plus membership/ownership checks before cloning a snapshot. At minimum, do not expose snapshot replay through an unconditional public controller.

---

### C-03: Reviewed commits currently break server typecheck

**File:** `packages/server/__tests__/engine/missions/MissionCondition.test.ts`
**Line(s):** 109, 166, 192, 196
**Dimension:** Quality

`pnpm --filter @seti/server run typecheck` fails because several test `ICustomizedEffect` fixtures omit the required `id` field:

```text
Property 'id' is missing in type '{ effectType: EEffectType.CUSTOMIZED; desc: string; }'
```

This is in the reviewed commit range and blocks CI even though the replay-focused tests pass.

**Suggested fix:** Build these fixtures with the existing `DESC(...)` helper or add stable `id` values to the custom effect objects.

## Warnings

### W-01: Snapshot sessions are not persisted as games

**File:** `packages/server/src/debug/debug.service.ts`
**Line(s):** 285-290
**Dimension:** Logic / Maintainability

`createReplaySession()` registers the game and then calls `gameRepository.create(game)` (`packages/server/src/debug/debug.service.ts:234-243`). `createSnapshotSession()` registers the deserialized clone but never creates the parent row. Later `GameManager.unloadGame()` tries to persist a snapshot (`packages/server/src/gateway/GameManager.ts:278-289`), and `game_snapshots.game_id` references `games.id` (`packages/server/src/persistence/schema/gameSnapshots.ts:16-18`).

**Suggested fix:** Mirror the replay session persistence path for snapshot clones, preferably before the game is exposed through `GameManager.registerGame()`.

---

### W-02: Snapshot replay always authenticates as seat 0

**File:** `packages/server/src/debug/debug.service.ts`
**Line(s):** 280-283
**Dimension:** Logic

The snapshot path uses `game.players[0]` as the human player regardless of `game.activePlayer`. On the client, `isMyTurn` is computed from authenticated user id versus `gameState.currentPlayerId` (`packages/client/src/pages/game/GameContext.tsx:80-91`), and `ActionMenu` blocks actions when it is not your turn (`packages/client/src/features/actions/ActionMenu.tsx:224-241`). A snapshot captured during another player's turn will render but cannot be continued from the replay page.

**Suggested fix:** Default the viewer to `game.activePlayer`, or add `viewerPlayerId` to `IDebugSnapshotSessionRequest` and validate it against the snapshot players.

---

### W-03: Snapshot service behavior is not directly tested

**File:** `packages/server/__tests__/debug/debugSnapshotSession.test.ts`
**Dimension:** Completion / Quality

The new snapshot tests cover serializer/deserializer round-trip behavior, but not `DebugService.createSnapshotSession()` itself. Missing coverage includes `loadSnapshot` versus `loadLatestSnapshot`, `GAME_NOT_FOUND`, registry registration, token user selection, and persistence of the cloned session.

**Suggested fix:** Add service-level tests with mocked `GameRepository`, `GameManager`, and `DebugSessionRegistry`. Include a non-seat-0 active player case.

---

### W-04: Invalid replay requests become generic server errors

**File:** `packages/server/src/debug/debugReplayPresets.ts`
**Line(s):** 105-108, 133-134, 264-268
**Dimension:** Error Handling

Unsupported preset/checkpoint/field values throw plain `Error`. Through the Nest controller this will surface as a 500-style failure rather than a validation error.

**Suggested fix:** Convert request validation failures to `BadRequestException` or a `GameError` with an appropriate client-safe code.

## Suggestions

### S-01: `/debug/alien` and `/debug/replay` should have clearer semantics

**File:** `packages/client/src/routes.tsx`
**Line(s):** 102-112
**Dimension:** Maintainability

Both routes render the same page. That is acceptable as an alias, but E2E tests use both paths interchangeably. Either keep one canonical route or make `/debug/alien` preselect alien-oriented presets.

---

### S-02: Replay field model is currently select-only

**File:** `packages/common/src/types/protocol/debug.ts`
**Line(s):** 21-27
**Dimension:** Maintainability

`IDebugReplayFieldDefinition.kind` only supports `'select'`. That works for the current alien presets, but snapshot/version-like future preset inputs will need a discriminated union for text, number, player, card, etc.

---

### S-03: Client snapshot version input should validate before submit

**File:** `packages/client/src/pages/game/DebugReplayPage.tsx`
**Line(s):** 205-210, 430-435
**Dimension:** Quality

`Number(snapshotVersion.trim())` can produce invalid values such as `NaN`, negative numbers, or decimals. The server handles this poorly as a not-found style lookup.

**Suggested fix:** Validate `Number.isInteger(version) && version >= 0` client-side and server-side.

## Verification

| Check | Result |
|-------|--------|
| `pnpm --filter @seti/server test -- __tests__/debug/debugReplayPresets.test.ts __tests__/debug/debugSnapshotSession.test.ts __tests__/debug/debug.controller.test.ts` | Passed: 22 tests |
| `pnpm --filter @seti/client run typecheck` | Passed |
| `pnpm --filter @seti/server run typecheck` | Failed, see C-03 |
| Mid-input snapshot probe | Confirmed restored `IN_RESOLUTION` snapshot has `restoredWaiting: null`, see C-01 |
