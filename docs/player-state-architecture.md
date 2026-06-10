# Design Doc: Event-Sourced Player State + Reusable Animation Replay Pipeline

| Field | Value |
|---|---|
| Status | Draft for review |
| Scope | `packages/common`, `packages/server`, `packages/client` |
| Premise | **Greenfield project — no historical data, no backward-compat constraints.** Aggressive refactoring is allowed. Design optimizes for **correctness, extensibility, reusability, and best practice**, not for implementation ease. |
| Audience | Engineers implementing this (backend / frontend / full-stack) |

---

## 1. Background

This is a digital implementation of a turn-based board game. The server is the authoritative engine (NestJS), the client is a React rendering layer, and the two sync over WebSocket (socket.io). Persistence is PostgreSQL + Drizzle.

### 1.1 Current state — key facts (all verified against the code)

**(A) The event log is structured, but is not a first-class persisted object**
- Event types live in `packages/common/src/types/protocol/events.ts` as the discriminated union `TGameEvent` (`ACTION` / `FREE_ACTION` / `INPUT` / `UNDO` / `RESOURCE_CHANGE` / `SCORE_CHANGE` / `SECTOR_COMPLETED` / `TRACE_MARKED` / `ALIEN_DISCOVERED` / `ROTATION` / `ROUND_END` / `GAME_END`). Each event carries optional `id`, `at` (monotonic sequence), `level` (`debug`/`info`).
- The engine has `EventLog` (`packages/server/src/engine/event/EventLog.ts`): `append` injects `id`/`at`, capacity 500, exposes `recent(n)`, `size()`, `toArray()`. Event factories are in `engine/event/GameEvent.ts`.
- **Problem**: events are persisted **only by embedding the whole array into every snapshot** — `GameSerializer.serializeGame()` does `eventLog: cloneValue(game.eventLog.toArray())`. The same 500-event array is rewritten into every `game_snapshots` row, **cannot be queried by type/player/turn**, and is unsuitable for analytics storage.

**(B) Rival / opponent actions execute "instantly", with no step-by-step replay**
- A rival's whole turn executes atomically inside `RivalTurnController.resolveCurrentTurn`; `GameManager.resolveAutomatedRivalTurns` loops resolution, calls `persistSnapshot` once per turn, and finally broadcasts **one final `game:state`** via `broadcastResult`.
- `RivalActionResolver.moveProbeAlongPath` (`engine/solo/RivalActionResolver.ts`) **already computes the full movement `path`** and moves hop-by-hop, but the path is **discarded** — it never reaches the client.
- Client animation today is **pure CSS interpolation from old state to new state**:
  - `WheelLayer.tsx`: disc rotation eases to the new angle over a 900ms `transition` (delta inferred from the final angle).
  - `SolarSystemView.tsx`: probes use a 900ms `transition` on `left/top`, with per-probe `transitionDelayMs` staggering.
- `IPublicSolarSystemProbe.transitionDelayMs` (`gameState.ts`) is a latent hook: **declared, consumed by the client, but never populated by the server** in `stateProjection.ts`.
- **Problem**: a rival/opponent performs a chain (move → rotate → mark), but the user only sees the board "jump" to the final state and cannot perceive what happened.

**(C) Persistence is too heavy; state is treated as the source of truth**
- `GameManager` calls `persistSnapshot` (a full `IGameStateDto` into `game_snapshots`, `nextVersion` incrementing, pruned to ~50 on unload) on every `processAction` / `processInput` / `processEndTurn` / rival turn.
- Turn boundaries additionally use `captureCurrentTurnCheckpoint`: an **in-memory** checkpoint every turn, and a `turn_checkpoints` DB write every `DB_PERSIST_EVERY_TURNS=4` turns.
- `undoToTurnStart` rolls back to the turn-start checkpoint (already satisfies "roll back to previous turn").
- **Problem**: per-action full snapshots are redundant for turn-granular rollback; state is the source of truth and events are an afterthought — at odds with the goal of using events for analytics/replay.

### 1.2 Current data flow (sketch)

