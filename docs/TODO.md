# TODO

## Durable player input recovery

- [x] Root cause and input inventory -> Verify: enumerate all `PlayerInput` classes and resolution-time construction sites, separating model shape from continuation behavior.
- [x] Persistence contract design -> Verify: define a versioned, serializable pending-input snapshot that can round-trip through `serializeGame` / `deserializeGame` without closure state.
- [x] Regression tests -> Verify: cold-load after pending Research Tech and chained follow-up prompts restores an actionable `waitingFor` and accepts the restored response.
- [x] Engine implementation -> Verify: pending resolution uses a versioned operation journal so closures are rebuilt by replaying from an explicit base state.
- [x] Gateway/client consistency -> Verify: manager snapshots carry the journal before persistence, and the client no longer clears a still-active prompt solely because an `IN_RESOLUTION` `game:state` arrives.
- [x] Verification -> Verify: targeted serializer/gateway/input tests, server/client typecheck, touched-file Biome checks, and `git diff --check` pass.

### Assumptions

- This is a systemic engine persistence bug, not a TECH-only UI rendering bug.
- The durable fix should make pending input part of game state in a versioned data contract; closures remain runtime-only and must be rebuilt from explicit state.
- Any input that cannot be resumed from explicit state should fail loudly in tests/design rather than silently producing an `IN_RESOLUTION` game with no prompt.

### Review

- Root cause: snapshots preserved `IN_RESOLUTION` but intentionally dropped `player.waitingFor`; after cache miss/server restart, the game could reload into resolution with no prompt.
- Added `pendingResolution` journal snapshots: manager captures a stable base state before a main/free/input step, records user steps while any prompt remains pending, and serializer/deserializer replay that journal to rebuild runtime closures and `waitingFor`.
- Covered Research Tech cold-load recovery and chained follow-up prompt recovery through `GameDeserializer` / `GameManager` tests.
- Client `usePlayerInput` now preserves an existing prompt across `IN_RESOLUTION` / setup state updates instead of briefly clearing it before `game:waiting`.
- Verification passed: `pnpm --filter @seti/server test -- GameDeserializer.test.ts GameManager.test.ts`; `pnpm --filter @seti/client test -- usePlayerInput.test.tsx`; `pnpm --filter @seti/server typecheck`; `pnpm --filter @seti/client typecheck`; touched-file `biome check`; `git diff --check`.

## Space Agency mission-like organization triggers

- [x] Root cause and scope -> Verify: confirm setup ordering, mission tracker behavior, organization state shape, and client projections before changing code.
- [x] Setup order regression -> Verify: a Space Agency setup test proves selected quick start/start resource cards resolve before organization setup tucks, and setup tuck candidates include cards gained before the tuck chain.
- [x] Organization trigger regressions -> Verify: Cosmos and Helion markable rewards become mission-like newly available organization free actions instead of immediately granting rewards; they do not move organization cards into `completedMissions`.
- [x] Organization free action implementation -> Verify: using the organization free action claims one marked reward or clears/reset marks through the organization state so the same mark can be earned again later.
- [x] Public state and free-action highlighting -> Verify: public player state exposes current-turn newly available free actions and the client highlights only actions newly added this turn.
- [x] Text mode organization rendering -> Verify: text mode shows organization reward markers/free-action state for Cosmos and Helion, including available/marked/used status without replacing rule icons with ad hoc graphics.
- [x] Verification -> Verify: targeted server tests, client tests, typecheck, and `git diff --check` pass.

### Assumptions

- "Start resource card" means the Space Agency quick start/start resource card path implemented by `PreludeCardRuntime`, not a separate card type.
- Cosmos and Helion organization marks should follow the mission UX pattern for availability, but their completion remains organization-local: no mission card moves to `completedMissions`.
- "Current turn新增 free action" should be computed from server/public state using `turnIndex`; client-only state diff is a fallback only if the server already has enough durable state.

### Review

