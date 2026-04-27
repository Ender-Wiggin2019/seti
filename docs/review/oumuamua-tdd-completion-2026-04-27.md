# Oumuamua TDD Completion Review - 2026-04-27

Scope: `docs/tests/tdd-oumuamua-plan.md`

## Verdict

Overall completion is partial.

- Implementation coverage: about 75%.
- Planned test coverage: about 60%.
- The plan's "current audit" section is stale: `OumuamuaAlienPlugin` and `OumuamuaAlienPlugin.test.ts` now exist.
- The core plugin behavior is in place and targeted tests pass, but several planned integration assertions are missing.

## Verification Run

Passed:

- `pnpm --filter @seti/server test -- OumuamuaAlienPlugin.test.ts`
  - 1 file, 13 tests passed.
- `pnpm --filter @seti/server test -- Scan.test.ts ExchangeResources.test.ts FinalScoring.test.ts ResolveSectorCompletion.test.ts`
  - 4 files, 44 tests passed.
- `pnpm --filter @seti/server typecheck`
  - passed.

Not clean:

- `pnpm --filter @seti/server test`
  - 195 files passed, 2 files failed.
  - 1426 tests passed, 17 tests failed.
  - Failures are in `GameFlowBehavior.test.ts` and `ProbeTechs.test.ts`, not Oumuamua-specific, but they mean the server suite is not globally green.

## Phase Matrix

| Item | Status | Evidence / gap |
| --- | --- | --- |
| OUM-A1 setup places tile in target disc-3 space | Partial | `onDiscover` sets Oumuamua as a dynamic planet and records meta. Test checks planet registration, but does not explicitly assert disc-3 placement. |
| OUM-A2 occupied placement gives +1 publicity | Complete | Covered in `OumuamuaAlienPlugin.test.ts`. |
| OUM-A3 tile data starts at 3 | Complete | Covered in `OumuamuaAlienPlugin.test.ts`. |
| OUM-A4 exofossil supply initialized/tracked | Complete | Supply starts at 20 and repeat completion consumes supply in plugin tests. |
| OUM-B1 marking Oumuamua sector prompts sector/tile choice | Partial | Plugin-level prompt is tested, but `Scan.test.ts` has no Oumuamua integration case. |
| OUM-B2 choosing sector uses normal sector marking/settlement | Partial | Callback exists, but no test selects `oumuamua-sector` and verifies normal sector state. |
| OUM-B3 choosing tile consumes data and records marker | Partial | Direct `markTileSignal` is tested; the actual option selection path is not. |
| OUM-B4 first tile mark reward | Complete | Tested as +1 VP. |
| OUM-B5 third tile mark reward | Complete | Tested as +2 VP. |
| OUM-B6 Oumuamua-specific icon reuses same choice flow | Partial | `desc.et-23` routes through `markByIndexWithAlternatives`, but no card/integration test covers it. |
| OUM-C1 tile completion on last data | Complete | Tested via three tile marks. |
| OUM-C2 each marker owner gains exofossil | Complete | Tested with two players. |
| OUM-C3 no winner/second-place/sectorWinners | Partial | Implementation is independent of `Sector`, but no explicit regression test checks `sectorWinners` is untouched. |
| OUM-C4 completion resets data and markers | Complete | Tested. |
| OUM-C5 repeat completion loop | Complete | Tested with six tile marks. |
| OUM-D1 exofossil-only paid slots | Complete | Tier-1 and tier-6 paid trace slots require/spend exofossils. |
| OUM-D2 exofossil cannot be exchanged | Partial | Exchange implementation only allows credit/energy/card, but `ExchangeResources.test.ts` has no explicit Oumuamua/exofossil assertion. |
| OUM-D3 insufficient exofossil makes mark illegal | Complete | Tested. |
| OUM-D4 leftover exofossil scores 0 | Partial | Final scoring ignores `player.exofossils`, but `FinalScoring.test.ts` has no explicit leftover-exofossil case. |
| OUM-D5 Oumuamua is recognized as planet | Complete | Visit/orbit/land are covered in plugin tests. |
| OUM-D6 visit Oumuamua gives publicity | Complete | Covered in plugin tests. |

## Main Findings

### 1. Signal routing is not consistently Oumuamua-aware

`MarkSectorSignalEffect.markByIndexWithAlternatives` supports the sector/tile branch, but several scan-related paths still call `markByIndex` directly:

- `packages/server/src/engine/effects/scan/ScanEffect.ts:54`
- `packages/server/src/engine/cards/BehaviorExecutor.ts:304`
- `packages/server/src/engine/effects/scan/ScanWithTechsEffect.ts:128`
- `packages/server/src/engine/effects/scan/ScanWithTechsEffect.ts:142`

Also, `markByColor` skips the Oumuamua branch when there is only one matching sector:

- `packages/server/src/engine/effects/scan/MarkSectorSignalEffect.ts:151`

This is the biggest completion risk for OUM-B.

### 2. Planned integration test files were not extended

The plan explicitly names `Scan.test.ts`, `ExchangeResources.test.ts`, and `FinalScoring.test.ts`. Current Oumuamua coverage is concentrated in `OumuamuaAlienPlugin.test.ts`; those three files contain no Oumuamua/exofossil-specific assertions.

### 3. Client visibility is incomplete

`exofossils` is serialized through public player state, but the client resource bar still renders only credit, energy, publicity, and score. This means client/server state is not fully surfaced for the new currency.

## Suggested Next Steps

1. Route all signal-marking entry points that can hit the Oumuamua sector through `markByIndexWithAlternatives` or a single Oumuamua-aware helper.
2. Add the planned integration tests:
   - `Scan.test.ts`: sector/tile choice via real scan flow.
   - `ExchangeResources.test.ts`: exofossil is not accepted as exchange input/output.
   - `FinalScoring.test.ts`: leftover exofossils add 0 VP.
   - `ResolveSectorCompletion.test.ts` or plugin test: Oumuamua completion does not mutate sector winners.
3. Add a client display path for `player.exofossils` where player resources are shown.
4. Fix or quarantine unrelated full-suite failures before declaring the broader server package green.
