# Code Review: Solo E2E Consistency

**Date:** 2026-05-11
**Scope:** Solo Rival client/server changes plus `solo-smoke` / `solo-full-flow` E2E coverage

## Findings

No blocking findings remain after this review.

Fixed during review:

- Image mode dropped `rival.computer.dataPool`; added board data-pool overlay and text/image count assertions.
- Image mode tech overlay used a fixed Probe/Scan/Computer order; moved board-specific Rival tech order to common and reused it from server and client.
- Server Rival planet reward handling ignored `signal` rewards; added planet-sector signal marking and covered it with `RivalTurnController.test.ts`.
- E2E compared image/text DOM to each other but not to server projection; `solo-smoke` now observes real `game:state` and checks both render modes against `gameState.rival`.

## Coverage

- Real UI auth/lobby/game flow: register, create solo room, launch game, log in observer, enter same game.
- Server projection consistency: progress, progress slot, board id, deck counts, current action card, objective ids, completed objectives, objective markers, computer slots, data pool, Rival tech counts.
- Render mode matrix: image-mode board image/marker/card/objective art and text-mode radial cycle/text cards.
- Interaction: rules dialog on both sessions, PASS sync, event hover card consistency, human-only areas excluded from Rival area.

## Verification

- `../../node_modules/.pnpm/node_modules/.bin/vitest run __tests__/features/solo/RivalPanel.test.tsx` - pass, 12 tests.
- `../../node_modules/.pnpm/node_modules/.bin/vitest run __tests__/engine/solo/RivalTurnController.test.ts` - pass, 41 tests.
- `../../node_modules/.pnpm/node_modules/.bin/tsc -p tsconfig.typecheck.json` in `packages/server` - pass.
- `../../node_modules/.pnpm/node_modules/.bin/tsc --noEmit` in `packages/client` - pass.
- `node_modules/.pnpm/node_modules/.bin/tsc -p packages/e2e/tsconfig.json --noEmit` - pass.
- `node_modules/.bin/biome check ...` touched files - pass.
- `git diff --check` - pass.
- `NINJA_ENV=production ./scripts/run-e2e-local.sh tests/solo-smoke.spec.ts` - pass, 1 test.
- `NINJA_ENV=production ./scripts/run-e2e-local.sh tests/solo-full-flow.spec.ts` - pass, 2 tests.

## Residual Risk

- E2E server startup logs still show Vite's Node.js warning for 22.11.0 versus the recommended 22.12+.

## Follow-Up

- Fixed the common typecheck blocker by updating `packages/common/__tests__/rules/planet.test.ts` to call `canLandOnMoon(planetId, planet, player)` and cover the no-moon-planet case.
- `../../node_modules/.pnpm/node_modules/.bin/tsc -p tsconfig.json --noEmit` in `packages/common` now passes.
