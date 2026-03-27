# Code Review: Common (constants, rules) & Server Engine

**Date:** 2026-03-27
**Scope:** Full review of `packages/common/src/` (constants, rules) and `packages/server/src/engine/` implementation
**Reviewer:** AI Code Review Skill

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| Warning  | 10 |
| Suggestion | 8 |

**Overall assessment:** The codebase has solid architecture foundations — the deferred action queue, behavior DSL, and effect layering all follow the intended patterns well. However, there are several critical logic issues (missing probe-limit check in `canLaunchProbe`, duplicate Pass logic, inconsistent `rotationCounter` management) and pervasive use of `unknown[]` instead of typed card arrays that will create technical debt.

---

## Critical Issues

> Issues that break correctness, lose data, or violate game rules. Must fix.

### C-01: `canLaunchProbe()` in common/rules ignores probe space limit

**File:** `packages/common/src/rules/actions.ts`
**Line(s):** 17-19
**Dimension:** Logic Correctness

Per PRD §7.1, Launch Probe validation requires: `probesInSpaceCount < probeSpaceLimit`. The common rule function only checks credit cost and completely ignores the probe limit. This means the client UI will show Launch Probe as available when the player already has max probes in space.

**Current:**
```typescript
export function canLaunchProbe(player: IPublicPlayerState): boolean {
  return player.resources[EResource.CREDIT] >= LAUNCH_PROBE_CREDIT_COST;
}
```

**Suggested fix:**
```typescript
export function canLaunchProbe(player: IPublicPlayerState): boolean {
  return (
    player.resources[EResource.CREDIT] >= LAUNCH_PROBE_CREDIT_COST &&
    player.probesInSpace < (player.probeSpaceLimit ?? 1)
  );
}
```

Note: `IPublicPlayerState` already has `probesInSpace` field but does not have `probeSpaceLimit`. Either add it to the protocol type, or use a default of 1.

---

### C-02: Pass logic duplicated between `PassAction` and `Game.enqueueMainActionPipeline` — double rotation risk

**File:** `packages/server/src/engine/Game.ts` (lines 354-365) and `packages/server/src/engine/actions/Pass.ts` (lines 62-68)
**Dimension:** Logic Correctness

Both `PassAction.execute()` and the `CORE_EFFECT` deferred action in `Game.enqueueMainActionPipeline()` set `player.passed = true` and handle `hasRoundFirstPassOccurred` + rotation. If both code paths execute for the same pass action, the solar system could rotate twice and the passed flag is set redundantly.

Looking at `Game.ts` line 354:
```typescript
if (action.type === EMainAction.PASS) {
  const actor = game.players.find(...);
  if (actor) {
    actor.passed = true;
    if (!game.hasRoundFirstPassOccurred) {
      game.hasRoundFirstPassOccurred = true;
      game.rotationCounter += 1;   // increments counter but doesn't rotate!
    }
  }
}
```

And `PassAction.execute()` line 62-68:
```typescript
if (!game.hasRoundFirstPassOccurred) {
  game.hasRoundFirstPassOccurred = true;
  if (game.solarSystem !== null) {
    result.rotatedDisc = game.solarSystem.rotateNextDisc(); // actually rotates
    result.rotatedSolarSystem = true;
  }
}
```

**Issue 1:** `Game.ts` increments `rotationCounter` but doesn't actually call `solarSystem.rotate()`. `PassAction` calls `solarSystem.rotateNextDisc()` which internally increments its own `rotationCounter`. If both run, counters diverge.

**Issue 2:** It's unclear whether `Game.processMainAction` delegates to `PassAction.execute()` at all — the `CORE_EFFECT` switch doesn't include a `PASS` case, so `PassAction.execute()` is never called from the main pipeline. The Pass handling is inlined in the switch's default fallthrough + the `if (action.type === EMainAction.PASS)` block.

**Suggested fix:**
- Route Pass through `PassAction.execute()` in the switch statement like other actions
- Remove the inline pass handling from `Game.ts` `CORE_EFFECT`
- Or: keep inline but make sure `rotationCounter` stays in sync with `SolarSystem.rotationCounter`

---

