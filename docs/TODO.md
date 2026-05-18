# TODO

## Uncommitted Space Agency diff review - 2026-05-18

Assumptions:
- Scope is the current staged diff on `feature/server`, centered on the Space
  Agency expansion slice plus its supporting documentation/build fixes.
- The review is `review-and-fix`, not read-only: in-scope critical/warning
  findings should be corrected with focused regression coverage.
- “100% confidence” means no known in-scope loopholes remain after rule review,
  diff re-review, and passing checks that exercise the reviewed contracts; if
  any blocker prevents factual certainty, it must be named precisely.

Success criteria:
- Common/server/client/e2e changes agree on the Space Agency public contract,
  including enabled aliens, public state, serialization, action routing, and UI
  rendering.
- New alien/card/organization behavior matches the rule documents or an explicit
  source-backed design note, with edge-case tests for any discovered gap.
- The confidence loop includes a second-pass diff review after fixes plus
  targeted checks for every touched package and broader checks when the blast
  radius requires them.
- Any residual risk is explicit instead of hidden behind a confidence claim.

Plan:
- [x] Review the staged diff against rules, architecture, and the existing
  completion audit; identify concrete loopholes before editing behavior.
- [x] Add failing regression coverage for each confirmed behavioral gap, then
  implement the smallest in-scope fixes.
- [x] Re-review the updated diff for client/server mismatch, serialization loss,
  stale tests, and false-positive tests; close any remaining holes.
- [x] Run focused checks for touched packages, then the smallest broader checks
  needed to support factual confidence.
- [x] Record review evidence and remaining risk, if any.

Review:
- Confirmed one Space Agency rules bug during the first pass:
  `AmoebaAlienPlugin.onDiscover()` dealt one extra card per discoverer after
  generic discovery-slot resolution had already dealt one card per marker.
  Added a red regression in
  `packages/server/__tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts`
  (`expected ... to have a length of 2 but got 3` before the fix), then removed
  the duplicate draw loop from
  `packages/server/src/engine/alien/plugins/AmoebaAlienPlugin.ts`.
- The second pass found one staged-diff stale-test gap:
  `room-configured-flow.spec.ts` still treated the lobby alien-module row as one
  switch after the new core-module UI rendered five switches. Updated the
  assertion to verify the two enabled core switches instead of relying on a
  singular locator. Its focused rerun now gets past that strict-locator failure
  and later times out in the pre-existing end-of-round prompt resolver path.
- Second-pass review after the fixes did not find another confirmed in-scope
  Space Agency behavioral gap across common/server/client/e2e contracts,
  serializer/deserializer projection, action routing, or rendered SA surfaces.
- Success-criterion audit:
  - Common/server/client/e2e contract agreement was rechecked through the
    staged diff plus focused common/server/client/e2e suites below.
  - The only newly confirmed rule mismatch was the Amoeba double deal; it now
    has a rule-backed red/green regression.
  - The confidence loop included a second-pass diff review, focused package
    checks, targeted Space Agency E2E, and a clean sequential repo-level
    `corepack pnpm test` attempt after clearing stale harness processes.
  - Residual risk remains explicit below instead of being hidden behind a
    completion claim.
- Verification passed:
  `pnpm --filter @seti/server test --
  __tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts`;
  `pnpm exec biome check
  packages/server/src/engine/alien/plugins/AmoebaAlienPlugin.ts
  packages/server/__tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts`;
  `pnpm --filter @seti/server typecheck`; focused server verification for
  `SpaceAgencyAlienPlugins`, `GameSetup`, `GameSerializer`,
  `GameDeserializer`, and `RivalTurnController` (160 tests); focused common
  verification for Space Agency organization/options/alien/rival data (28
  tests); focused client verification for the touched Space Agency UI surfaces
  (52 tests); `pnpm --filter @seti/e2e typecheck`; focused Space Agency E2E
  bundle for options/setup/agencies/organization-power/new-aliens/event-bus (6
  passed); `corepack pnpm typecheck`; `corepack pnpm build`; `git diff --check`;
  `pnpm exec biome check packages/e2e/tests/room-configured-flow.spec.ts`.
- Broader verification attempted:
  after clearing stale prior E2E harnesses, clean sequential `corepack pnpm
  test` reached the full E2E suite and failed with `62 passed, 8 failed`.
  Failures were:
  `centaurians-real-flow.spec.ts`,
  `debug-replay.spec.ts`,
  two cases in `debug-snapshot-replay.spec.ts`,
  `free-action-complete-mission.spec.ts`,
  `oumuamua-real-flow.spec.ts`,
  `room-configured-flow.spec.ts`, and `room-multiplayer.spec.ts`.
  A focused rerun of `room-configured-flow.spec.ts` after the stale-locator fix
  failed later in `helpers/prompt-resolvers.ts` while resolving an end-of-round
  card prompt.
- Residual risk:
  - Whole-branch release confidence is not factual while the eight broader E2E
    failures above remain open.
  - Existing source blockers still prevent claiming Space Agency feature
    completion: Glyphids reward payload/refill data, Amoeba organelle reward
    payloads and full `SA.ET.19` payout, Arkhos human exploration effect data,
    and broader SA-10 browser/release evidence.

## Space Agency organization event-bus E2E coverage - 2026-05-17

Assumptions:
- This slice adds SA-10 real-flow evidence for one organization runtime event
  subscription through production UI.
- Sentinel Probe Network is the narrowest source-backed event-bus target:
  `PROBE_LAUNCHED` should mark a signal in the launched probe's sector.
- The test may use a deterministic room seed through the normal room-create
  request and a bounded retry fallback, but must not use debug endpoints, mocked
  server behavior, raw websocket driving, or hidden state inspection.

Success criteria:
- A real-flow E2E selects Sentinel Probe Network from the normal setup-choice UI.
- The owning player launches a probe through the normal action menu.
- The sector signal marker appears in the production board renderer for both
  players after the launch.
- Focused E2E, E2E typecheck, Biome on touched E2E files, and `git diff
  --check` pass or any blocker is recorded.

Plan:
- [x] Add this implementation checklist.
- [x] Add the real-flow Playwright spec.
- [x] Run focused E2E and E2E typecheck/format checks.
- [x] Record review evidence.

Review:
- Added `packages/e2e/tests/space-agency-event-bus.spec.ts`.
- The spec uses UI registration, UI room creation, host Space Agency option
  switches, UI room join/start, setup-choice organization selection, a normal
  `LAUNCH_PROBE` main action, and production sector signal rendering to prove
  Sentinel Probe Network's `PROBE_LAUNCHED` event path.
- Tightened seeded room creation in `packages/e2e/helpers/room-flow.ts` by
  routing at browser-context scope and asserting the seed rewrite was actually
  applied. The event-bus seed was searched against the create-room UI's real
  default two-core-alien pool, not the all-core-alien setup used by the Amoeba
  reveal spec.
- Verification passed: `pnpm exec biome check packages/e2e/helpers/room-flow.ts
  packages/e2e/tests/space-agency-event-bus.spec.ts`; `pnpm --filter @seti/e2e
  typecheck`; `pnpm --filter @seti/e2e test --
  tests/space-agency-event-bus.spec.ts`; `pnpm --filter @seti/e2e test --
  tests/space-agency-options.spec.ts tests/space-agency-agencies-setup.spec.ts
  tests/space-agency-organization-power.spec.ts
  tests/space-agency-new-aliens.spec.ts
  tests/space-agency-event-bus.spec.ts`.

## Space Agency new alien board E2E coverage - 2026-05-17

Assumptions:
- This slice adds SA-10 real-flow evidence that a Space Agency alien selected by
  game setup can be revealed and rendered through the production game UI.
- The spec can use a deterministic room seed only by rewriting the normal UI
  room-create request; it must not use debug endpoints, mocked server behavior,
  raw websocket driving, or hidden state inspection.
- The test should prove a specific new alien renderer is visible after real
  card plays and trace-choice prompts, not just prove lobby toggles exist.

Success criteria:
- A real-flow E2E enables Space Agency new alien species through room settings.
- The game starts from the normal lobby/room UI and reveals Amoeba by playing
  real red/yellow/blue trace cards from real dealt hands.
- The Amoeba board renderer becomes visible for both players after discovery.
- Focused E2E, E2E typecheck, Biome on touched E2E files, and `git diff
  --check` pass or any blocker is recorded.

Plan:
- [x] Add this implementation checklist.
- [x] Add the real-flow Playwright spec.
- [x] Run focused E2E and E2E typecheck/format checks.
- [x] Record review evidence.

Review:
- Added `packages/e2e/tests/space-agency-new-aliens.spec.ts`.
- The spec uses UI registration, UI room creation with all core aliens enabled, host Space Agency new-alien option switches, UI room join/start, real card plays, real trace-choice prompts, and normal turn flow to reveal Amoeba through the production alien board renderer.
- Initial attempts exposed two useful boundaries: cards `98`/`99`/`100` only duplicate existing same-color traces, so they cannot start discovery; and the create-room dialog defaults to only two core aliens enabled, so the deterministic seed had to explicitly select all five core aliens through the real create-room UI before enabling the Space Agency species.
- Verification passed: `pnpm exec biome check packages/e2e/tests/space-agency-new-aliens.spec.ts`; `pnpm --filter @seti/e2e typecheck`; `pnpm --filter @seti/e2e test -- tests/space-agency-new-aliens.spec.ts`; `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts tests/space-agency-agencies-setup.spec.ts tests/space-agency-organization-power.spec.ts tests/space-agency-new-aliens.spec.ts`.

## Space Agency organization power E2E coverage - 2026-05-17

Assumptions:
- This slice adds SA-10 real-flow evidence for one implemented organization
  power through the production setup and game UI.
- The spec should choose an immediately usable organization power from the real
  setup candidates instead of depending on debug state or raw websocket control.
- The spec must use real UI registration, room setup, setup-choice selection,
  free-action click, and main-action click. It must not use debug endpoints,
  mocked network, or raw websocket driving.

Success criteria:
- A real-flow E2E chooses an immediately usable organization power during
  Space Agency setup.
- The owning player can click the selected organization power through the
  free-action bar and sees it become unavailable for the round.
- The game remains usable after the organization power with normal main-action
  availability still visible through the same real UI flow.
- Focused E2E, E2E typecheck, Biome on touched E2E files, and `git diff
  --check` pass or any blocker is recorded.

Plan:
- [x] Add this implementation checklist.
- [x] Add the real-flow Playwright spec.
- [x] Run focused E2E and E2E typecheck/format checks.
- [x] Record review evidence.

Review:
- Added `packages/e2e/tests/space-agency-organization-power.spec.ts`.
- The spec uses UI registration, UI room creation, host Space Agency option switches, UI room join/start, setup-choice organization selection, real setup card-prompt resolution, free-action organization power click, and a normal main-action follow-up.
- Initial attempts exposed two E2E design issues: seed rewriting through Playwright routing did not reliably affect the server setup candidates, and setup can produce card-tuck prompts before main actions become available. The final spec avoids seed dependence by retrying real setup attempts until either player is dealt an immediately usable organization power, and it drains real card prompts on both pages before asserting action availability.
- A later combined run exposed a flake from assuming `LAUNCH_PROBE` is always enabled after setup. The spec now synchronizes on an active `PASS` turn for the organization-power owner and asserts normal main-action availability after the power is used.
- Verification passed: `pnpm exec biome check packages/e2e/tests/space-agency-organization-power.spec.ts`; `pnpm --filter @seti/e2e typecheck`; `pnpm --filter @seti/e2e test -- tests/space-agency-organization-power.spec.ts`; `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts tests/space-agency-agencies-setup.spec.ts tests/space-agency-organization-power.spec.ts`; `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts tests/space-agency-agencies-setup.spec.ts tests/space-agency-organization-power.spec.ts tests/space-agency-new-aliens.spec.ts`.

## Space Agency completion audit evidence refresh - 2026-05-17

Assumptions:
- This slice updates documentation only; it does not mark SA-10 complete.
- Repo-level `typecheck` and `build` evidence should be recorded now that both
  gates have passed after the latest fixes.
- Full `pnpm test`, full E2E, and browser smoke evidence remain separate
  release gates.

Success criteria:
- The completion audit no longer says full typecheck/build evidence is missing.
- The audit still calls out missing full tests, full E2E, browser smoke, and
  source-blocked alien reward payloads.
- Documentation whitespace and `git diff --check` pass.

Plan:
- [x] Add this audit-refresh checklist.
- [x] Update the completion audit evidence and blocker wording.
- [x] Run documentation whitespace and diff checks.
- [x] Record review evidence.

Review:
- Updated `docs/review/space-agency-organization-aliens-completion-audit-2026-05-17.md` to record the now-passing repo-level `corepack pnpm typecheck` and `corepack pnpm build` gates, plus focused Space Agency E2E/typecheck evidence.
- Kept the audit status as not complete: full `pnpm test`, full E2E, browser smoke, and source-blocked Glyphids/Amoeba/Arkhos reward payload execution remain open.
- Verification passed: documentation trailing-whitespace check found no matches; `git diff --check` passed.

## Space Agency server build test import fix - 2026-05-17

Assumptions:
- This slice fixes the next repo-level build failure after the asset sync race
  was removed.
- Server build currently compiles tests, so test imports must also be valid
  under the server build's NodeNext resolution.
- The fix should not change card registry or database reset behavior.

Success criteria:
- `corepack pnpm build` fails before the fix on server test imports.
- Server test imports resolve under `tsc -p tsconfig.json`.
- Focused server build and repo-level build pass, or any remaining failure is
  recorded exactly.
- Biome on touched tests and `git diff --check` pass.

Plan:
- [x] Capture the server build import failures.
- [x] Fix the two build-unsafe test imports.
- [x] Run focused server build and repo-level build.
- [x] Record review evidence.

Review:
- `corepack pnpm build` progressed past the asset sync race and then failed on server NodeNext import resolution in server tests/scripts.
- Updated server test imports to use build-safe package/export paths and `.js` extensions where required by NodeNext: `CardRegistry.test.ts`, `resetE2eDatabase.test.ts`, and the server database script imports under `packages/server/scripts`.
- Verification passed: `corepack pnpm --filter @seti/server build`; `corepack pnpm build` across all build tasks. The repo-level build emitted only existing large bundle/page-data warnings.

## Space Agency build asset sync race fix - 2026-05-17

Assumptions:
- This slice fixes the repo-level build failure exposed by parallel Turbo
  builds; it does not change card assets or generated build output.
- Both `@seti/client` and `@seti/web` run the same sync script, so the script
  must be safe when invoked concurrently.
- A simple repo-local directory lock is sufficient for local/CI shell builds.

Success criteria:
- `corepack pnpm build` fails before the fix with `rm: ... seti-assets:
  Directory not empty` from concurrent asset sync.
- `scripts/sync-card-assets.sh` serializes concurrent sync runs.
- `corepack pnpm build` passes after the fix, or any remaining failure is
  recorded exactly.
- Shell script syntax check and `git diff --check` pass.

Plan:
- [x] Capture the repo-level build failure.
- [x] Add a minimal lock around asset syncing.
- [x] Run shell syntax check and repo-level build.
- [x] Record review evidence.

Review:
- `corepack pnpm build` failed before the fix when parallel client/web builds invoked `scripts/sync-card-assets.sh` at the same time and one sync observed `rm: ... seti-assets: Directory not empty`.
- Added a repo-local directory lock around the existing asset sync loop so concurrent Turbo tasks serialize the destructive copy step without changing source or target asset contents.
- Verification passed: `bash -n scripts/sync-card-assets.sh`; `corepack pnpm build` across all build tasks. The repo-level build emitted only existing large bundle/page-data warnings.

## Space Agency web Arkhos color typecheck fix - 2026-05-17

Assumptions:
- This slice fixes the repo-level typecheck failure exposed after adding Arkhos
  to the common alien enum.
- `packages/web` should use the same Arkhos alien color as common unless a
  separate web design requirement exists.
- No runtime behavior beyond completing the color map is changed.

Success criteria:
- `corepack pnpm typecheck` fails before the fix with missing
  `[EAlienType.ARKHOS]` in `packages/web/src/constant/color.ts`.
- The web alien color map includes Arkhos.
- Focused web typecheck and repo-level typecheck pass, or any remaining
  failure is recorded with exact evidence.
- Biome on the touched web file and `git diff --check` pass.

Plan:
- [x] Capture the repo-level typecheck failure.
- [x] Add the missing Arkhos color mapping.
- [x] Run focused and repo-level typechecks plus formatting/diff checks.
- [x] Record review evidence.

Review:
- `corepack pnpm typecheck` failed before the fix because `packages/web/src/constant/color.ts` was missing `[EAlienType.ARKHOS]` in `EAlienColor`.
- Added the Arkhos color mapping using the same value as common: `#02adc4`.
- Verification passed: `corepack pnpm --filter @seti/web typecheck`; `pnpm exec biome check packages/web/src/constant/color.ts`; `corepack pnpm typecheck` across all 6 packages; final whitespace and `git diff --check`.

## Space Agency E2E typecheck coverage - 2026-05-17

Assumptions:
- This slice improves verification only; it does not change runtime behavior.
- The E2E package already has `tsconfig.json`, so the smallest fix is a
  package-local `typecheck` script and local TypeScript dev dependency.
- Root `pnpm typecheck` should include E2E once the package exposes a
  `typecheck` script through Turbo.

Success criteria:
- Before the fix, `pnpm --filter @seti/e2e typecheck` does not typecheck the
  package.
- After the fix, `pnpm --filter @seti/e2e typecheck` runs `tsc` against
  `packages/e2e/tsconfig.json`.
- Lockfile/package metadata remains consistent.
- Focused E2E typecheck, Biome on touched package metadata if applicable, and
  `git diff --check` pass.

Plan:
- [x] Confirm the E2E package currently has no effective typecheck script.
- [x] Add the minimal E2E typecheck script and TypeScript dev dependency.
- [x] Run focused E2E typecheck and metadata/diff checks.
- [x] Record review evidence.

Review:
- Confirmed the pre-fix command `pnpm --filter @seti/e2e typecheck` printed `None of the selected packages has a "typecheck" script`, so it did not verify the E2E TypeScript sources.
- Added `typecheck: "tsc -p tsconfig.json --noEmit"` and a local `typescript` dev dependency to `packages/e2e/package.json`; added the matching scoped importer entry in `pnpm-lock.yaml`.
- Regenerated workspace links with `corepack pnpm install --filter @seti/e2e --ignore-scripts`. An initial pnpm 9 lockfile update produced unrelated churn, so only that generated lockfile diff was reverted and replaced with the minimal E2E importer entry.
- Verification passed: `pnpm --filter @seti/e2e typecheck`; `corepack pnpm exec turbo run typecheck --filter=@seti/e2e`; `pnpm exec biome check packages/e2e/package.json pnpm-lock.yaml` processed package metadata successfully; `git diff --check` passed after final whitespace checks.

## Space Agency E2E alien enum consistency - 2026-05-17

Assumptions:
- This slice fixes E2E expectations only; common/server enum values are already
  authoritative.
- The failure should remain a real configured-room flow, not a mocked unit test.
- `ARKHOS` must be represented as alien type `8` and `DUMMY` as `9` in E2E
  helpers/expected room option flags.

Success criteria:
- The existing configured alien pool E2E fails before the helper fix for the
  stale enum expectation.
- E2E helper enum and expected option flags match the current common alien enum.
- The focused configured alien pool E2E passes after the fix.
- Biome on touched E2E files, whitespace checks, and `git diff --check` pass.

Plan:
- [x] Run the existing configured alien pool E2E and capture the stale enum
  failure.
- [x] Fix the E2E helper enum and expected flags for Arkhos/Dummy.
- [x] Re-run focused configured alien pool E2E and formatting checks.
- [x] Record review evidence.

Review:
- The red run of `pnpm --filter @seti/e2e test -- tests/alien-pool-config.spec.ts` failed in all three configured alien pool cases because expected `alienModulesEnabled` flags omitted key `9`, the current `DUMMY` id.
- Updated `packages/e2e/helpers/room-flow.ts` so the E2E helper enum matches common: `AMOEBA = 6`, `GLYPHIDS = 7`, `ARKHOS = 8`, `DUMMY = 9`.
- Updated `packages/e2e/tests/alien-pool-config.spec.ts` expected flags to include both Arkhos and Dummy as disabled for core-only configured-room cases.
- Verification passed: `pnpm --filter @seti/e2e test -- tests/alien-pool-config.spec.ts`; `pnpm exec biome check packages/e2e/helpers/room-flow.ts packages/e2e/tests/alien-pool-config.spec.ts`; no trailing whitespace in touched files; `git diff --check`.

## Space Agency new-alien option E2E coverage - 2026-05-17

Assumptions:
- This slice adds E2E coverage for already implemented lobby/room option
  behavior; it does not change gameplay rules or server state shape.
- The test should use the existing real UI room flow and PATCH responses, not
  debug endpoints or direct websocket actions.
- Board-rendering E2E remains a separate slice because deterministic new-alien
  selection/discovery requires more setup than the option visibility boundary.

Success criteria:
- The Space Agency options E2E asserts Glyphids, Amoeba, and Arkhos child
  toggles are hidden until `newAlienSpecies` is enabled.
- The same E2E asserts the child toggles are visible/enabled when
  `newAlienSpecies` is enabled and are hidden again after it is disabled.
- Focused E2E, E2E typecheck if available, Biome on touched E2E files, and
  `git diff --check` pass or any blocker is recorded.

Plan:
- [x] Extend the existing Space Agency options real-UI spec with child-toggle
  visibility assertions.
- [x] Run focused E2E verification and formatting checks.
- [x] Record review evidence.

Review:
- Extended `packages/e2e/tests/space-agency-options.spec.ts` so the real UI room-options flow now asserts Glyphids, Amoeba, and Arkhos child switches are absent while `newAlienSpecies` is off, become visible/enabled when the option is turned on, and disappear again when it is turned off.
- The spec continues to use UI registration, room creation, room option PATCH responses, and guest read-only room rendering. It does not use debug endpoints, raw websocket actions, or mocked network behavior.
- Verification passed: `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts`; `pnpm exec biome check packages/e2e/tests/space-agency-options.spec.ts`.
- E2E package-local typecheck was attempted with `pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`, and root invocation was attempted with `pnpm exec tsc -p packages/e2e/tsconfig.json --noEmit`; both failed because `tsc` is not installed in the available package/root execution context.
- Final whitespace and `git diff --check` pass recorded after this note.

## Space Agency blocked alien reward payload manifest - 2026-05-17

Assumptions:
- This slice does not implement reward execution. It prevents source-blocked
  rewards from being silently treated as implemented.
- The manifest belongs in common because server and client need the same
  source-status vocabulary.
- Arkhos exploration effect ids should remain opaque `*_UNMAPPED` ids until a
  structured `effectSmall`/`effectBig` source is recovered.

Success criteria:
- A common test fails before the manifest exists and passes after the minimal
  implementation.
- The manifest names Glyphids translated rewards, Amoeba organelle rewards, and
  Arkhos exploration rewards as blocked by missing structured payload sources.
- Existing Arkhos exploration card data still uses opaque unmapped effect ids.
- Focused common tests, common typecheck, Biome on touched files, and
  `git diff --check` pass or any tool limitation is recorded.

Plan:
- [x] Add a red common test for the blocked alien reward payload manifest.
- [x] Add the smallest shared manifest in common Space Agency alien constants.
- [x] Run focused common verification and whitespace checks.
- [x] Record review evidence.

Review:
- Added a red common test in `packages/common/__tests__/constant/spaceAgencyAliens.test.ts` for a shared blocked alien reward payload manifest. The red run failed because `SPACE_AGENCY_BLOCKED_ALIEN_REWARD_PAYLOADS` was `undefined`.
- Added `SPACE_AGENCY_BLOCKED_ALIEN_REWARD_PAYLOADS` to `packages/common/src/constant/spaceAgencyAliens.ts`, naming Glyphids translated rewards, Amoeba organelle rewards, and Arkhos exploration rewards as blocked by missing structured payload sources.
- The test also asserts every Arkhos exploration minor/major effect id remains an opaque `_UNMAPPED` id, preserving the source-backed blocker instead of implying executable reward behavior.
- Verification passed: `pnpm --filter @ender-seti/common test -- spaceAgencyAliens`; `pnpm --filter @ender-seti/common typecheck`; `pnpm exec biome check packages/common/src/constant/spaceAgencyAliens.ts packages/common/__tests__/constant/spaceAgencyAliens.test.ts`; no trailing whitespace in touched files; `git diff --check`.

## Space Agency completion audit follow-up - 2026-05-17

Assumptions:
- This slice does not mark the active goal complete; it creates a fact-based audit of the current organization and alien implementation state.
- The audit must map the original objective to concrete files/tests and separate proven work from unresolved or source-blocked behavior.
- Known missing reward payload tables must remain explicit blockers rather than inferred behavior.

Success criteria:
- A review document restates the objective as concrete deliverables and maps each deliverable to implementation/test evidence.
- The audit identifies missing, incomplete, weakly verified, or blocked requirements.
- The audit explains why the goal is not yet complete and which next implementation slices are safe.
- Documentation checks and `git diff --check` pass.

Plan:
- [x] Inspect the implementation plan, TODO blockers, and representative common/server/client/e2e evidence.
- [x] Create a completion-audit report under `docs/review`.
- [x] Run doc formatting/whitespace checks.
- [x] Record review evidence in this TODO section.

Review:
- Created `docs/review/space-agency-organization-aliens-completion-audit-2026-05-17.md` to map Space Agency organization and alien requirements to current files, tests, E2E evidence, and unresolved blockers.
- Conclusion: the active goal is not complete. Organization/runtime surfaces are mostly implemented for the current server behavior, but Glyphids translated rewards, Amoeba organelle rewards and `SA.ET.19` payout, Arkhos human exploration reward payloads, and SA-10 release/E2E evidence remain incomplete.
- Verification: `pnpm exec biome check docs/TODO.md docs/review/space-agency-organization-aliens-completion-audit-2026-05-17.md` was attempted, but repo Biome config ignores Markdown and processed zero files. Manual doc whitespace checks passed: `rg -n "[ \t]+$" docs/TODO.md docs/review/space-agency-organization-aliens-completion-audit-2026-05-17.md` found no trailing whitespace, and both files end with newline.
- Final `git diff --check` passed after this review note.

