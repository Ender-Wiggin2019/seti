# PRD/rule-tech Completion Audit - 2026-05-13

## Objective

User objective:

- Check whether the current implementation accurately implements `docs/arch/prd-rule.md` and `docs/arch/rule-tech.md`.
- Pay special attention to tech board positions and ordering.
- If factual confidence is below 100%, find loopholes, fix them, and repeat until no known rule gap remains.

Concrete deliverables:

- Rule/tech discrepancies fixed in code, not only documented.
- Regression tests for each confirmed loophole.
- Prompt-to-artifact evidence that each named spec file and explicit concern is covered.
- Final verification using full package tests, type checks, static checks, and browser smoke for touched frontend surfaces.

## Prompt-to-Artifact Checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Inspect `docs/arch/rule-tech.md` tech order, ids, images, and effects. | `packages/common/src/constant/boardLayout.ts`, `packages/client/src/features/tech/techTileImages.ts`, `packages/common/__tests__/constant/techBoardLayout.test.ts`, `packages/client/__tests__/features/board/TechBoardView.test.tsx`. | Covered |
| Fix tech position/order mismatch without changing persisted tech ids. | `TECH_STACK_LAYOUT` now uses canonical `[0, 1, 2, 3]` per stack; client image mapping explicitly maps persisted ids to physical image assets. | Covered |
| Research Tech flow: rotate first, main action pays 6 publicity, card-granted tech rotates even if no tech can be taken, no duplicate tech. | `packages/server/src/engine/actions/ResearchTech.ts`, `packages/server/src/engine/effects/tech/ResearchTechEffect.ts`, `ResearchTech.test.ts`, `BehaviorExecutor.test.ts`, `SolarSystem.test.ts`. | Covered |
| Tech first-take 2 VP and printed bonus resolution. | `ResearchTechEffect.takeTech`, `TechBonusEffect`, `TechBonusEffect.test.ts`, `GameIntegration.test.ts` resource/score mutation event regression. | Covered |
| Probe tech rules: probe limit, asteroid movement/publicity, land discount, moon unlock. | `ProbeTechs.test.ts`, `Movement.test.ts`, `Land.test.ts`, `PlanetaryBoard.test.ts`, `RivalTurnController.test.ts`. | Covered |
| Telescope/scan tech rules and scan ordering. | `ScanTechs.test.ts`, `ScanTechEffects.test.ts`, `ScanActionPool.test.ts`, `MarkSectorSignalEffect.test.ts`, `GameFlowBehavior.test.ts`. | Covered |
| Computer tech bottom rewards and place-data rules. | `ComputerTechs.test.ts`, `PlaceData.test.ts`, `ComputerRow.test.tsx`, `GameLayout.test.tsx`. | Covered |
| `prd-rule.md` setup state and player setup. | `GameSetup.test.ts`, `FullGameSimulation.test.ts`, setup tuck handling in `TestGameBuilder`, serializer/deserializer tests. | Covered |
| Main action legality and resolution for launch/orbit/land/scan/analyze/play/research/pass. | `GameIntegration.test.ts`, action-specific tests under `packages/server/__tests__/engine/actions/`, common `actions.test.ts`. | Covered |
| Round/turn lifecycle, pass sequence, first-pass rotation, income, final game end. | `GameTurnFlow.test.ts`, `GameRoundTransition.test.ts`, `IncomeSystem.test.ts`, `FullGameSimulation.test.ts`. | Covered |
| Free actions: movement, card/energy movement, place data, complete mission, free-action corner, buy card, exchange. | `Movement.test.ts`, `ConvertEnergyToMovement.test.ts`, `PlaceData.test.ts`, `CompleteMission.test.ts`, `FreeActionCorner.test.ts`, `BuyCard.test.ts`, `ExchangeResources.test.ts`. | Covered |
| Planetary board orbit/land/moon rules, first bonuses, moon exclusivity. | `PlanetaryBoard.ts`, `LandProbeEffect.ts`, `PlanetaryBoard.test.ts`, `Land.test.ts`, `PlanetaryBoardView.test.tsx`. | Covered |
| Hidden/public information boundaries. | `GameSerializer.projectGameState` removes future `endOfRoundStacks`; `GameSerializer.test.ts`; client public state tests. | Covered |
| Alien discovery and plugin extensibility including `onRoundEnd`. | `AlienState.ts`, plugin tests, `GameRoundTransition.test.ts`, `ResolveDiscovery.test.ts`. | Covered |
| Milestones and deferred ordering. | `Milestone.test.ts`, `GoldScoringTile.test.ts`, `ResolveMilestone.test.ts`, `GameIntegration.test.ts`. | Covered |
| Final scoring and tie behavior. | `FinalScoring.test.ts`, `GoldScoringTile.test.ts`, `FullGameSimulation.test.ts`, `GameIntegration.test.ts`. | Covered |
| Determinism and auditable event log. | `EventLog.ts`, `GameEvent.ts`, `Player.ts`, `Resources.ts`, `EventLog.test.ts`, `GameEvent.test.ts`, `GameIntegration.test.ts`. Event ids/timestamps are deterministic; resource and score mutations now emit `RESOURCE_CHANGE` / `SCORE_CHANGE`. | Covered |
| Client/server consistency for changed flows. | Common protocol `spentCardIds`, server `ExchangeResources`, client `ExchangeResourcesDialog` in `GameLayout`, specific-card play checks in common/server/client. | Covered |
| UI icon/rendering rule for rule/reward/desc icons. | `PlanetaryBoardView` / stories/tests use existing reward/icon renderers; Storybook core tests assert current stable test ids/ARIA labels. | Covered |
| Browser verification for changed frontend surfaces. | `/debug/game` smoke: planet board image mode rendered, tech tab had all 12 stacks, inspected tech images loaded with nonzero dimensions. | Covered |

