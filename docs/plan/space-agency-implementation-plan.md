# Space Agency Implementation Plan

Source: `docs/plan/space-agency-cosmic-hellman.md`
Status: draft, awaiting user confirmation before implementation
Date: 2026-05-14

## Assumptions

- This document is an implementation plan only. No production code should be changed until the plan is confirmed.
- Tasks are executed serially. `SA-N` may start only after `SA-(N-1)` has passed its review gate, but each task may run several subagents in parallel on disjoint file scopes.
- A task is "independent" when it has a bounded scope, its own tests, and a mergeable end state. Some intermediate tasks may expose new contracts behind disabled UI or inactive options, but they must not regress BASE mode.
- `alienModulesEnabled` is migrated directly from `boolean[]` to `Record<EAlienType, boolean>` as confirmed in the architecture plan. Old room rows are handled by a one-time cleanup/reset script or explicit dev data reset, not by long-lived compatibility code.
- Existing `docs/TODO.md` is the project todo file in this repo. This detailed plan is kept under `docs/plan/`.

## Global Definition Of Done

Every implementation task must finish with:

- A red/green test loop for the behavior it changes.
- Focused common/server/client tests for touched contracts.
- `pnpm typecheck` or package-scoped typecheck when the task only touches one package.
- `git diff --check`.
- A review note in `docs/TODO.md` with test evidence and any residual risk.
- No handwritten substitutes for rule/reward icons in client UI. Use existing `DescRender` / `EffectFactory` paths.

## Current Code Facts To Respect

- `IGameOptions` is still locally defined in `packages/server/src/engine/GameOptions.ts` and `packages/client/src/api/types.ts`; common has no `types/protocol/options.ts` yet.
- Lobby routes are mounted under `/lobby/...`; the options update route should follow the existing shape as `PATCH /lobby/rooms/:id/options`.
- `CreateRoomDialog.tsx` already submits core alien toggles with the old `boolean[]` option shape and must be migrated together with the room settings panel.
- Client game pending input currently renders through `GameLayout` and `InputRenderer`; setup choice can wrap/reuse that renderer, but should not invent a parallel input protocol.
- `frontend-reference` confirms the closest reusable front-end patterns are state-name-driven setup transitions in `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/states.js` and optional deck/setup injection in `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/setup.js`; implementation should borrow ideas, not architecture.
- `frontend-reference` assets under `frontend-reference/storage.googleapis.com/cgo-projects/seti/assets` are the preferred visual reference/source when SA UI needs board/card art or placement cues.
- Scan interaction currently uses `ScanActionPool`, `SelectOption`, `FreeActionBar`, and `SPEND_SIGNAL_TOKEN`; there is no existing `ScanModal.tsx`.
- `EAlienType.AMOEBA` and `EAlienType.GLYPHIDS` already exist in `BaseCard.ts`; `ARKHOS` is the missing enum/data/plugin path.
- `spaceAgencyAliens` registers `SA.ET.1`-`SA.ET.20` as generic cards, but the alien deck setup path does not automatically use them for Glyphids/Amoeba.
- Arkhos has the largest data/runtime gap: no enum, common card data, server registry, plugin, board state, projection, or client board.
- Glyph/organelle icon tokens and sprites already exist through `DescRender` / `EffectFactory` / `IconFactory`; new UI should assert those paths instead of drawing replacement icons.
- Existing `engine/event/EventLog` and common protocol events are audit/log output, not a runtime mutation bus. `GameEventBus` should be a new runtime mechanism.
- There is no dedicated `backend-reference` folder in the workspace. The closest in-repo backend reference for corporation-like setup behavior is the current server path around `packages/server/src/engine/corporation/BaseCorporation.ts`, `packages/server/src/engine/corporation/CorporationCard.ts`, and `packages/server/src/engine/GameSetup.ts`.

## Task Template

Every serial task below is intended to be a standalone implementation unit.

- One task should produce one mergeable diff with a bounded scope.
- Internal subagents may run in parallel only on disjoint file scopes.
- If a task introduces a contract used by later tasks, that contract must already be test-covered before the next task starts.
- If a task cannot be verified without later tasks, it is too large and should be split again.

## Serial Task Order