```
client ──(game:action/freeAction/input/endTurn)──▶ GameGateway
GameGateway ─▶ GameManager.process*  ─▶ engine atomic execution + eventLog.append
                                     ─▶ persistSnapshot(full state, per action)
                                     ─▶ resolveAutomatedRivalTurns(rival whole turn, atomic)
                                     ─▶ buildResult { states, pendingInputs, events=recent(10) }
GameGateway.broadcastResult ─▶ per-player game:state  +  per-event game:event (room broadcast)
client: useGameState stores latest state (direct replace) · useGameEvents merges events for text feed
        board CSS interpolates old → new
```

---

## 2. Goals & Non-Goals

### 2.1 Goals
1. **G1 — Step-by-step replay + reusable animation**: rival and multiplayer-opponent turn actions are **replayed step-by-step in semantic order** on the client (move, rotate, mark, resource changes…), via a **registry-driven, reusable mechanism** — adding a new animated action requires only "emit one event + register one renderer".
2. **G2 — Structured, analyzable log**: events become an **independent append-only table**, queryable by game / player / turn / type, to power offline data analysis.
3. **G3 — Turn-granular persistence + previous-turn rollback**: within a turn, only append lightweight events; at turn boundaries, materialize the whole board; crash recovery = latest turn snapshot + replay subsequent events; remove per-action full snapshots.

### 2.2 Non-Goals
- No client "replay export / sharing" feature (this design provides its data foundation).
- No rewrite of game-rule engine effect logic (only emit semantic events at effect sites).
- No new state-management library (keep existing React hooks / store patterns).

---

## 3. Overall Design (Event Sourcing)

**Core idea: the domain event stream is the single source of truth; everything else is a derived projection.**

```
        Command (player intent / rival decision / system flow)
                       │  authoritative engine execution
                       ▼
        ┌──────── Domain Event Stream ────────┐   ← ordered · semantic · immutable · sole source of truth
        │  (PROBE_MOVED / DISC_ROTATED / ...)  │
        └──────────────────┬───────────────────┘
                           │   three derived projections (mutually decoupled)
        ┌──────────────────┼─────────────────────────────┐
        ▼                  ▼                              ▼
  State Projection    Animation Projection          Analytics Projection
  projectGameState    events → animation batches     SQL over game_events (G2)
  (situation, exists)  (G1) registry EventToAnimation

  Persistence (G3):
    · game_events        append-only event store (source of truth + analytics source)
    · turn_snapshots     turn-boundary materialized board (load/undo optimization; rebuildable from events)
    · per-action full snapshots removed
```

**Why this satisfies "extensibility / reusability"**:
- All three projections derive from **one event stream**. A new behavior is introduced in **exactly one place** (emit an event); each projection consumes it automatically via a **registry**, with no shotgun edits.
- The animation "which event" is decoupled from "how to draw": a server registry maps `event type → animation step`, a client registry maps `step type → renderer`. Adding an animation = one entry in each table.

---

## 4. Detailed Design

### 4.1 Protocol layer (`packages/common/src/types/protocol`)

#### 4.1.1 Refactor events (`events.ts`)
Consolidate the scattered optional fields into a required base, and add **movement-semantic events**:

```ts
export type TGameEventLevel = 'debug' | 'info';

interface IGameEventBase {
  id: string;             // required, stable, unique (injected by EventLog)
  seq: number;            // global monotonic sequence (current EventLog `at`, renamed for clarity)
  turnIndex: number;      // owning turn (batch slicing / analytics / replay)
  round: number;
  actorId: string | null; // acting subject (playerId / rivalPlayerId / null = system)
  level: TGameEventLevel;
}

export enum EGameEventType {
  // Behavior / flow (existing)
  ACTION, FREE_ACTION, INPUT, UNDO, SECTOR_COMPLETED,
  ALIEN_DISCOVERED, ROUND_END, GAME_END,
  // State changes (existing; add before/after to drive number-roll animations)
  RESOURCE_CHANGED, SCORE_CHANGED, TRACE_MARKED,
  // Movement primitives (new; prerequisite for step-by-step animation)
  PROBE_MOVED, DISC_ROTATED,
}

export type TGameEvent =
  | (IGameEventBase & { type: EGameEventType.PROBE_MOVED;
      actorId: string; probeId: string; path: string[]; publicityGained?: number })
  | (IGameEventBase & { type: EGameEventType.DISC_ROTATED;
      ring: 1 | 2 | 3; steps: number })
  | (IGameEventBase & { type: EGameEventType.RESOURCE_CHANGED;
      actorId: string; resource: EResource; before: number; after: number })
  | (IGameEventBase & { type: EGameEventType.SCORE_CHANGED;
      actorId: string; before: number; after: number; source: string })
  | (IGameEventBase & { type: EGameEventType.TRACE_MARKED;
      actorId: string; traceColor: ETrace; alienIndex: number; isOverflow: boolean })
  // ... ACTION / FREE_ACTION / INPUT / UNDO / SECTOR_COMPLETED / ALIEN_DISCOVERED / ROUND_END / GAME_END
  ;
```
> Design rule: events describe **domain semantics only** — no pixels / duration / easing. Presentation details are decided by the animation registry.

