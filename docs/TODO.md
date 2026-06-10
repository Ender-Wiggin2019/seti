# Todo

- [x] Add a regression test for sector-resolution input handoff: turn owner chooses sector order, trace prompt switches to the sector winner, then the next sector-order prompt switches back to the turn owner.
- [x] Fix input handoff in `Game.processInput` so follow-up inputs are assigned to `nextInput.player`, not implicitly to the responding player.
- [x] Run focused engine tests covering `ResolveSectorCompletion`, `SectorFulfillmentEffect`, and `Game` input chaining.

## Review

- Root cause: `Game.processInput` assumed every follow-up input belongs to the same player who answered the current input. That was false for `resolve sector -> winner marks trace`, and would also break any future cross-player input chain.
- Fix: when `currentInput.process()` returns `nextInput`, assign it to `nextInput.player.waitingFor`; clear the previous holder when ownership changes.
- Coverage added:
  - Generic `Game.processInput` cross-player handoff regression.
  - Real sector-resolution regression where turn owner chooses order, the sector winner marks trace, then control returns to the turn owner.
- Verification:
  - `pnpm --filter @seti/server test -- __tests__/engine/deferred/ResolveSectorCompletion.test.ts __tests__/engine/effects/scan/SectorFulfillmentEffect.test.ts __tests__/engine/Game.test.ts`