| Done | Task | Gate | Main outcome |
| --- | --- | --- | --- |
| [x] | SA-0 | Planning baseline | Current behavior and test matrix documented. |
| [x] | SA-1 | Option foundation | `IGameOptions` moves to common; lobby options become editable. |
| [x] | SA-2 | Server extension foundation | Round counter, setup role, and event bus land with BASE no-op behavior. |
| [ ] | SA-3 | Setup-choice protocol | `spaceAgencyOptions` and `SETUP_CHOICE` contracts exist, still minimally wired. |
| [ ] | SA-4 | Organization core | Agencies-only SA setup works with simple organizations. |
| [ ] | SA-5 | Complex organizations + Quick Start | All 11 organizations and SR quick start cards resolve. |
| [ ] | SA-6 | New Deck + Signal Token | SA cards are option-gated; signal-token scan branch works. |
| [ ] | SA-7 | Glyphids + Amoeba | Existing SA alien cards become option-gated species plugins. |
| [ ] | SA-8 | Arkhos | Arkhos data, cards, board, and plugin are added. |
| [ ] | SA-9 | Client integration | Full SA game UI is data-driven and localized. |
| [ ] | SA-10 | E2E/release audit | Real flows, docs, and full regression evidence are complete. |

---

## SA-0: Baseline Audit And Test Matrix

Goal: Convert the architecture plan into a concrete work map without touching production behavior.

Scope:

- Audit current common/server/client/e2e entry points against the Space Agency plan.
- Record which existing tests prove BASE behavior before extension work begins.
- Produce a checklist of protocol fields that must stay single-source in common.

Parallel subagents:

- Common/server contracts: inspect `packages/common/src/types/protocol`, `packages/server/src/engine/GameOptions.ts`, `GameSetup.ts`, `IGame.ts`, `IPlayer.ts`, serializer/deserializer DTOs.
- Client/lobby/setup: inspect `GameSettingsPanel.tsx`, `RoomPage.tsx`, `lobbyApi.ts`, `InputRenderer.tsx`, `PlayerDashboard.tsx`, action/free-action components.
- Alien/card data: inspect `spaceAgencyCards`, `spaceAgencyAliens`, `preludeCards`, `CardRegistry`, alien plugins/boards, Arkhos gaps.
- E2E harness: inspect room setup helpers and real-flow tests that can be extended without shortcuts.

Verification:

- Run focused existing tests for options, setup, lobby API/UI, alien registry, and card registry.
- Save evidence in `docs/review/space-agency-baseline-audit-2026-05-14.md`.

Exit criteria:

- A touched-file map exists.
- The team knows which tests are baseline guards for BASE mode.
- No code behavior changed.

---

## SA-1: Common Option Foundation And Editable Lobby

Goal: Make game options a shared contract and make room options mutable before adding SA behavior.

Dependencies: SA-0.

Independent deliverable:

- After this task, room creation and room option editing both use the new shared `IGameOptions` contract, but no SA gameplay path is active.

Scope:

- Add `packages/common/src/types/protocol/options.ts` with `EExpansion`, `IGameOptions`, `ISpaceAgencyOptions`, `TAlienModulesEnabled`, defaults, validation, and helpers.
- Re-export common options from server `packages/server/src/engine/GameOptions.ts`.
- Remove local client `IGameOptions` from `packages/client/src/api/types.ts`.
- Migrate `alienModulesEnabled` to `Record<EAlienType, boolean>` across common/server/client.
- Add lobby option update API at `PATCH /lobby/rooms/:id/options`: controller route, service method, DTO validation, and `lobbyApi.updateRoomOptions`.
- Migrate both `CreateRoomDialog` and `GameSettingsPanel` to the new option shape; make `GameSettingsPanel` actually call `onChange`; add `CoreAlienModulesSection` for the five existing aliens.
- Add a dev cleanup/reset path for old `boolean[]` room options if needed.

Parallel subagents:

- Common contract worker: owns common option types, validation helpers, exports, tests.
- Server lobby worker: owns `GameOptions.ts`, lobby DTO/controller/service tests, create/update room validation.
- Client lobby worker: owns API normalization removal, mutable settings components, lobby tests.
- Migration/test worker: owns cleanup script or documented dev reset plus regression tests for old structure rejection.

Verification:

- `pnpm --filter @ender-seti/common test`
- `pnpm --filter @seti/server test -- GameOptions lobby`
- `pnpm --filter @seti/client test -- lobbyApi GameSettingsPanel`
- Package typechecks for touched packages.

Exit criteria:

- Server and client import `IGameOptions` from common.
- BASE room creation/start still works.
- At least two enabled aliens is enforced on the record shape.
- No Space Agency gameplay is active yet.

---

## SA-2: Server Extension Foundation

Goal: Land the reusable runtime hooks that SA needs while keeping BASE mode behavior equivalent.

Dependencies: SA-1.

Independent deliverable:

- After this task, BASE behavior is unchanged, but the runtime has `ISetupRole`, round counters, and a no-op-capable `GameEventBus` ready for later SA features.

Scope:

- Add `roundIndex` and `maxRounds` to `IGame`, DTOs, serializer/deserializer, public state if needed.
- Add `ISetupRole`; adapt `BaseCorporation` to implement it without changing current setup output.
- Add `GameEventBus` with `subscribe`, `emit`, owner cleanup, priority/order if used.
- Initialize `eventBus` in `Game`.
- Add no-op event emit points to `ResearchTech`, `Scan`, `PlayCard`, `AnalyzeData`, `Orbit`, `Land`, `LaunchProbe`, trace/signal placement paths, and round/turn boundaries.
- Add context patch merging where decisions are server-authored, especially research publicity choices.
- Add BASE no-listener regression tests for every changed action path.

Parallel subagents:

- Round/phase/persistence worker: owns `IGame`, `Game`, DTOs, serializer/deserializer, round tests.
- Setup-role worker: owns `ISetupRole`, `BaseCorporation`, `GameSetup` setup invariants.
- Event-bus worker: owns the new runtime bus implementation and unit tests; it must not reuse `EventLog`.
- Action integration worker: owns emit points and no-listener behavior regressions.

Verification:

- Focused server tests: `GameSetup`, `GameRoundTransition`, `BaseCorporation` setup chain, each changed action test.
- `pnpm --filter @seti/server typecheck`
- `git diff --check`

Exit criteria:

- BASE still starts with publicity 4, four end-of-round stacks, and five rounds.
- With no listeners, every touched action behaves as before.
- Event bus can patch a controlled test context deterministically.

---

## SA-3: Space Agency Option Gate And SETUP_CHOICE Protocol

Goal: Add the SA option and setup-choice protocol surface before organization behavior is wired.

Dependencies: SA-2.

Independent deliverable:

- After this task, lobby/server/protocol can express SA options and `SETUP_CHOICE`, but starting SA still does not require completed organization content.

Scope:

- Add `EExpansion.SPACE_AGENCY` and validation rules for `spaceAgencyOptions`.
- Add `EPhase.SETUP_CHOICE` to common/server phase transition tables.
- Add setup-choice config and context types in common/server.
- Implement `SetupChoiceCoordinator` as a parameterized state machine, unit-tested with fixture candidates and auto-choice cases.
- Add player state fields needed by setup choice: `setupChoiceContext`, future-safe `quickStartCardIds`, and public projection shape.
- Add generic setup-choice PlayerInput models or reuse existing `SelectCard` / `SelectOption` models with explicit metadata.
- Mount setup choice in the existing game pending-input surface, optionally as a modal/sheet wrapper around `InputRenderer`.
- Add `SpaceAgencyOptionsSection` in lobby UI, but keep production agencies/start-card flow hidden or guarded until SA-4 connects real candidates.

Parallel subagents:

- Common/protocol worker: phase/options/setup-choice types and validation tests.
- Server coordinator worker: `SetupChoiceConfig`, coordinator state machine, unit tests with fixture pools.
- Persistence/projection worker: DTO/public state fields and deserialization defaults.
- Client lobby/protocol worker: SA option section, disabled-state logic, tests.

Verification:

- Common validation tests for every option combination.
- Server coordinator tests for canChoose true, canChoose false, auto strategies, invalid picks, all-players-done barrier.
- Client lobby tests for toggle dependencies: SA off disables all, agencies off disables quick start, new alien species off disables new alien toggles.

Exit criteria:

- `spaceAgencyOptions` can be stored and validated.
- `SETUP_CHOICE` is legal in the phase machine.
- Coordinator is proven independently, but real organization selection waits for SA-4.