#### 4.1.2 Animation step envelope (new file `protocol/animation.ts`)
```ts
export enum EAnimationStepKind {
  PROBE_MOVE, DISC_ROTATE, RESOURCE_DELTA, SCORE_DELTA, TRACE_PLACE, GENERIC,
}

interface IAnimationStepBase {
  kind: EAnimationStepKind;
  sourceEventId: string;   // traces back to the producing event
  durationMs: number;      // server default per kind; client may override
}

export interface IProbeMoveStep extends IAnimationStepBase {
  kind: EAnimationStepKind.PROBE_MOVE; actorId: string; probeId: string; path: string[];
}
export interface IDiscRotateStep extends IAnimationStepBase {
  kind: EAnimationStepKind.DISC_ROTATE; ring: 1 | 2 | 3; steps: number;
}
export interface IResourceDeltaStep extends IAnimationStepBase {
  kind: EAnimationStepKind.RESOURCE_DELTA; actorId: string; resource: string; before: number; after: number;
}
// ... SCORE_DELTA / TRACE_PLACE / GENERIC (fallback: just hold durationMs, then reconcile)
export type TAnimationStep =
  | IProbeMoveStep | IDiscRotateStep | IResourceDeltaStep | /* ... */ IGenericStep;

/** One actor's ordered animation batch for one turn */
export interface IAnimationBatch {
  batchId: string;
  actorId: string;
  turnIndex: number;
  steps: TAnimationStep[];
  finalStateVersion: number;  // ties to the authoritative game:state version used for reconcile
}
```

#### 4.1.3 New WS channel (`events.ts` `IGameWsEventPayloadMap`)
```ts
'game:animation': { batch: IAnimationBatch };
```
> Add `version: number` to `game:state` (aligns with the batch's `finalStateVersion`; reuse `GameManager`'s existing `versions` counter).

---

### 4.2 Server layer

#### 4.2.1 Event production (`engine/`)
- `engine/event/GameEvent.ts` — add factories: `createProbeMovedEvent(actorId, probeId, path, publicityGained?)`, `createDiscRotatedEvent(ring, steps)`; add `before/after` to `createScoreChangeEvent`.
- `engine/event/EventLog.ts`:
  - Rename/extend `at` to `seq`; add `since(seq): TGameEvent[]` (replay / delta).
  - `append` injects `seq` / `turnIndex` / `round` / `actorId` (provided by the `Game` context — `EventLog` holds a reference to the current `turnIndex`/`round`, or they are passed at append time).
- Emit events at effect sites:
  - `RivalActionResolver.moveProbeAlongPath`: after the hop-by-hop move, `append(createProbeMovedEvent(...))` (path already in hand).
  - `RotateDiscEffect` (`engine/effects/solar/RotateDiscEffect.ts`): `append(createDiscRotatedEvent(ring, steps))`.
  - The player's own movement free action (`EFreeAction.MOVEMENT`) also emits `PROBE_MOVED` (multiplayer-opponent animation depends on it).

