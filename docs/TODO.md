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

## Orbital Dynamics map movement interaction

- [x] Root cause and scope -> Verify: confirm Orbital Dynamics currently exposes legal one-step moves as `SelectOption` ids and the solar board already supports one-step click movement.
- [x] Client regression tests -> Verify: an Orbital Dynamics pending input can be resolved by clicking a legal map target, and clicking an illegal map target does not submit an input response.
- [x] Server regression tests -> Verify: Orbital Dynamics rejects an illegal move option and still prevents moving the same probe twice in one use.
- [x] Implementation -> Verify: clicking Orbital Dynamics opens the board, map highlights only server-provided legal moves, legal clicks answer the pending input, and normal movement remains unchanged.
- [x] Verification -> Verify: targeted client/server tests, relevant typecheck, touched-file Biome checks, and `git diff --check` pass.
- [x] Follow-up no-response bug -> Verify: when the second Orbital Dynamics prompt includes `done`, the board-input hint still exposes a response control instead of trapping the user in a map-only hint.

### Assumptions

- "Click map like normal movement" means the organization power still starts from the free-action button, then the pending move is completed on the solar board by clicking a probe/target space.
- Orbital Dynamics should not spend movement points or use the normal `MOVEMENT` free-action request; it should continue to use the organization pending input because its rule is "up to 2 different probes, 1 step each".
- The safest validation source is the server-generated Orbital Dynamics option list: the client may only submit an option id already present in the pending input, and the server still rejects unknown ids.

### Review

- Root cause: Orbital Dynamics produced legal one-step moves as a generic `SelectOption`, so the client rendered a text option list instead of using the existing solar-board click interaction.
- `SolarSystemView` now recognizes the Orbital Dynamics move prompt, maps only server-provided legal option ids to board targets, submits `OPTION` responses for legal clicks, and blocks fallback to ordinary movement while that prompt is pending.
- `GameLayout` switches to the board tab when Orbital Dynamics power is clicked, and the Orbital Dynamics pending input now shows a board hint instead of the raw `SelectOption` list.
- Server tests now explicitly cover forged move option rejection and ensure a probe moved once is omitted from the second move prompt.
- Follow-up correction: the first pass connected map clicks but left the action dock rendering "Choose an Orbital Dynamics move"; added a `GameLayout` regression so board-resolved inputs do not show the raw option buttons.
- Follow-up correction: the map click path did submit through `GameLayout`, but the second prompt's `done` option was hidden with the raw move options. The board hint now keeps a compact `Done` button while still resolving movement choices on the map.
- Verification passed: `pnpm --filter @seti/client test -- SolarSystemView.test.tsx GameLayout.test.tsx`; `pnpm --filter @seti/server test -- OrganizationTechProbePowers.test.ts`; `pnpm --filter @seti/client typecheck`; `pnpm --filter @seti/server typecheck`; touched-file `biome check`; `git diff --check`.

## Text mode Earth sector and launch alignment

- [x] Root cause and scope -> Verify: trace Earth sector resolution from server state through text-mode solar labels, sector panels, and launched probe rendering.
- [x] Client regression tests -> Verify: after Earth rotates, the Earth text label, launched probe token, Earth-space hotspot, and matching sector panel share the same polar sector in text mode.
- [x] Server regression tests -> Verify: launch resolves to the current Earth space after rotation, and MARK_EARTH marks the sector indexed by the current Earth location.
- [x] Implementation -> Verify: client uses one authoritative current-space coordinate path for text-mode labels/hotspots/tokens and does not apply stale disc offsets.
- [x] Remove legacy snapshot/debug compatibility -> Verify: text-mode no longer derives cells from setup wheels or synthetic space-id coordinates when public `spaceStates` are missing, and the public protocol requires `spaceStates` plus per-space sector coordinates.
- [x] Verification -> Verify: targeted client/server tests, relevant typecheck, touched-file Biome checks, and `git diff --check` pass.

### Assumptions

- The reported issue is text-mode specific, so image-mode art calibration should not be retuned unless a test proves the same data drift there.
- Launch should always place probes on the server's current Earth space; if the token looks elsewhere, the likely client bug is coordinate projection rather than launch rules.
- MARK_EARTH should mark the sector whose wedge contains current Earth, not the original setup sector.

### Review

- Root cause: text-mode hotspots/probes trusted server `spaceStates`, but text-mode Earth/planet labels independently recomputed positions from `setupConfig.wheels` plus disc angles. Any drift between these sources made launches appear away from Earth and made MARK_EARTH look like it belonged to a different sector.
- After merging the latest `origin/feature/server`, `SolarSystemView` now requires the server-projected public `spaceStates` path for text-mode cells; the old setup-wheel/no-state fallback was removed instead of being kept for legacy snapshots/debug data.
- The public solar-system state type now requires `spaceStates`, `elements`, `sectorIndex`, and `cellInSector`; server projection throws if a runtime solar space cannot be projected into that new coordinate contract.
- Client mocks, debug-state builders, and regressions now provide `spaceStates` with `sectorIndex`/`cellInSector`, and a missing-`spaceStates` regression proves the client does not synthesize old text-mode positions from invalid payloads.
- Client regression: a rotated Earth state now proves the Earth label, launched probe token, Earth-space hotspot, and current Earth sector panel share the same polar angle.
- Server regressions prove launch resolves to current Earth space after rotation, and SCAN MARK_EARTH marks the sector indexed by current Earth.
- Verification passed: `pnpm --filter @seti/client test -- SolarSystemView.test.tsx GameLayout.test.tsx`; `pnpm --filter @seti/server test -- LaunchProbe.test.ts Scan.test.ts OrganizationTechProbePowers.test.ts`; `pnpm --filter @seti/client typecheck`; `pnpm --filter @seti/server typecheck`; touched-file `biome check` exited 0 with two pre-existing `LaunchProbe.test.ts` non-null assertion warnings; `git diff --check`.