## Confirmed Loopholes Fixed

- Tech stack layout and client image mapping were not aligned to the canonical physical order.
- First end-of-round income underpaid round 1.
- Research Tech spend/rotation order and card-granted research rotation were incomplete.
- Rotation publicity gained during a card/effect rotation was not credited back to player resources.
- `LAUNCH_IGNORE_LIMIT` bonus still respected the normal probe limit.
- Same-player repeated ordinary planet landings were over-restricted.
- Future end-of-round stacks leaked through public projection.
- Card exchange did not require explicit hand card ids.
- Play-card availability could be true without a specific playable revealed card.
- Discovered alien `onRoundEnd` hooks were not dispatched.
- Event ids/timestamps used nondeterministic metadata.
- Existing `RESOURCE_CHANGE` / `SCORE_CHANGE` event types were not emitted by generic resource/score mutation paths.

## Verification Gates

Required final gates:

- `pnpm --filter @ender-seti/common test` - passed, 14 files / 150 tests.
- `pnpm --filter @seti/server test` - passed, 298 files / 1921 tests.
- `pnpm --filter @seti/client test` - passed, 66 files / 265 tests.
- `pnpm --filter @ender-seti/common typecheck` - passed.
- `pnpm --filter @seti/server typecheck` - passed.
- `pnpm --filter @seti/client typecheck` - passed.
- `pnpm exec biome check --diagnostic-level=error $(git diff --name-only -- '*.ts' '*.tsx')` - passed.
- `git diff --check` - passed.
- Browser smoke for `/debug/game` - passed: planet image mode rendered without text cards, 12 tech stacks rendered, all 12 tech tile images loaded with nonzero dimensions, no current console errors/warnings.

## Completion Decision

No known in-scope implementation gap remains after the resource/score event-log fix. This is an evidence-backed implementation audit, not a mathematical proof over all possible future code paths; new rule code can still introduce future gaps and should follow the same checklist.