## Space Agency organization complexity metadata follow-up - 2026-05-17

Assumptions:
- This slice fixes common/server consistency only; it does not change organization runtime behavior.
- If a server organization class exposes a power or main action, common metadata should not describe it as `setup-only`.
- Exact player-facing wording for complexity is out of scope because the current client does not render `complexity`.

Success criteria:
- A server registry test fails when runtime-implemented organizations are marked `setup-only` in common metadata.
- Common organization metadata marks every runtime-implemented organization as non-`setup-only`.
- Existing common organization metadata tests are updated to match the implemented runtime surface.
- Focused common/server tests, typechecks, Biome, and `git diff --check` pass.

Plan:
- [x] Add a red server registry test for organization runtime/metadata complexity consistency.
- [x] Update common organization complexity metadata and common expectations.
- [x] Run focused common/server tests, typechecks, Biome, and `git diff --check`.
- [x] Record review evidence.

Review:
- Added a red `OrganizationRegistry` test that compares server runtime capabilities to common organization metadata. The red run failed because at least one runtime-implemented organization was still marked `setup-only`.
- Updated common `complexity` metadata so every organization with an implemented server power or main action is non-`setup-only`; updated common metadata expectations accordingly.
- Verification passed: `pnpm --filter @ender-seti/common test -- organizations`; `pnpm --filter @seti/server test -- __tests__/engine/organization/OrganizationRegistry.test.ts`; `pnpm --filter @ender-seti/common typecheck`; `pnpm --filter @seti/server typecheck`; Biome check on touched files after formatting; `git diff --check`.
- Runtime behavior was not changed in this slice.

## Space Agency Amoeba client section-color follow-up - 2026-05-17

Assumptions:
- This slice implements only client rendering of source-backed Amoeba board section colors using shared `AMOEBA_TRACE_SLOTS`.
- It does not introduce new layout data or hand-drawn organelle icons; organelles still render through `DescRender`.
- The change is visual/semantic only and does not add new game actions.

Success criteria:
- Amoeba board cells expose their shared trace color via DOM data attributes.
- Cell borders use the existing trace-color palette to make the section color visible.
- Focused client tests fail before production edits and pass after the minimal implementation; type/format/whitespace checks remain green.

Plan:
- [x] Add a red client test for Amoeba cell section colors.
- [x] Update `AlienBoardView` to derive cell trace colors from `AMOEBA_TRACE_SLOTS`.
- [x] Run focused client tests, common/client typechecks, Biome, and `git diff --check`.
- [x] Record review evidence and remaining Amoeba blockers.

Review:
- Added a red `AlienBoardView` test asserting Amoeba cell positions expose the shared section colors: position `8` blue, `4` yellow, and `2` red. The red run failed because cells did not yet include `data-trace-color`.
- Updated `AlienBoardView` to derive Amoeba cell trace colors from shared `AMOEBA_TRACE_SLOTS`, expose them via `data-trace-color`, and apply the existing trace-color palette to cell borders/backgrounds. Organelle icons still render through `DescRender`.
- Verification passed: `pnpm --filter @seti/client test -- AlienBoardView`; `pnpm --filter @ender-seti/common typecheck`; `pnpm --filter @seti/client typecheck`; Biome check on touched files; `git diff --check`.
- Remaining blocker: this is a client semantic/visual consistency slice only. Amoeba reward execution and `SA.ET.19` full card flow remain blocked by source-backed organelle reward payload mapping.

## Space Agency Amoeba single-organelle mutation helper follow-up - 2026-05-17

Assumptions:
- This slice implements only source-backed Amoeba mutation movement for one organelle token, based on `frontend-reference` `amoebaLife.js` `moveAmoeba`.
- It is groundwork for single-organelle card choices; it does not grant the selected organelle's reward.
- Movement skips occupied positions and uses the existing loops: positions `0-5` and positions `6-8`.

Success criteria:
- Amoeba board code can move one organelle token by id.
- The helper returns `false` for an unknown token id.
- Occupied target positions are skipped without moving unrelated organelles.
- The existing board-space mutation path reuses the board helper and remains green.

Plan:
- [x] Add a red test for single-organelle movement.
- [x] Add the smallest `AmoebaAlienBoard` movement helper and reuse it from the plugin.
- [x] Run focused server tests, common/server typechecks, Biome, and `git diff --check`.
- [x] Record review evidence and remaining Amoeba reward blocker.

Review:
- Added a red plugin test for moving a single Amoeba organelle by token id. The red run failed as expected with `board.moveOrganelleToken is not a function`.
- Added `AmoebaAlienBoard.moveOrganelleToken`, `moveOrganellesInSection`, and the shared occupied-position skip logic. `AmoebaAlienPlugin` now delegates board-space mutation movement to the board helper.
- Verification passed: `SpaceAgencyAlienPlugins.test.ts` passed 21 tests; `pnpm --filter @ender-seti/common typecheck` passed; `pnpm --filter @seti/server typecheck` passed after restoring the `AmoebaAlienBoard` type import; Biome check on touched files passed after formatting; `git diff --check` passed.
- Remaining blocker: this supports future single-organelle card choices but still does not grant organelle rewards because the source-backed token reward mapping is not implemented.

## Space Agency Amoeba ET.19 marker-removal helper follow-up - 2026-05-17

Assumptions:
- This slice implements only the source-backed marker-removal target scope for `SA.ET.19` from `docs/arch/aliens/amoeba/rule.md` and the Space Agency FAQ.
- Valid targets are the player's own markers on Amoeba species-board spaces, Amoeba discovery spaces, or Amoeba overflow spaces.
- Organelle reward execution after removal remains out of scope because organelle reward payloads are still not represented.

Success criteria:
- Amoeba board code can list the current player's removable `SA.ET.19` marker slots across board, discovery, and overflow.
- Removing a valid marker removes only that player's occupant and returns the removed space color for later organelle-section resolution.
- Unknown slots and slots without the player's marker are no-ops.
- Focused tests fail before production edits and pass after the minimal implementation; type/format/whitespace checks remain green.

Plan:
- [x] Add a red test for Amoeba `SA.ET.19` marker target listing and removal.
- [x] Add the smallest `AmoebaAlienBoard` helper for removable marker slots and marker removal.
- [x] Run focused server tests, common/server typechecks, Biome, and `git diff --check`.
- [x] Record review evidence and remaining Amoeba reward blocker.

Review:
- Added a red plugin test for `SA.ET.19` marker targets. The red run failed as expected with `board.getRemovableMarkerSlots is not a function`.
- Added `AmoebaAlienBoard.getRemovableMarkerSlots` and `removePlayerMarkerFromSlot`; the target scope is species-board slots first, then discovery slots, then overflow slots, and removal returns the removed slot color.
- Verification passed: `SpaceAgencyAlienPlugins.test.ts` passed 20 tests; `pnpm --filter @ender-seti/common typecheck` passed; `pnpm --filter @seti/server typecheck` passed; Biome check on touched files passed after formatting; `git diff --check` passed.
- Remaining blocker: this does not yet implement the `SA.ET.19` card flow or organelle reward payout because the organelle token reward payloads still need a source-backed executable mapping.

## Space Agency Amoeba organelle section helper follow-up - 2026-05-17

Assumptions:
- This slice implements only source-backed Amoeba section lookup/count/order behavior from checked-in `frontend-reference` `amoebaLife.js`.
- Organelles in an activated color section are ordered by descending board position, matching `activateAllAmoebaColor`.
- Reward payload execution remains out of scope because organelle effect payloads are not represented in shared data.

Success criteria:
- Amoeba board code can report which organelles are in a trace-color section.
- The reported order is descending by position for future activation.
- The count helper uses the same section mapping.
- Existing mutation movement behavior remains unchanged; focused tests fail before production edits and pass after the minimal implementation.

Plan:
- [x] Add a red test for Amoeba organelle section order and count.
- [x] Add the smallest `AmoebaAlienBoard` helper and reuse it from the plugin.
- [x] Run focused server tests, common/server typechecks, Biome, and `git diff --check`.
- [x] Record review evidence and remaining Amoeba blockers.

Review:
- Added a red plugin test for Amoeba section lookup. The red run failed as expected with `board.getOrganellesInSection is not a function`.
- Added `AmoebaAlienBoard.getOrganellesInSection`, `countOrganellesInSection`, and `traceColorForOrganellePosition` using the existing trace-slot section mapping, with activation order sorted by descending position.
- Updated `AmoebaAlienPlugin` to reuse the board helper for rival placement checks and mutation movement ordering.
- Verification passed: `SpaceAgencyAlienPlugins.test.ts` passed 19 tests; `pnpm --filter @ender-seti/common typecheck` passed; `pnpm --filter @seti/server typecheck` passed; Biome check on touched files passed after formatting; `git diff --check` passed.
- Remaining blocker: this still does not execute Amoeba organelle rewards because the organelle effect payloads and `SA.ET.19` reward execution remain incomplete.

## Space Agency Glyphids translation reward-coordinate follow-up - 2026-05-17

Assumptions:
- This slice implements only the source-backed coordinate math from checked-in `frontend-reference` `alphabetLife.js` `getAlphabetEffect`.
- Reward payload execution remains out of scope because `dataSheet.alphabetTable` values are still unrecovered.
- Coordinates are zero-based row indexes into `alphabetTable`, while columns follow the reference's `position + 1` lookup because column 0 is not a glyph slot payload.

Success criteria:
- A translated level 1 glyph reports reward row `(level - 1) * 2 + (side - 1)` and reward column `position + 1`.
- A translated level 2 glyph reports the same source-backed coordinate math.
- Untranslated glyph lookup still returns `undefined`.
- Focused tests fail before production edits and pass after the minimal implementation; type/format/whitespace checks remain green.

Plan:
- [x] Add a red test for Glyphids translation reward table coordinates.
- [x] Extend the shared translated-glyph placement shape and board lookup with source-backed coordinates.
- [x] Run focused server tests, common/server typechecks, Biome, and `git diff --check`.
- [x] Record review evidence and remaining blockers.

Review:
- Extended the translated-glyph plugin test with reward table coordinate assertions. The red run failed because `getTranslatedGlyph` did not yet return `rewardRowIndex` or `rewardColumnIndex`.
- Added `rewardRowIndex` and `rewardColumnIndex` to `IGlyphidsTranslationPlacement` and implemented the checked-in reference formula: row `(level - 1) * 2 + (side - 1)`, column `position + 1`.
- Verification passed: `SpaceAgencyAlienPlugins.test.ts` passed 18 tests; `pnpm --filter @ender-seti/common typecheck` passed; `pnpm --filter @seti/server typecheck` passed; Biome check on touched TS files passed; `git diff --check` passed.
- Remaining blocker: this still only identifies the reward table cell. Executing translated rewards remains blocked until the actual `dataSheet.alphabetTable` payload table is recovered from a structured source.

## Space Agency Glyphids translated-glyph lookup follow-up - 2026-05-17

Assumptions:
- This slice implements only the source-backed lookup behavior from checked-in `frontend-reference` `alphabetLife.js` `getPlacedToken`.
- It returns where a glyph is translated: level, position, side, and glyph.
- It does not execute translated rewards because `dataSheet.alphabetTable` payloads are still unrecovered.
- It does not place sky, planet, or tech-stack glyph tokens because the project does not yet have all equivalent token containers and partial placement would make bank order misleading.

Success criteria:
- Looking up an unplaced Glyphids glyph returns `undefined`.
- Looking up a translated glyph returns its table level, position, side, and glyph.
- Duplicate placement constraints remain unchanged.
- Focused tests fail before production edits and pass after the minimal implementation; type/format/whitespace checks remain green.

Plan:
- [x] Add a red test for translated-glyph lookup.
- [x] Add the smallest shared placement type and `GlyphidsAlienBoard` query helper.
- [x] Run focused server tests, common/server typechecks, Biome, and `git diff --check`.
- [x] Record review evidence and remaining Glyphids blockers.

Review:
- Added a red plugin test for Glyphids translated-glyph lookup. The red run failed as expected with `board.getTranslatedGlyph is not a function`.
- Added shared `IGlyphidsTranslationPlacement` and implemented `GlyphidsAlienBoard.getTranslatedGlyph`, derived from existing `translationRows` state without adding new persisted fields.
- Verification passed: `SpaceAgencyAlienPlugins.test.ts` passed 18 tests; `pnpm --filter @ender-seti/common typecheck` passed; `pnpm --filter @seti/server typecheck` passed; Biome check on touched TS files passed; `git diff --check` passed.
- Remaining Glyphids blockers: translated reward execution still lacks the structured `dataSheet.alphabetTable` reward table; sky/planet/tech glyph token setup remains blocked because implementing only a subset would make token-bank ordering misleading; board-token trace/refill wiring still lacks source-backed trace colors/rewards/refill positions.

## Space Agency Glyphids board-token claim helper follow-up - 2026-05-17

Assumptions:
- This slice implements only the source-backed one-time claim/removal behavior for a Glyphids token already placed on the Glyphids board.
- It does not wire token claiming to trace placement yet, because Glyphids species-board trace colors/rewards and top-three refill positions are still not recovered as structured data.
- It does not implement refill; future callers must keep refill-specific spaces blocked until the exact refill positions are sourced.

Success criteria:
- Claiming a Glyphids board token by position removes that token from board-token state.
- Human claims add the glyph to the first scoring row without the same glyph.
- Rival claims use the existing rival translation placement helper before falling back to scoring rows.
- Claiming an empty/unknown board position is a no-op.
- Focused tests fail before production edits and pass after the minimal implementation; type/format/whitespace checks remain green.

Plan:
- [x] Add red tests for human claim, rival translated claim, and empty-position no-op.
- [x] Implement the smallest `GlyphidsAlienBoard.claimBoardToken` helper.
- [x] Run focused server tests, typecheck, Biome, and `git diff --check`.
- [x] Record review evidence and remaining Glyphids blockers.

Review:
- Added red plugin tests for claiming Glyphids board tokens: human claims remove the token and collect it into scoring rows, rival claims route through translation placement first, and empty positions are no-ops. The red run failed on missing `claimBoardToken`.
- Implemented `GlyphidsAlienBoard.claimBoardToken` as a single-token removal/claim helper; it delegates to `gainRivalGlyphToken` when a rival direction is supplied, otherwise it uses `collectGlyphToken`.
- Verification passed: server plugin/serializer/deserializer suite passed 3 files / 67 tests; `pnpm --filter @seti/server typecheck` passed; Biome check on touched files passed; `git diff --check` passed.
- Remaining Glyphids blockers: this helper is not wired to trace/planet/sector/tech triggers; top-three board-token refill remains blocked until exact refill positions/effects are sourced; translation reward execution remains blocked by the unrecovered `dataSheet.alphabetTable` payload table.

## Space Agency Glyphids rival translation placement follow-up - 2026-05-17

Assumptions:
- This slice implements only the source-backed structural placement behavior from checked-in `frontend-reference` `alphabetLife.js`.
- Rival translation reward execution remains out of scope because the structured `dataSheet.alphabetTable` payload table is still unrecovered.
- Token-source triggers remain out of scope; this adds the board helper that future token acquisition paths can call.

Success criteria:
- Rival glyph placement tries level 2 before level 1.
- Direction `left` checks positions from low to high; direction `right` checks positions from high to low.
- Existing translation constraints still apply: no duplicate deciphered glyphs and level 2 requires both lower support slots.
- If a rival glyph cannot be placed, it can still be collected into scoring rows through the existing row grouping helper.
- Focused tests fail before production edits and pass after the minimal implementation; type/format/whitespace checks remain green.

Plan:
- [x] Add red tests for rival translation placement priority/direction and fallback collection behavior.
- [x] Implement the smallest `GlyphidsAlienBoard` helper for rival translation placement.
- [x] Run focused server tests, typecheck, Biome, and `git diff --check`.
- [x] Record review evidence and remaining Glyphids blockers.

Review:
- Added red plugin tests for rival Glyphids translation placement: level 2 is attempted before level 1, direction controls scan order, duplicate deciphered glyphs fall back to scoring rows, and translated glyphs are not also collected.
- Implemented `GlyphidsAlienBoard.gainRivalGlyphToken` and `placeRivalGlyphOnTranslationTable` using the checked-in `frontend-reference` `alphabetLife.js` behavior: table 2 first, then table 1, with `[0,1,2,3]` or `[3,2,1,0]` position order.
- Verification passed: server plugin/serializer/deserializer suite passed 3 files / 64 tests; `pnpm --filter @seti/server typecheck` passed; Biome check on touched files passed; `git diff --check` passed.
- Remaining Glyphids blockers: no token-source trigger currently calls this helper; translated reward execution is still blocked by the unrecovered `dataSheet.alphabetTable` payload table; planet/sector/tech token acquisition and board-token refill are still incomplete.

## Space Agency Glyphids board-token setup follow-up - 2026-05-17

Assumptions:
- This slice implements only the source-backed setup placement of Glyphids tokens onto the six designated Glyphids board positions from checked-in `frontend-reference` `life.js`.
- The six source-backed positions are `[0, 3, 4, 7, 8, 11]`.
- This slice does not implement claiming/replenishing those board tokens, because the exact top-three refill positions are not represented in recovered structured data.
- Planet, sector, and tech-stack Glyphids token placement remain out of scope for this slice.

Success criteria:
- Glyphids discovery deals six shuffled glyph tokens to public Glyphids board-token state and removes those tokens from the remaining bank.
- Serializer/deserializer and public projection preserve the board-token state.
- Client Glyphids board renders the board tokens using `DescRender`.
- Focused tests fail before production edits and pass after the minimal implementation; type/format/whitespace checks remain green.

Plan:
- [x] Add red tests for Glyphids board-token setup, serializer/deserializer projection, and client rendering.
- [x] Add common/server state for Glyphids board tokens and deal six tokens from the shuffled bank on discovery.
- [x] Render projected board tokens in the Glyphids client board with existing desc icon rendering.
- [x] Run focused server/client tests, common/server/client typechecks, Biome, and `git diff --check`.
- [x] Record review evidence and remaining Glyphids blockers.

Review:
- Added red tests proving Glyphids discovery should deal six shuffled tokens to the species-board positions `[0, 3, 4, 7, 8, 11]`, preserve those tokens through serializer/deserializer/public projection, and render them in the client with `DescRender`. The red run failed on missing `boardTokens` server state/projection and missing client board-token UI.
- Added `IGlyphidsBoardToken` and `GLYPHIDS_BOARD_TOKEN_POSITIONS` in common, plus `GlyphidsAlienBoard.boardTokens` and `dealBoardTokensFromBank`.
- Updated `GlyphidsAlienPlugin.onDiscover` to shuffle the bank, deal six board tokens from the shuffled bank, and leave the remaining tokens in `glyphTokenBank`.
- Updated public projection, DTO serialization/deserialization, localized board-token labels, and the Glyphids client board renderer.
- Verification passed: server plugin/serializer/deserializer suite passed 3 files / 62 tests; client `AlienBoardView` passed 14 tests; common/server/client typechecks passed; locale JSON parsing passed; Biome check on touched files passed; `git diff --check` passed.
- Remaining Glyphids blockers: claiming and replenishing Glyphids board tokens is not implemented because the exact top-three refill positions/effects are not recovered as structured data; planet, sector, and tech-stack token placement/acquisition and translation reward execution also remain incomplete.

## Space Agency Glyphids translation structure follow-up - 2026-05-17

Assumptions:
- This slice implements only source-backed Glyphids structure from checked-in `frontend-reference` `alphabetLife.js` and setup in `life.js`.
- The structured `dataSheet.alphabetTable` reward payload table has not been recovered, so translation reward execution remains out of scope.
- Token placement on sky sectors, planets, tech stacks, and printed Glyphids board spaces remains out of scope for this slice.

Success criteria:
- Glyphids translation state has a 4-position level 1 table and a 3-position level 2 table with random side `1` or `2` on discovery.
- A glyph may be placed on the translation table only once; level 2 positions require both supporting level 1 positions to be occupied.
- Human glyph collection stores tokens in the first row that does not already contain that glyph, matching the reference's five-row grouping behavior.
- Focused tests fail before production edits and pass after the minimal implementation; serializer/deserializer/type/format checks remain green.

Plan:
- [x] Add red tests for translation-table setup sides, placement constraints, and human glyph row grouping.
- [x] Implement the smallest Glyphids board/plugin helpers for those source-backed structural rules.
- [x] Update serializer/deserializer/public projection tests for the refined translation state.
- [x] Run focused plugin/serializer tests, server typecheck, Biome on touched files, and `git diff --check`.
- [x] Record review evidence and remaining Glyphids blockers.

Review:
- Added red plugin tests for Glyphids translation setup sides, translation placement constraints, and human glyph row grouping. The red run showed the old placeholder translation rows and missing board helpers.
- Updated Glyphids shared state to model a level 1 translation table with 4 slots and a level 2 table with 3 slots, with `null` empty slots and randomized sides on discovery.
- Added `GlyphidsAlienBoard.placeGlyphOnTranslationTable` and `collectGlyphToken`: translation glyphs cannot duplicate, level 2 placement requires both lower supports, occupied slots reject placement, and human collection uses the first row without that glyph.
- Updated serializer/deserializer/public projection tests and client board rendering so empty translation slots render as empty cells while actual glyphs still use `DescRender`.
- Verification passed: server plugin/serializer/deserializer suite passed 3 files / 62 tests; client `AlienBoardView` passed 14 tests; common/server/client typechecks passed; Biome check on touched files passed; `git diff --check` passed.
- Remaining Glyphids blockers: the structured `dataSheet.alphabetTable` reward payload table is still unrecovered, so translated reward execution and card glyph icon payout behavior remain blocked; token placement/acquisition from sky sectors, planets, tech stacks, and Glyphids board spaces is still not modeled.

## Space Agency Amoeba mutation movement follow-up - 2026-05-17

Assumptions:
- This slice implements only the source-backed organelle movement that follows marking an Amoeba board space.
- It does not execute organelle reward payloads; reward payload data is still not represented in shared state.
- Movement follows checked-in `frontend-reference` `amoebaLife.js`: positions `0-5` advance around one loop, positions `6-8` advance around the inner loop, and occupied target positions are skipped.

Success criteria:
- Marking an Amoeba species-board trace moves organelles in the matching color section.
- Occupied target positions are skipped to the next available position.
- Discovery, serializer/deserializer, type, format, and whitespace checks remain green.

Plan:
- [x] Add a red plugin test that marks an Amoeba board space and observes mutation movement.
- [x] Implement movement in `AmoebaAlienPlugin.onPlaceTraceOnSlot`.
- [x] Run focused plugin/serializer/type/format checks and `git diff --check`.
- [x] Record review evidence and remaining Amoeba blockers.

Review:
- Added a plugin test that marks a yellow Amoeba board space through `AlienState.applyTraceToSlot` and expects the matching organelle to mutate from position `5` to `1`, skipping occupied position `0`. Red run showed the organelle stayed at `5`.
- Implemented `AmoebaAlienPlugin.onPlaceTraceOnSlot` so Amoeba species-board trace placement moves organelles in the matching section using the checked-in `frontend-reference` position loops: `0-5` and `6-8`, skipping occupied positions.
- Verification passed: targeted mutation test; plugin plus serializer/deserializer suite passed 3 files / 59 tests; `pnpm --filter @seti/server typecheck` passed; Biome check on the touched plugin/test files passed; `git diff --check` passed.
- Remaining Amoeba blockers: organelle reward payloads are still not represented, so this movement currently updates board state after relevant trace placement but does not grant the printed organelle rewards; card organelle icons and `SA.ET.19` reward execution remain incomplete.

## Space Agency Glyphids token bank setup shuffle follow-up - 2026-05-17

Assumptions:
- This slice only implements the source-backed setup rule that Glyphids glyph tokens are shuffled during discovery.
- Existing state still models the not-yet-placed tokens as `glyphTokenBank`; placement on planets, sectors, tech stacks, and Glyphids board spaces remains out of scope.
- Translation-board strip orientation and reward payload execution remain unchanged because the current shared state does not yet encode the full slot/reward model.

Success criteria:
- Glyphids discovery uses `game.random.shuffle` to randomize the glyph token bank.
- Existing Glyphids card draw and serializer/deserializer behavior remains green.
- Focused tests fail before production edits and pass after the minimal plugin implementation.

Plan:
- [x] Add a red plugin discovery test that controls `game.random.shuffle` for the Glyphids token bank.
- [x] Implement token-bank shuffling in `GlyphidsAlienPlugin.onDiscover`.
- [x] Run focused plugin/serializer/type/format checks and `git diff --check`.
- [x] Record review evidence and remaining Glyphids blockers.

Review:
- Added a discovery test that overrides `game.random.shuffle` to reverse the Glyphids token bank. Red run showed the old implementation kept the deterministic default glyph order.
- Implemented `GlyphidsAlienPlugin.onDiscover` to shuffle the existing `glyphTokenBank` through `game.random.shuffle` during discovery setup.
- Verification passed: targeted Glyphids shuffle test; plugin plus serializer/deserializer suite passed 3 files / 58 tests; `pnpm --filter @seti/server typecheck` passed; Biome check on the touched plugin/test files passed; `git diff --check` passed.
- Remaining Glyphids blockers: token placement/acquisition across planets, sectors, tech stacks, and Glyphids board spaces is still not modeled; translation-board occupancy/reward payload execution remains incomplete, so card glyph icons cannot yet grant translated resources.

## Space Agency Amoeba organelle setup shuffle follow-up - 2026-05-17

Assumptions:
- This slice only implements the source-backed setup rule that Amoeba organelle tokens are shuffled onto the marked board spaces on discovery.
- The marked positions remain the existing `AMOEBA_ORGANELLE_START` positions; only token identity/color assignment is randomized.
- Serializer/deserializer remain authoritative after discovery and should preserve whatever shuffled order exists.

Success criteria:
- Amoeba discovery uses `game.random.shuffle` to randomize organelle token assignment.
- The five marked positions remain occupied after discovery.
- Focused tests fail before production edits and pass after the minimal plugin implementation.