- Setup order was already correct in `GameSetup`; added a regression that proves quick start/start resource cards resolve before organization setup tucks, including tuck candidates drawn before the tuck chain.
- Cosmos and Helion organization powers are now gated by their organization-local marks, so their free actions appear only after a qualifying trigger and clear marks through organization state on use.
- Free action UI now highlights actions and organization powers that become newly available during the same `turnIndex`; text mode organization cards render Cosmos/Helion reward marks from `organizationState`.
- Verification passed: `pnpm --filter @seti/server test -- GameSetup.test.ts OrganizationCardPowers.test.ts OrganizationTechProbePowers.test.ts`; `pnpm --filter @seti/client test -- FreeActionBar.test.tsx PlayerDashboard.test.tsx`; `pnpm --filter @seti/server typecheck`; `pnpm --filter @seti/client typecheck`; touched-file `biome check`; `git diff --check`.

## Client game settings sync

- [x] Root cause and scope -> Verify: create-room and room-page settings data flow is identified, with no server-only assumption.
- [x] Regression test -> Verify: `CreateRoomDialog` exposes Space Agency options and submits valid `spaceAgencyOptions` before entering a room.
- [x] Shared settings editor -> Verify: create-room and room-page editable settings use one client component/patch path for reusable game option controls.
- [x] DTO sync guard -> Verify: create-room options DTO accepts existing solo fields under strict whitelist validation.
- [x] Verification -> Verify: targeted client/server tests and typecheck pass.

### Assumptions

- Server already accepts `spaceAgencyOptions` on room creation through `CreateRoomDto` and normalizes them with `createGameOptions`.
- The minimal maintainable client fix is to centralize editable option controls in one component, then reuse it from both create-room and room-page settings instead of duplicating UI code.

### Review

- Added a shared `GameOptionsEditor` and `applyGameOptionsPatch` client helper so create-room and room-page editable settings share the same option controls and nested patch merge path.
- `CreateRoomDialog` now stores full `IGameOptions`, exposes Space Agency options before room creation, and submits normalized options through common `createGameOptions`.
- `CreateRoomOptionsDto` and `UpdateRoomOptionsDto` now include `isSoloMode` and `soloDifficulty`, matching the options payload already submitted by the client.
- Verification passed: `pnpm --filter @seti/client test -- CreateRoomDialog.test.tsx GameSettingsPanel.editable.test.tsx GameSettingsPanel.test.tsx`; `pnpm --filter @seti/server test -- CreateRoomDto.test.ts`; `pnpm --filter @seti/client typecheck`; `pnpm --filter @seti/server typecheck`; touched-file `biome check`; `git diff --check`.

## Player input rendering cleanup

- [x] Root cause and scope -> Verify: identify which player-input branches render tech/cards outside compact/shared render paths.
- [x] Regression tests -> Verify: pending tech input uses compact controls in the action dock, and quick-start card options expose shared card render test ids.
- [x] Implementation -> Verify: top player input uses `InputRenderer`; tech-id options render as compact selectable tiles; card previews go through shared `CardRender`.
- [x] Verification -> Verify: targeted client tests and typecheck pass.
- [x] Prelude text-mode refinement -> Verify: prelude image mode uses maintained `@seti/cards/PreludeCard`, while client text mode uses a dedicated prelude text renderer through `CardRender`.
- [x] Tech bonus refinement -> Verify: compact player-input tech choices show first 2VP status and printed back bonuses from the public tech board stack.

### Assumptions

- The full `TechBoardView` remains appropriate for the Tech board tab, but not inside the top pending-input dock.
- Player-input card displays should route through the client card render wrapper so base cards and prelude cards share one entry point.

### Review

- Root cause: `GameLayout` intercepted pending tech inputs and rendered full `TechBoardView` inside the action dock; quick-start card player input used `QuickStartCardPreview` with hand-built effect rendering instead of the shared client `CardRender`.
- Implemented compact tech-id option controls in `InputRenderer`, kept full `TechBoardView` for the board tab, and routed quick-start/prelude card previews through `CardRender`.
- Corrected prelude handling after review: image mode now continues to use the maintained `@seti/cards/PreludeCard`; text mode uses `PreludeTextCard` through the same client `CardRender` switch.
- Compact tech-id player inputs now receive the public tech board stack, reuse the same bonus icon/label metadata as `TechStack`, and show first-take 2VP plus the current top-tile printed bonus.
- Verification passed: focused input/layout/card-render tests, quick-start dashboard test, client typecheck, touched-file Biome check, and `git diff --check`.