#### 4.2.2 Animation projector (new file `gateway/AnimationProjector.ts`)
Registry-driven, event → step:
```ts
type TStepFactory = (e: TGameEvent) => TAnimationStep | null;

const EVENT_TO_STEP: Partial<Record<EGameEventType, TStepFactory>> = {
  [EGameEventType.PROBE_MOVED]:   (e) => ({ kind: PROBE_MOVE,  sourceEventId: e.id, durationMs: 900 * (e.path.length - 1), ... }),
  [EGameEventType.DISC_ROTATED]:  (e) => ({ kind: DISC_ROTATE, sourceEventId: e.id, durationMs: 900 * e.steps, ... }),
  [EGameEventType.RESOURCE_CHANGED]: (e) => ({ kind: RESOURCE_DELTA, ... }),
  [EGameEventType.TRACE_MARKED]:  (e) => ({ kind: TRACE_PLACE, ... }),
  // unregistered types → null (no animation step; pure log event)
};

export function buildAnimationBatch(
  appended: TGameEvent[], actorId: string, turnIndex: number, finalStateVersion: number,
): IAnimationBatch | null {
  const steps = appended.map(e => EVENT_TO_STEP[e.type]?.(e)).filter(Boolean);
  return steps.length ? { batchId: ..., actorId, turnIndex, steps, finalStateVersion } : null;
}
```
> **Extension point**: a new animated action adds one entry to `EVENT_TO_STEP`.

#### 4.2.3 Delta-event capture + result envelope (`gateway/GameManager.ts`)
Currently `buildResult` uses `events = game.eventLog.recent(10)` (imprecise). Change to **precise delta**:
- At the start of each `process*`, record `const seqBefore = game.eventLog.size()` (or current `seq`).
- After execution, `const appended = game.eventLog.toArray().slice(seqBefore)` (or `eventLog.since(seqBefore)`).
- Extend `IActionResult` / `IUndoResult`:
  ```ts
  interface IActionResult {
    states: Map<string, IPublicGameState>;   // existing (now carries version)
    pendingInputs: { playerId: string; input: IPlayerInputModel }[]; // existing
    events: TGameEvent[];                     // changed to "this call's delta"
    animationBatches: IAnimationBatch[];      // new: possibly multiple (rival multi-turn)
  }
  ```
- Rival turns: inside `resolveAutomatedRivalTurns`, take a delta slice **per turn** (by `turnIndex` change) and build one batch each, pushed into `animationBatches`.

#### 4.2.4 Broadcast (`gateway/game.gateway.ts` `broadcastResult`)
On top of the existing "per-player `game:state` + per-event `game:event`", **emit animation before authoritative state**:
```ts
// order: animation (room broadcast) → state (per-player) → event (per-event, room) → waiting
for (const batch of result.animationBatches) {
  this.server.to(roomKey).emit('game:animation', { batch });
}
for (const [playerId, state] of result.states) { /* per-player game:state (with version) */ }
for (const event of result.events) { this.server.to(roomKey).emit('game:event', { event }); }
```
> The client aligns via `finalStateVersion`, tolerating out-of-order arrival. `game:resync` (already exists) is the stuck-recovery path — re-emit authoritative state and cancel any in-flight batch.

#### 4.2.5 Persistence refactor to event sourcing (`persistence/`)

**(a) Event store table `game_events` (new)** — `persistence/schema/gameEvents.ts`, registered in `schema/index.ts`:
```ts
export const gameEvents = pgTable('game_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  seq: integer('seq').notNull(),
  turnIndex: integer('turn_index').notNull(),
  round: integer('round').notNull(),
  actorId: text('actor_id'),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),   // full TGameEvent
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  gameSeqUnique: unique('game_events_game_seq_uq').on(t.gameId, t.seq), // idempotent
  gameTurnIdx:   index('game_events_game_turn_idx').on(t.gameId, t.turnIndex),
  gameTypeIdx:   index('game_events_game_type_idx').on(t.gameId, t.type), // analytics
}));
```
`persistence/repository/GameEventRepository.ts` (new): `appendMany(gameId, events)` (bulk, ON CONFLICT (game_id,seq) DO NOTHING), `loadSince(gameId, seq)`, `loadByTurn(gameId, turnIndex)`, `countByType(gameId)`.