Plan:
- [x] Add a red plugin discovery test that controls `game.random.shuffle`.
- [x] Implement organelle shuffling in `AmoebaAlienPlugin.onDiscover`.
- [x] Run focused plugin/serializer/type/format checks and `git diff --check`.
- [x] Record review evidence and remaining Amoeba blockers.

Review:
- Added a discovery test that overrides `game.random.shuffle` to reverse Amoeba organelle token assignment. Red run showed the old implementation kept the deterministic organelle colors instead of using the shuffled assignment.
- Implemented `AmoebaAlienPlugin.shuffleOrganelles` during first discovery setup: marked Amoeba positions remain fixed, while `{ tokenId, color }` assignments are shuffled through `game.random.shuffle`.
- Verification passed: targeted shuffle test; plugin plus serializer/deserializer suite passed 3 files / 57 tests; `pnpm --filter @seti/server typecheck` passed; Biome check on the touched plugin/test files passed; `git diff --check` passed.
- Remaining Amoeba blockers: organelle reward payloads are still not represented, so card organelle icons, board-space organelle payouts, mutation movement after payouts, and `SA.ET.19` reward execution remain incomplete.

## Space Agency Amoeba rival trace targeting follow-up - 2026-05-17

Assumptions:
- This slice implements only the source-backed solo rule that the rival ignores Amoeba board spaces with 1 or 0 organelle bonuses.
- Human trace placement is unchanged; discovery and overflow spaces are not Amoeba board spaces for this filter.
- The existing `AmoebaAlienBoard.organelles` positions and `AMOEBA_TRACE_SLOTS` section colors are sufficient to count organelle bonuses per trace-color section.

Success criteria:
- When the rival resolves a trace and the matching Amoeba section has only one organelle, Amoeba species-board slots are skipped.
- The same rival trace can still resolve on another valid alien board.
- Focused solo/plugin tests fail before production edits and pass after the minimal plugin filter.

Plan:
- [x] Add a red solo rival trace-selection test with Amoeba first and a fallback alien second.
- [x] Implement `AmoebaAlienPlugin.canPlaceTraceOnSlot` for solo rival species-board slots.
- [x] Run focused solo/plugin tests, server typecheck, Biome on touched files, and `git diff --check`.
- [x] Record review evidence and remaining Amoeba blockers.

Review:
- Added a solo rival test where Amoeba is the first alien and Exertians is the fallback. Red run showed the rival incorrectly placed the blue trace on Amoeba even though the blue Amoeba section had only one organelle.
- Implemented `AmoebaAlienPlugin.canPlaceTraceOnSlot` so solo rival trace selection skips Amoeba species-board slots whose matching section has 1 or 0 organelles. Human placement, discovery slots, and overflow slots are unchanged.
- Verification passed: targeted red/green test; full `RivalTurnController.test.ts` plus `SpaceAgencyAlienPlugins.test.ts` passed 2 files / 60 tests; `pnpm --filter @seti/server typecheck` passed; Biome check on the touched plugin/test files passed; `git diff --check` passed.
- Remaining Amoeba blockers: organelle reward payloads are still not represented, so card organelle icons, board-space organelle payouts, mutation movement after payouts, and `SA.ET.19` reward execution remain incomplete.

## Space Agency Glyphids final scoring follow-up - 2026-05-17

Assumptions:
- This slice is limited to the source-backed Glyphids species end-game scoring from `docs/arch/aliens/glyphids/rule.md`.
- Existing `GlyphidsAlienBoard.glyphRows` represents collected unplaced glyph tokens grouped into scoring sets; translated/placed glyphs are not in this state and are therefore not scored here.
- Rival scoring uses the documented solo rule: 3 VP per glyph token regardless of type.

Success criteria:
- Human players score every unplaced Glyphids set using the documented 1 / 3 / 5 / 8 / 11 / 15 / 20 VP scale for set sizes 1-7.
- Solo rival scores 3 VP per collected Glyphids token, ignoring type and set composition.
- `FinalScoring.score` includes the Glyphids plugin bonus for discovered Glyphids boards.
- Focused tests fail before production edits and pass after the minimal plugin implementation.

Plan:
- [x] Add red final-scoring tests for human Glyphids set scoring and rival flat glyph scoring.
- [x] Implement `GlyphidsAlienPlugin.onGameEndScoring` with small local helpers.
- [x] Run focused final-scoring/plugin tests, server typecheck, Biome on touched files, and `git diff --check`.
- [x] Record review evidence and remaining Glyphids blockers.

Review:
- Added `GlyphidsFinalScoring.test.ts` through the actual `FinalScoring.score` path. Red run showed both human and rival Glyphids `alienBonus` values were `0`.
- Implemented `GlyphidsAlienPlugin.onGameEndScoring`: human players score collected unplaced glyph rows with the 1/3/5/8/11/15/20 set scale; solo rival scores 3 VP per collected glyph token.
- Verification passed: `pnpm --filter @seti/server test -- __tests__/engine/scoring/GlyphidsFinalScoring.test.ts __tests__/engine/scoring/FinalScoring.test.ts __tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts` passed 3 files / 25 tests; `pnpm --filter @seti/server typecheck` passed; Biome check on the touched plugin/test files passed; `git diff --check` passed.
- Remaining Glyphids blockers: token acquisition/placement across planets, sectors, tech stacks, and Glyphids board spaces is still not modeled; translation-board occupancy/reward payloads are still insufficient for card glyph icons to grant translated resources.

## Space Agency alien card logic follow-up - 2026-05-17

Assumptions:
- This slice only implements source-backed Glyphids/Amoeba card behavior that can be proven from `docs/arch/aliens/*/rule.md`, `docs/arch/spaceAgency/faq.md`, and existing common card data.
- Arkhos exploration payloads remain blocked and must not be guessed from images.
- Amoeba organelle payout execution remains blocked until organelle reward payloads are represented in shared data; do not infer rewards from token art.

Success criteria:
- `SA.ET.1` scores 3 VP per token of the Glyphids glyph type the player has the most of, using collected unplaced glyph rows.
- `SA.ET.9` scores 1 VP per glyph in the player's largest Glyphids set.
- `SA.ET.11`, `SA.ET.12`, and `SA.ET.13` score 2 VP per matching red/yellow/blue trace marked for Amoeba, including overflow spaces.
- Focused tests fail before production edits and pass after the minimal scoring implementation.

Plan:
- [x] Add red tests for the five source-backed end-game cards.
- [x] Implement the smallest scoring helpers in the existing end-game scoring path.
- [x] Register handled Space Agency alien cards through dedicated classes instead of silent generic registration where touched.
- [x] Add source-backed `SA.ET.14` quick-mission condition/reward coverage and implementation.
- [x] Run focused card/scoring/registry tests plus `git diff --check`.
- [x] Record review evidence and remaining blocked alien-card behavior.

Review:
- Added dedicated server card classes for `SA.ET.1`, `SA.ET.9`, `SA.ET.11`, `SA.ET.12`, `SA.ET.13`, and `SA.ET.14`; the Space Agency alien registry now dispatches these handled cards instead of generic classes.
- Implemented source-backed end-game scoring: `SA.ET.1` scores 3 VP per most-common collected Glyphids token type, `SA.ET.9` scores the largest collected Glyphids set, and `SA.ET.11`/`12`/`13` score 2 VP per matching Amoeba trace including overflow.
- Implemented `SA.ET.14` as a quick mission: red/yellow/blue Amoeba traces must be outside discovery spaces, overflow counts, and the reward grants 1 VP per empty Amoeba board space.
- Red tests were observed before production changes: the five scoring tests initially returned `0`, and `SA.ET.14` initially registered as `GenericMissionCard` with no mission branch.
- Verification passed: focused server card/registry/mission/scoring suite passed 10 files / 59 tests; `pnpm --filter @seti/server typecheck` passed; Biome check on 17 touched server files passed; `git diff --check` passed.
- Remaining blocked behavior: Glyphids card glyph icons still need real translation-board slot/reward state before they can grant translated resources; Amoeba organelle card icons and `SA.ET.19` still need organelle reward payload data; Arkhos exploration reward payloads remain unmapped.

## Space Agency organization/alien completion audit - 2026-05-17

Objective restated:
- Complete the organization and alien portions of `docs/plan/space-agency-implementation-plan.md` across common/server/client, using `frontend-reference` as a behavior/data reference where reliable, with tests proving logic correctness and server/client consistency.
- Do not claim 100% confidence from proxy signals; each explicit organization/alien deliverable must map to concrete source, code, and test evidence.

Prompt-to-artifact checklist:
- [x] Organization core and architecture: 11 concrete server organization classes, registry dispatch, action-cost projection, event-bus listeners, setup-choice flow, once-per-round reset, dashboard/opponent badges, and organization power UI all have code and focused test coverage.
- [x] Glyphids and Amoeba: option gating, dedicated plugins/boards, deck injection, serializer/deserializer/public projection, and client board renderers are present with common/server/client tests.
- [ ] Arkhos: option gating, security-card lifecycle, board state, serializer/deserializer/public projection, and client renderer are present, but exact exploration reward payload execution is not implemented because the structured `effectSmall`/`effectBig` table has not been recovered.
- [x] Arkhos solo/rival rules: `docs/arch/aliens/arkhos/rule.md` requires rival discovery/security-card setup, Arkhos reward-to-progress conversion, Arkhos action-card breach behavior, and Arkhos trace-choice priority; these now have common/server implementation and focused test evidence.
- [x] Client organization/alien UI: Space Agency lobby controls, setup-choice shell, organization badges/powers, and alien boards are localized/data-driven from public server state for the implemented surface.

Verification run in this audit:
- `pnpm --filter @ender-seti/common test -- options organizations arkhosCards alienCards` passed: 4 files, 26 tests.
- `pnpm --filter @seti/server test -- __tests__/engine/organization __tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts __tests__/engine/cards/register/registerSpaceAgencyAliens.test.ts __tests__/engine/GameSetup.test.ts` passed: 9 files, 89 tests.
- `pnpm --filter @seti/client test -- AlienBoardView SetupChoiceModal SelectOptionInput PlayerDashboard OpponentSummary FreeActionBar GameSettingsPanel.editable` passed: 7 files, 44 tests.
- `git diff --check` passed.
- Continuation verification on 2026-05-17 passed: `pnpm --filter @ender-seti/common test -- options organizations arkhosCards alienCards rivalActionCards` passed 5 files / 29 tests; `pnpm --filter @seti/server test -- __tests__/engine/organization __tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts __tests__/engine/cards/register/registerSpaceAgencyAliens.test.ts __tests__/engine/GameSetup.test.ts __tests__/engine/solo/RivalTurnController.test.ts __tests__/persistence/serializer/GameSerializer.test.ts __tests__/persistence/serializer/GameDeserializer.test.ts` passed 12 files / 192 tests; `pnpm --filter @seti/client test -- AlienBoardView SetupChoiceModal SelectOptionInput PlayerDashboard OpponentSummary FreeActionBar GameSettingsPanel.editable RivalPanel` passed 8 files / 62 tests; common/server/client typechecks passed; Biome check on 55 touched TS/TSX/JSON files passed; `pnpm --filter @seti/e2e test tests/space-agency-options.spec.ts tests/space-agency-agencies-setup.spec.ts tests/free-action-spend-signal-token.spec.ts` passed 3 specs; `git diff --check` passed.

Audit result:
- The organization portion and Glyphids/Amoeba implementation are strongly covered by current tests.
- The overall organization/aliens objective is not complete with factual 100% confidence because SA-8 still has one uncovered Arkhos gap: exact exploration reward payload execution.

## Space Agency SA-8 Arkhos solo/rival follow-up - 2026-05-17

Assumptions:
- This follow-up only covers Arkhos solo/rival rules that can be implemented from `docs/arch/aliens/arkhos/rule.md` plus checked-in `frontend-reference`; it does not guess the missing exploration card effect payload table.
- `frontend-reference` maps Arkhos/life10 to rival action card id 21 and implements the special action as `unlockSecurity`: discard a security card, mark matching Arkhos overflow, then resolve two small exploration rewards.
- For the rival, Arkhos exploration reward icons convert to progress instead of executing the unknown exploration card payloads.

Success criteria:
- Arkhos discovered in a solo game gives the rival three front security cards and converts any rival Arkhos exploration reward icon into 1 progress.
- A discovered Arkhos species replacement check resolves to the Arkhos special rival card, and that card unlocks one front rival security card without relying on generic overflow breach behavior.
- Generic rival overflow trace placement on Arkhos does not breach security; the Arkhos special action is the only rival breach path.
- Rival trace selection ignores Arkhos spaces above the rival's access level and prefers Arkhos over the other species when available-space height is tied.
- Focused common/server tests and `git diff --check` pass.

Plan:
- [x] Add failing tests for Arkhos rival replacement, special-card security unlock, overflow non-breach, exploration-icon-to-progress conversion, access filtering, and Arkhos tie-break priority.
- [x] Implement the smallest common data/protocol additions for the Arkhos rival action card and action kind.
- [x] Implement the Arkhos rival action resolver path and solo-specific Arkhos plugin behavior.
- [x] Run focused common/server verification and update this review.

Review:
- Added `ERivalActionKind.UNLOCK_ARKHOS_SECURITY`, Arkhos species replacement mapping to `S.21`, and the `S.21` species-special rival action card, matching `frontend-reference` life10/action-card id 21.
- Added the local `S.21` action-card image from the checked-in `frontend-reference` asset so Arkhos species-special rival cards render in client image mode; `RivalPanel` tests cover the asset mapping.
- Implemented Arkhos rival security unlock in `RivalActionResolver`: one front rival security card is marked used, the matching Arkhos overflow trace is placed, normal overflow rewards resolve, access level advances, and two minor Arkhos exploration rewards convert to rival progress.
- Updated `ArkhosAlienPlugin` so solo rival generic overflow placement does not breach security; the Arkhos special rival action is the breach path.
- Arkhos exploration reward records are still recorded for the rival, but each Arkhos reward icon now also grants 1 rival progress rather than attempting to execute unknown exploration-card payloads.
- Rival trace selection now ignores inaccessible Arkhos spaces and applies the Arkhos tie-breaker when the first available non-overflow space rank is tied with another species.
- Verification passed: `pnpm --filter @ender-seti/common test -- rivalActionCards`, `pnpm --filter @seti/server test -- __tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts __tests__/engine/solo/RivalTurnController.test.ts`, common/server/client typechecks, Biome on touched files, and `git diff --check`.
- Follow-up verification for the `S.21` client asset passed: `pnpm --filter @seti/client test -- RivalPanel`, `pnpm --filter @seti/client test -- AlienBoardView`, `pnpm --filter @seti/client typecheck`, Biome on touched client files, and `git diff --check`.
- Residual scope: exact Arkhos exploration card minor/major payload execution remains blocked on the unrecovered `effectSmall`/`effectBig` source table.

Additional Arkhos exploration reward source check:
- Rechecked `docs/arch/spaceAgency/SE2 aliens aid EN 14.pdf` and `docs/arch/spaceAgency/SE2_rulebook_EN_13_lowres.pdf` with `pdftotext -layout`; the PDFs document Arkhos exploration deck, reward reveal/reset mechanics, security-card lifecycle, and solo/rival conversion, but do not enumerate the 9 exploration cards' minor/major payload table.
- Rechecked local recovered assets `/tmp/seti-arkhos-ai/AI_01.jpg` through `AI_09.jpg` and `/tmp/seti-arkhos-ai/sheet.jpg`; the card faces expose visible icons, but several icon meanings and choice/action semantics are not unambiguous enough to implement as executable server effects with factual 100% confidence.
- Rechecked `frontend-reference` source and built assets for `effectSmall`, `effectBig`, `small_AI`, `big_AI`, and `aiTile`; checked-in code contains the reveal/effect execution path but not the structured deck data table. The table HTML remains only a SPA shell and `/tmp/gcs-46417.json` only lists image assets.
- Final cleanup changed Arkhos exploration `effectId`s from guessed resource names to opaque `ARKHOS_EXPLORATION_##_{MINOR|MAJOR}_UNMAPPED` ids, so persisted reveal records do not imply a factual payload mapping that has not been sourced.
- Follow-up visual inspection of `/tmp/seti-arkhos-ai/sheet.jpg` confirms simple icons such as score, energy, data, publicity, credits, launch, movement, and trace colors are recognizable against existing project icons. The blocker remains the exact executable semantics for non-trivial icons and compositions, such as card-selection/unknown-card icons, multi-icon option groups, and "ignore the limit of probes in space for this launch" payloads; these need the structured `effectSmall`/`effectBig` strings or an explicit confirmed mapping before server effects can be written.
- Rechecked the rendered reference table artifacts: `docs/frontend-demo.html` includes visible `__card-aiTile` DOM and event log entries such as "Exploration tile is revealed", but not `deckData`, `effectSmall`, or `effectBig`; the known reference table id `bDbebSnUY` still returns `403 {"message":"No token provided!"}` from `/api/table-open/bDbebSnUY`.
- Rechecked the official CGE Space Agencies press download from `https://www.cge.as/se2-forpress` on 2026-05-17. The downloadable `seti-space-agencies-artworks.zip` contains box images, component/rulebook render PNGs, banner artwork, and logo PNGs only; `unzip -l` found no JSON, CSV, XLSX, TXT, PDF, Arkhos, `aiTile`, `effectSmall`, or `effectBig` payload file.
- Continuation audit on 2026-05-17 rechecked the actual current code paths: `packages/common/src/data/arkhosCards.ts` still intentionally stores `ARKHOS_EXPLORATION_##_{MINOR|MAJOR}_UNMAPPED`; `frontend-reference` `doEffect.js` and `states.js` only reveal an `aiTile` and parse `data.effectSmall` / `data.effectBig`; local source/build/html searches and current web searches did not recover the missing structured payload table.
- API/source recovery was rechecked again on 2026-05-17: `frontend-reference` `gameTableLogic.ts` loads table data from `/api/table-open/{tableId}` and then reads `data.deckData`, but direct probes to `/api/table-open/bDbebSnUY`, `/api/projects/get-project-detail/seti?status=none`, and `/api/deck/46417` still return `403 {"message":"No token provided!"}`. Public GCS listing for `dummy/prod/46417/` exposes only `assets/AI_01.jpg` through `assets/AI_09.jpg`; common metadata filenames `data.json`, `deck.json`, `cards.json`, `metadata.json`, `manifest.json`, `info.json`, and `export.json` all return 404.
- Continuation source recovery on 2026-05-17 repeated the CGO/GCS checks with `sessionId` query variants and the component endpoints: `/api/table-open/bDbebSnUY?sessionId=arkhosrecheck`, `/api/projects/get-project-detail/seti?status=none&sessionId=arkhosrecheck`, `/api/projects/seti/components`, `/api/projects/seti/components?development=true`, and `/api/deck/46417` all still return `403`; the public `dummy/prod/46417/` GCS listing still contains only the nine `AI_*.jpg` assets; additional metadata guesses `table.json`, `components.json`, `project.json`, and `aiTile.json` are also 404. GitHub code search for `effectSmall`/`aiTile`, `deck-aiTile`, and `AIcard01` requires authentication, and the saved rendered replay exposes only Arkhos card art/log snippets rather than the structured `effectSmall`/`effectBig` payload table.
- Archive recovery on 2026-05-17 also did not recover the table: Wayback CDX requests for the CGO table API, project-detail API, and `dummy/prod/46417/` GCS prefix returned `503`; Common Crawl recent indexes checked for `czech-gaming-online.herokuapp.com/api/table-open/bDbebSnUY*` and `storage.googleapis.com/cgo-deck-assets/dummy/prod/46417/*` returned no captures.
- Decision: keep exact human Arkhos exploration payload execution open until a structured source table, official icon legend plus card list, or user-provided confirmation is available. Do not replace this with image-based guesses.

## Space Agency SA-9 organization/alien client integration polish - 2026-05-17

Assumptions:
- This slice completes the organization and alien-facing part of SA-9 without claiming the unrelated main-deck preview/release-audit work.
- Server remains authoritative for setup-choice candidates and availability; client localization may translate labels from server-provided ids but must not recompute selectable choices.
- Existing `DescRender` / `EffectFactory` icon paths remain mandatory for rule/reward icons.

Success criteria:
- Space Agency lobby controls, setup-choice shell text, organization setup choices, organization badges, organization power aria labels, and Arkhos alien labels use common/i18n text.
- Organization and alien UI continues to render from public server state, including multi-organization arrays, usable organization power ids, Quick Start thumbnails, and typed alien boards.
- Focused common/server/client tests, package typechecks, Biome on touched files, `git diff --check`, and real browser Space Agency flows pass.

Plan:
- [x] Add failing client i18n tests for Space Agency lobby controls, setup-choice shell fallback text, and organization setup-choice names/status/summary copy.
- [x] Add shared client organization display text helper and common locale keys for EN/ZH/PT-BR.
- [x] Wire lobby, setup-choice, organization badge, and organization power UI to common/i18n while preserving server-provided option ids.
- [x] Re-run focused common/server/client tests plus E2E Space Agency flows.
- [x] Record review evidence and residual scope.

Review:
- Added `client.space_agency_options`, `client.setup_choice`, `client.organizations`, and Arkhos alien label keys to common locale files for `en`, `zh-CN`, and `pt-BR`.
- Updated `SpaceAgencyOptionsSection`, `CoreAlienModulesSection`, `SetupChoiceModal`, `SelectOptionInput`, `OrganizationBadge`, and `FreeActionBar` to read localized Space Agency/organization/alien text through `useTranslation('common')`.
- Added `packages/client/src/lib/organizationText.ts` so organization names are translated consistently from the server-provided organization id, with common data names as fallback.
- Client tests now prove Chinese Space Agency option labels, setup-choice fallback dialog labels, and localized organization setup choice text.
- Follow-up audit fixed remaining hardcoded labels in the Space Agency alien board renderers: the shared alien deck panel, Glyphids bank/player-row/translation labels, Amoeba organelle label, and Arkhos exploration/security/access labels now read from common/i18n. `AlienBoardView` tests assert the Chinese labels while still verifying existing `DescRender` glyph/organelle icon paths.
- Follow-up asset parity added the official Arkhos exploration tile images from public CGO/GCS assets to the client and renders server-projected `resolvedExplorationRewards` as a revealed reward history on the Arkhos board. This shows the actual card face and recorded minor/major/player metadata without guessing or executing the still-unmapped payload.
- Follow-up event-log parity added localized client descriptions for the Arkhos structured server events `ARKHOS_EXPLORATION_REWARD_REVEALED`, `ARKHOS_SECURITY_CARD_USED`, and `ARKHOS_SECURITY_BREACHED`, preserving the server-provided card/reward/access details.
- Verification passed: common focused tests 26, server focused tests 178, client focused tests 45 plus i18n regression tests 11 after formatting, common/server/client typechecks, Biome check on 47 touched TS/TSX/JSON files, `git diff --check`, and Playwright specs `space-agency-options`, `space-agency-agencies-setup`, and `free-action-spend-signal-token`.
- Follow-up verification passed: `pnpm --filter @seti/client test -- AlienBoardView` now covers 14 tests including Arkhos exploration asset existence, `pnpm --filter @seti/client typecheck`, `pnpm --filter @ender-seti/common typecheck`, locale JSON parsing for `en`/`zh-CN`/`pt-BR`, Biome on touched client/locale files, and `git diff --check`.
- Event-log follow-up verification passed: `pnpm --filter @seti/client test -- EventEntry` now covers 5 tests including Chinese Arkhos event localization, `pnpm --filter @seti/client typecheck`, locale JSON parsing for `en`/`zh-CN`/`pt-BR`, Biome on touched event-log/locale files, and `git diff --check`.
- Combined client follow-up verification passed: `pnpm --filter @seti/client test -- AlienBoardView EventEntry RivalPanel` passed 3 files / 37 tests, covering Arkhos board reward images, Arkhos event-log localization, and Arkhos `S.21` rival action-card art together.
- Latest focused cross-package verification passed on 2026-05-17: common Space Agency focused tests passed 5 files / 29 tests; server organization/alien/solo/serializer focused tests passed 12 files / 192 tests; client Space Agency focused tests passed 9 files / 68 tests.
- Residual scope: SA-9's unrelated main-deck preview/confirm and SA-10 full release audit remain open in `docs/plan/space-agency-implementation-plan.md`.

## Space Agency SA-8 Arkhos species - 2026-05-17

Assumptions:
- Active goal to continue `docs/plan/space-agency-implementation-plan.md` is approval to execute this scoped SA-8 slice.
- Arkhos card/setup behavior is sourced from `docs/arch/spaceAgency/SE2 aliens aid EN 14.pdf` and `frontend-reference` `life10`/`aiTile` behavior.
- The reference implementation exposes Arkhos setup/deck flow but not a complete plain-text card effect table in the checked-in source; unverified card rewards must stay data-marked rather than silently becoming executable gameplay.
- This slice implements the smallest end-to-end Arkhos surface: option-gated selection, typed board/plugin state, exploration/security card pools, discovery setup, persistence/projection, and client rendering.

Success criteria:
- `EAlienType.ARKHOS` is a known Space Agency alien and can only be enabled/selected when Space Agency `newAlienSpecies` is enabled.
- Arkhos plugin is registered, initializes a 5-card exploration deck plus 4-card reserve from 9 exploration cards, deals one security card from each of the three 4-card sets to every player, and grants discovery markers minor exploration rewards as recorded events/state.
- Arkhos board state serializes/deserializes and projects typed public state consistently, hiding species-specific details while undiscovered.
- Client `AlienBoardView` renders Arkhos exploration deck/discard/reserve counts, per-player security cards, access levels, and trace slots using the existing board patterns.
- Focused common/server/client tests, package typechecks where touched, Biome on touched files, and `git diff --check` pass or any blocker is recorded with exact command output.