### C-03: `Game.rotationCounter` and `SolarSystem.rotationCounter` are separate counters that can diverge

**File:** `packages/server/src/engine/Game.ts` (line 150, 363) and `packages/server/src/engine/board/SolarSystem.ts` (line 99, 147)
**Dimension:** Logic Correctness

Both `Game` and `SolarSystem` maintain a `rotationCounter` property. `SolarSystem.rotateNextDisc()` increments its own counter (line 147). The Game-level counter is incremented independently in the Pass handling (Game.ts line 363). Research tech actions call `RotateDiscEffect.execute(game)` which calls `game.solarSystem.rotateNextDisc()`, only incrementing the SolarSystem counter.

This dual-counter design is fragile. If any code path rotates via `SolarSystem.rotateNextDisc()` without also incrementing `Game.rotationCounter`, or vice versa, the disc selection sequence becomes incorrect.

**Suggested fix:** Remove `Game.rotationCounter` and always use `game.solarSystem.rotationCounter` as the single source of truth. Or add a `Game.rotateNextDisc()` method that delegates to `solarSystem` and keeps counters in sync.

---

## Warnings

> Issues that may cause bugs, hurt maintainability, or deviate from architecture. Should fix.

### W-01: `canLand()` in common/rules uses hardcoded minimum energy=2 instead of actual landing cost

**File:** `packages/common/src/rules/actions.ts`
**Line(s):** 31-36
**Dimension:** Logic Correctness

```typescript
export function canLand(player, _gameState): boolean {
  return player.resources[EResource.ENERGY] >= 2;
}
```

Per PRD §7.3, landing cost is 3 normally, 2 if orbiter exists, and can be reduced by tech. Hardcoding `2` means the client will show Land as available when the player has 2 energy even if they have no orbiter at any planet (actual cost = 3).

**Suggested fix:** Accept planet context or compute minimum possible landing cost across all planets.

---

### W-02: `canOrbit()` in common/rules ignores probe-on-planet prerequisite

**File:** `packages/common/src/rules/actions.ts`
**Line(s):** 21-29
**Dimension:** Logic Correctness

Per PRD §7.2: "at least one own probe on non-Earth planet space". The function only checks resource cost, not whether the player has any probe at a valid planet. Same issue affects `canLand()`.

**Suggested fix:** Check `probesInSpace > 0` as a minimum necessary condition, or accept game state to check probe positions.

---

### W-03: Pervasive `unknown[]` for card arrays — should use `ICard` or `string` union

**File:** `packages/server/src/engine/player/IPlayer.ts`, `IGame.ts`, `Player.ts`, `Game.ts`
**Dimension:** Code Quality

Hand, playedMissions, completedMissions, endGameCards, tuckedIncomeCards, cardRow, and endOfRoundStacks are all typed as `unknown[]`. This forces unsafe casts throughout the codebase (e.g., `(card as { id?: string })?.id` in `Player.ts` line 241).

**Suggested fix:** Define a union type `type TCardItem = string | IBaseCard` and use it consistently. At minimum, `hand` should be `string[]` since cards are represented by ID strings throughout the server engine.

---

### W-04: Serializer/Deserializer relies heavily on `as unknown as` casts to access private state

**File:** `packages/server/src/persistence/serializer/GameSerializer.ts`, `GameDeserializer.ts`
**Dimension:** Code Maintainability

There are 20+ occurrences of `as unknown as ISomeInternalState` to reach private fields. This bypasses TypeScript's encapsulation, making the code fragile — any private field rename will silently break serialization at runtime without a compile error.

**Suggested fix:** Add explicit serialization methods (`toDto()` / `fromDto()`) to each subsystem (`Player`, `SolarSystem`, `MilestoneState`, `MissionTracker`, etc.) that expose their internal state in a type-safe way. Alternatively, use `toJSON()`/`fromJSON()` patterns.

---

### W-05: `FreeActionCorner` has blocking TODOs — free-action corner effect not implemented

**File:** `packages/server/src/engine/freeActions/FreeActionCorner.ts`
**Line(s):** 13, 41
**Dimension:** Task Completion

The card's free-action corner effect is never executed. The card is discarded but the corner effect is silently skipped. This is a known incompleteness flagged with TODO.

