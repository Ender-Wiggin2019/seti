# TODO

## E2E

- Investigate stale game-state sync after `LAUNCH_PROBE` in `packages/e2e/tests/smoke-probe-scan.spec.ts`.
  Fresh evidence from 2026-04-16:
  After `LAUNCH_PROBE`, the server debug state for game `2be4e434-10ef-48bf-94b5-4135a13908b5` showed the action succeeded, host resources dropped to `credit=2`, and `currentPlayerId` handed off to the guest player `e744b098-bab1-4f21-80c5-a2a59c5a5f49`.
  The browser UI stayed on stale pre-launch state, so the smoke test later failed while trying to continue with `SCAN`.
  The tightened smoke now fails earlier at action handoff, which points to a websocket or client state-sync issue rather than a `SCAN` rules bug.
  Next step: trace `game:state` and `game:waiting` delivery/consumption after `LAUNCH_PROBE`, especially game-room join readiness and post-action state updates in the client.
