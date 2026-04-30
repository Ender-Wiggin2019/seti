# Stream C Action Boundary Test Report

Date: 2026-04-17

Scope:
- `packages/server/__tests__/engine/actions/Scan.test.ts`
- `packages/server/__tests__/engine/actions/AnalyzeData.test.ts`
- `packages/server/__tests__/engine/actions/Pass.test.ts`
- `packages/server/__tests__/engine/freeActions/Movement.test.ts`
- `packages/server/__tests__/engine/freeActions/PlaceData.test.ts`
- `packages/server/__tests__/engine/freeActions/FreeActionCorner.test.ts`

## Fresh evidence

- `Scan.test.ts`: `pnpm --filter @seti/server exec vitest run __tests__/engine/actions/Scan.test.ts`
  - Result: 14 tests passed
  - Newly verified in current file state: `2.4.5`, `2.4.6`, `2.4.8`, `2.4E.2`
- `AnalyzeData.test.ts`: `pnpm --filter @seti/server exec vitest run __tests__/engine/actions/AnalyzeData.test.ts`
  - Result: 17 tests passed
  - Newly added regressions: data pool/stash unchanged, discovery reward, overflow fallback, bottom-row-empty legality, post-analyze immediate place-data, completely-empty computer rejection
- Combined Stream C verification:
  - Command: `pnpm --filter @seti/server exec vitest run __tests__/engine/actions/Scan.test.ts __tests__/engine/actions/AnalyzeData.test.ts __tests__/engine/actions/Pass.test.ts __tests__/engine/freeActions/Movement.test.ts __tests__/engine/freeActions/PlaceData.test.ts __tests__/engine/freeActions/FreeActionCorner.test.ts`
  - Result: 6 files passed, 79 tests passed
- LSP diagnostics:
  - File: `packages/server/__tests__/engine/actions/AnalyzeData.test.ts`
  - Result: 0 errors

## Coverage status

- `Scan`
  - Covered: `2.4.1-2.4.8`, `2.4.10`, `2.4E.1`, `2.4E.2`
  - Open semantic note: `2.4.9` is currently implemented and tested as `overflow into stash`, not direct discard
- `AnalyzeData`
  - Covered: `2.5.1-2.5.8`, `2.5E.1-2.5E.3`
- `Pass`
  - Test file is green, but plan still keeps `2.8.1` and `2.8.4` as explicit follow-up semantics not yet separately locked
- `Movement`
  - Target file is green; still mostly built around a linearized solar-system fixture rather than `Game.create()` end-to-end paths
- `PlaceData`
  - Target file is green; still primarily uses a mocked deck adapter rather than a real deck/game pipeline
- `FreeActionCorner`
  - Target file is green; multi-effect representative coverage remains shallow

## Remaining practical gaps in Stream C

- `Pass`: add a dedicated real-flow `buy card -> pass` regression if the plan still treats `2.8.1` as required
- `Pass`: add an explicit round-5 first-pass rotation/reminder-token assertion for `2.8.4`
- `Movement`: if Phase 3.1 is to be closed strictly against the plan, migrate key path assertions from the linear fixture to a real board/game setup
- `PlaceData`: if Phase 3.2 is to be closed strictly, replace the mocked deck path with at least one `Game.create()` + real `Deck` reward assertion
- `FreeActionCorner`: add more than one representative corner effect if the plan intends to close the “多效果” lane

## Known unrelated blocker

- Repo-wide server type checking is currently blocked by pre-existing `PlayCard.test.ts` `TCardItem.id` errors, so this report relies on targeted vitest runs plus file-level diagnostics for touched work.