---

### W-06: `DragonflyCard` and `BehaviorExecutor.buildLandAction` contain duplicated planet-selection logic

**File:** `packages/server/src/engine/cards/base/DragonflyCard.ts` and `packages/server/src/engine/cards/BehaviorExecutor.ts`
**Dimension:** Code Maintainability

Both files contain nearly identical logic for building a planet-selection menu for landing:
- Same `allPlanets` array
- Same `SelectOption` construction
- Same `LandProbeEffect.canExecute` / `getLandingCost` / `execute` pattern
- Same "skip-land" option

This is ~30 lines of duplicated code.

**Suggested fix:** Extract a shared `buildLandPlanetSelection(player, game, options?)` utility in `effects/probe/` or a shared helper.

---

### W-07: Orbit action costs are inlined as magic numbers

**File:** `packages/server/src/engine/actions/Orbit.ts`
**Line(s):** 27, 49
**Dimension:** Configurability

`{ credits: 1, energy: 1 }` is hardcoded inline in both `canExecute` and `execute`, unlike `LaunchProbe` and `Scan` which extract constants.

**Suggested fix:** Extract to named constants `const ORBIT_CREDIT_COST = 1; const ORBIT_ENERGY_COST = 1;` at minimum.

---

### W-08: Duplicate cost constants between `common/rules/actions.ts` and server action files

**File:** `packages/common/src/rules/actions.ts` and `packages/server/src/engine/actions/`
**Dimension:** Configurability

Both define the same action costs independently:
- `common/rules/actions.ts`: `LAUNCH_PROBE_CREDIT_COST = 2`, `SCAN_CREDIT_COST = 1`, etc.
- `server/engine/actions/LaunchProbe.ts`: `LAUNCH_PROBE_CREDIT_COST = 2`
- `server/engine/actions/Scan.ts`: `SCAN_CREDIT_COST = 1`, `SCAN_ENERGY_COST = 2`

If one changes without the other, server validation and client UI become inconsistent.

**Suggested fix:** Define all action costs in `common/constant/actionCosts.ts` and import from both server and common/rules.

---

### W-09: `GameSetup` creates deck with placeholder card IDs instead of real card data

**File:** `packages/server/src/engine/GameSetup.ts`
**Line(s):** 33-36
**Dimension:** Logic Correctness

```typescript
const baseDeckCards = Array.from(
  { length: 80 },
  (_, index) => `card-${index + 1}`,
);
```

This generates cards `card-1` through `card-80` as string IDs. While `CardRegistry.registerFromLoadedData()` registers cards by their actual ID (e.g., `'55'`, `'128'`), the deck contains `card-1` style IDs that won't match. When `PlayCardAction` calls `hasCardData(cardId)` with `card-1`, it returns false and the card is treated as a generic no-effect discard.

**Suggested fix:** Use actual card IDs from `loadAllCardData()` to build the deck, matching the real card pool.

---

### W-10: `PassAction.execute()` is never called from the main game pipeline

**File:** `packages/server/src/engine/Game.ts`
**Line(s):** 310-365
**Dimension:** Logic Correctness

The `enqueueMainActionPipeline` switch handles `ORBIT`, `LAND`, and `PLAY_CARD` by delegating to their respective action classes. However, `PASS` falls through to `default: break` and is then handled by a separate `if` block that only sets `passed = true` and increments `rotationCounter`. It never calls `PassAction.execute()`, so:

- Hand discard-to-limit is skipped
- End-of-round card selection is skipped
- Solar system rotation on first pass uses `rotationCounter += 1` instead of actual rotation

**Suggested fix:** Add `case EMainAction.PASS:` to delegate to `PassAction.execute(player, game)` like other actions.

---

## Suggestions

> Non-blocking improvements for readability, consistency, or future-proofing.

### S-01: Move all action costs to a shared config file in `common/constant/`

**File:** Multiple action files
**Dimension:** Configurability

Per the checklist and architecture doc, all game constants should live in a dedicated config file. Currently costs are scattered across:
- `common/rules/actions.ts` (file-level constants)
- `server/engine/actions/*.ts` (file-level constants)
- `server/engine/effects/scan/ScanTechEffects.ts`
- `server/engine/freeActions/*.ts`