Plan:
- [x] Add common/server/client tests for Arkhos option gating, setup selection, plugin discovery setup, projection/serialization, and client rendering.
- [x] Add Arkhos shared constants/data and public protocol board types.
- [x] Implement server board class, plugin, registration, setup option gate, serializer/deserializer/projection support.
- [x] Implement client Arkhos board renderer with existing styling/rendering patterns.
- [x] Run focused verification and fix failures.
- [x] Record review evidence and any remaining card-effect data gap in this section.

Review:
- Added `EAlienType.ARKHOS` to shared alien options/defaults, lobby color/filter metadata, and Space Agency alien module UI so Arkhos can be enabled through the same `alienModulesEnabled` contract as Glyphids/Amoeba.
- Added common Arkhos data in `packages/common/src/data/arkhosCards.ts`: 9 exploration cards, 12 security cards split into 4 red / 4 yellow / 4 blue, opaque unmapped exploration effect ids, and server CardRegistry registration for all security cards.
- Added `ArkhosAlienBoard` runtime state for exploration draw/reserve/discard piles, per-player security card zones, access levels, resolved exploration reward records, and trace slots; exploration rewards now rebuild a 5-card deck plus 4-card reserve after the active deck is exhausted.
- Implemented `ArkhosAlienPlugin` discovery setup: 5-card exploration deck + 4 reserve, one security card per trace color per player, one minor exploration reward per discovery marker, no generic alien deck placeholder, security breach from matching overflow into hand, and access-level gating for deeper Arkhos spaces.
- Wired Arkhos security-card lifecycle through generic alien-card hooks: discarding a breached security card for its free-action corner marks it `used` and resolves a minor exploration reward, while playing it for 2 credits marks it `used` and resolves a major exploration reward without putting it in the main deck discard pile.
- Wired serializer/deserializer DTOs and public projection for Arkhos board state, hiding species-specific state while undiscovered through the existing public alien projection behavior.
- Added client `AlienBoardView` Arkhos renderer for exploration counts, security cards, access state, and trace columns; Space Agency lobby settings now expose Glyphids/Amoeba/Arkhos child toggles when `newAlienSpecies` is enabled.
- Verification passed: common focused tests 100, server focused tests 226 plus focused PlayCard/FreeActionCorner regression tests 38 after formatting, client focused tests 82, common/server/client typechecks, Biome check on 35 touched TS/TSX/JSON files, and `git diff --check`.
- Residual scope: individual Arkhos exploration card reward payloads remain effect-id records rather than fully expanded reward execution. Follow-up audit on 2026-05-17 confirmed `SE2 aliens aid EN 14.pdf` documents reveal/reshuffle mechanics but not all 9 card reward payloads, checked-in `frontend-reference` code has the `aiTile` effect execution path but not the complete `effectSmall`/`effectBig` data table, and public `frontend-reference` asset URLs expose `AI_01.jpg` through `AI_09.jpg` card faces without the structured effect table needed to map several icons with 100% confidence. The local saved table HTML is only the SPA shell, archived CGO API probes for table/project/deck detail return 403 `No token provided!`, and GCS probes under `dummy/prod/46417/` list only image assets while common metadata names such as `data.json`, `deck.json`, `cards.json`, and `metadata.json` return 404. SA-8 is intentionally reopened in `docs/plan/space-agency-implementation-plan.md`; do not claim 100% Arkhos reward correctness until those payloads are mapped to executable effects and covered by failing-then-passing tests.

## Space Agency SA-7 Glyphids and Amoeba species - 2026-05-17

Assumptions:
- Active goal to continue `docs/plan/space-agency-implementation-plan.md` is approval to execute the next serial slice after completed organization and SA-6 work.
- SA-7 scope is Glyphids and Amoeba only; Arkhos remains deferred to SA-8 and no Arkhos placeholder behavior should be introduced.
- `frontend-reference` is used as behavioral/data reference, with aliases `alphabet*` mapped to Glyphids and `amoebaEffect` mapped to Amoeba.
- The first implementation should be the smallest end-to-end, test-covered shape: option-gated species selection, dedicated board/plugin state, SA alien card deck injection, projection/serialization, and client board rendering through existing icon renderers.

Success criteria:
- `newAlienSpecies=true` is no longer rejected for supported Glyphids/Amoeba configurations, while enabling those aliens still requires the Space Agency expansion and `spaceAgencyOptions.newAlienSpecies=true`.
- Game setup can select Glyphids and Amoeba only when their module flags are enabled; core alien selection remains unchanged when the submodule is off.
- Glyphids and Amoeba have registered plugins, dedicated board classes/state, and `getAlienDeckCardIds` returns `SA.ET.1`-`SA.ET.10` and `SA.ET.11`-`SA.ET.20` respectively.
- Discovery initializes species-specific runtime state, serializes/deserializes it, and projects typed public board state to the client.
- Client `AlienBoardView` renders Glyphids and Amoeba typed boards using existing `DescRender` / effect icon paths for glyph/organelle tokens.
- Focused common/server/client tests, package typechecks where touched, Biome on touched files, and `git diff --check` pass or any blocker is recorded with exact command output.

Plan:
- [x] Add failing common/server/client tests for option gating, setup selection, plugin/deck injection, typed board projection/serialization, and client rendering.
- [x] Add shared Glyphids/Amoeba constants and public protocol board types.
- [x] Implement server board classes, plugins, registration, setup option gate, serializer/deserializer/projection support.
- [x] Implement client board renderers using existing icon renderer chain.
- [x] Run focused verification and fix failures.
- [x] Record review evidence and residual risk in this section.

Review:
- Added shared Space Agency alien constants for Glyphids and Amoeba card-id ranges, default Glyphids token/translation state, and default Amoeba organelle/slot state.
- Enabled supported `newAlienSpecies=true` configurations: common validation still requires the Space Agency expansion and `spaceAgencyOptions.newAlienSpecies=true` before Glyphids/Amoeba flags can be enabled, while setup now includes those aliens only through that gate.
- Added dedicated `GlyphidsAlienBoard` and `AmoebaAlienBoard` classes, registered `GlyphidsAlienPlugin` and `AmoebaAlienPlugin`, and wired their alien decks to `SA.ET.1`-`SA.ET.10` and `SA.ET.11`-`SA.ET.20`.
- Added serializer/deserializer DTO fields plus public typed board projections for Glyphids and Amoeba; undiscovered aliens still hide species-specific board/card state.
- Added `AlienBoardView` renderers for Glyphids and Amoeba using `DescRender` for `{glyph-*}` and `{organelle-*}` tokens instead of hand-drawn icon substitutes.
- Verification passed: common options tests 16, server focused suite 5 files/89 tests, client AlienBoardView tests 12, common/server/client typechecks, Biome check on 18 touched files, and `git diff --check`.
- Residual scope intentionally remains for SA-8/SA-9: Arkhos is not implemented, and deeper Glyphids/Amoeba card-specific resource accounting/endgame scoring beyond the dedicated board/plugin/deck/projection surface is not completed in this slice.

## Space Agency SA-6 New Deck and Signal Token - 2026-05-15

Assumptions:
- Active goal to continue `docs/plan/space-agency-implementation-plan.md` is approval to execute this scoped SA-6 slice.
- `spaceAgencyOptions.newDeck=true` controls the 42 Space Agency main-deck cards only; new alien species remain deferred to SA-7+.
- Signal-token scan is enabled by `spaceAgencyOptions.newDeck=true` and remains available only while resolving a real scan action.
- Client scan UI continues to use the existing free-action rail; no new scan modal is introduced in this slice.

Success criteria:
- BASE and Space Agency games with `newDeck=false` build the main deck without `spaceAgencyCards`; Space Agency games with `newDeck=true` include them.
- `newDeck=true` is no longer rejected by setup, while `newAlienSpecies=true` remains rejected until SA-7.
- `SPEND_SIGNAL_TOKEN` is unavailable when `spaceAgencyOptions.newDeck=false`, available during scan when `newDeck=true`, and capped at two spends per scan.
- Server/client tests prove option gating, 0/1/2 spend behavior, overspend rejection, and existing scan UI rendering through the free-action rail.

Plan:
- [x] Add failing common/server/client tests for `newDeck` composition, signal-token `newDeck` gating, max two spends, and client free-action visibility.
- [x] Implement Space Agency option projection and deck composition gate.
- [x] Gate server/common/client `SPEND_SIGNAL_TOKEN` availability through `spaceAgencyOptions.newDeck` and track per-scan spend count.
- [x] Run focused common/server/client tests, typechecks, Biome on touched files, and `git diff --check`.
- [x] Record review evidence and residual risk in this section.

Review:
- Projected `spaceAgencyOptions` plus `scanSignalTokensSpent` to public game state so common/client availability reads the same `newDeck` option as the server.
- Enabled `spaceAgencyOptions.newDeck=true` as a non-organization Space Agency path: setup now builds the main deck from `baseCards` plus `spaceAgencyCards` only when `newDeck` is enabled, while `newAlienSpecies` stays blocked for SA-7.
- Added full Space Agency main-deck registry coverage: all 42 `spaceAgencyCards` data ids are registered and creatable.
- Gated `SPEND_SIGNAL_TOKEN` through `spaceAgencyOptions.newDeck` and capped each scan at two signal-token spends; server/common/client tests cover `newDeck=false`, 0/1/2 spend behavior, and third-spend rejection/hidden UI.
- Updated debug replay/session setup so the spend-signal-token checkpoint creates an SA-enabled game, and aligned the Playwright spec with scan pending-input mode.
- Follow-up correction removed the separate signal-token helper/public boolean; server/common/client now read `spaceAgencyOptions.newDeck` directly.
- Verification passed after the correction: common focused tests 64, server focused tests 32, client focused tests 59, common/server/client typechecks, Biome check on touched files, `git diff --check`, and `pnpm --filter @seti/e2e test tests/free-action-spend-signal-token.spec.ts`.
- Residual scope intentionally remains for SA-7+: Glyphids/Amoeba/Arkhos species plugins and alien-deck option gating are not implemented in SA-6.

## Space Agency full organization implementation - 2026-05-15

Assumptions:
- Active user goal is approval to continue implementation after recording this plan.
- `frontend-reference` corporation names are source aliases; current repo names and ids remain authoritative for code and docs.
- `extraData` in `frontend-reference` is excluded because the reference marks it disabled and the current repo has 11 confirmed organizations.
- Organization behavior belongs in organization classes or generic organization registry hooks. Shared engine extension points may be added when needed, but concrete organization-id branches should not be added to `Game` or action classes.
- Client work is limited to protocol/projection changes needed for existing controls; new organization-specific UI affordances are not added unless server behavior cannot be exercised otherwise.

Success criteria:
- `docs/arch/spaceAgency/corporations/` maps every current organization id/name to the matching reference alias and contains a non-TODO ability summary.
- Every `EOrganizationId` has a concrete server implementation for its documented passive, main-action, or once-per-round ability, with private state under `player.organizationState[organizationId]` when needed.
- Generic hooks cover passive reactions such as played-card signal rewards, launch-probe signals, researched-tech rewards, temporary tech modifiers, disabled tech modifiers, and prepared-card play without hardcoding organization behavior in normal actions.
- Focused tests prove each organization's key behavior, serialization/projection-sensitive state, and once-per-round reset or turn-end cleanup where applicable.
- A fresh implementation subagent, code-review subagent, and test-review subagent are used; confirmed findings are fixed.
- Focused common/server/client checks, package typechecks where touched, Biome on touched files, and `git diff --check` pass or any blocker is recorded with exact command output.

Plan:
- [x] Verify source alias mapping from `frontend-reference` and update corporation Markdown files with ids and ability summaries.
- [x] Add failing tests for the currently missing or incorrect organization behaviors before implementation.
- [x] Add generic organization/runtime extension points needed by the tests.
- [x] Implement all organization classes with minimal state and no unrelated refactors.
- [x] Update projection/common/client protocol only where server behavior needs surfaced state or availability.
- [x] Run focused verification and fix failures.
- [x] Run independent subagent code review and test/E2E review, then fix confirmed findings.
- [x] Record review evidence and residual risk in this section.

Progress:
- Added focused runtime-event tests proving `TECH_ACQUIRED` and `PROBE_LAUNCHED` are emitted only after concrete effect resolution.
- Added generic organization main-action and effective-tech hooks, plus viewer projection for usable organization main actions.

Review:
- Mapped all 11 current organizations to `frontend-reference` corporation aliases under `docs/arch/spaceAgency/corporations/`; the disabled `extraData` reference entry is intentionally excluded, and Deep Sky keeps the repo's existing configured values rather than the reference's mismatched numeric values.
- Implemented the remaining organization behavior in concrete organization classes, including card-row/deck powers, probe and tech passives, prepared-card play, Xenolab tile actions, effective disabled/temporary tech hooks, and launch/tech runtime event reactions.
- Added generic main-action dispatch and viewer-only `usableOrganizationMainActionIds` projection so Futurespan and Xenolab can be used without organization-specific branches in normal actions.
- Independent subagents completed mapping/architecture exploration, three implementation slices, code review, and test review; confirmed findings were fixed, including organization main-action availability, Sentinel launch signals, Futurespan edge cases, Cosmos black-sector choice, and Helion optional marking.
- Verification passed: server focused suite 15 files/213 tests, common action rules 33 tests, client action menu 7 tests, common/server/client typechecks, Biome check on 42 touched files, locale JSON parsing, and `git diff --check`.

## Space Agency organization architecture refactor - 2026-05-15

Assumptions:
- Scope is an architecture refactor of the existing SA-4/SA-5 organization implementation before adding more organization behavior.
- The current behavior for Quick Start, Deep Sky, Fenwick, Mission Relay, Stratus, and Sentinel should remain the same unless a test proves the existing behavior is wrong.
- Use the existing project todo file `docs/TODO.md` rather than creating a new lowercase `docs/todo.md`.
- `backend-reference` corporation cards are the architectural reference: one runtime class per corporation/organization, registered by a manifest/registry, with setup/action/event behavior owned by that class.

Success criteria:
- Every `EOrganizationId` has a concrete server class registered through `OrganizationRegistry`; no organization behavior is selected by switch/if chains outside organization classes.
- Player action costs are runtime configuration on the player, with defaults such as research tech = 6 publicity and analyze data = 1 energy. Fenwick/Deep Sky update that player config when the organization is resolved or restored.
- `UseOrganizationPowerFreeAction` becomes a generic dispatcher: validate ownership/phase/once-per-round, then delegate `canUsePower` and `usePower` to the organization instance.
- Organization event responses are registered through `GameEventBus` or a generic organization hook owner, so `Game` no longer imports/calls Sentinel/Fenwick/Stratus-specific methods.
- Common/client action availability uses projected player runtime config and projected usable organization powers, not hardcoded organization ids.
- Serialization/deserialization restores player runtime config and re-registers organization event listeners deterministically.

Plan:
- [x] Add failing tests for the desired seams: player-configured research/analyze costs without organization id checks, registry class coverage for every organization id, generic free-action dispatch, Sentinel event response through the runtime bus, and public projection of usable organization power ids.
- [x] Add player runtime config types/defaults in common/server, persist/project them, and update server/common action-cost helpers to read the config.
- [x] Split `packages/server/src/engine/organization/Organization.ts` into a base/configured organization plus one concrete class per organization under `packages/server/src/engine/organization/organizations/`.
- [x] Replace `OrganizationRegistry.create` data wrapping with explicit factory registration and add helper methods for resolving, restoring, registering event listeners, and computing usable organization powers.
- [x] Move Mission Relay setup, Fenwick/Deep Sky action-cost modifiers, Stratus/Fenwick/Sentinel powers, and Sentinel armed-card response into their owning organization classes.
- [x] Remove organization-id hardcodes from `Game`, `UseOrganizationPowerFreeAction`, `ResearchTechAction`, `AnalyzeDataAction`, `common/src/rules/actions.ts`, and `common/src/rules/freeActions.ts`.
- [x] Run focused common/server/client tests, package typechecks, Biome on touched files, `git diff --check`, and then record review evidence here.

Review:
- Refactored server organizations to match the backend-reference corporation shape: every `EOrganizationId` now has a concrete organization class and `OrganizationRegistry` owns factory registration, restore hooks, and usable-power projection.
- Moved organization behavior out of generic game/action code: Deep Sky and Fenwick modify `player.actionCosts`, Mission Relay owns setup gold-tile marking, Stratus/Fenwick/Sentinel own their free-action behavior, and Sentinel registers its runtime event listeners through the event bus.
- Added persisted/projected player runtime action costs and viewer-only `usableOrganizationPowerIds`; common/client action availability now reads those projected fields instead of rechecking organization ids.
- Replaced organization-specific branches in `UseOrganizationPowerFreeAction` with ownership/phase/once-per-round validation plus `canUsePower`/`usePower` delegation to the organization instance.
- Removed direct Sentinel handling from `Game` and removed Deep Sky/Fenwick id checks from analyze/research actions and common action helpers.
- Verification passed: common focused tests 81, server focused tests 110, client focused tests 59, common/server/client typechecks, Biome check on the touched files, and `git diff --check`.

## Space Agency SA-5 remaining organization powers slice 2 - 2026-05-15

Assumptions:
- Active goal to complete the full Space Agency plan is treated as approval to continue this scoped SA-5 sub-slice after recording it here.
- Rules come from `docs/arch/spaceAgency/rulebook.md`, `docs/arch/spaceAgency/faq.md`, and the organization card images under `packages/web/public/corps/`.
- This slice implements the next seam-validation set only: Fenwick Research Center once-per-round, Sentinel Probe Network once-per-round, and Mission Relay setup gold-tile premark.
- Mission Relay's shown tile maps to the existing `mission` gold scoring tile; this slice marks that tile's current lowest slot value instead of changing the broader gold-tile score model.
- Fenwick and Sentinel may apply only card corners that the existing `FreeActionCornerFreeAction` can resolve; broader chained `CARD_ANY` support remains a later SA-5 task.

Success criteria:
- `canUseOrganizationPower` and the server dispatcher expose Fenwick and Sentinel only when owned, unused this round, and immediately resolvable by the current engine.
- Fenwick can spend 1 publicity to gain a selected card-row card or a random deck card, then resolves that card's free-action corner without discarding the gained card.
- Sentinel can be armed once per round and, after the next non-alien card played as a main action is fully resolved, applies that card's free-action corner; alien cards do not trigger it.
- Mission Relay organization setup premarks the lowest slot of the `mission` gold scoring tile, prevents that player from claiming that tile again, and makes Solvay Conference treat it as already marked.
- Serialization/projection keeps organization state and once-per-round usage safe; existing Deep Sky/Fenwick passive and Stratus behavior do not regress.

Plan:
- [x] Add failing common/server tests for Fenwick/Sentinel availability, Fenwick row/deck execution, Sentinel armed trigger, Mission Relay setup premark, and Solvay interaction.
- [x] Implement the minimal server/common changes for those three behaviors using existing input/card-corner/gold-tile helpers.
- [x] Add or adjust focused client coverage if the newly enabled powers change visible free-action controls.
- [x] Run focused common/server/client tests and typechecks, Biome on touched files, and `git diff --check`.
- [ ] Run a fresh independent code-review subagent for this slice and fix confirmed findings.
- [ ] Run a fresh independent test/E2E review subagent for this slice and fix confirmed findings.

## Space Agency SA-5 complex organizations + Quick Start - 2026-05-15

Assumptions:
- Active goal to complete the full Space Agency plan is treated as approval to execute this scoped SA-5 plan after recording it here.
- SA-5 enables `spaceAgencyOptions.startResourceCards=true` only when agencies are enabled; `newDeck`, signal-token scan, and new alien species remain deferred to SA-6+.
- Quick Start cards reuse existing `preludeCards` data internally; only UI copy says "Quick Start Card".
- Organization ability rules come from `docs/arch/spaceAgency/rulebook.md`, `docs/arch/spaceAgency/faq.md`, and the existing organization card images under `packages/web/public/corps/`.
- Where a full interactive card-specific power would require broad new UX not needed for SA-5's first playable path, implement the smallest faithful server contract and keep unsupported branches explicitly rejected rather than silently ignored.
- SA-5 organization runtime support in this slice covers the implemented engine seams only: Fenwick passive research cost, Deep Sky passive analyze-data cost, and Stratus Core once-per-round card-row corner copying when no copied corner needs an extra choice.

Success criteria:
- Agencies setup with `startResourceCards=true` deals each setup player 3 Quick Start candidates, lets them pick exactly 2, resolves selected lower effects before upper setup marks, stores selected ids, then proceeds through organization resources/tucks into `AWAIT_MAIN_ACTION`.
- Quick Start upper signal/trace/orbiter setup marks are silent: they do not grant setup benefits, trigger missions, or fire alien/runtime mark hooks.
- 1-2 player games with Quick Start prepare neutral upper markers from revealed neutral Quick Start cards without granting rewards.
- Organization free-action dispatcher can execute implemented once-per-round powers, marks `oncePerRoundUsed`, rejects unavailable/used/unsupported powers, and resets usage at round end.
- Mandatory passive powers that have clear existing engine seams are enforced server-side, including Fenwick 5-publicity research and Deep Sky zero-energy analyze data.
- Player quick-start ids and organization private state serialize, deserialize, and project safely; client displays Quick Start choices/thumbnails and organization powers without hand-written rule icons.

Plan:
- [x] Add failing common/server tests for Quick Start metadata, selection/runtime, silent marks, and supported option gating.
- [x] Add remaining tests for organization powers/passives, persistence/projection, and client rendering.
- [x] Implement Quick Start candidate dealing, setup-choice step, `PreludeRegistry`/runtime, selected-card storage, and neutral setup markers.
- [x] Add setup-only silent trace/signal/orbiter paths for Quick Start marks.
- [x] Implement supported organization once-per-round dispatcher paths and guarded unsupported branches; no event subscriptions are needed for the included Fenwick/Deep Sky/Stratus slice.
- [x] Implement clear mandatory passives and guarded unsupported branches without weakening BASE behavior.
- [x] Implement client Quick Start selection cards/thumbnails and enabled organization power controls using existing `DescRender`/card renderers.
- [x] Run focused tests/typechecks, Biome, `git diff --check`, and real UI E2E for agencies + Quick Start.
- [x] Run an independent SA-5 code review subagent and fix confirmed findings.
- [x] Run an independent SA-5 test/E2E review subagent and fix confirmed findings.

Review:
- Added Quick Start metadata/runtime using existing `preludeCards`: candidates are dealt per player, players choose exactly two, lower rewards resolve before upper setup marks, selected ids are stored/projected, and 1-2 player neutral upper markers resolve without lower rewards.
- Added silent setup paths for signal, trace, and orbiter marks so Quick Start upper marks do not trigger mission events, alien trace hooks, runtime mark hooks, or setup rewards.
- Added the implemented SA-5 organization runtime seams: Deep Sky analyze data costs 0 energy, Fenwick research tech costs 5 publicity, and Stratus Core can copy card-row free-action corners once per round when the copied corners need no follow-up choice.
- Kept unsupported organization branches explicit: metadata now distinguishes implemented passive/once-per-round behavior from setup-only organizations, and the server rejects unowned, used, or unsupported organization powers.
- Fixed confirmed review findings: setup-choice deserialization now rebuilds the all-done barrier from participating players only, setup completion resolves all players' Quick Start cards before any organization setup, and client/common Stratus availability matches the server's unsupported `CARD_ANY` guard.
- Added client Quick Start choice previews/thumbnails and localized Quick Start labels, plus organization power buttons that pass the organization id through the game layout free-action path.
- Added real-flow E2E coverage for agencies + Quick Start setup and hardened the Quick Start option picker to wait for selected options to leave the pending-input list.
- Independent code review found no critical issues after the fix pass; independent test/E2E review findings were implemented, including neutral marker coverage, silent event negatives, invalid Quick Start selection coverage, and GameLayout organization-power coverage.
- Verification passed: common focused tests 82, server focused tests 128, client focused tests 60, common/server/client typechecks, Biome check on 56 changed TS/TSX/JSON files, `git diff --check`, and Playwright specs `space-agency-agencies-setup.spec.ts` plus `space-agency-options.spec.ts`.
- Residual scope intentionally remains in the main implementation plan: full all-11 organization custom powers/state machines, New Deck, signal-token scan gameplay, and new alien species modules are not complete in this slice.

## Space Agency SA-4 organization core - 2026-05-15

Assumptions:
- This slice implements only `SA-4`: agencies-only Space Agency setup, simple organization metadata/runtime, and minimal client shell.
- "Simple organizations" means organizations that can be resolved from static setup resources/income without custom private state machines; complex/passive/once-per-round behavior beyond a safe shell remains for SA-5 unless already expressible with existing effect helpers.
- Quick Start cards, New Deck, signal-token scan, and new alien species remain deferred.
- BASE setup, setup tuck, and normal lobby/game start must remain unchanged.

Success criteria:
- Common exports `EOrganizationId`, `IOrganizationData`, and a deterministic `ORGANIZATIONS` pool for the SA-4 simple organizations.
- A game with `spaceAgencyOptions.enabled=true` and `agencies=true` enters `SETUP_CHOICE`, lets each player select one organization, resolves the selected organization, then enters `AWAIT_MAIN_ACTION`.
- Agencies setup starts players at publicity 0, `roundIndex=2`, and three end-of-round stacks; BASE still starts at publicity 4, `roundIndex=1`, and four stacks.
- Player organization ids/state/once-per-round usage serialize, deserialize, and project to the owning/public game state safely.
- Client displays organization candidates through the existing setup-choice input path, shows selected organization badges, and exposes a disabled/guarded organization power shell without enabling unfinished powers.

Plan:
- [x] Add failing common/server/client tests for organization metadata, registry/runtime setup, SA setup-choice production flow, persistence/projection, and dashboard rendering.
- [x] Implement common organization types/data and use them as setup-choice candidates.
- [x] Implement server `Organization`, `OrganizationRegistry`, player fields, persistence/projection, and agencies setup wiring.
- [x] Add guarded `USE_ORGANIZATION_POWER` protocol/server/client shell without complex powers.
- [x] Implement client organization selection/badge/free-action shell using existing UI patterns.
- [x] Run focused tests/typechecks, Biome, `git diff --check`, and a real UI E2E for agencies setup.
- [x] Run an independent SA-4 code review subagent and fix confirmed findings.
- [x] Run an independent SA-4 test/E2E review subagent and fix confirmed findings.