---

## SA-4: Organization Core And Simple Agencies

Goal: Make agencies-only SA setup playable with the organization runtime and the simple organizations.

Dependencies: SA-3.

Independent deliverable:

- After this task, a game with `agencies=true` can enter setup choice, resolve a selected organization, and start the game with SA round/publicity rules using only the simple agencies.

Scope:

- Add `EOrganizationId`, `IOrganizationData`, and `ORGANIZATIONS` static metadata in common.
- Add `Organization` class, `OrganizationRegistry`, and registration entrypoint.
- Add player runtime fields: `organizations`, `organizationState`, `oncePerRoundUsed`.
- Wire `GameSetup` agencies path: publicity 0, `roundIndex=1`, three end-of-round stacks, setup-choice candidates, resolve selected organization, then enter `AWAIT_MAIN_ACTION`.
- Implement simple config-driven organizations first.
- Add `EFreeAction.USE_ORGANIZATION_POWER`, dispatcher, and once-per-round reset.
- Add minimal client rendering: setup choice modal for organization step, organization badges, and organization power button shell.

Parallel subagents:

- Common metadata worker: owns organization IDs/data/i18n keys and data tests.
- Server organization worker: owns runtime class, registry, setup integration, simple org tests.
- Free-action worker: owns organization power dispatcher and reset tests.
- Client setup/dashboard worker: owns organization selection UI, badges/buttons, focused tests.

Verification:

- Server tests: organization registry, simple organization resolve effects, setup-choice production flow, round/publicity/stacks assertions.
- Client tests: setup modal organization selection, dashboard badges, organization free-action disabled state.
- BASE GameSetup tests rerun.

Exit criteria:

- `spaceAgencyOptions.enabled=true` and `agencies=true` starts a game through real organization selection.
- BASE path remains unchanged.
- Simple organizations are resolved through the same `ISetupRole`/event-bus architecture that complex ones will use.

---

## SA-5: Complex Organizations And Quick Start Cards

Goal: Complete all organization behavior and add SR quick start card setup.

Dependencies: SA-4.

Independent deliverable:

- After this task, all organizations and quick start setup are fully playable without requiring `newDeck` or `newAlienSpecies`.

Scope:

- Implement medium/complex organization subclasses for the remaining organizations.
- Add organization-specific private state under `player.organizationState[organizationId]`.
- Add event listeners for mandatory/passive effects through `GameEventBus`.
- Add `PreludeRegistry` and `PreludeCardRuntime`.
- Implement quick start selection: 3 candidates, pick 2, lower effects then upper effects.
- Add `silent?: boolean` support to board mark APIs so quick start upper effects do not trigger alien/plugin/mission events.
- Add 1-2 player neutral quick-start upper-marker logic.
- Add client quick-start step and thumbnail display, using existing desc/icon renderers.

Parallel subagents:

- Organization group A worker: owns event-driven organizations that do not need custom board state.
- Organization group B worker: owns stateful organizations such as Xenolab/Futurespan/Helion.
- Prelude runtime worker: owns `PreludeRegistry`, `PreludeCardRuntime`, resolve order, silent board API.
- Client quick-start worker: owns setup modal quick-start step and dashboard thumbnails.
- Regression worker: owns event-bus interaction and silent-mode tests.

Verification:

- One unit test per custom organization behavior.
- Quick start runtime tests for lower-before-upper, selected order, silent upper marks, dummy neutral setup.
- Server setup tests for agencies + startResourceCards.
- Client tests for Quick Start Card wording and icon rendering.

Exit criteria:

- All 11 organizations are available.
- Quick start cards reuse `preludeCards` internally and display as "Quick Start Card" only at UI/i18n boundaries.
- Silent setup markers do not fire alien trace hooks or missions.

---

## SA-6: New Deck And Signal Token Scan

Goal: Enable the non-organization SA card deck and signal-token scan mechanic.

Dependencies: SA-3; execute serially after SA-5 to keep one active feature branch.

Independent deliverable:

- After this task, SA cards can be mixed into the main deck behind `newDeck`, and scan can spend signal tokens when the mechanic is enabled, without depending on new alien species.

Scope:

- Gate `spaceAgencyCards` into the main deck only when `spaceAgencyOptions.newDeck` is true.
- Confirm existing SA card registrations are complete and only become reachable through deck setup when enabled.
- Gate the existing `SPEND_SIGNAL_TOKEN` scan branch behind `isSignalTokenMechanicEnabled`.
- Implement scan option to spend signal tokens for one extra revealed card, max two tokens per scan.
- Ensure `isSignalTokenMechanicEnabled` is the single helper used by server and client.
- Add client scan UI in the existing bottom input/free-action rail; do not add a separate scan modal unless the surrounding scan flow is refactored as a separate task.

Parallel subagents:

- Deck worker: owns GameSetup deck composition tests and card registry reachability.
- Scan server worker: owns `ScanActionPool` branch, validation, and event emission.
- Scan client worker: owns existing `FreeActionBar`/input rail behavior and tests.
- E2E worker: extends real scan flow with signal-token case.

Verification:

- Server tests prove SA deck cards are absent when off and present when on.
- Server scan tests prove 0/1/2 token spending, max reveal limit, and invalid overspend rejection.
- Client tests prove option only renders when server offers it.

Exit criteria:

- `newDeck` and signal-token scanning are independently usable without new alien species.
- BASE deck composition is unchanged.

---

## SA-7: Glyphids And Amoeba Species

Goal: Add Glyphids and Amoeba as option-gated alien plugins using existing `SA.ET.1`-`SA.ET.20` card data.

Dependencies: SA-3; execute serially after SA-6.

Independent deliverable:

- After this task, `newAlienSpecies` can expose Glyphids and Amoeba end to end, but Arkhos remains out of scope and absent.

Scope:

- Keep existing `EAlienType.AMOEBA` and `EAlienType.GLYPHIDS` ids stable.
- Add default alien module records and option gating for both species.
- Add common constants for Glyphids and Amoeba UI/runtime state.
- Implement `GlyphidsAlienPlugin` and `AmoebaAlienPlugin`.
- Add `GlyphidsAlienBoard` and `AmoebaAlienBoard`, type guards, serializer/deserializer/public projection support.
- Wire alien deck setup to use `spaceAgencyAliens` card ids for these species instead of generic fallback behavior.
- Add client alien board renderers using actual rule data and existing desc/effect icon rendering.

Parallel subagents:

- Glyphids worker: owns Glyphids board/plugin/cards/state tests.
- Amoeba worker: owns Amoeba board/plugin/cards/state tests.
- Shared projection worker: owns default options/serializer/public state/client switch integration.
- Client board worker: owns Glyphids/Amoeba board components and visual/unit tests.
- Icon-regression worker: owns desc token tests for glyph/organelle rendering through `DescRender` / `EffectFactory`.

Verification:

- Common tests for default option shape and Glyphids/Amoeba constants.
- Server plugin tests for discovery, trace placement, deck injection, round/game-end hooks.
- Client tests for `AlienBoardView` rendering both boards and icon tokens through the existing renderer chain.
- E2E configured-room test proving Glyphids/Amoeba appear only when `newAlienSpecies=true`.

Exit criteria:

- Glyphids and Amoeba are impossible to select when the submodule is off.
- Both species have dedicated runtime state, public projection, and client board UI.
- No Arkhos placeholder behavior is introduced in this task.

---

## SA-8: Arkhos Species

Goal: Add Arkhos as a complete option-gated alien species after the smaller new-species path is proven.

Dependencies: SA-7.

Independent deliverable:

- After this task, all three SA alien species are implemented, and Arkhos no longer requires placeholders or TODO-only wiring.

Scope:

- Add `EAlienType.ARKHOS` and lobby/default option records.
- Add `packages/common/src/data/arkhosCards.ts` for exploration/security cards and export it.
- Register Arkhos cards in the server card registry.
- Add Arkhos constants and public-state types for exploration deck, security cards, access level, and any solo/rival state required by the rules.
- Implement `ArkhosAlienPlugin` and `ArkhosAlienBoard`.
- Add serializer/deserializer/public projection support.
- Add client Arkhos board renderer using actual rule data and existing icon rendering.

Parallel subagents:

- Common data worker: owns enum, constants, Arkhos card data, exports, and tests.
- Server card worker: owns Arkhos card registry and card lifecycle tests.
- Arkhos plugin worker: owns discovery, exploration deck, security cards, access-level lifecycle, and scoring tests.
- Projection worker: owns board DTO/public state/deserialization tests.
- Client board worker: owns Arkhos renderer and unit/visual tests.

Verification:

- Common Arkhos data and enum/default option tests.
- Server plugin tests for discovery, exploration deck reset, security card breach/hand/used state, and endgame behavior.
- Client tests for Arkhos board rendering.
- Focused E2E configured-room test proving Arkhos appears only when `newAlienSpecies=true`.

Exit criteria:

- Arkhos has no generic placeholder path.
- Arkhos cards, board state, projection, and client board are all wired.
- Glyphids/Amoeba behavior from SA-7 remains green.

---

## SA-9: Client Integration, I18n, And UX Completion

Goal: Make the full SA flow usable from lobby through game UI without client-side rule drift.

Dependencies: SA-8.

Independent deliverable:

- After this task, all SA server features already built in SA-1 through SA-8 are fully operable through production UI with final wording, state projection, and accessibility polish.

Scope:

- Complete `SpaceAgencyOptionsSection` and `CoreAlienModulesSection` polish.
- Complete setup choice UI as a three-step flow: organization, quick start, main deck preview/confirm. Prefer a modal/sheet wrapper around the existing pending-input renderer instead of a separate response path.
- Render organization arrays in player dashboard and opponent summaries.
- Render multiple organization power buttons when future multi-organization config is used.
- Render quick-start thumbnails and all SA text through common/i18n.
- Ensure client never recomputes mandatory server choices such as patched publicity options; it renders server-provided input options only.
- Add responsive and accessibility checks for setup modal, lobby settings, dashboard badges, scan option, and alien boards.

Parallel subagents:

- Lobby UX worker: owns lobby option sections and tests.
- Setup modal worker: owns setup choice flow and input submission tests.
- Dashboard/free-action worker: owns organization/quick-start dashboard integration.
- Alien/scan UI worker: owns new alien boards and signal-token scan UI polish.
- I18n/a11y worker: owns common locale files, label coverage, and accessibility assertions.

Verification:

- Client focused tests for every new component.
- Browser smoke against a local game page for layout/console errors.
- No visible handcrafted rule icons; icon-like rules come from `DescRender` / `EffectFactory`.

Exit criteria:

- A user can configure SA in lobby and complete setup through real UI.
- UI state is derived from server/public game state.

---

## SA-10: E2E, Documentation, And Release Audit

Goal: Prove the expansion works end to end and record release-quality evidence.

Dependencies: SA-9.

Independent deliverable:

- After this task, the branch has release-quality evidence for BASE and SA flows, plus final architecture/documentation updates.

Scope:

- Add real-flow Playwright specs:
  - `space-agency-setup.spec.ts`
  - `space-agency-organization-power.spec.ts`
  - `space-agency-new-aliens.spec.ts`
  - `space-agency-event-bus.spec.ts`
- Update docs with final architecture notes and any deviations from `space-agency-cosmic-hellman.md`.
- Run full package tests, typecheck, build, and focused E2E.
- Run a BASE real-flow regression: five rounds, publicity 4, four end-of-round stacks.
- Run an SA real-flow regression: agencies + quick start starts at round 2, publicity 0, three stacks, four played rounds.
- Record all evidence and residual risks in `docs/TODO.md`.

Parallel subagents:

- Setup E2E worker: owns lobby-to-setup-to-game real flow.
- Organization E2E worker: owns event-bus and once-per-round power cases.
- Alien E2E worker: owns new species selection/discovery/render cases.
- Regression worker: owns BASE real-flow and full test/typecheck/build evidence.
- Docs worker: owns final docs and review summary.

Verification:

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm --filter @seti/e2e test`
- Browser smoke screenshots for the main SA setup/game surfaces.

Exit criteria:

- BASE and SA flows both have concrete passing evidence.
- The final review section lists exact commands and outcomes.
- Any residual risk is explicit and scoped to a follow-up task.

## Subagent Operating Rule

For each task, the lead agent should first split ownership by file path. Workers must be told that they are not alone in the codebase, must not revert edits made by others, and must adapt their work to existing concurrent changes. If two workers need the same file, the lead keeps that file local or serializes those edits.