Create `common/constant/actionCosts.ts` with all action/free-action costs as a single record.

---

### S-02: Add `probeSpaceLimit` to `IPublicPlayerState`

**File:** `packages/common/src/types/protocol/gameState.ts`
**Dimension:** Logic Correctness

`IPublicPlayerState` has `probesInSpace` but not `probeSpaceLimit`. Without it, `canLaunchProbe()` cannot check the probe limit on the client side.

---

### S-03: `Player.getCardIdAt` should throw or return a discriminated result instead of `'unknown'`

**File:** `packages/server/src/engine/player/Player.ts`
**Line(s):** 237-242
**Dimension:** Code Quality

Returning `'unknown'` as a string card ID silently propagates an invalid ID. Better to throw `GameError` for an out-of-range index, or return `undefined` with proper typing.

---

### S-04: `BehaviorExecutor` should be injectable rather than a module-level singleton

**File:** `packages/server/src/engine/cards/BehaviorExecutor.ts`
**Line(s):** 386-390
**Dimension:** Code Maintainability

The module-level singleton `defaultBehaviorExecutor` with `getBehaviorExecutor()` makes it hard to test custom handlers in isolation. Consider injecting it into `Card` or `Game` via constructor.

---

### S-05: `CardRegistry` is also a module-level singleton with eager registration

**File:** `packages/server/src/engine/cards/CardRegistry.ts`
**Line(s):** 52-65
**Dimension:** Code Maintainability

`defaultCardRegistry` is created and populated at module load time. This means all card data is loaded on import even in tests that don't need it. Consider lazy initialization or explicit `init()`.

---

### S-06: `normalizeDiscAngle` in `sectorSetup.ts` duplicates modular arithmetic in `SolarSystem.ts`

**File:** `packages/common/src/constant/sectorSetup.ts` (line 186) and `packages/server/src/engine/board/SolarSystem.ts` (line 95-96)
**Dimension:** Maintainability

Both compute `((angle % N) + N) % N`. The common helper should be reused by the server.

---

### S-07: `MissionCondition.parsePlanetFromDesc` uses fragile string matching

**File:** `packages/server/src/engine/missions/MissionCondition.ts`
**Line(s):** 126-137
**Dimension:** Code Quality

Parsing planet from a description string via `includes('mercury')` is fragile. If the card data format changes or a description contains a planet name coincidentally, this breaks.

**Suggested fix:** Use a structured field (e.g., `planet: EPlanet`) on the requirement effect instead of parsing from `desc`.

---

### S-08: Consider renaming `IPlayerInput` vs `PlayerInput` — currently both names are used

**File:** `packages/server/src/engine/input/PlayerInput.ts`, `IGame.ts`, `IPlayer.ts`
**Dimension:** Naming

`IGame.ts` uses `IPlayerInput`, while `Game.ts` uses `PlayerInput`. This inconsistency is confusing — `IPlayerInput` follows the naming convention (interface prefix) but `PlayerInput` is the actual class/type alias. Standardize to one.

---

## Checklist Summary

| Dimension | Pass | Fail | N/A |
|-----------|------|------|-----|
| Logic Correctness | 8 | 5 | 3 |
| Task Completion | 7 | 1 | 2 |
| Maintainability | 7 | 3 | 2 |
| Configurability | 3 | 5 | 1 |
| Code Quality | 6 | 3 | 2 |

## What's Done Well

- **Effect layering** is clean — actions delegate to effects, effects are composable, the scan pipeline (mark + select + mark) is well-structured
- **DeferredAction priority system** correctly orders COST → CORE_EFFECT → IMMEDIATE_REWARD → CARD_TRIGGER → SECTOR_COMPLETION
- **Behavior DSL** with `behaviorFromEffects()` is an elegant bridge from static card data to runtime behavior
- **Board topology** (SolarSystem rings, rotation, adjacency rebuilding) is a complex domain handled well
- **Error handling** consistently uses `GameError` with `EErrorCode` and contextual data
- **Sector tile setup** in common is properly typed with `ISolarSystemSetupConfig` shared between server and client
- **Typecheck passes cleanly** with zero errors