**(b) Turn-boundary materialized table `turn_snapshots` (replaces `game_snapshots` + `turn_checkpoints`)**:
```ts
export const turnSnapshots = pgTable('turn_snapshots', {
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  turnIndex: integer('turn_index').notNull(),
  seq: integer('seq').notNull(),          // event seq at this turn's start (replay anchor)
  round: integer('round').notNull(),
  playerId: text('player_id').notNull(),
  state: jsonb('state').notNull(),         // full IGameStateDto (no longer embeds the full eventLog)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.gameId, t.turnIndex] }) }));
```

**(c) `GameSerializer.serializeGame`**: change `eventLog` to keep only a `recent(50)` tail (so the log feed renders self-sufficiently); analytics / replay use `game_events` as the source of truth.

**(d) `GameManager` persistence timing refactor**:
| Timing | Now | Change to |
|---|---|---|
| Per action/input | full `game_snapshots` write | **only** `gameEventRepo.appendMany(appended)` |
| Turn boundary | in-memory checkpoint + DB write every 4 turns | in-memory checkpoint (immediate undo) + **every turn** write to `turn_snapshots` |
| Cold load | `loadLatestSnapshot` | latest `turn_snapshots` + `loadSince(snapshot.seq)` replay to current |
| Rollback (undo) | restore turn checkpoint | unchanged (restore previous turn); keep `game_events` (UNDO itself enters the event stream) |

> Remove the per-action `game_snapshots` write path and table; `captureCurrentTurnCheckpoint`'s DB branch becomes an every-turn `turn_snapshots` write (the in-memory checkpoint is still kept every turn for immediate undo).

---

### 4.3 Client layer (`packages/client/src`)

#### 4.3.1 WS wiring (`api/wsClient.ts`)
- Add `'game:animation': (data: { batch: IAnimationBatch }) => void` to `IGameSocketHandlerMap`; add a handler set, `bind/unbind`, and `onAnimation(cb)` (mirror the `onEvent` pattern).
- `onState` callback passes through `version`.

#### 4.3.2 Animation queue and render state (new dir `features/board/animation/`)
- `StepRendererRegistry.ts`: `Map<EAnimationStepKind, IStepRenderer>`; `IStepRenderer = { play(step, ctx): Promise<void> }`. Each renderer drives an **existing** CSS animator:
  - `PROBE_MOVE` → set the probe's render `spaceId` hop-by-hop (`path[1]→…`), reusing `SolarSystemView`'s `left/top` transition and `transitionDelayMs` stagger.
  - `DISC_ROTATE` → advance the angle step-by-step, reusing `WheelLayer`'s `normalizeStepDelta`.
  - `RESOURCE_DELTA`/`SCORE_DELTA` → number roll; `TRACE_PLACE` → place-and-highlight; `GENERIC` → pure wait.
- `useAnimationQueue.ts`: subscribe to `game:animation`, maintain a FIFO of batches, `await renderer.play(step)` step-by-step, dedupe by `batchId` (mirror `useGameEvents` dedupe).
- `AnimationController` (context / lightweight store): maintains **render state** (`renderProbePositions`, `renderDiscAngles`…); the board reads render state rather than authoritative state directly.

#### 4.3.3 Authoritative/render state split & reconcile (visual gating)
- `useGameState`: store the latest authoritative state **immediately** (input validation and legality checks always use the truth), never blocking.
- The board renders from `AnimationController`'s render state:
  - While an in-flight batch with `finalStateVersion === authoritative.version` exists: render the queue's interpolated result.
  - When the queue drains / watchdog times out (e.g. `ΣdurationMs × 1.5`) / a higher-`version` authoritative state arrives → **snap to authoritative state** (guaranteeing the final state is always correct).
- **Self-action dedupe** (multiplayer G1): `batch.actorId === me` → skip replay and reconcile directly (locally optimistic already applied); rival / opponent batches replay in full.

---

## 5. Key Sequences