Review:
- Added shared organization ids/data/setup metadata and exported them through common for server/client reuse.
- Wired agencies setup to deal two seeded organization candidates per non-rival player, reject selections outside that player's candidates, resolve selected setup resources/income/tucks/probes, and start the game after all setup choices finish.
- Added player organization state, once-per-round usage, serializer/deserializer DTO fields, and public projection so private organization runtime state is only visible to the owning viewer.
- Added guarded `USE_ORGANIZATION_POWER` protocol/server/client shell; setup-only organization powers are not exposed as available free actions and malicious unowned/setup-only requests are rejected server-side.
- Added client organization selection cards using `DescRender` icons plus accessible setup summaries, selected organization badges for player/opponents, and disabled organization power buttons.
- Added explicit SA-4 server guard for unsupported Space Agency submodules so Quick Start, New Deck, new alien species, or SA-without-agencies configurations cannot silently start with ignored options.
- Independent code review found and confirmed fixes for Deep Sky data pool handling, per-player two-candidate dealing, unsupported option rejection, and organization setup-card icon rendering/accessibility. Final re-review reported no P0/P1/P2/P3 findings.
- Independent test/E2E verification passed: common focused tests 58, server focused tests 109, client focused tests 63, common/server/client typechecks, Biome on 61 changed TS/TSX/JSON files, `git diff --check`, and both Playwright specs `space-agency-agencies-setup.spec.ts` and `space-agency-options.spec.ts`.
- Residual scope intentionally deferred to SA-5+: complex organization powers/state machines, Quick Start card setup, Space Agency deck/signal-token gameplay, and new alien species modules.

## Space Agency SA-3 setup-choice protocol - 2026-05-15

Assumptions:
- This slice implements only `SA-3`: Space Agency option validation, `SETUP_CHOICE` protocol/state surface, a generic setup-choice coordinator, and minimal lobby/game UI shells.
- Real organization metadata, quick start card resolution, Space Agency deck injection, and new alien species behavior remain for SA-4+.
- Existing BASE setup and setup tuck behavior must remain unchanged.

Success criteria:
- `spaceAgencyOptions` is defaulted/validated consistently in common/server/client, including dependency toggles.
- `EPhase.SETUP_CHOICE` is legal in the phase machine without enabling real organization content yet.
- `SetupChoiceCoordinator` is unit-tested independently for selectable candidates, disabled steps, auto-choice, invalid picks, and all-players-done barrier.
- Player setup-choice context and `quickStartCardIds` are serializable, deserializable with legacy defaults, and projected to public state.
- Lobby UI exposes Space Agency toggles with dependency behavior, and game UI can show a generic setup-choice shell around existing pending input.

Plan:
- [x] Add failing common/server/client tests for SA option validation, phase transitions, setup-choice coordinator, projection/persistence, and lobby UI dependencies.
- [x] Implement common protocol types/defaults/validation and `SETUP_CHOICE` phase support.
- [x] Implement server player state fields, DTO/projection persistence, and the generic setup-choice coordinator.
- [x] Implement minimal client `SpaceAgencyOptionsSection` and setup-choice pending-input shell.
- [x] Run focused tests/typechecks and `git diff --check`.
- [x] Run an independent SA-3 code review subagent and fix confirmed findings.
- [x] Run an independent SA-3 test/E2E review subagent and fix confirmed findings.

Review:
- Added shared Space Agency option defaults/validation, including dependencies between `enabled`, `agencies`, `startResourceCards`, `newAlienSpecies`, and the existing Glyphids/Amoeba alien module flags.
- Added `EPhase.SETUP_CHOICE`, setup-choice protocol metadata, per-player setup-choice context, and `quickStartCardIds` projection/persistence fields with legacy deserialization defaults.
- Added `SetupChoiceCoordinator` with fixture-backed candidates, disabled-step skipping, single-candidate auto-choice, optional skip/done paths, invalid-pick validation, reserved-id protection, and all-players-done barrier tests.
- Added room DTO support for `expansions` and `spaceAgencyOptions`, plus a DTO regression so the host room settings UI can PATCH Space Agency options through the real server validation pipe.
- Added `SpaceAgencyOptionsSection` to the lobby room settings panel and a generic setup-choice shell around the existing `InputRenderer` for future SA setup prompts.
- Added real UI E2E coverage in `packages/e2e/tests/space-agency-options.spec.ts`: host registers, creates a room, toggles Space Agency dependencies through the room UI, guest joins, and guest sees read-only Space Agency status. No network mocks, auth storage injection, debug endpoints, or raw websocket driving are used.
- Independent SA-3 code review subagent passed after fixes for missing absent-options validation, optional setup skip/done behavior, and reserved candidate-id collision.
- Independent SA-3 test/E2E subagent passed: common options test (13), server focused tests (70), client focused tests (47), and the Space Agency Playwright spec (1).
- Main-thread verification passed: common/server/client typechecks, Biome check on 32 touched files, focused DTO/lobby/server tests, Space Agency Playwright spec, and `git diff --check`.
- Residual risk: real organization candidates, quick start card resolution, Space Agency deck injection, and new alien species gameplay are intentionally still deferred to SA-4+.

## Current diff review fixes - 2026-05-15

Assumptions:
- Scope is limited to the three review findings from the current uncommitted diff: runtime event timing, research-tech event patch consumption, and Biome diagnostics.
- Existing staged/unstaged work remains intact; fixes are minimal and directly tied to those findings.

Success criteria:
- Signal and trace runtime events fire only after the actual sector/trace placement has succeeded.
- Research-tech runtime event patches are consumed before the tech decision is executed.
- Focused tests, typechecks, Biome check for touched files, and `git diff --check` pass.

Plan:
- [x] Add failing tests for event timing and research-tech patch consumption.
- [x] Move placement events to the atomic placement points and consume research-tech patches before execution.
- [x] Run formatter/lint fixes only for touched files.
- [x] Verify focused tests, typechecks, Biome, and diff whitespace.

Review:
- Added regression tests proving `MARK_PLACED` and `TRACE_PLACED` do not fire while the engine is only creating/selecting pending input, then do fire after the actual sector/trace placement succeeds.
- Added a research-tech regression proving `EGameRuntimeEvent.RESEARCH_TECH` patches the filter before tech selection, so a listener can force a specific tech decision.
- Moved signal placement events into `MarkSectorSignalEffect.markOnSector` and trace placement events into `AlienState.applyTraceToSlotInternal`, with concrete sector/slot context.
- Added `EGameRuntimeEvent.RESEARCH_TECH` consumption in `ResearchTechAction.execute` before availability checks and execution.
- Fixed Biome diagnostics in the touched client/server/e2e files, including missing `vi` imports in lobby tests and E2E formatting/import order.
- Verification passed: focused red runs failed before implementation; `pnpm --filter @ender-seti/common exec vitest run __tests__/types/protocol/options.test.ts`; `pnpm --filter @ender-seti/common typecheck`; `pnpm --filter @seti/server exec vitest run __tests__/engine/events/GameEventBus.test.ts __tests__/engine/Game.test.ts __tests__/engine/actions/ResearchTech.test.ts __tests__/engine/GameOptions.test.ts __tests__/engine/GameSetup.test.ts __tests__/engine/GameRoundTransition.test.ts __tests__/persistence/serializer/GameSerializer.test.ts __tests__/persistence/serializer/GameDeserializer.test.ts __tests__/lobby/lobby.controller.test.ts __tests__/lobby/lobby.service.test.ts`; `pnpm --filter @seti/server typecheck`; `pnpm --filter @seti/client exec vitest run __tests__/api/lobbyApi.test.ts __tests__/pages/lobby/GameSettingsPanel.editable.test.tsx __tests__/pages/lobby/GameSettingsPanel.test.tsx __tests__/components/CreateRoomDialog.test.tsx __tests__/components/RoomCard.test.tsx`; `pnpm --filter @seti/client typecheck`; `pnpm exec biome check --diagnostic-level=error` on the 40 touched TS/TSX files; `git diff --check`.
- Playwright E2E was not run in this pass.

## Space Agency implementation plan - 2026-05-14

Assumptions:
- The requested work is planning only; implementation starts after user confirmation.
- The source architecture is `docs/plan/space-agency-cosmic-hellman.md`.
- The detailed plan is maintained in `docs/plan/space-agency-implementation-plan.md` and this file records the planning review.
- Tasks should execute serially, while each task may run multiple subagents in parallel on disjoint scopes.
- `frontend-reference` is available and was used as a front-end implementation reference; no dedicated `backend-reference` folder exists, so current corporation/setup code paths were used as the server reference baseline.

Success criteria:
- The plan decomposes Space Agency work into serial, independently verifiable tasks.
- Each task lists scope, dependencies, parallel subagent lanes, verification, and exit criteria.
- The plan preserves BASE zero-regression as an explicit gate.
- No production code is changed during planning.

Plan:
- [x] Read current lessons and Space Agency architecture plan.
- [x] Inspect current common/server/client/alien entry points enough to avoid an abstract plan.
- [x] Refine `docs/plan/space-agency-implementation-plan.md` into serial independent tasks with per-task parallel subagent lanes.
- [ ] Confirm this plan with the user before implementation begins.

Review:
- Refined the serial implementation plan into tasks `SA-0` through `SA-10`, each with an explicit independent deliverable, bounded scope, dependency gate, and internal parallel subagent split.
- Incorporated code-exploration findings: lobby update should use `PATCH /lobby/rooms/:id/options`, setup choice should reuse the existing pending-input surface, scan should extend the existing `SPEND_SIGNAL_TOKEN` rail, `AMOEBA`/`GLYPHIDS` already exist while `ARKHOS` does not, and `GameEventBus` must be separate from `EventLog`.
- Incorporated `frontend-reference` findings: setup/state references come mainly from `states.js` and `setup.js`, and visual/assets references come from `frontend-reference/storage.googleapis.com/cgo-projects/seti/assets`.
- Recorded that no dedicated `backend-reference` directory exists, so current server corporation/setup files are the authoritative implementation reference for the server-side plan.
- Kept Glyphids/Amoeba and Arkhos as separate serial tasks because Arkhos has a materially larger data/runtime/projection gap.
- Recorded that glyph/organelle token rendering should stay on the existing `DescRender` / `EffectFactory` chain.
- No business code was changed.
- Verification passed: `git diff --check -- docs/todo.md docs/plan/space-agency-implementation-plan.md`.
- Awaiting user confirmation before any implementation task starts.

## Space Agency SA-1 option foundation - 2026-05-14

Assumptions:
- This slice implements only `SA-1`: shared option contract, record-based alien toggles, and editable lobby room options.
- No Space Agency gameplay flow is enabled yet; this is option/lobby groundwork only.

Success criteria:
- `IGameOptions` moves to common as the single source of truth.
- `alienModulesEnabled` uses `Record<EAlienType, boolean>` across common/server/client.
- Lobby create-room and room settings flows both use the shared contract.
- Host can patch room options through `PATCH /lobby/rooms/:id/options`.

Plan:
- [x] Add shared common options module and migrate server re-export.
- [x] Update client/server option consumers from array toggles to record toggles.
- [x] Add lobby room option patch endpoint and client API.
- [x] Add focused regression tests and package typechecks.

Review:
- Added `packages/common/src/types/protocol/options.ts` as the shared source for `IGameOptions`, `EExpansion`, default alien toggle records, validation, and option helpers.
- Replaced server-local `GameOptions` definitions with re-exports from common and migrated `GameSetup` to read alien enablement by alien id instead of array index.
- Reworked client lobby normalization and form submission to use record-shaped alien toggles, and added editable host controls through `CoreAlienModulesSection` plus `lobbyApi.updateRoomOptions`.
- Added `PATCH /lobby/rooms/:id/options` on the server and merged nested alien-toggle patches safely before validation/persistence.
- Added focused regression coverage in common/client/server for shared options, lobby API normalization/patching, editable settings UI, controller routing, and service merge behavior.
- Verification passed: `pnpm test -- __tests__/types/protocol/options.test.ts` in `packages/common`; `pnpm typecheck` in `packages/common`; `pnpm test -- __tests__/api/lobbyApi.test.ts __tests__/pages/lobby/GameSettingsPanel.editable.test.tsx __tests__/pages/lobby/GameSettingsPanel.test.tsx __tests__/components/CreateRoomDialog.test.tsx __tests__/components/RoomCard.test.tsx` in `packages/client`; `pnpm typecheck` in `packages/client`; `pnpm test -- __tests__/engine/GameOptions.test.ts __tests__/lobby/lobby.controller.test.ts __tests__/lobby/lobby.service.test.ts` in `packages/server`; `pnpm typecheck` in `packages/server`; `git diff --check -- packages/common packages/client packages/server docs/todo.md`.

### SA-1 follow-up review pass - 2026-05-15

Assumptions:
- Scope is limited to the two confirmed SA-1 follow-up findings in the current diff: invalid `alienModulesEnabled` payload acceptance and room-size shrink updates that later crash `startGame`.
- Existing in-flight user changes remain untouched unless directly required by these fixes.

Success criteria:
- `createGameOptions` rejects unknown alien keys and non-boolean alien toggle values before merge/persist.
- Waiting-room option updates reject reducing the room below the number of already joined human players.
- Focused common/server tests and relevant typechecks pass after the fixes.

Plan:
- [x] Tighten shared alien toggle validation in common options.
- [x] Block invalid waiting-room downsizing in lobby service.
- [x] Add focused regression tests for both follow-up findings.
- [x] Run focused tests and typechecks.

Review:
- Tightened `packages/common/src/types/protocol/options.ts` validation so alien toggle payloads must be record-shaped, use only known `EAlienType` keys, and contain only boolean values; complete option objects must define all alien types.
- Updated `packages/server/src/lobby/lobby.service.ts` so host room-option updates now compare the proposed room size against already joined players and reject impossible downsizes with a `BadRequestException` instead of deferring to a later 500 in `Game.create()`.
- Added regression coverage in `packages/common/__tests__/types/protocol/options.test.ts` for unknown alien keys and non-boolean toggle values, plus `packages/server/__tests__/lobby/lobby.service.test.ts` for room shrink rejection.
- Verification passed: `pnpm exec vitest run __tests__/types/protocol/options.test.ts` in `packages/common`; `pnpm typecheck` in `packages/common`; `pnpm --filter @seti/server exec vitest run __tests__/lobby/lobby.service.test.ts __tests__/engine/GameOptions.test.ts`; `pnpm --filter @seti/server typecheck`.

## Space Agency SA-2 server extension foundation - 2026-05-15

Assumptions:
- This slice implements only `SA-2`: server runtime hooks and persisted counters with BASE no-op behavior.
- Space Agency setup-choice, organizations, and gameplay remain inactive until later tasks.

Success criteria:
- Games expose `roundIndex`, `maxRounds`, and a runtime `eventBus` without changing BASE round flow.
- Base corporation is usable through the new `ISetupRole` contract without changing setup output.
- Serialization, deserialization, and public projection include the new round counters with safe legacy defaults.
- Event bus listeners can be ordered, owner-cleaned, and can merge context patches deterministically.

Plan:
- [x] Add failing server tests for round counters, setup role, event bus, and projection/persistence.
- [x] Add `GameEventBus` and `ISetupRole`, then initialize `eventBus` on `Game`.
- [x] Wire no-op runtime emit points for main/free/input/mark/trace/turn/round boundaries.
- [x] Add DTO/public-state round counter fields and legacy deserialization defaults.

Review:
- Added `packages/server/src/engine/events/GameEventBus.ts` with ordered subscriptions, owner cleanup, and merged context patches; it is separate from `EventLog`.
- Added `packages/server/src/engine/setup/ISetupRole.ts` and made `CorporationCard` implement it so `BaseCorporation` remains the BASE setup role.
- Added `roundIndex` and `maxRounds` on `Game`/`IGame`, serialized them, projected them to public state, and restored missing legacy snapshot values from current `round` and default `5`.
- Added no-op runtime event emissions around main action resolution, free actions, input resolution, mark/trace placement, turn handoff, and round boundaries.
- Verification passed: focused red test run failed on missing `roundIndex`, `eventBus`, projection fields, and `GameEventBus`; focused green test run passed with `pnpm --filter @seti/server exec vitest run __tests__/engine/events/GameEventBus.test.ts __tests__/engine/Game.test.ts __tests__/engine/GameSetup.test.ts __tests__/engine/GameRoundTransition.test.ts __tests__/persistence/serializer/GameSerializer.test.ts __tests__/persistence/serializer/GameDeserializer.test.ts`; `pnpm --filter @seti/server typecheck`; `pnpm --filter @ender-seti/common typecheck`; `git diff --check`.

## Space Agencies alien aid conversion - 2026-05-13

Assumptions:
- The source is `docs/arch/spaceAgency/SE2 aliens aid EN 14.pdf`.
- The PDF contains three alien species to add under `docs/arch/aliens`: Arkhos, Glyphids, and Amoeba.
- Existing `docs/arch/aliens/<alien>/rule.md` files define the target documentation shape: Raw Layer, Detailed Layer, and implementation notes.
- The existing repository uses `docs/TODO.md`; this entry is recorded there instead of creating a duplicate lowercase `docs/todo.md`.
- Active direct task request is treated as approval to execute this scoped documentation/assets task after recording the plan.

Success criteria:
- `docs/arch/aliens/arkhos`, `docs/arch/aliens/glyphids`, and `docs/arch/aliens/amoeba` exist with `rule.md` and `assets/`.
- Each `rule.md` captures the PDF rules for setup, card flow, species-specific mechanics, solo/rival notes, and implementation-oriented contracts.
- Each `assets/` folder contains stable, descriptive PNG crops for the species board, card back or equivalent card example, and key species components/examples.
- Verification includes PDF page coverage, file-structure audit, image-dimension audit, and `git diff --check` for touched documentation paths.

Plan:
- [x] Extract the 6-page alien aid PDF and map page pairs to species.
- [x] Create rule documents matching the existing alien documentation structure.
- [x] Crop species assets from the rendered PDF pages into the matching alien folders.
- [x] Verify structure, image dimensions, rule coverage, and diff whitespace.

Review:
- Converted `SE2 aliens aid EN 14.pdf` into three new alien folders: `docs/arch/aliens/arkhos`, `docs/arch/aliens/glyphids`, and `docs/arch/aliens/amoeba`.
- Added `rule.md` for each species using the existing Raw Layer / Detailed Layer structure, including PDF-derived rules, relevant FAQ clarifications, and current code-state notes.
- Added 18 PNG assets cropped from the rendered PDF pages: 6 each for Arkhos, Glyphids, and Amoeba.
- Noted implementation status differences: Arkhos has no canonical `EAlienType` or card data yet; Glyphids and Amoeba have Space Agencies card metadata/registration but no dedicated alien plugins yet.
- Verification passed: 6-page PDF page-pair mapping, rule coverage scan, file-structure audit, PNG dimension audit for all 18 new assets, visual contact-sheet review, and `git diff --check -- docs/TODO.md docs/arch/aliens/arkhos docs/arch/aliens/glyphids docs/arch/aliens/amoeba`.

## Alien rule sheets asset extraction - 2026-05-13

Assumptions:
- The source is `docs/references/SETI_Alien_rule_sheets_(EN).pdf`.
- The five in-scope aliens are the five existing rule notes under `docs/arch/aliens`: Mascamites, Anomalies, Oumuamua, Centaurians, and Exertians.
- The existing repository uses `docs/TODO.md`; this entry is recorded there instead of creating a duplicate lowercase `docs/todo.md`.
- Active goal continuation is treated as confirmation to execute this scoped documentation/assets task after recording the plan.

Success criteria:
- `docs/arch/aliens` is organized as one folder per alien, each with `rule.md` and `assets/`.
- Each `rule.md` preserves the existing rule content for that alien.
- Each `assets/` folder contains identified and named assets for the alien board, components, and card back where the PDF page provides them.
- Asset names are stable, descriptive, lowercase, and scoped to the alien folder.
- Verification includes a PDF page/image audit, file-structure audit, image-dimension audit, and `git diff --check` for the touched documentation paths.

Plan:
- [x] Inspect PDF pages/images and map each alien page pair to its alien name.
- [x] Extract candidate images from the PDF and identify board, component, and card-back assets.
- [x] Restructure `docs/arch/aliens` into per-alien folders with `rule.md` plus categorized `assets/`.
- [x] Verify asset presence, image dimensions, and Markdown/file structure; append review evidence here.

Review:
- Mapped the 10-page PDF into five page pairs: Mascamites 1-2, Anomalies 3-4, Oumuamua 5-6, Centaurians 7-8, and Exertians 9-10.
- Moved the five existing alien notes into `docs/arch/aliens/<alien>/rule.md` and verified each file matches the previous `HEAD:docs/arch/aliens/<alien>.md` content byte-for-byte.
- Added native-resolution page-composite PNG crops for each alien, including `alien-board.png`, `card-back.png`, and species-specific components/examples such as sample tokens, anomaly tokens, Oumuamua tile/exofossils, Centaurian message tiles, and Exertian milestone/danger images.
- Updated direct documentation references from the old `docs/arch/aliens/<alien>.md` paths to `docs/arch/aliens/<alien>/rule.md`.
- Verification passed: PDF page/image audit via PyMuPDF native-density render contact sheet, file-structure audit, image-dimension audit for all 28 PNG assets, old-path reference scan, and `git diff --check` on touched documentation paths.

## Space Agencies expansion rulebook markdown - 2026-05-13

Assumptions:
- The output should be an English Markdown rule document at `docs/arch/spaceAgency/rulebook.md`, next to the source PDF and expansion FAQ.
- The PDF is the primary source. `docs/arch/spaceAgency/faq.md` may add clarifications, but any supplement must be labeled as clarification rather than silently replacing the PDF text.
- `docs/arch/rule-simple.md` is used only to explain how these expansion rules increment the base game; base-game rules should not be duplicated unless needed for context.
- The existing repository uses `docs/TODO.md`; this entry is recorded there instead of creating a duplicate lowercase `docs/todo.md`.
- Active goal continuation is treated as approval to execute this scoped documentation task after recording the plan.

Success criteria:
- Every rules-bearing PDF section is represented in Markdown: cover premise, components, using this expansion, organizations setup, quick start cards, organizations card anatomy, 1-2 player adjustment, solo setup, long-term objectives, advanced action card fallback, signal tokens, printed FAQ, and credits/source metadata.
- Image-only icon meanings that affect rules are transcribed in text, including scan action, signal token, rival advancement, advanced action card, star difficulty, and Futurespan token references.
- Key FAQ logic from `docs/arch/spaceAgency/faq.md` is summarized in a separate clarification section, especially organizations, 4-round balance, quick start cards without organizations, starting income replacement, signal-token use, and trigger-like organization abilities.
- The document clearly states that Space Agencies is an optional expansion module and which components are always added when using the expansion.
- Verification includes PDF page-by-page visual/text audit, FAQ coverage audit, base-rule increment audit, markdown lint-style structural scan, and `git diff --check`.

Plan:
- [x] Extract PDF text and render page images for audit.
- [x] Write `docs/arch/spaceAgency/rulebook.md` with PDF-derived rules and explicitly labeled FAQ clarifications.
- [x] Compare the Markdown against all 5 PDF pages and targeted `faq.md`/`rule-simple.md` references.
- [x] Run final structural checks and append review evidence here.

Review:
- Created `docs/arch/spaceAgency/rulebook.md` as the Markdown rule document for the Space Agencies expansion option.
- Converted all rules-bearing PDF sections: component inventory, always-added expansion components, organization setup, quick start cards, organization anatomy, 1-2 player neutral setup, solo organization setup, long-term objectives, advanced-action-card fallback, signal tokens, printed FAQ, and source credits.
- Added an option-boundary section clarifying that disabling Space Agencies keeps base-game rules/components only, while enabling it adds the expansion cards/aliens/signal tokens and optionally the organizations + quick start module.
- Added explicitly labeled FAQ clarifications from `docs/arch/spaceAgency/faq.md`, covering all 50 FAQ headings/card IDs by audit: general questions, all 11 organizations, main-deck card clarifications, alien card clarifications, and promo card clarification.
- Verification passed: rendered all 5 PDF pages to `/tmp/demo-a2ui-spaceagency-pages` for visual audit; PyMuPDF text extraction confirmed 5 PDF pages; PDF/option checklist script passed 13 groups; FAQ heading/id coverage script passed 50 headings; Markdown structural scan passed; placeholder scan on `rulebook.md` found no matches; `git diff --check -- docs/TODO.md docs/arch/spaceAgency/rulebook.md` passed.

## Current diff code review - 2026-05-13

Assumptions:
- Scope is the current working tree relative to `HEAD`, with priority on planetary board moon landing changes and any cross-package inconsistencies they introduce.
- The explicit `$code-review` request and the provided review-and-fix skill are treated as approval to fix confirmed in-scope issues after this plan is recorded.
- `moonIndex` should not be used as a persisted/protocol identity. A moon slot needs a stable id; numeric ordering may remain only as an internal derived position for arrays/rendering.
- Existing user changes are not reverted; fixes must be minimal and directly tied to review findings.

Success criteria:
- Moon identity is stable across common config, server state/DTO/public projection, client action payloads, and tests.
- Multi-moon target selection lets users choose the exact moon slot/reward in both main action and card-driven land flows.
- Legacy snapshots using old moon fields remain readable at deserialization boundaries only.
- Focused common/server/client regression tests cover invalid moon targets, occupied moon targets, clicked moon payloads, and card-driven moon choices.
- Verification covers focused tests, relevant typechecks/static checks, and `git diff --check`.

Plan:
- [x] Review current diff and rule references for moon landing, protocol, serializer, and UI target paths.
- [x] Confirm findings that require code changes, starting with `moonIndex` as identity and card-driven moon selection.
- [x] Add failing focused tests for confirmed behavioral/API gaps.
- [x] Implement minimal shared moon-id model and update server/client consumers.
- [x] Run focused tests/type/static checks, re-review the diff, and record final evidence here.

