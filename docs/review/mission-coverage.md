# Mission System Coverage Report

Date: 2026-04-17
Scope: Stream A Mission system line

## Completed

- `#10 MissionTracker`:
  - added action-level checkpoint grouping so a single effect chain can emit multiple mission events but surface only one prompt per player for that checkpoint
  - added multi-player trigger scanning so a full mission can prompt its owner even when the triggering action was taken by another player
- `#9 CompleteMission`:
  - rewrote coverage around real `Game.create()` + `processMainAction()` + `processFreeAction()` flow
  - locked delayed completion, unmet-condition guard, reward payout, and not-your-turn rejection
- `#11 ObservationQuickMissionCard`:
  - replaced the primary coverage path with a real play-action integration test
  - verified the card marks only the star-matched sector and still registers its mission state

## Files Changed

- `packages/server/src/engine/Game.ts`
- `packages/server/src/engine/missions/MissionTracker.ts`
- `packages/server/__tests__/engine/missions/MissionTracker.test.ts`
- `packages/server/__tests__/engine/freeActions/CompleteMission.test.ts`
- `packages/server/__tests__/engine/cards/base/ObservationQuickMissionCard.test.ts`
- `packages/server/__tests__/engine/actions/PlayCard.test.ts`

## New Coverage

- opponent action can trigger another player's full mission prompt
- one scan checkpoint that emits both `SCAN_PERFORMED` and `SIGNAL_PLACED` is aggregated into one mission prompt instead of multiple chained prompts
- observation quick mission can be played through the real main-action pipeline and marks the intended nearby-star sector only
- observation quick mission can be completed later through the free-action path after its condition becomes true
- `CompleteMissionFreeAction.canExecute()` stays false while the condition is unmet
- satisfied quick missions still reject completion outside the owner's turn

## Verification

- `pnpm --filter @seti/server typecheck`
- `pnpm exec biome check --diagnostic-level=error packages/server/src/engine/Game.ts packages/server/src/engine/missions/MissionTracker.ts packages/server/__tests__/engine/missions/MissionTracker.test.ts packages/server/__tests__/engine/freeActions/CompleteMission.test.ts packages/server/__tests__/engine/cards/base/ObservationQuickMissionCard.test.ts packages/server/__tests__/engine/actions/PlayCard.test.ts`
- `pnpm --filter @seti/server test -- --run __tests__/engine/actions/PlayCard.test.ts __tests__/engine/GameIntegration.test.ts __tests__/engine/cards/base/StrategicPlanningCard.test.ts __tests__/engine/missions/MissionTracker.test.ts __tests__/engine/freeActions/CompleteMission.test.ts __tests__/engine/cards/base/ObservationQuickMissionCard.test.ts`

## Remaining Risks

- `MissionTracker.test.ts` and `CompleteMission.test.ts` still contain pre-existing non-null-assertion warnings; they are not type errors and were left untouched outside the new logic path
- the checkpoint model is now action-resolution scoped, but wider mission-card coverage for other multi-input actions still depends on additional Phase 3 follow-up tests