### 5.1 Solo: rival turn step-by-step replay
```
player ends turn → GameManager.processEndTurn
  → resolveAutomatedRivalTurns: rival turn N
      execute: moveProbeAlongPath(append PROBE_MOVED) → RotateDiscEffect(append DISC_ROTATED) → TRACE_MARKED ...
      take this turn's delta events → buildAnimationBatch → push animationBatches
  → buildResult { states(version=v), events, animationBatches }
broadcastResult:
  room ◀ game:animation(batch, finalStateVersion=v)   // first
  each ◀ game:state(version=v)                          // after
  room ◀ game:event ×N
client:
  receive batch → queue plays step-by-step (probe hop-by-hop → disc step-by-step → trace placed)
  receive state(v) → store authoritative; render state lags
  queue drains → snap to v (align)
```

### 5.2 Multiplayer: opponent turn
Same pipeline as 5.1; `broadcastResult`'s room broadcast delivers the same batch to all players. The **acting** client skips replay (`actorId===me`) and reconciles directly; **other** players replay in full. Out-of-order is aligned by `finalStateVersion`; stuck cases fall back to `game:resync`.

---

## 6. Implementation Plan (phased / parallelizable / with DoD)

> Milestones are ordered by dependency. M1 and M3 can run in parallel (backend vs frontend); M2 depends on M1; M4 depends on M1+M2; M5 depends on M3.

### M0 — Protocol scaffolding (0.5d)
- [ ] `events.ts`: land `IGameEventBase` + movement events + `game:animation` channel; add `version` to `game:state`.
- [ ] New `protocol/animation.ts` (step / batch types).
- **DoD**: `packages/common` passes `tsc`; consumed by server/client and compiles.

### M1 — Server event production + projection + broadcast (2d)
- [ ] `GameEvent.ts` / `EventLog.ts`: factories, `seq`, `since()`, append injects turn context.
- [ ] Emit events at effect sites: `RivalActionResolver` (PROBE_MOVED), `RotateDiscEffect` (DISC_ROTATED), MOVEMENT free action (PROBE_MOVED).
- [ ] `AnimationProjector.ts` + registry.
- [ ] `GameManager`: delta capture, `IActionResult.animationBatches`, rival multi-turn batch slicing.
- [ ] `game.gateway.ts`: broadcast `game:animation` (before state).
- **DoD**: unit test asserts "one rival turn produces ordered events → one batch with correct steps"; manual WS check confirms batch delivery.

### M2 — Persistence refactor to event sourcing (2d)
- [ ] `gameEvents` table + `GameEventRepository` + drizzle migration.
- [ ] `turn_snapshots` table replacing `game_snapshots`+`turn_checkpoints`; `GameManager` persistence-timing refactor.
- [ ] `GameSerializer`: state no longer embeds the full log (keep `recent(50)`).
- [ ] Cold load: latest `turn_snapshots` + `loadSince` replay.
- **DoD**: replay-equivalence test passes (see §7); kill+restart yields consistent game state; `undo` to previous turn works.

### M3 — Client animation pipeline (2.5d)
- [ ] `wsClient.onAnimation`, `game:state` passes through version.
- [ ] `StepRendererRegistry` + renderers (reusing `WheelLayer`/`SolarSystemView`).
- [ ] `useAnimationQueue` + `AnimationController` + render/authoritative split.
- [ ] reconcile + watchdog + `game:resync` cancels in-flight.
- **DoD**: in solo, rival turns show step-by-step animation with a correct final state; dropped step / timeout snaps cleanly.

### M4 — Multiplayer opponent animation (1d)
- [ ] Self-action dedupe (`actorId===me` skips replay).
- [ ] Out-of-order / reconnect scenarios verified.
- **DoD**: two-client test — A acts, B sees step-by-step, A does not double-play.

### M5 — Analytics projection (0.5d)
- [ ] `GameEventRepository` sample analytics queries + docs.
- **DoD**: `SELECT type,count(*) ... GROUP BY type` matches the UI text feed.

---

## 7. Acceptance Criteria

**Functional**
- AC1 (G1): in solo, a rival turn is rendered **in event order** on the client — probe move (hop-by-hop) → disc rotate (step-by-step) → trace placed; on completion the board **equals** the authoritative state.
- AC2 (G1): in multiplayer, non-acting players see the opponent's full step-by-step animation; the acting player does not re-play their own action.
- AC3 (robustness): if a higher-`version` authoritative state arrives mid-animation, or the queue times out, or `game:resync` fires, the board snaps cleanly to the authoritative state with no ghosting / misplacement.