Review:
- Fixed moon identity leak: runtime/server DTO/public state and client main-action payloads now use stable `moonId`; `moonIndex` is rejected at the action boundary and only remains as legacy snapshot input in deserialization.
- Added shared stable ids for configured moon slots and alignment tests proving ids, names, rewards, moon slot count, and landing-slot moon count stay in sync.
- Fixed card-driven moon selection (`buildLandPlanetSelection` and Mascamites land-then-pickup) so multi-moon planets expose one option per available moon id instead of one ambiguous per-planet moon option.
- Preserved legacy snapshot compatibility for both old `moonOccupant` and `moonOccupants[].moonIndex`, normalizing them to stable ids at deserialization only.
- Verification passed: common focused tests 9; server focused tests 102; client focused tests 10; common/server/client typecheck; Biome error-level check on 29 touched TS/TSX files; `git diff --check`.
- Review report: `docs/review/diff-2026-05-13-moon-id.md`.

### Follow-up server review pass

Assumptions:
- Subagent server review findings are external review feedback: verify against project rules before implementing.
- `docs/arch/rule-faq.md` project note is authoritative for card-granted tech rotation: generic card tech effects do not rotate unless the behavior also has an explicit rotate effect.
- Mascamites land-then-pickup must preserve all land reward continuations before sample pickup.
- LAND payloads should reject moon-only fields when `isMoon` is not true.
- Event log `at` values must remain monotonic after appending persisted legacy timestamped events.

Success criteria:
- BehaviorExecutor tech effect without explicit rotate does not rotate; tech + explicit rotate still rotates once.
- Mascamites moon land-then-pickup resolves moon reward pending input, then prompts sample pickup.
- Non-moon LAND payload with `moonId` is rejected before mutating board state.
- EventLog appends new events after legacy timestamped events with monotonic `at`.
- Focused server tests fail before fixes, pass after fixes, and targeted static/type checks are rerun.

Plan:
- [x] Add failing server regressions for the four confirmed loopholes.
- [x] Implement the smallest server fixes in BehaviorExecutor, Land/Mascamites flow, Game payload validation, and EventLog sequencing.
- [x] Run focused server tests plus type/static checks and update this review section.

Review:
- Confirmed and fixed generic card-granted tech rotation: `BehaviorExecutor` now calls `ResearchTechAction` with `skipRotation`, while explicit `ROTATE + TECH` still rotates exactly once.
- Confirmed and fixed Mascamites land-then-pickup continuation loss: moon land rewards now resolve before sample pickup by passing an `onComplete` continuation through `LandProbeEffect`.
- Confirmed and fixed non-moon LAND payload validation: `moonId` is rejected when `isMoon` is not true before board mutation.
- Confirmed and fixed legacy event ordering: `EventLog` advances its sequence from persisted `at` values so later events remain monotonic.
- Focused server regressions passed after fixes: `BehaviorExecutor`, `Land`, `MascamitesCards`, `EventLog`, plus updated `SolarSystem` and `CardEffectsIntegration` expectations for the FAQ rotation rule.

### Follow-up client/common review pass

Assumptions:
- Server is authoritative for LAND legality; common/client availability must mirror rover-discount landing cost.
- Unit tests that assert mocked `DescRender` test ids are insufficient for real reward icon parsing.

Success criteria:
- Common `canLandOnPlanet` and client planet target selection allow `PROBE_ROVER_DISCOUNT` landings at the discounted energy cost.
- Reward desc strings emitted by `PlanetCard` parse through the real common desc parser into known effects, so invalid token names are caught without relying on the global `@seti/cards` mock.

Plan:
- [x] Add failing common/client regressions for rover-discount LAND availability.
- [x] Add a parser-level reward desc regression that is independent of mocked `DescRender`.
- [x] Implement the smallest common/client fix and rerun focused checks.

Review:
- Confirmed and fixed client/common LAND availability drift: `canLandOnPlanet` now applies `PROBE_ROVER_DISCOUNT`, matching the server landing-cost modifier.
- Added a client board regression proving a two-energy discounted LAND target is clickable when the player has rover tech.
- Added parser-level reward desc coverage for `PlanetCard` output, independent of the global mocked `@seti/cards` `DescRender`.
- Focused common/client regressions passed after fixes.

### Follow-up E2E review pass

Assumptions:
- E2E should run against isolated server/client ports and matching runtime env, not whatever local dev server happens to occupy `5173`.
- Real UI planet-board assertions must work in both image mode and text mode.
- Full e2e failures outside the reviewed moon/landing/tech paths are recorded as residual review risks unless reproduced and fixed in this pass.

Success criteria:
- The local E2E harness starts server/client on the requested `SERVER_URL` / `CLIENT_URL`, passes matching API/WS env into Vite, uses strict Vite port binding, and avoids unsupported Node 22.11 for Vite.
- The focused orbit/land real-ui E2E passes on isolated ports after updating stale text-mode-only assertions.
- Remaining full-suite E2E failures are grouped and explicitly reported instead of hidden.

Plan:
- [x] Fix `scripts/run-e2e-local.sh` to honor requested ports/env and strict client port binding.
- [x] Fix `scripts/init-e2e-local.sh` to choose a Vite-compatible Node version: 20.19+, 22.12+, or 23+.
- [x] Update `main-action-orbit-land.spec.ts` so token assertions work for image-mode overlays as well as text-mode `PlanetCard`.
- [x] Rerun the focused real-ui orbit/land E2E on isolated ports and record residual full-suite E2E risk.

Review:
- The first full `pnpm test` exposed 13 E2E failures after all common/web/client/server unit and integration suites passed. Review found one harness issue: a pre-existing user Vite dev server occupied `5173`, while the E2E harness used non-strict `--port 5173` and did not pass `VITE_API_URL` / `VITE_WS_URL` for the isolated server.
- Fixed the harness so `SERVER_URL=http://127.0.0.1:3100 CLIENT_URL=http://127.0.0.1:5174 WS_URL=http://127.0.0.1:3100 scripts/run-e2e-local.sh ...` starts matching isolated services. `init-e2e-local.sh` now selects Node v23.3.0 on this machine instead of unsupported v22.11.
- Fixed stale image/text mode E2E selector assumptions in `main-action-orbit-land.spec.ts`; focused real-ui orbit/land E2E now passes 2/2 on isolated ports.
- Final verification after the E2E harness/spec fixes passed: `pnpm typecheck`, touched-file Biome error-level check, `bash -n scripts/init-e2e-local.sh scripts/run-e2e-local.sh`, `git diff --check`, and the isolated focused E2E command above for `tests/main-action-orbit-land.spec.ts` (2 passed).
- Residual full-suite E2E risk remains outside this focused pass: the prior full run ended with 51 passed / 13 failed, clustered around stale helper assumptions for setup/pending inputs, image-mode selectors, debug snapshot contracts, and long-flow deterministic card/sector expectations. These are documented in the final review summary and should be handled as a separate E2E stabilization pass.

### Completion audit and full E2E stabilization pass

Assumptions:
- The active goal is not complete until the current uncommitted implementation has no known reproducible failure in the reviewed scope, or any remaining failure is blocked by a concrete external dependency.
- The previous full E2E failure list is stale after harness and selector fixes; rerun the current suite before choosing fixes.
- Fixes should target root causes in product code or test helpers/contracts, not paper over failures with arbitrary waits.

Success criteria:
- Prompt-to-artifact checklist maps every explicit review requirement to concrete evidence.
- Current full E2E run is green, or every remaining failing test is reduced to a named external blocker with exact evidence.
- Any E2E helper or product change has a focused reproduction before the fix and a passing focused/full verification after.
- Final audit includes static/type checks, unit/integration coverage already run, full E2E evidence, and a residual-risk decision.

Plan:
- [ ] Build the prompt-to-artifact completion checklist from the active objective and repo instructions.
- [ ] Rerun the current full E2E suite on isolated ports to get the actual remaining failure list.
- [ ] Group failures by root cause and fix the smallest confirmed set.
- [ ] Rerun focused E2E tests for each fixed group, then rerun the full E2E suite.
- [ ] Rerun static/type checks and update this section with the final audit result.

## PRD/rule-tech implementation audit - 2026-05-13

Assumptions:
- `docs/arch/prd-rule.md` and `docs/arch/rule-tech.md` are the in-scope specs for this pass; `frontend-reference` is used only to disambiguate physical tech board asset/position mappings referenced by `rule-tech.md`.
- Existing project tech ids remain the canonical implementation ids; if reference `options.num` differs, the code must map reference assets/positions onto the canonical ids explicitly instead of changing persisted ids.
- Active goal continuation is treated as confirmation to implement after recording this plan.

Success criteria:
- Every explicit `rule-tech.md` tech id, board position, image, and effect mapping has focused regression evidence or a documented residual risk.
- Confirmed tech position/order mismatches are fixed with the smallest shared config/client change.
- The broader `prd-rule.md` audit is converted into a checklist by domain and compared against current implementation evidence, not just existing broad tests.
- Every confirmed loophole gets a failing regression test first, a minimal fix, and a fresh passing verification run.
- Final review records evidence, residual risk, and any uncovered/out-of-scope item.

Plan:
- [x] Add failing tests for canonical tech board position and image mappings.
- [x] Fix the tech layout/image mapping without changing persisted tech ids or rule semantics.
- [x] Run focused tech tests and type/static checks for touched files.
- [x] Continue the `prd-rule.md` checklist audit by domain, starting with setup/research/scan/analyze where current evidence is weakest.
- [x] Repeat red/green/audit loops for any additional confirmed mismatch.
- [x] Record final review evidence and residual risk here.

Review:
- Fixed canonical tech board order and image mapping without changing persisted tech ids. Regression coverage now asserts the shared `TECH_STACK_LAYOUT` order and client image sources for probe/scan/computer stacks.
- Fixed first end-of-round income so round 1 income applies the full base + tucked-card payout, matching setup/pass timing.
- Fixed Research Tech order and card-granted research semantics: main research rotates before spending publicity, card-granted tech rotates even when the tech take is unavailable, and rotation publicity gained during card effects is credited back to the player.
- Fixed tech bonus `LAUNCH_IGNORE_LIMIT` by allowing that bonus path to bypass the normal probe-in-space cap.
- Fixed Land legality and UI selection so repeated same-player ordinary-planet landings are allowed, moon duplicate restrictions remain, and card-driven land selection propagates pending input correctly.
- Fixed hidden-information leakage by removing future `endOfRoundStacks` from public game-state projection while preserving persistence DTO state.
- Fixed 2-cards-for-resource exchange protocol by requiring explicit `spentCardIds` for card exchanges on server/common/client paths.
- Fixed alien `onRoundEnd` extensibility by dispatching discovered species plugin round-end hooks during `Game.resolveEndOfRound`.
- Fixed Play Card availability so both server and client evaluate specific revealed hand cards, rather than enabling the action when any abstract hand size/resource condition looks true.
- Fixed event-log determinism and scalar mutation auditability: event factories no longer stamp wall-clock IDs/timestamps; `EventLog` assigns deterministic sequence ids and `at` values per log instance; generic player resource and score mutations now emit `RESOURCE_CHANGE` / `SCORE_CHANGE`.
- Completion audit report: `docs/review/prd-rule-tech-completion-audit-2026-05-13.md`.
- Verification passed after final formatting and event-log mutation fix: common full tests 14 files / 150 tests; server full tests 298 files / 1921 tests; client full tests 66 files / 265 tests; common/server/client typecheck; Biome error-level check on all changed TS/TSX files; `git diff --check`.
- Browser smoke passed at `http://127.0.0.1:5175/debug/game`: debug page rendered, image-mode planet board exposed `planetary-board-image-mode`, image mode did not render text planet cards, tech tab exposed all 12 tech stacks, all 12 inspected tech tile images loaded with nonzero natural dimensions, and current console had no errors/warnings.

## Planet board moon land bonus - 2026-05-13

Findings:
- This is a system issue, not only a text-mode rendering issue.
- Common currently exposes one shared `land.rewards` / `land.firstData` block per planet and has no moon-specific land reward config.
- Server `PlanetaryBoard.land()` stores moon occupants, then uses the same `config.land.rewards` and first-land data path for moon and planet landings.
- Public game state returns `configs: PLANETARY_BOARD_CONFIG`, so the client cannot display moon rewards unless common config grows that data.
- `frontend-reference` confirms moon rewards are per rover/moon slot and first-land data applies only to non-moon landings.

Reference moon rewards:
- Mars moon: `8 VP + 2 unlock production`
- Jupiter moons: `12 VP + 5 publicity`, `7 VP + 2 yellow trace`, `10 VP + 4 energy`, `13 VP + 4 data`
- Saturn moons: `12 VP + red/yellow/blue signal`, `7 VP + 2 any trace`
- Uranus moon: `25 VP`
- Neptune moon: `26 VP`

Assumptions:
- `frontend-reference` reward data is authoritative for the missing moon land rewards.
- Existing project naming should stay `land`, `moon`, and `landingSlotKinds`; legacy reference names like `Rover` should not leak into protocol or common naming.
- The minimal correct model is to add moon-specific reward arrays to common config, keyed by moon slot order, and let server/client consume that shared config.
- First-land data remains planet-only, matching `frontend-reference`; moon landing should not consume `firstLandDataBonusTaken`.
- Text mode must render planet and moon rewards through `DescRender` / `EffectFactory`, not plain text reward strings.
- Runtime/public planet state should use one canonical moon occupant field: `moonOccupants`. Legacy `moonOccupant` may only be accepted at deserialization boundaries for old snapshots.
- Moon target selection must include a stable `moonId`; otherwise clicking a specific moon block can still resolve on the server as the next open moon and award the wrong slot reward.

Success criteria:
- Common config contains moon land rewards for all configured moon slots and tests assert the reference values.
- Server moon landing returns/applies the moon slot's configured rewards, does not consume planet first-land data, and keeps existing planet landing behavior unchanged.
- Public game state exposes the updated shared config through the existing `configs` path without adding duplicate ad hoc state.
- Text-mode `PlanetCard` displays orbit/land/moon rewards with desc icons from projected config. Each moon is its own block with centered reward icons and the moon name below.
- Image mode exposes moon landing hotspots from `landingSlotKinds`; clicking a moon target sends the same main-action flow with `payload.isMoon === true`.
- Text mode moon blocks are selectable in land mode and send the same `payload.isMoon === true` plus `payload.moonId` action path.
- Focused tests fail on the current implementation and pass after the minimal fix.
- Verification covers focused common/server/client tests, relevant type checks, touched-file static checks, and `git diff --check`.

Plan:
- [x] Add failing common config tests for per-moon reward values from `frontend-reference`.
- [x] Add failing server tests proving moon landing uses moon reward, does not take planet first-land data, and applies resources/VP/traces consistently.
- [x] Add/update failing client tests proving image-mode moon hotspots and text-mode moon blocks send `isMoon: true` and the clicked `moonId`.
- [x] Add/update failing server tests proving a direct `moonId` landing uses the clicked moon slot reward, not merely the next open moon.
- [x] Add/update failing client tests proving planet orbit/land and moon rewards render through `DescRender` icon descs, not plain text.
- [x] Remove duplicated current-state `moonOccupant` from common/server/client projections while keeping legacy deserializer support; add `moonId` to `moonOccupants`.
- [x] Add failing client text-mode tests proving moon rewards render and multi-moon occupancy uses `moonOccupants`.
- [x] Implement the smallest shared config/model change in `packages/common/src/constant/boardLayout.ts`.
- [x] Update server reward selection/application to branch on moon slot order while preserving existing planet landing logic.
- [x] Update `PlanetCard` text-mode rendering to show planet and moon reward blocks using `DescRender` and current occupants.
- [x] Update `PlanetaryBoardView` / `GameLayout` target selection so moon hotspots and text-mode moon blocks dispatch data-driven main action payloads.
- [x] Run focused tests, type/static checks, browser verification, and append review evidence here.

Review:
- Root cause confirmed: common had no moon-specific land reward config, server moon landings reused planet `land.rewards` and first-land data, and client text mode had no moon reward blocks.
- Added `land.moonRewards` in shared config, keyed by moon slot order, and aligned moon names/order to `frontend-reference`.
- Removed current-state `moonOccupant`; runtime/public state now uses `moonOccupants: [{ playerId, moonId }]`. Legacy `moonOccupant` is only read in `GameDeserializer`.
- Server LAND now accepts `moonId`, applies that slot's moon rewards, leaves first-land data untouched for moon landings, and supports resource/tuck/colored-signal/trace reward chains.
- Text mode uses `DescRender` for orbit, first-orbit, land, first-data, and per-moon rewards. Each moon renders as its own block with centered reward icons and the moon name below.
- Image mode and text-mode moon blocks dispatch the same main action path with `payload.isMoon === true` and the clicked `payload.moonId`.
- Verification passed: common focused tests 31; server focused tests 37; client focused tests 53; common/server/client typecheck; touched-file Biome check; browser smoke at `http://127.0.0.1:5175/debug/game` with text mode showing `planet-reward-icons-*` and `moon-block-*` DescRender icon containers; `git diff --check`.

## Planet board UI/reference alignment - 2026-05-13

Assumptions:
- `frontend-reference` is only a visual/coordinate reference. Its `Satellite` / `Rover` / `planetMissions` names are legacy UI names and should not leak into this codebase's rule naming.
- The current project rule terminology is `planetary board`, `orbit`, `land/landing`, `orbiter`, `lander`, and `moon`; shared config names should follow that terminology.
- Image mode should prioritize the printed board image and invisible/selection-only clickable hotspots. Text summaries, empty slot labels, and planet cards belong to text mode.
- Text mode should use the data-driven `PlanetCard` list as the accessible board representation and should not render a separate image-board placeholder above those cards.
- Active goal continuation is treated as confirmation to implement after recording this plan.

Success criteria:
- Shared board layout config uses canonical planetary-board naming while preserving compatibility for any older imports if needed.
- Image mode renders the planet board artwork with data-driven occupied tokens and clickable hotspots from shared coordinates, but does not render the text-mode planet-card grid or text/empty-slot labels.
- Text mode renders the planet-card grid directly, with projected rewards/occupants and selectable-card behavior, and does not render the image-board placeholder above it.
- Clicking a selectable planet in either mode still submits the same typed `IInputResponse` / main-action planet payload; the client does not invent rule state.
- Focused tests fail on the old UI split and pass after the component change.
- Verification covers focused client tests, client/common/server type checks as affected, touched-file static checks, browser or Storybook smoke, and `git diff --check`.

Plan:
- [x] Add focused failing tests for image/text mode separation and click payloads.
- [x] Rename current shared planet-board config symbols from planet-mission wording to planetary-board wording.
- [x] Refactor `PlanetaryBoardView` so image mode uses reference-style board hotspots and text mode uses only `PlanetCard`.
- [x] Run focused tests/type/static checks and record review evidence.

Review:
- `frontend-reference` review confirmed the relevant board is a 500x700 `planetBoard` image with `planetMissions` coordinates; its `Satellite` / `Rover` names were treated as legacy reference names only. The project now uses `PLANETARY_BOARD_CONFIG`, `IPlanetaryBoardConfig`, and `TPlanetaryBoardConfigId` in common/client/server board config paths.
- `PlanetaryBoardView` now splits presentation by mode: image mode renders only the board artwork, occupied projected tokens, and selectable hotspots derived from shared orbit/landing coordinates; text mode renders only the projected `PlanetCard` grid.
- The click contract stays data-driven: image and text mode selection still submit typed `EPlayerInputType.PLANET` responses or main-action planet payloads with `EPlanet`, without sending reference slot strings.
- Red/green evidence: the focused client test first failed on the old UI because `planetary-board-image-mode` did not exist and `planetary-board-text-mode` still rendered above cards; after the refactor it passed 6 tests.
- Verification passed: `PlanetaryBoardView.test.tsx` 6 tests, Storybook core stories 5 tests, common planet board rewards 2 tests, server `PlanetaryBoard`/`Orbit` 17 tests, common/client/server typechecks, touched-file Biome check, and `git diff --check`.
- Browser smoke passed at `http://[::1]:5175/debug/game` with debug routes enabled: image mode had `planetary-board-image-mode=true`, `planet-card` count `0`, no text placeholder, board rect about `518x725`; text mode had `planet-card` count `7`, no image board, and no text placeholder. The only console error was the existing missing `/favicon.ico`.

## Blue tech place-data downward slot bug - 2026-05-12

Assumptions:
- "blue tech 可以向下延伸" refers to Computer tech bottom slots created under a filled top slot.
- Top-row data still fills left-to-right, but an unlocked bottom slot only requires its own top slot to be filled; the whole top row does not need to be complete.
- The protocol currently sends only `slotIndex`, so the server should infer a bottom placement when the requested index is an available bottom slot and not the next top slot.
- The repository has `docs/TODO.md` rather than lowercase `docs/todo.md`; this entry is appended here to avoid duplicate task files.

Success criteria:
- With top slots 0-3 filled, a blue tech bottom slot under column 0 can be filled even when next top slot is 4.
- Omitting `slotIndex` still fills the next top slot by default.
- Requesting the next top slot still fills top row left-to-right.
- Requesting a non-next top slot that is not an available bottom slot still throws the existing left-to-right error.
- The free-action place-data dialog exposes available bottom slots alongside the next top slot.

Plan:
- [x] Add focused failing server regression tests for bottom placement before the whole top row is full.
- [x] Add focused failing client layout test for place-data dialog options.
- [x] Implement the minimal server/client logic change.
- [x] Run focused tests, typecheck/static checks as needed, and record evidence.

Review:
- Confirmed root cause: `PlaceDataFreeAction.execute` rejected every explicit `slotIndex` except `nextTopIndex` while any top slot remained empty, so a valid blue-tech bottom slot under an already-filled top slot hit `Top row must be filled left-to-right`.
- Server now treats an explicit `slotIndex` that matches an available bottom slot as bottom placement before falling back to the next-top-slot default.
- Client free-action dialog now lists available bottom slots together with the next top slot, so the action bar path exposes the same valid choice as the player-board computer row.
- Regression tests failed before implementation and passed after: server `PlaceData.test.ts` and client `GameLayout.test.tsx`.
- Verification passed: focused server/client tests, server typecheck, client typecheck, touched-file Biome check, and `git diff --check`.

## Client card input and move overlay UI - 2026-05-12

Assumptions:
- "player input select card row / pick card when pass" refers to client pending card inputs, especially `END_OF_ROUND` pass-pile selection, because generic `CARD` input already uses `HandView -> CardRender` like tuck income.
- The fix should stay client-only: no server/common rule behavior changes.
- Clicking a hand card should still inspect the card, but the detail dialog should expose a large `Play Card` entry when that specific hand card can be played through the same main-action rules as the action panel.
- Move selection overlays should only be raised while selected/reachable so normal text-mode cell labels and board pieces keep their existing visual hierarchy outside movement selection.

Success criteria:
- End-of-round/pass card selection renders real `CardRender` cards, not text-only rows.
- Focused tests prove the card-selection UI uses the same card renderer path in image/text mode and still submits the same input payloads.
- Clicking a hand card opens the existing detail dialog, and the dialog provides a prominent `Play Card` button for playable hand cards.
- The dialog play button dispatches `EMainAction.PLAY_CARD` with the clicked card's current hand index and is disabled/absent when the action panel would not allow playing a card.
- In text mode, selected/reachable move hotspots render above text-mode solar cell labels.
- Verification covers focused client tests, client typecheck, touched-file static checks, browser smoke where feasible, and `git diff --check`.

Plan:
- [x] Add failing tests for pass/end-of-round card selection rendering through `CardRender` while preserving submit payload.
- [x] Add failing tests for hand-card detail dialog `Play Card` behavior and availability.
- [x] Add failing text-mode `SolarSystemView` z-index regression for reachable/selected move hotspots above text labels.
- [x] Implement the smallest client changes in the affected components only.
- [x] Run focused tests, typecheck/static checks, browser verification, and record review evidence here.

Review:
- `SelectEndOfRoundCardInput` now renders pass/end-of-round choices with the shared client `CardRender`, preserving the same `END_OF_ROUND` input response payload.
- `CardDetail` accepts a playable-hand-card action and shows a large `Play Card` CTA only when allowed; `GameLayout` wires that to `EMainAction.PLAY_CARD` using the clicked card's current hand index and the existing main-action availability rules.
- `SolarSystemView` raises visible move overlays to z-index 90 when selected/reachable or when the current player's probe is selectable in move mode, keeping them above text-mode cell labels.
- Red/green evidence: focused tests initially failed for missing `CardRender`, missing detail `Play Card`, and z-index `0 <= 75`; after implementation, `SelectEndOfRoundCardInput`, `CardDetail`, `GameLayout`, and `SolarSystemView` focused client tests passed 4 files / 63 tests.
- Verification passed: `packages/client` TypeScript check, touched-file Biome, `git diff --check`, and browser smoke at `/debug/game` with debug routes enabled. Browser smoke confirmed end-of-round cards had `card-render` + `text-card`, the hand-card detail dialog showed the play-card CTA, and reachable move hotspots computed z-index 90 while text labels maxed at 75.

## DescTextRender - 2026-05-12

Assumptions:
- This is for pure text-mode card copy, not image-mode icon rendering.
- Existing common desc parsing should be reused where possible so `<br>` and `{token}` syntax stays consistent with `DescRender`.
- Token output in text mode should stay textual and safe; it should not use `dangerouslySetInnerHTML`.

Success criteria:
- A reusable client `DescTextRender` renders `<br>`, `<br/>`, and `<br />` as actual line breaks.
- Desc tokens such as `{credit}` and `{score-2}` render as readable inline text without raw braces.
- `TextCard` uses `DescTextRender` for effect, mission, end-game, and note text.
- Focused tests fail before implementation and pass after the minimal component change.

Plan:
- [x] Add focused failing tests for `DescTextRender` line breaks and token text.
- [x] Wire the renderer into `TextCard` desc display paths.
- [x] Run focused tests, typecheck/static checks, and record evidence.

