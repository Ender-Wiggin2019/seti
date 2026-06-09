# Latest Commit Review: Pending Input Freeze Recovery

**Date:** 2026-06-10
**Scope:** latest commit `9d914b5e` (`fix: resolve pending-input freeze and add recovery controls`)
**Mode:** review-and-fix

## Finding

### Fixed: legacy layout did not auto-focus sector inputs

The latest commit added `isSolarSystemInput` and wired it through the V2
layout focus bridge, but the default legacy `GameLayout` still only
auto-jumped alien and planet inputs. Because `useLayoutStore.enabled` defaults
to `false`, a real player on the legacy layout could still be on `cards`,
`tech`, `planets`, or `aliens` when a `SECTOR` / `sector-N` option input
arrived. The top bar would show **Input Required**, but the sector board
hotspots would remain hidden.

Fix:

- `packages/client/src/pages/game/GameLayout.tsx` now reuses
  `isSolarSystemInput` and switches the legacy board tab back to `board` for
  native sector and `sector-N` option inputs.
- Regression tests first failed with activeTab=`cards`, then passed after the
  fix.

## Added Coverage

- Legacy `GameLayout` sector / sector-option pending inputs jump back to
  `board`.
- V2 `getInputFocusSection` routes sector inputs to `solarSystem`.
- TopBar recovery buttons call `resync` and `requestUndo`.
- `wsClient.resync()` emits `game:resync`.
- Gateway `game:resync` re-emits state/pending input to the requester only.
- `projectGameState` exposes `pendingInput` only to the waiting viewer.

## Verified

- `pnpm --filter @seti/client test -- usePlayerInput.test.tsx inputPresentation.test.ts GameLayout.test.tsx layoutHelpers.test.ts wsClient.test.ts`
- `pnpm --filter @seti/server test -- game.gateway.test.ts GameSerializer.test.ts`
- `pnpm --filter @seti/client test` (486 passed)
- `pnpm --filter @seti/server test` (2232 passed)
- `pnpm --filter @ender-seti/common test` (258 passed)
- `pnpm --filter @seti/client typecheck`
- `pnpm --filter @seti/server typecheck`
- `pnpm --filter @ender-seti/common typecheck`
- touched-file `pnpm exec biome check ...`
- `git diff --check`

## Remaining Risk

No known in-scope logic loophole remains for the pending-input recovery
strategy. Browser E2E was not run in this pass.