**Analytics (G2)**
- AC4: `game_events` is unique and ordered by `(gameId, seq)`; queryable by `type`/`turnIndex`/`actorId`; repeated `appendMany` (reconnect) is idempotent and does not error.
- AC5: persisted event content matches the runtime UI log feed (no omissions / no duplicates).

**Persistence (G3)**
- AC6: within a turn no full state is written (events appended only); one `turn_snapshots` row at the turn boundary; `game_snapshots` no longer produced.
- AC7: after killing the server process and restarting, the game recovers from `turn_snapshots + loadSince` replay, consistent with the pre-crash state (deep equal).
- AC8: `undo` rolls back to the previous turn start, semantics identical to current behavior.

**Extensibility (core goal)**
- AC9: **adding a new animated action is closed over "emit one event + one server registry entry + one client renderer entry"**; `useAnimationQueue` / broadcast / persistence / reconcile require no changes. Validate with a new action (e.g. "place orbiter") as a demonstration.

**Regression & quality**
- AC10: `pnpm -w test` fully green (engine, serialization, client board tests).
- AC11: all three packages pass `tsc`; no new lint errors.

---

## 8. Risks & Test Strategy

| Risk | Mitigation |
|---|---|
| **Replay non-determinism** (the event-sourcing keystone): replay must reproduce live state | Engine uses seeded RNG; `game.random.getState()` is already serialized — replay restores RNG first, then re-applies commands. **Replay-equivalence test**: `turn_snapshot → apply N operations → assert replay(snapshot, loadSince(seq)) deep-equals live state`. Any effect that cannot be rebuilt purely from events must carry the needed info in the event payload. |
| Animation diverges from authoritative state (dropped/out-of-order) | Visual gating + watchdog + `finalStateVersion` alignment + `game:resync` fallback; the final state always converges by snapping to the authoritative state. |
| Multiplayer double-play / ordering issues | `actorId` dedupe; batch `batchId` dedupe; out-of-order aligned by version. |
| Oversized batch → overly long animation | Renderer `durationMs` caps / skippable; long batches allow "speed up / snap immediately" control. |

**Test checklist**: replay equivalence (M2), batch-build unit tests (M1), reconcile dropped-step/timeout (M3), idempotent append (M2), multiplayer out-of-order + reconnect (M4).

---

## 9. Affected Files

| Layer | Files (✎ modify / ✚ new) |
|---|---|
| Protocol | ✎ `common/.../protocol/events.ts`, ✚ `protocol/animation.ts` |
| Server events | ✎ `engine/event/GameEvent.ts`, `engine/event/EventLog.ts`, `engine/solo/RivalActionResolver.ts`, `engine/effects/solar/RotateDiscEffect.ts`, movement free-action handler |
| Server projection/broadcast | ✚ `gateway/AnimationProjector.ts`, ✎ `gateway/GameManager.ts`, `gateway/game.gateway.ts`, `engine/utils/stateProjection.ts` (populate `transitionDelayMs`) |
| Server persistence | ✚ `persistence/schema/gameEvents.ts`, `schema/turnSnapshots.ts`, `repository/GameEventRepository.ts`, new migration; ✎ `serializer/GameSerializer.ts`, `schema/index.ts`, remove the `game_snapshots` write path |
| Client | ✎ `api/wsClient.ts`, `hooks/useGameState.ts`; ✚ `features/board/animation/*`; ✎ `features/board/SolarSystemView.tsx`, `features/board/WheelLayer.tsx` wiring |

## 10. Appendix: state vs log — which to use for analytics

- **player/game state = a situation snapshot** (where everything is *now*): good for resume, render, periodic context; **bad** for behavioral analytics — heavy, redundant across turns, and **loses "how you got here"**.
- **event stream = transitions/behavior** (what each actor *did*, in order): each carries `actorId`/`seq`/`turnIndex` and semantic fields — the behavioral source of truth.
- **Conclusion**: analytics use `game_events`; pull `turn_snapshots` for context only when you need "the whole board at turn N". The original idea of "use state for analytics" needs correcting: **state is the situation superset, but not the behavior superset.**