Review:
- Added reusable `DescTextRender` for client text-mode desc output. It reuses `@seti/common/utils/desc.extractDesc`, renders `<br>` variants as real line breaks, renders tokens like `{credit}` / `{score-2}` as readable inline text, and keeps literal HTML escaped.
- Wired `TextCard` effect, mission, end-game, and note text through `DescTextRender`.
- The new TextCard regression failed first against the old raw-string output, then passed after the component integration.
- Verification passed: `DescTextRender` + `TextCard` focused client tests 2 files / 11 tests, `packages/client` TypeScript check, touched-file Biome, `git diff --check`, and browser smoke at `/debug/game` in text mode. Browser smoke found 10 text-card bodies, 2 rendered desc breaks, 6 desc tokens, and 0 raw `<br` occurrences in card body text.

## Solar board zoom controls - 2026-05-12

Assumptions:
- "solar board" refers to `SolarSystemView`, used by both image mode and text mode.
- Shrinking should affect the rendered board container, not the underlying solar coordinate/probe/sector calculations.
- The existing `gameViewStore.zoom` is intended for board zoom and can be used instead of adding another store field.
- Follow-up bug report: if zoom only changes `max-width`, users can see no visual change when the parent layout already constrains the board. The zoom must change the actual reserved panel/frame width.

Success criteria:
- Solar board defaults smaller than the current 760px max visual size in both image mode and text mode.
- The board header exposes compact `-` / `+` zoom controls with a visible percentage readout.
- Controls clamp to a reasonable zoom range and update the actual board max width without changing movement/input semantics.
- The outer solar board panel shrinks with the board, allowing content below to move upward and leaving open space to the right.
- Clicking zoom updates concrete `width` on the panel/frame, not only `max-width`, so the layout visibly changes even inside constrained scroll containers.
- Focused tests fail on the old layout and pass after implementation.
- Verification covers focused board tests, client typecheck, touched-file static checks, browser smoke, and `git diff --check`.

Plan:
- [x] Add focused SolarSystemView tests for default smaller size and zoom controls.
- [x] Implement board zoom with existing view store and compact header controls.
- [x] Run focused tests, typecheck, static checks, browser smoke, and record evidence.
- [x] Add regression coverage for zoom changing concrete layout width, then fix and re-verify.

Review:
- Reused `gameViewStore.zoom` for solar board zoom and changed its default to 90%, reducing the board max width from 760px to 684px.
- Added compact header zoom controls with a magnifier glyph, `-` / `+` buttons, and a visible percentage readout.
- Applied zoom by changing the board frame `max-width`, so image mode and text mode both shrink without changing percentage-based wheel, sector, probe, and input geometry.
- Follow-up correction moved the zoom boundary to the whole solar board panel: the panel now uses board width plus its horizontal padding, and the board tab column is compact/left-aligned instead of centered at 800px.
- Controls clamp through the component to 72%-108% in 6% steps.
- Focused tests first failed against the old fixed 760px layout, then passed after implementation; the follow-up panel/column tests also failed before the correction and passed after it.
- Final verification passed: TextCard + SolarSystemView + GameLayout client tests 3 files / 58 tests, `packages/client` TypeScript check, touched-file Biome, and `git diff --check`.
- Browser smoke passed at `/debug/game`: image mode showed 90% with panel/frame `708px / 684px` by default, `+` changed to 96% with `754px / 730px`, and two `-` clicks changed to 84% with `662px / 638px`; the board tab column rendered as `w-fit max-w-full`.
- Follow-up bug fix: changed panel/frame sizing from `max-width` to concrete `width`, because `max-width` can be visually inert when the parent container already constrains the board. New regression tests now require `width` and reject leftover inline `max-width`.
- Follow-up browser smoke checked real `getBoundingClientRect()` values: default `708px / 684px`, `+` `754px / 730px`, and `-` from default `662px / 638px`.

## Text card sections and hand readability - 2026-05-12

Assumptions:
- Mission container means only `MISSION_QUICK` / `MISSION_FULL` effects.
- End game container means `END_GAME` effects should be separated from generic Effect text.
- The too-small hand cards are the bottom hand dock previews, currently scaled down from the intrinsic card renderer.

Success criteria:
- Text cards do not render a Mission section unless at least one quick/full mission exists.
- Text cards render End Game effects in their own bordered section.
- Hand dock card previews are at least twice the previous visible size on desktop, using the same wrapper for text and image mode.
- Focused tests fail before implementation and pass after the minimal component changes.
- Verification covers focused card/hand tests, typecheck, touched-file Biome, browser smoke, and `git diff --check`.

Plan:
- [x] Add failing TextCard tests for conditional Mission and End Game sections.
- [x] Add failing HandView dock-size test for unified text/image preview scaling.
- [x] Implement the minimal TextCard and HandView changes.
- [x] Run focused tests, typecheck, static checks, browser smoke, and record evidence.

Review:
- TextCard now renders Mission only when the card has `MISSION_QUICK` or `MISSION_FULL` effects.
- TextCard now filters `END_GAME` out of generic Effect and renders it in a separate bordered End Game section.
- Hand dock previews now use a shared 158px by 220px wrapper with a 1.05 scale around the intrinsic 150px by 209px `CardRender`, so text mode and image mode grow together.
- Focused tests failed before implementation and passed after: TextCard conditional mission/end-game tests and HandView dock-size text/image test.
- Verification passed: related client tests 4 files / 48 tests, `packages/client` TypeScript check, touched-file Biome, and `git diff --check`.
- Browser smoke passed at `/debug/game`: image-mode hand preview measured 158px by 220px; text-mode hand preview also measured 158px by 220px; text cards without mission such as `110`, `28`, and `16` no longer had mission sections.

## Text card price badge - 2026-05-12

Assumptions:
- This applies only to `TextCard`.
- `C` means credit and `E` means energy; other price types fall back to their raw text.

Success criteria:
- Price renders in the card's top-left corner as `number + compact resource code`, for example `3 C`.
- The number is visually stronger/larger than the resource code.
- The previous right-side `#id` / full `priceType` stack is removed from the header.
- Focused tests fail before implementation and pass after the component change.

Plan:
- [x] Add focused TextCard tests for credit and energy price badges.
- [x] Implement the header change with minimal layout impact.
- [x] Run focused tests, typecheck/static checks, and record evidence.

Review:
- TextCard price now renders as a top-left compact readout, e.g. `4 C` / `3 E`.
- The price number uses a larger bold style; the resource code uses a smaller uppercase style.
- Removed the previous right-side `#id` plus full `priceType` stack from the text-card header.
- Focused price tests failed before implementation and passed after it; related TextCard/HandView/SelectCardInput tests passed 3 files / 13 tests.
- Verification passed: `packages/client` TypeScript check, touched-file Biome, and `git diff --check`.
- Browser smoke passed at `/debug/game` in text mode: a hand card rendered `2 C`, with the number at `text-[15px] font-bold` and the resource code at `text-[8px]`.

## Client Storybook component tests - 2026-05-12

Assumptions:
- "image mode" means the default client render path where `useTextMode()` is false.
- "text mode" means the debug render path controlled by `useTextMode()`.
- Core coverage should prioritize client components that accept projected state or card data and produce visible/clickable output, not full server rule execution.
- The repository has `docs/TODO.md` rather than lowercase `docs/todo.md`; this entry is appended here to avoid duplicate task files.
- Active goal continuation is treated as confirmation to implement after recording this plan.

Success criteria:
- Client has React Storybook configured for the Vite app and can render client stories with the same global CSS/card CSS used by the app.
- Core component stories exist for card rendering, card row/hand interactions, and text/image mode render paths.
- Storybook stories include interaction assertions that validate visible output and callback/input payloads.
- Existing Vitest can execute the Storybook stories as portable component tests, so CI-style verification does not rely on manually opening Storybook.
- Text mode and image mode are both covered by direct assertions for the important client components.
- Verification covers the focused Storybook tests, client typecheck, Storybook build, touched-file static checks, and `git diff --check`.

Plan:
- [x] Add Storybook dependencies/config/scripts with shared app styles and a mode-reset decorator.
- [x] Add focused stories with play assertions for `CardRender`/`TextCard`, `CardRowView`, and `HandView`.
- [x] Add a Vitest story test harness that composes and runs the stories.
- [x] Run the story tests red/green, fix minimal issues, then run type/static/build verification.
- [x] Audit the objective against concrete artifacts and record final evidence.

Review:
- Added Storybook 9.1.20 to the client with `storybook`, `build-storybook`, and `test:storybook` scripts. Version 10.3.6 was checked first but rejected locally because it hard-blocks Node 22.11.0; 9.1.20 supports the current Node line and Vite 7 peer range.
- Added `.storybook/main.ts` with the client aliases used by Vite and `.storybook/preview.tsx` that imports app/card CSS plus i18n and resets `useTextMode()` from story parameters.
- Added portable Storybook tests through `vitest.storybook.config.ts` and `__tests__/storybook/coreStories.test.tsx`; this setup deliberately avoids the existing `test/setup.ts` card-render mock so image-mode stories exercise the real `@seti/cards` renderer.
- Added core stories with play assertions for `CardRender`, `CardRowView`, `HandView`, `PlanetaryBoardView`, and `RivalPanel`. The stories assert text-mode visible content, image-mode render path, selected state, and callback/input payloads.
- Verification passed: initial story test failed before Storybook deps were installed; final `pnpm --filter @seti/client test:storybook` passed 1 file / 5 tests; focused related client tests passed 5 files / 33 tests; `pnpm --filter @seti/client typecheck` passed; `pnpm --filter @seti/client build-storybook` passed; touched-file Biome passed; `git diff --check` passed.
- Browser smoke passed: Storybook served at `http://localhost:6006/`; the `Client / Cards / CardRender / Text Mode Complex Card` story loaded with `Signal Analysis`, and the `Client / Board / PlanetaryBoardView / Text Mode Planet Summary` story exposed `first data 2 / 1` inside the iframe.
- Residual risk: Storybook build emits the existing large-chunk warning for the generated iframe bundle; `pnpm install` still reports pre-existing peer warnings for `@testing-library/dom` and `react-html-parser`.

## Text-mode card readability pass - 2026-05-12

Success criteria:
- Text-mode game cards keep the same 150px by 209px envelope as image-mode cards.
- Title, free-action/sector metadata, and income stay in fixed regions; only the middle effect/mission region scrolls when content is long.
- Text-mode cards present effects and missions as readable sections, using existing card effect data without changing rule semantics.
- Focused tests fail on the old layout and pass after the component change.
- Verification covers the focused card tests plus client type/static checks for touched files.

Plan:
- [x] Add focused TextCard tests for fixed dimensions, section order, mission rows, and middle-region scrolling.
- [x] Refactor `TextCard` to a fixed-height section layout with compact metadata and a scrollable effect/mission body.
- [x] Run focused client tests, typecheck, touched-file static checks, and `git diff --check`.
- [x] Record final evidence and residual risk.

Pre-implementation notes:
- The repository uses `docs/TODO.md` rather than lowercase `docs/todo.md`; this entry is appended here to avoid duplicate task files.
- Scope is limited to the client text-mode card renderer and its tests. Shared card rendering, image-mode card CSS, and game-rule logic are out of scope.
- Under the current Codex default workflow, implementation proceeds after recording this plan rather than waiting for a separate confirmation round.

Review:
- Added focused `TextCard` regression coverage for fixed card dimensions, fixed title/meta/income regions, scrollable effect/mission body, and readable mission rows.
- Refactored text-mode cards to a fixed 150px by 209px shell: title and cost at top, free-action/sector metadata below, scrollable Effect/Mission/Note body, and fixed Income footer.
- Mission effects are split out of the generic effect list and rendered as one `req -> reward` row per branch; non-mission effects remain in the Effect section.
- Verification passed: initial focused TextCard test failed against the old layout, then passed after the implementation; card-related client tests passed 4 files / 12 tests; `packages/client` TypeScript check passed; touched-file Biome check passed; `git diff --check` passed for touched files.
- Browser smoke passed at `http://127.0.0.1:5173/debug/game` with debug routes enabled: text mode showed real hand cards, `text-card-115` had `width: 150px; height: 209px;`, and its body used `overflow-y-auto`.
- Follow-up adjusted metadata readability: Free Action and Sector now render as separate fixed metadata rows.
- Follow-up made Mission more visually distinct with a rounded hairline border and darker surface fill inside the scrollable card body.
- Follow-up verification passed: focused TextCard test first failed against the single-line metadata / top-border-only mission layout, then passed after the update; card-related client tests passed 4 files / 12 tests; `packages/client` TypeScript check passed; touched-file Biome check passed; `git diff --check` passed for touched files; browser smoke confirmed `text-card-free-action-115`, `text-card-sector-115`, and bordered mission class on `/debug/game`.
- Residual risk: visual smoke covered the existing desktop debug route only; no new Playwright E2E was added because the change is isolated to the text-mode card renderer and covered by component assertions.

## Real game creation log verification - 2026-05-12

Success criteria:
- Start the real client and server with the repository E2E harness.
- Register real users through the UI, create a room through the UI, launch a real game, and enter `/game/{gameId}`.
- Perform a real user action that creates a log event.
- Assert the game page shows the compact board log and the desktop drawer log with readable text.
- Record screenshots or test artifacts through Playwright where available, and document any route/server blockers.

Plan:
- [x] Add a focused real-ui E2E spec for creating a game and checking game log UI.
- [x] Run the spec through `scripts/run-e2e-local.sh`.
- [x] Fix any log-specific failures found by the real game flow.
- [x] Record final evidence and residual risk.

Review:
- First real-game E2E run created a real room/game and exposed a compact-log gap: the full drawer showed `Pass`, but the compact board log showed later internal `Milestone Check` / `Action Reward` entries instead.
- Fixed compact log selection to prefer user-facing, non-debug events while preserving the complete event stream in the full dialog.
- Added a focused client regression test for that event ordering so the compact log keeps showing the readable player action and the dialog still shows all entries.
- Final verification passed: `pnpm --filter @seti/client test -- __tests__/features/log/EventLog.test.tsx` (9 tests), `./scripts/run-e2e-local.sh tests/game-log-real-game.spec.ts` (1 real UI game test, 9.3s), `pnpm --filter @seti/client typecheck`, E2E tsconfig check via `packages/client/node_modules/.bin/tsc -p packages/e2e/tsconfig.json --noEmit`, touched-file Biome, and `git diff --check`.
- Residual risk: Vite still warns that local Node 22.11.0 is below its preferred 22.12+ floor, but the local server/client started cleanly and the real-game Playwright flow passed.

## Game log post-review confidence loop - 2026-05-12

Success criteria:
- Every server/common/client log requirement from the refactor has direct code and test evidence, not just a passing smoke check.
- Confirmed loopholes are fixed with focused regression tests before production edits where feasible.
- Event history cannot silently lose initial/reconnect logs, undo logs, input sub-step logs, or seeded recent events through ordering/dedupe mistakes.
- Client rendering avoids raw backend tokens in normal log text, handles card references without hidden crashes, and keeps the mobile compact log persistent and expandable.
- Verification includes targeted tests, broader affected package tests where practical, type checks, format/static checks, and a written residual-risk statement.

Plan:
- [x] Audit shared event protocol and server event producers/transport for structured event completeness and lifecycle gaps.
- [x] Audit client event ingestion/rendering/layout for stale closures, duplicate handling, raw token leakage, dialog/scroll behavior, and accessible interaction.
- [x] Add focused regression tests for any confirmed loophole, then implement minimal fixes.
- [x] Run targeted and broader checks; repeat audit after fixes until no known in-scope loopholes remain.
- [x] Record final review evidence and residual risk.

Review:
- Confirmed and fixed event-history dedupe risk by adding stable event ids and making client merge id-first with no-op state preservation.
- Confirmed and fixed compact-log interaction conflicts: card-reference clicks no longer expand the full log, dialog log uses a taller scroll area, and newest-first logs stay at the top.
- Confirmed and fixed readability gaps for score source / alien enum display, plus scan debug logging no longer breaks lightweight game doubles.
- Full verification passed: common 13 files / 142 tests, client 63 files / 227 tests, server 298 files / 1898 tests, common/server/client typechecks, touched-file Biome, and `git diff --check`.
- Browser smoke passed for the Vite app shell at `http://127.0.0.1:5173/`; `/debug/game` still redirects to `/`, so authenticated/live game visual validation remains covered by automated component/layout/hook/gateway tests rather than a browser route.
- Detailed report: `docs/review/game-log-post-review-2026-05-12.md`.

## Game log readability refactor confidence loop - 2026-05-12

Success criteria:
- Server emits distinct structured log entries for main actions, free actions, inputs/sub-steps, and undo, with `info`/`debug` levels instead of encoding categories in backend strings.
- Main action logs include useful details, especially `PLAY_CARD` card id/name and scan sector-mark sub logs.
- Client renders log actions and card ids as readable UI text/components, with no raw `ACTION:...` / `FREE_ACTION:...` backend strings visible in normal entries.
- Desktop keeps an event log in the side intel area; mobile keeps a short, always-present log below the solar-system board tab area, independent of tab switching, and opens a scrollable full log dialog on click.
- Focused tests fail on the old behavior and pass after implementation; targeted type/tests prove common/server/client consistency.

Plan:
- [x] Add red server tests for structured main/free/input/undo logs, play-card card details, and scan sector-mark debug entries.
- [x] Add red client tests for readable log rendering, card-id dialog behavior, and mobile/board-area persistent short log placement.
- [x] Implement shared event protocol fields and server helper functions with minimal call-site changes.
- [x] Replace raw client log strings with mapping/render components and card lookup from visible game state.
- [x] Move/add log UI so the desktop side area remains available and the board tab has a compact persistent summary plus dialog.
- [x] Run focused server/client tests and type checks, then audit every objective item against real evidence.

Pre-implementation notes:
- The repository has `docs/TODO.md` rather than lowercase `docs/todo.md`; this section is appended here to avoid duplicate task files.
- The active thread goal explicitly asks to continue implementation. That supersedes a separate interactive confirmation round for this plan, but the plan and verification gates remain recorded here.

Review:
- Server log protocol now carries structured `info`/`debug` levels, separate `ACTION` / `FREE_ACTION` / `INPUT` / `UNDO` event shapes, and timestamps across the shared common type.
- Main actions now log debug cost/reward entries without `ACTION:...` string encoding; free actions log as `FREE_ACTION`; successful input responses log as debug input entries; undo appends and broadcasts an `UNDO` event.
- Play-card logs include `cardId`, `cardName`, destination, price, and price type. Scan sector marking emits a debug `SECTOR_MARKED` sub log with sector id/color and gained reward metadata.
- Client log entries map main/free action tokens to readable labels, hide backend event type badges, render card ids as card-name buttons that open a dialog, and seed/dedupe history from `gameState.recentEvents`.
- Mobile/tablet board area now has an always-present compact log below the tab content (`lg:hidden`) showing one or two recent entries and opening a scrollable full log dialog; desktop side intel drawer remains available.
- Verification passed: server event/integration/gateway target suite 5 files / 87 tests; client log/layout target suite 2 files / 40 tests; common/server/client typechecks; touched-file Biome check with diagnostic-level error; `git diff --check`.

## Global error management confidence loop - 2026-05-11

Success criteria:
- Common protocol carries enough error semantics for server/client to distinguish silent, warning/business, error, and blocking failures.
- Server WebSocket and HTTP boundaries map known business/auth/not-found/system errors into the shared error payload without leaking unexpected internal messages.
- Stale or duplicate game input responses are silent at the client boundary and do not mutate/persist state; ordinary illegal game actions are warnings, not error toasts.
- Client global error handling uses shared semantics: silent errors are ignored, warning/business errors render warning toasts, blocking errors stay visible until dismissed.
- Focused tests fail on the old behavior and pass after the implementation; final review records any residual risk.

- [x] Add failing common tests for error classification defaults and explicit payload normalization.
- [x] Add failing server tests for missing game mapping, stale input silence, GameError payload metadata, and sanitized internal websocket errors.
- [x] Add failing client tests for silent/warning/blocking `game:error` handling and warning toast rendering.
- [x] Implement shared protocol/error classification and server/client boundary mapping with minimal API changes.
- [x] Run targeted common/server/client tests and type checks, then re-review loopholes.

Review:
- 新增 common 错误语义：`EErrorSeverity` / `EErrorCategory` / `EErrorDisplay`、`CONNECTION_ERROR`、`STALE_INPUT_RESPONSE`、`classifyErrorCode`、`normalizeErrorPayload`。默认分类将 stale input 设为 silent，游戏规则拒绝设为 warning/business，transport/auth/not-found/internal 设为 blocking。
- 修复 server 边界：`GameError` 现在携带 normalized payload；WebSocket auth/handler 错误统一发 shared payload；未知 WS/HTTP 异常脱敏为 `Internal server error`；`GameManager.getGame` 返回 `GAME_NOT_FOUND`；外部 input 无 prompt 或 inputId mismatch 返回 silent `STALE_INPUT_RESPONSE` 且不推进 version/persist。
- 修复 HTTP 边界：新增 `HttpErrorFilter` 并在 `main.ts` 全局挂载，Nest exceptions / `GameError` / unknown errors 都映射为 shared payload。
- 修复 client 展示：`useGameError` 按 shared classification 处理 silent/warning/blocking；toast 支持 `warning` 与 persistent `duration: null`；HTTP interceptor 优先展示 server payload message；Socket.IO connect/reconnect failure 映射为 blocking `CONNECTION_ERROR`；`GameLayout` 本地游戏内业务阻断从 error toast 改为 warning toast。
- 验证通过：common 全量 13 files / 142 tests；server 全量 298 files / 1887 tests；client 全量 62 files / 213 tests；common/server/client typecheck；本轮 touched files Biome check；`git diff --check`。client 全量测试仍输出既有 jsdom `window.scrollTo` warning，但测试通过，且与本轮错误系统无关。

## Rule FAQ implementation confidence loop - 2026-05-11

Success criteria:
- Every ruling in `docs/arch/rule-faq.md` is mapped to concrete implementation and/or test evidence, or explicitly marked not implemented/out of scope with reason.
- Every confirmed mismatch has a minimal proposed fix and a focused regression test/check that would fail on the old behavior.
- The fix plan is recorded before production changes; any skipped confirmation gate is explicitly noted.
- After confirmed fixes, targeted tests/type checks prove the FAQ behavior; any residual risk is explicitly recorded.

- [x] Read `docs/arch/rule-faq.md` line-by-line and convert it into a checklist by rules domain.
- [x] Compare Actions/Land/Scan/Analyze/Probe/Tech FAQ rulings with server/common/client implementation and tests.
- [x] Compare Missions/Milestones/Gold scoring/Cards FAQ rulings with implementation and tests.
- [x] Compare Alien species/Solo FAQ rulings with implementation and tests.
- [x] Aggregate all loopholes, separate confirmed bugs from unimplemented/out-of-scope features, and propose minimal fixes/tests.
- [x] Record the implementation plan before production code; explicit confirmation was superseded by the active-goal continuation instruction.
- [x] Implement confirmed fixes only, with focused regression coverage.
- [x] Run targeted verification, repeat the review loop, and record final confidence/review result.

Pre-implementation review:
- 当前实现还不能 100% 确认符合 `rule-faq.md`。已确认的行为差异包括：income/tuck 有手牌时被强制执行；card orbit effect 提供 `skip-orbit`；card launch/tech 不可执行时会让整张多效果卡不可打，而不是只跳过该 effect；generic card effect 以固定 priority/字段顺序解析，并且 tech-without-ROTATE 会旋转，和 project note 不一致。
- Scan 存在两个确认漏洞：基础 Scan 在执行 `MARK_EARTH` 后就提供 `DONE`，可跳过 card-row signal；Scan interruption 用任意 OPTION prompt 放行 free action，可能在一个 free action 或子交互未完成时再次插入 free action。
- Orbiter/lander 的真实状态在 `planetaryBoard`，但若干计分/卡牌路径使用 `player.pieces.deployed(ORBITER/LANDER)`；真实 orbit/land effect 没有同步 deploy。影响 gold `other/A`、通用 end-game per-orbit/land 计分，以及依赖 piece inventory 的 return-card 类路径。
- Solo gold milestone 没有限制 Rival 只能占 gold tile 第一格；当所有第一格已被占时，当前筛选仍可让 Rival 占第二格。S.17 Oumuamua 只配置/跟随 lander placement，在 landing 不可用但 orbit 可用的场景可能错误 fallback 到 scan。
- 需要补强但未必是生产逻辑错误的风险：S.15 Saturn/Jupiter movement 配置都为 5，FAQ 写 Saturn up to 4/Jupiter up to 5；S.15 empty sample pool / no reward isolation、S.16 既有人类 marker 的 leading 判定、solo objective 与 triggerable mission 同动作双标记、full mission skip 后再触发、Computer tech arbitrary column 的既有测试稳定性，都需要 focused regression 覆盖。

Proposed minimal fix plan:
- 修正 card effect 执行语义：card `canPlay` 不因 launch/tech 当前不可执行而拒绝整张卡；单个 launch/tech/land/orbit effect 在不可执行时跳过并继续；orbit 有可选目标时不提供 skip；tuck-for-income 在 card effect 场景允许 0 张跳过，但 setup tuck 仍保持强制。
- 修正 card effect 顺序/旋转：至少让 generic card-granted tech 使用 `skipRotation: true`，只由显式 ROTATE effect 旋转；为当前数据中的 rotate+tech、tech-without-rotate、launch-impossible-plus-resource 等路径加回归测试。若左到右顺序需要彻底保证，再把 generic behavior 从聚合字段改为保留 effect sequence 的队列。
- 修正 Scan：`DONE` 只有在 `MARK_EARTH` 和可执行的 `MARK_CARD_ROW` 都完成后才出现；free action interruption 只允许在 Scan action-pool menu 上发生，不能在 SpendSignalToken / MarkSectorSignal / PlaceData 等嵌套输入中再次插入。
- 修正 orbiter/lander 计数来源：以 `planetaryBoard` 作为计分权威来源，替换 gold `other/A` 与 end-game per orbit/land/per orbit-or-land 计数；同时修复 return-card 对真实 board lander/orbiter 的处理，避免依赖未同步的 piece deployed 计数。
- 修正 Solo：Rival gold options 只包含 `claims.length === 0` 的 tile；S.17 对 Oumuamua 使用 land-or-orbit 选择，landing 不可用但 orbit 可用时执行 orbit；为 S.15/S.16/solo objective-mission 并行触发补回归测试。
- 验证：先写能在旧实现失败的 targeted tests，再跑相关 server/common 测试集与 TypeScript check；根据失败继续下一轮 review，直到每个 FAQ 条目都有代码或测试证据。

