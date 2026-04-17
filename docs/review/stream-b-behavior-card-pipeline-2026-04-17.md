# Stream B — Behavior & Card Pipeline Test Report

> Scope: #5 BehaviorExecutor rewrite · #6 CardEffectsIntegration (new) · #3 ResearchTech closure
> Date: 2026-04-17 · Branch: `feature/server`

## Summary

| Task | File | Result | Cases |
|------|------|--------|-------|
| #5 | `packages/server/__tests__/engine/cards/BehaviorExecutor.test.ts` | 🔴 → 🟢 INTEGRATION | 16 passing + 2 legacy skipped |
| #6 | `packages/server/__tests__/engine/cards/CardEffectsIntegration.test.ts` | 🆕 INTEGRATION | 8 passing |
| #3 | `packages/server/__tests__/engine/actions/ResearchTech.test.ts` | 🟡 → 🟢 INTEGRATION | +6 passing (18 total) |

Full server suite: **1121 passed / 2 skipped / 0 failed** (vitest).

## #5 BehaviorExecutor — MOCK-HEAVY → INTEGRATION

**Problem (from TDD plan §2.9):** the legacy suite mocked `game.mark` into a `__markCalls` array, stubbed `solarSystem.rotateNextDisc`, and returned `[]` for `techBoard.getAvailableTechs`, so every branch verified mock invocations instead of real rule behaviour.

**Rewrite policy followed:** per §Execution Rules in `docs/tests/tdd-plan.md`, the old `describe` block is kept inline as `describe.skip('legacy - ... superseded by integration suite', ...)`. It will be deleted once coverage parity is signed off.

**New integration coverage (all via `Game.create()` + real `deferredActions.drain`):**

- **2.9.1** resource bundle effects (spend / gain / score / movement / income) against real `Player` ledger.
- **2.9.2** action behaviors routed through real effect classes:
  - `launchProbe` places a probe on a real Earth space via `SolarSystem.placeProbe`.
  - `rotateSolarSystem` advances `solarSystem.rotationCounter`.
  - `drawCards` pulls from the real `mainDeck` and triggers `RefillCardRowEffect`.
- **2.9.3** `researchTech` emits a `SelectOption` whose ids are intersected with `TechBoard.getAvailableTechs`.
- **2.9.4** `markTrace` surfaces a real `AlienState` interactive input (not a noop).
- **2.9.5** `markAnySignal` / `markDisplayCardSignal` go through `game.mark → Mark.execute`, producing real `SelectOption` / `SelectCard` inputs over the live card row.
- **2.9.6** `scan.markEarthSectorIndex` writes a real player signal into `sectors[i].signals`.
- **2.9.7** custom `DESC` handlers resolve against real game state (`desc.card-119` → +4 VP); unknown ids log an `UNHANDLED` event and do not mutate player state.
- **2.9.8** `canExecute` honours real prerequisites: insufficient spend, probe-limit, and exhausted tech category all return `false`.
- **2.9.9** composite behavior (spend + gain + score + movement + income + rotate) runs ordered and leaves the game in the expected state.

All previously mocked invariants from the legacy block are re-asserted in the integration suite, with one strict upgrade: `game.mark` assertions now verify the *surfaced player input* (sector palette / card-row selection) rather than mock call shape.

## #6 CardEffectsIntegration — New

Replaces the implicit "30+ single-card unit tests call `card.execute()` against hand-rolled `IGame` fakes" pattern called out in the TDD plan. Picks representative live cards and drives them via `Game.processMainAction({ type: PLAY_CARD })`:

- **2.10.1** Probe card `130` (`Low-Cost Space Launch`, LAUNCH effect) — cost 1 credit, probe placed, no extra 2-credit launch fee.
- **2.10.2** Telescope card `55` (`Arecibo Observatory`, SCAN + DESC) — real sector signal written for the active player.
- **2.10.3** Resource card `110` (`Press Statement`, +3 publicity) — real ledger delta with no off-target drift.
- **2.10.4** Tech card `71` (`Focused Research`, ROTATE + TECH_ANY) — rotation ticks, tech prompt ids all belong to `TechBoard.getAvailableTechs`, no 6-publicity cost charged.
- **2.10.5** Multi-effect card `109` (`Low-Power Microprocessors`, ENERGY + ROTATE + TECH_COMPUTER) — every step in order, tech prompt narrowed to `comp-*` ids, turn hands off after acquisition.
- **2.10.6** Ordinary card goes to discard, hand shrinks by one.
- **2.10.7** Out-of-range `cardIndex` rejected without mutating turn state.
- **2.10.8** Insufficient resources rejected without mutating turn state.

## #3 ResearchTech — 2.7.x Closure

The existing `ResearchTech.test.ts` used `vi.spyOn(techBoard, 'getAvailableTechs').mockReturnValue([])` and a hand-rolled `IGame` with `sectors: []`, never going through `processMainAction`. Added a new `integration (2.7.x closure)` describe block:

- **2.7.1** full loop: 6 publicity spent, `rotationCounter` advances, real `SelectOption` returned, input processed, `TechBoard.playerOwns` confirms acquisition.
- **2.7.3 / 2.7E.3** post-acquisition, the picked techId is no longer in `getAvailableTechs(playerId)` and `canResearch` returns `false`.
- **2.7.4** first-taker bonus: stack's `firstTakeBonusAvailable` flips off, score delta ≥ 2.
- **2.7.5** tile bonus: `TechBonusEffect` is applied — either `tileBonus` is surfaced on the result and at least one non-score surface moves, or the tile has no bonus and only +2 first-take VP shows up.
- **2.7.7** card-effect path (`isCardEffect=true`): rotation still ticks while publicity is not deducted even when at 0.
- **2.7E.2** full-board guard: after taking every tech, `ResearchTechAction.canExecute` returns `false`.

Not added in this pass (defer to Phase 4 / Phase 8 tasks per plan scope):
- 2.7.2 probes-follow-rotation physics (covered by Phase 4 RotateDiscEffect rewrite).
- 2.7.6 blue-tech placement onto the computer with pre-existing data (covered by Phase 8 ComputerTechs suite).
- 2.7.8 grant of an already-owned tech (requires a bespoke card effect path; out of scope here).

## Verification

```
pnpm --filter @seti/server test
Test Files  184 passed (184)
Tests       1121 passed | 2 skipped (1123)
```

The 2 skipped cases are the `describe.skip('legacy - BehaviorExecutor (mock-heavy...')` block kept intentionally until coverage parity sign-off.

## Boundary Compliance

No files outside `packages/server/src/engine/cards/`, `engine/tech/`, `engine/effects/tech/`, or their `__tests__` mirrors were touched. `MissionTracker.ts` and `PlayCard.ts` were **not** modified, per Stream A handoff boundary.

## Follow-ups handed off to plan

- Delete the `describe.skip` legacy block once a reviewer signs off on coverage parity.
- Stream A still owns the remaining mission-tracker trigger-mission timing assertions (`2.6.8–2.6.11`).
- Phase 4 / Phase 8 suites are the right home for 2.7.2 / 2.7.6.
