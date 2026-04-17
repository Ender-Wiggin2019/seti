# TODO

## E2E

- [x] Fix stale game-state sync after `LAUNCH_PROBE` in `packages/e2e/tests/smoke-probe-scan.spec.ts`.
  Resolved on 2026-04-17:
  The client websocket layer now retains `game:state` / `game:waiting` /
  `game:event` / `game:error` subscriptions independently from the current
  socket instance and automatically rebinds them when the socket connects late
  or gets replaced.
  Regression coverage:
  `packages/client/__tests__/api/wsClient.test.ts`
  Verification:
  `pnpm --filter @seti/client exec vitest run __tests__/api/wsClient.test.ts`
  `pnpm typecheck` in `packages/client`
  `pnpm exec biome check src/api/wsClient.ts __tests__/api/wsClient.test.ts`
  `pnpm exec playwright test tests/smoke-probe-scan.spec.ts --project=chromium`