Review:
- 修复 Actions/Card 语义：income tuck 可选择 0 张跳过，setup tuck 仍强制；card `canPlay` 不再因单个 launch/tech 不可执行而拒绝整张卡；不可执行的 launch/tech effect 执行时跳过并继续；orbit effect 可执行时不再提供 skip；通用 `behaviorFromEffects` 保留 left-to-right effect sequence；card-granted tech 只在显式 ROTATE effect 存在时旋转。
- 修复自由行动时机：主行动解析中的 pending input 可被 free action 中断，并在 free action 自身输入完成后恢复原主行动输入；free action interruption wrapper 防止 free action 嵌套 free action；Scan pool 保持 card-row/base mark mandatory，不允许在 MARK_EARTH 后提前 DONE。
- 修复 probe/orbiter/lander 权威状态：orbit/land effect 同步 deployed piece；gold `other/A`、通用 final scoring、Exertians 条件计数以 `planetaryBoard` 为权威并包含 moon occupants；Sample Return 支持真实 board lander/moon occupant。
- 修复 Solo/alien FAQ：Rival gold 只占 gold tile 第一格；S.15 拆为 Saturn 4/Jupiter 5 并保持 sample pool 为空时跳过、样本奖励不发给 Rival；S.16 以最近非 neutral occupant 判断 Rival 是否 leading；S.17 在 Oumuamua landing 不可用但 orbit 可用时执行 orbit；S.19 danger 计数只统计真实 danger slots + face-down cards。
- 补强 mission/objective 证据：triggerable mission 一个 checkpoint 只能 claim 一个 branch；skip 当前 trigger 后必须靠后续 trigger 再 claim；solo objective 与 triggerable mission 可由同一动作同时标记；mission 在卡牌主效果完全解析后才在 played mission 区生效的既有测试保持通过。
- 验证通过：server 全量 297 files / 1882 tests 通过；`pnpm --filter @seti/server typecheck` 通过；common 全量 12 files / 138 tests 通过；`pnpm --filter @ender-seti/common typecheck` 通过；本轮 touched 25 个 TS/TSX 文件 Biome check 通过；`git diff --check` 对本轮 touched 文件通过。
- 残余说明：本轮未改动已有 client/transport dirty files、`bk.config.yml`、`.playwright-mcp/` 等前序工作区改动；未发现剩余可复现的 `rule-faq.md` mismatch。

## Data-driven view/interaction confidence loop - 2026-05-11

Success criteria:
- Server owns canonical game state and projects all client-visible board/player/alien/solo data per viewer, without leaking hidden information.
- Server pending interactions are serialized as `IPlayerInputModel`; client submits only typed `IInputResponse` / action payloads and does not invent rule state outside `common` helpers.
- Client text mode and image mode differ only in presentation assets/layout. Both modes must consume the same projected state and preserve the same click/submit semantics.
- Every confirmed loophole has a focused failing test or observable assertion before production changes.
- Targeted type/tests/lint prove the reviewed contract; any residual risk is explicitly recorded.

- [x] Review server projection and websocket/input lifecycle for stale prompts, hidden data leaks, and missing public fields.
- [x] Review common protocol/types/helpers used by both client and server for duplicated or divergent rule logic.
- [x] Review client board/player/card/solo renderers for data-driven state consumption and text/image mode parity.
- [x] Review existing unit/E2E coverage and identify assertions that would fail if the strategy regressed.
- [x] Confirm the fix plan before changing production code.
- [x] Implement only confirmed minimal fixes, with regression tests.
- [x] Run targeted checks, re-review loopholes, and write the final review result.

Pre-implementation review:
- 当前策略还不能 100% 确认。最大漏洞是 transport response 没有关联 `inputId`：server pending input model 有 `inputId`，但 client 提交的 `IInputResponse` 没有带 id，server 也只校验 response type。过期点击、重复点击或迟到响应只要类型和 payload 符合新 prompt，就可能被当作当前交互处理。
- client `usePlayerInput.respond` 在发送后立即清空 pending input。如果 server 拒绝、网络失败或 stale input 被拦截，客户端会丢掉可重试的 prompt，掩盖真实状态。
- debug server 模式没有复用 websocket 路径的 card normalization。live server state 中部分 card 仍可能是 id string；debug REST 获取后直接 set state/input，可能让数据驱动视图收到未归一化 card。
- text mode / image mode 本轮未发现确认的规则分叉：主要分支集中在 presentation assets/layout，点击与提交语义仍来自同一份 server projection 和 pending input。修复重点应放在交互契约和 debug 数据入口。

Proposed minimal fix:
- 在 common `IInputResponse` 契约中加入 optional `inputId`，client 所有 input renderer 与 board shortcut 提交时带上当前 `model.inputId` / `pendingInput.inputId`；嵌套 AND/OR response 同时携带 root 与 nested input id。
- 在 `GameManager.processInput` 这个外部 transport 边界校验 `response.inputId === player.waitingFor.inputId`，缺失或不匹配时在进入 engine 前拒绝，避免 stale response 改变 game state 或清掉 server prompt。
- 调整 `usePlayerInput`：提交时只发送，不乐观清空；收到 authoritative `game:state` 后清空 pending，后续 `game:waiting` 再设置新 prompt。
- 在 `useServerDebugSession` 中复用 `normalizeGameStateCards` / `normalizePlayerInputCards`，让 debug REST 和 websocket 路径一致。
- 为上述每个漏洞补 focused regression tests，再跑 targeted client/server/common checks。

Review:
- 修复 transport input 关联：`IInputResponse` 增加 `inputId`，所有 client input renderer、board shortcut、debug bot/random input response 都带当前 server-projected input id；`GameManager.processInput` 在进入 engine 和递增 snapshot version 之前拒绝 missing/stale `inputId`。
- 修复 pending input 生命周期：`usePlayerInput.respond` 不再乐观清空 prompt，改为在收到 authoritative `game:state` 后清空，后续 `game:waiting` 继续由 server 设置。
- 修复 debug server 数据入口：`useServerDebugSession` 对 REST state 和 pending input 复用 card normalization，debug server mode 与 websocket mode 不再分叉。
- text mode / image mode 复核：本轮没有发现规则或交互语义分叉；相关 board/layout 测试覆盖了 text/image presentation 下的同一 pending input 语义。
- 验证通过：新增红灯覆盖 missing/stale `inputId`、pending prompt retry、debug REST card normalization、root/nested renderer response id；client input/board/layout 目标集 19 files / 91 tests 通过；client text-mode 目标集 5 files / 35 tests 通过；server gateway/debug 目标集 3 files / 27 tests 通过，额外 `GameManager` 16 tests 通过；common/client/server TypeScript checks 全部通过；本轮 touched TS/TSX 文件 Biome check 通过。
- 残余说明：`Game.processInput` 仍允许无 `inputId` 的内部调用，保留给 engine unit tests、Rival 自动解析和测试 fixture；外部 websocket/debug REST transport 统一由 `GameManager` 强制校验。`bk.config.yml` 与 `.playwright-mcp/` 是本轮开始前已有改动，未纳入本次修复。

## Alien implementation confidence loop - 2026-05-11

Success criteria:
- Every implemented alien species and shared alien mechanism is mapped to `docs/arch/aliens/*/rule.md`, `docs/arch/rule-simple.md`, and FAQ constraints where relevant.
- Every confirmed alien bug has a failing unit/E2E check or equivalent observable assertion before production changes.
- Server/common/client alien behavior stays consistent for hidden information, public projection, card economy, discovery, and species-specific resources.
- The final state is backed by targeted tests/type checks, and any residual risk is explicitly recorded.

- [x] Inventory current alien docs, implementation files, tests, and dirty worktree state.
- [x] Review shared alien infrastructure: setup, discovery, trace selection, deck/face-up flow, serialization, and public state.
- [x] Review Anomalies and Centaurians implementations against rules and tests.
- [x] Review Exertians and Mascamites implementations against rules and tests.
- [x] Review Oumuamua implementation against rules and tests.
- [x] Review client rendering/projection and E2E coverage for alien-specific behavior.
- [x] Patch only confirmed issues with minimal code changes.
- [x] Run targeted tests/type checks and repeat review until no factual gaps remain.

Review:
- 修复 shared alien 流程：discovery 输入完成后会继续解析同一轮后续已 fully marked 的 alien，避免第一个 alien 的交互输入截断发现链。
- 修复 Exertians：solo Rival 发现只按 discovery markers 获得 progress；danger trace 槽不再立即给 VP，游戏结束惩罚从 slot id 解析 danger；所有本轮确认的弃牌路径过滤 Exertian cards。
- 修复 Oumuamua：tile signal 消耗 data token 时给玩家 data；orbit 奖励现在会让玩家选择 sector/tile signal，并在 face-up 与 deck 都可用时选择 alien-card 来源。
- 修复 Mascamites：public sample pools 只投影数量，active capsules 不再投影 hidden sample token id；quick mission 的 comet/asteroid/distance probe 判断包含 Mascamites capsules。
- 修复客户端一致性：Centaurians reward slots 使用现有 desc/icon 渲染链；SelectTraceInput 使用 server-provided title；Mascamites UI 不再展示 active capsule 的 hidden sample id。
- 验证通过：server alien 目标集 11 files / 107 tests；client alien/input 目标集 2 files / 12 tests；common freeActions 1 file / 39 tests；common/server/client TypeScript checks 全部通过；本次相关 21 个文件 Biome check 通过，`GameSerializer.ts` correctness check 通过。
- 残余说明：完整 `@seti/server` lint 仍被既有格式问题阻断，位置在 `GameStateDto.ts`、`GameDeserializer.ts`、`GameSerializer.ts` 的旧格式片段；本轮未做无关格式化。

## Solo implementation confidence loop - 2026-05-11

Success criteria:
- Every confirmed solo bug has a failing test or equivalent observable check before production changes.
- Server/common/client solo behavior agrees with `docs/arch/solo/README.md`.
- The final state is backed by targeted tests, and any residual risk is explicitly recorded.

- [x] Inventory current solo code, docs, tests, and dirty worktree state.
- [x] Review server/common solo rules for impossible-action handling, state mutation, serialization, and rule edge cases.
- [x] Review client solo rendering/projection for hidden information leaks and server-client drift.
- [x] Review solo E2E/unit coverage for assertions that would fail on the identified bugs.
- [x] Patch only confirmed issues with minimal code changes.
- [x] Run targeted tests/type checks and repeat the review loop until no factual gaps remain.

Review:
- 修复 server/common solo 漏洞：probe placement 只能从 Earth probe 出发，跳过不可放置目标时不保留移动/publicity 副作用，probe tech 不提高 Rival 单 probe 发射上限，星球 trace/signal 奖励现在结算，Exertians discovery 卡对 Rival 转为 progress，Rival 金色里程碑输入自动结算，objective stack 先洗后抽样，SOLO.4 阈值改为 9 publicity。
- 修复 client/public projection 漏洞：`IPublicRivalState` 直接投影 Rival tech ids 与 computer slot rewards，`GameLayout` 不再从 public player rows 反推 Rival tech，`RivalPanel` 使用 server 投影的 rewards/techs，image mode objective 显示具体 task marker，data pool 显示完整数量，computer slots 稳定渲染 6 格。
- 覆盖补强：新增/更新 server unit、serializer、client unit、GameLayout 和 solo smoke 断言，确保这些漏洞会先红后绿。
- 验证通过：server 目标集 5 files / 115 tests；client 目标集 2 files / 51 tests；common/server/client/e2e TypeScript checks 全部通过；solo 相关 18 个改动文件 Biome check 通过；solo Playwright smoke/full-flow 3 tests 通过。
- 残余说明：完整 touched set 的 Biome 仍被 `GameSerializer` 既有非空断言和旧格式阻断，本轮未改无关代码。

清理说明：
- 已移除全部已完成任务与历史 Review；需要追溯时查看 git history 或 `docs/review/`。

## Solo interaction review confidence loop - 2026-05-12

Success criteria:
- For every reported solo interaction issue, classify it as a single scenario bug or a systemic implementation bug before production edits.
- Tech selection uses one canonical mapping from visible board slot/image to server tech id, immediate tile bonus, computer slot reward, and client click payload.
- `any card` rewards are not collapsed into deck-only `draw card`; where rules say any card, the user can choose card row or deck and card row refills correctly.
- Place-data rewards that require input, especially tuck-for-income and any-card choice, surface an obvious pending prompt and cannot look like a frozen page.
- Solo rival scan state is projected identically in text mode and image mode: data slots replaced by rival/player color markers stay visible in both modes.
- Focused tests fail on old behavior, pass after fixes, and targeted type/tests prove common/server/client consistency.

Plan:
- [x] Document implementation plan before production code changes. Note: repo has `docs/TODO.md` rather than lowercase `docs/todo.md`, so this entry is appended here to avoid duplicate task files. User explicitly requested fixes and sub-agent support, so implementation proceeded after classification and red tests.
- [x] Add red tests for blue tech visual-slot mapping: first visible computer tech resolves to credit, second to energy, third to any-card choice, fourth to publicity; client tech-board click sends the matching tech id.
- [x] Add red tests for `any card` reward semantics in the shared reward paths touched by this review: tech bonus, computer slot reward, planet orbit/card rewards, mission/card utility paths that currently collapse `CARD_ANY` into deck draw.
- [x] Add red tests for place-data continuation: data placement on a tuck/any-card slot keeps the player waiting on an explicit prompt, hides unrelated free actions first, and the client prompt names the required interaction.
- [x] Add red client tests for image-mode sector signals: rival/player markers produced by scan remain visible as colored markers instead of disappearing from the board.
- [x] Implement minimal shared fixes: separate canonical tech id order from image asset/order, add explicit any-card reward handling, propagate pending input from any-card computer/place-data rewards, and improve card input prompt copy/skip affordance.
- [x] Run targeted common/server/client tests and type checks; use Playwright only if unit coverage cannot prove the image-mode/pending-input behavior.

Pre-implementation review:
- Issue 1 is systemic. `TECH_STACK_LAYOUT` currently uses the visual/legacy computer row order `2,3,1,0`, while `getTechId(layout.tech, layout.level)` treats the same `level` as canonical rule id. This makes the first visible blue image (`techComp3`, credit) submit `comp-2`, whose server reward is card. The same conflation affects owner markers, rival tech order presentation, and blue-tech slot rewards.
- Issue 2 is systemic. There is a correct interactive helper for tech tile `CARD` bonuses (`TechBonusEffect.createAnyCardChoice`), but several reward paths still treat `CARD_ANY` as `drawCard`/deck draw only, including computer bottom rewards and generic mission/card reward helpers. This loses card-row choice and can also drop pending-input continuations.
- Issue 3 is expected rules behavior with a UI/continuation risk. Tuck-for-income itself is already interactive and skippable for non-setup effects, but place-data can create a card-selection prompt after a board click; if the client does not surface the title/skip affordance clearly, it looks like a freeze. The fix should improve prompt visibility and keep server locking behavior intact.
- Issue 4 is a client rendering bug with systemic mode-parity impact. `SectorNodeView` passes `showPlayerSignals={false}` in image mode, so scanned data replaced by rival/player markers is hidden; text mode renders the same data correctly.
- Issue 5 is likely the same pending-input discoverability/system-flow class as issue 3, with possible stale prompt hazards if any-card/tuck continuations are dropped. The fix should be verified through a real place-data path, not only component rendering.

Review:
- Fixed the systemic blue-tech mapping bug by keeping `TECH_STACK_LAYOUT` in canonical rule-id order and moving the computer image asset permutation into a shared client helper.
- Fixed the systemic any-card collapse in core paths: behavior executor, mission rewards, computer bottom rewards, place-data rewards, free-action corners, orbit rewards, and bespoke card utility paths now use `AnyCardChoiceEffect` so card row and deck choices are both available where the surrounding flow can return pending input.
- Fixed the place-data/orbit pending-input visibility class: card-selection prompts render their title, zero-card selections show `Skip`, and free actions are hidden while any pending input must be resolved.
- Fixed the image-mode scan rendering bug by allowing player/rival signal markers to render in image-mode sector slots.
- Verification passed: client focused vitest suite, server focused vitest suite, orbit/research/scan/play-card regression suite, related card regression suite, and `tsc --noEmit` for common/server/client.

## Space Agency corporation markdown import - 2026-05-15

Assumptions:
- Source workbook is `/Users/oushuohuang/Downloads/公司模型计算.xlsx`.
- Use `Sheet1` as the source of truth.
- Create one Markdown file for each of the 11 non-`基础白板` corporation rows.
- Fill absent numeric resources as `0` rather than leaving ambiguous blanks.
- Keep `Ability` as exactly `Mark as TODO`.
- Map spreadsheet shorthand names to existing formal names where the repo already has them:
  - `赞助公司` -> Futurespan Institute / 未来跨度研究所
  - `垃圾桶` -> Xenolab / 异星实验室
  - `深空调查` -> Deep Sky Survey / 深空探测
  - `删科技` -> Helion Assembly / 赫利昂联合体
  - `打牌公司` -> Cosmos Strategy Group / 宇宙战略集团
  - `5宣传` -> Fenwick Research Center / 芬威克研究中心
  - `白嫖科技公司` -> Turing Systems / 图灵系统
  - `任务公司` -> Mission Relay / 任务中继站
  - `双发` -> Orbital Dynamics / 寰宇动力
  - `哨兵` -> Sentinel Probe Network / 哨兵探测网络
  - `三免费行动` -> Stratus Core / 层云核心

Success criteria:
- `docs/arch/spaceAgency/corporations/` contains one Markdown file per confirmed corporation row.
- Each file uses the requested `Metadata`, `Start Resource`, `Income`, and `Ability` sections.
- Start resources and income values match `Sheet1` for credit, energy, card, publicity, data, tuck income, probe, and signal token.
- Existing unrelated worktree changes are left untouched.

Plan:
- [x] Confirm inclusion and name mapping with the user before generation.
- [x] Generate/update corporation Markdown files from `Sheet1` with minimal field normalization.
- [x] Verify row count, resource values, file names, section structure, and `git diff --check`.

Review:
- Generated 11 Markdown files in `docs/arch/spaceAgency/corporations/` from `Sheet1`, excluding `基础白板`.
- Reused the existing empty `fenwick.md` and added the other 10 corporation files.
- Filled blank workbook cells as `0` for all resource fields.
- Kept each `Ability` section as `Mark as TODO`.
- Verification passed: file set count is 11, values match `Sheet1`, section structure is present in every file, `基础白板` and `Vitor` are absent, and `git diff --check -- docs/todo.md docs/arch/spaceAgency/corporations` passed.

## Space Agency browser smoke evidence - 2026-05-17

Assumptions:
- This is a verification slice only; do not infer or implement missing Glyphids, Amoeba, or Arkhos reward payloads from UI images.
- Use real Playwright/browser flows, not debug endpoints, localStorage auth injection, raw websocket action driving, or mocked network behavior.
- Capture evidence for surfaces already implemented by common/server/client and existing focused E2E specs.
- Keep browser smoke checks narrow enough to avoid duplicating full release E2E.

Success criteria:
- Lobby Space Agency options are visibly reachable and can create a real room/game through the production UI.
- Setup choice UI visibly offers and selects a Space Agency organization.
- In-game Space Agency organization badge/power surface is visible for a real player.
- Representative new alien board renderers are visible through real UI/game state paths already covered by focused specs.
- Verification commands and browser evidence are recorded in the completion audit without marking the active goal complete.

Plan:
- [x] Confirm this smoke-evidence slice before changing E2E/test code. Note: active-goal continuation instruction superseded waiting for a separate confirmation response.
- [x] Inventory existing Space Agency E2E helpers/specs to reuse real-flow setup without adding shortcuts.
- [x] Add or run a narrow browser smoke spec/check that captures lobby options, setup choice, organization surface, and representative alien board surfaces.
- [x] Run focused browser smoke verification plus touched-file Biome/typecheck gates.
- [x] Update the completion audit and this review with exact evidence, preserving known source/data blockers.

Review:
- Added Playwright screenshot attachments to existing real-flow Space Agency specs instead of adding a duplicate scenario:
  - `packages/e2e/tests/space-agency-agencies-setup.spec.ts` now captures room Space Agency options, host/guest setup-choice UI, and host/guest organization surfaces.
  - `packages/e2e/tests/space-agency-new-aliens.spec.ts` now captures Space Agency new-alien room options, hidden alien board, and revealed Amoeba board surfaces for both players.
- Browser evidence produced by the focused run:
  - `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-01-room-options.png`
  - `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-02-host-setup-choice.png`
  - `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-02-guest-setup-choice.png`
  - `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-03-host-organization-surface.png`
  - `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-03-guest-organization-surface.png`
  - `packages/e2e/test-results/space-agency-new-aliens--r-445a6-can-reveal-the-Amoeba-board-chromium/space-agency-new-aliens-01-room-options.png`
  - `packages/e2e/test-results/space-agency-new-aliens--r-445a6-can-reveal-the-Amoeba-board-chromium/space-agency-new-aliens-02-hidden-board.png`
  - `packages/e2e/test-results/space-agency-new-aliens--r-445a6-can-reveal-the-Amoeba-board-chromium/space-agency-new-aliens-03-amoeba-board-actor.png`
  - `packages/e2e/test-results/space-agency-new-aliens--r-445a6-can-reveal-the-Amoeba-board-chromium/space-agency-new-aliens-03-amoeba-board-other.png`
- Verification passed: `pnpm exec biome check packages/e2e/tests/space-agency-agencies-setup.spec.ts packages/e2e/tests/space-agency-new-aliens.spec.ts`; `pnpm --filter @seti/e2e typecheck`; `pnpm --filter @seti/e2e test -- tests/space-agency-agencies-setup.spec.ts tests/space-agency-new-aliens.spec.ts`; scoped `git diff --check`.
- Residual blockers remain unchanged except for the now-planned named setup spec: full `pnpm test`, full E2E, and source-backed Glyphids/Amoeba/Arkhos reward payload execution are still open.

## Space Agency named setup E2E coverage - 2026-05-17

Assumptions:
- This slice closes the SA-10 named-artifact gap for `space-agency-setup.spec.ts`.
- It should reuse the real UI flow and overlap only as much as needed with the existing `space-agency-agencies-setup.spec.ts`.
- Assertions should focus on setup invariants visible through production UI: option-gated room setup, setup-choice prompts, organization resolution, Quick Start thumbnails, and Space Agency end-of-round stack shape.
- No debug endpoints, localStorage injection, raw websocket action driving, or mocked network behavior.

Success criteria:
- `packages/e2e/tests/space-agency-setup.spec.ts` exists and runs through lobby -> room -> setup-choice -> game using real UI.
- The spec proves Space Agency agencies + Quick Start setup resolves for both players and renders selected organization/Quick Start artifacts in game.
- The spec asserts Space Agency end-of-round stack shape from the production Cards tab.
- Focused E2E, E2E typecheck, Biome on touched E2E files, and `git diff --check` pass or any blocker is recorded.

Plan:
- [x] Add the named real-flow setup spec.
- [x] Run focused E2E/typecheck/format checks.
- [x] Update the completion audit and this review with exact evidence.

Review:
- Added `packages/e2e/tests/space-agency-setup.spec.ts`, a real-flow Playwright spec covering lobby Space Agency agencies + Quick Start options, room join/start, setup-choice organization selection, Quick Start card picks, organization badges, Quick Start thumbnails, and the Space Agency three-stack end-of-round surface in the production Cards tab.
- The red E2E exposed a real server/client projection gap: server built 3 Space Agency end-of-round stacks, but public state did not expose redacted stack counts, so the client rendered 4 empty placeholders. Fixed this by adding `IPublicGameState.endOfRoundStackCounts`, projecting counts only from server, and rendering `EndOfRoundStacks` from those counts without exposing hidden card identities.
- Focused coverage added/updated:
  - `packages/server/__tests__/persistence/serializer/GameSerializer.test.ts` now proves stack contents remain hidden while base projects `[3, 3, 3, 3]` counts and Space Agency projects `[3, 3, 3]`.
  - `packages/client/__tests__/features/cards/EndOfRoundStacks.test.tsx` now proves redacted counts render the correct number of stacks.
- Verification passed: `pnpm exec biome check` on touched common/server/client/e2e files; `pnpm --filter @ender-seti/common typecheck`; `pnpm --filter @seti/server typecheck`; `pnpm --filter @seti/client typecheck`; `pnpm --filter @seti/e2e typecheck`; `pnpm --filter @seti/server test -- __tests__/persistence/serializer/GameSerializer.test.ts`; `pnpm --filter @seti/client test -- EndOfRoundStacks`; `pnpm --filter @seti/e2e test -- tests/space-agency-setup.spec.ts`; combined Space Agency E2E `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts tests/space-agency-setup.spec.ts tests/space-agency-agencies-setup.spec.ts tests/space-agency-organization-power.spec.ts tests/space-agency-new-aliens.spec.ts tests/space-agency-event-bus.spec.ts` passed 6 specs in 2.4m.
- Residual blockers remain: full `pnpm test`, full `pnpm --filter @seti/e2e test`, BASE/SA long regression flows, and source-backed Glyphids/Amoeba/Arkhos reward payload execution.

## Space Agency SA-10 full test gate evidence - 2026-05-17

Assumptions:
- This slice records broad release-gate evidence only; do not change behavior unless the full test command exposes a concrete failure related to the active goal.
- If failures are unrelated to Space Agency organization/alien work or pre-existing dirty worktree state, record them precisely instead of hiding or broadening the fix.
- Full E2E and long BASE/SA regression remain separate gates after this command.

Success criteria:
- `pnpm test` is run from the repo root.
- Passing output or exact failure evidence is recorded in this review and the completion audit.
- If a related failure is found, fix it with focused tests and rerun the affected command.

Plan:
- [ ] Run root `pnpm test`.
- [ ] Classify any failures as related, unrelated, or environment/pre-existing.
- [ ] Update the completion audit and this review with exact evidence.
