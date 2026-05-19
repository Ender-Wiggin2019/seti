# TODO

## Space Agency 11 corporation completion - 2026-05-19

Assumptions:
- Scope is the 11 documents under `docs/arch/spaceAgency/corporations/`.
- `docs/arch/spaceAgency/corporations/` is the latest and authoritative rule source for corporation ids, resources, income, abilities, reference logic, and image paths.
- The `frontend-reference image` field in each corporation document is the required client image address; implementation should not infer or substitute another image path.
- `frontend-reference` source code may be consulted only to understand referenced behavior after the corporation document has defined the requirement; current project architecture remains authoritative for implementation shape.
- Implementation starts only after this checklist is confirmed, per repo instructions.
- Existing unrelated dirty worktree changes are not in scope and must not be reverted.
- "100% confidence" means no known in-scope discrepancy remains after repeated spec/code/test review loops and passing focused verification; any source blocker must be named instead of guessed.

Success criteria:
- Common organization data exactly matches each corporation document for id, names, start resources, income, setup tucks, probe setup, ability metadata, frontend-reference type, display name, and image path.
- Server organization logic matches the documented `Ability` and `Reference Logic` sections, including passive hooks, once-per-round powers, main actions, state reset, serialization/deserialization, and public projection.
- Client setup, dashboard/opponent, action surfaces, and organization card/badge rendering use the shared organization data and the 11 documented `frontend-reference image` paths.
- Focused common/server/client tests cover every corporation-specific rule and every changed client rendering path.
- At least one real-flow Space Agency E2E covers organization setup and at least one representative power/main-action path after the changes.
- The confidence loop repeats gap audit -> red test -> minimal fix -> focused verification -> independent re-review until no known in-scope loopholes remain.

Plan:
- [x] Confirm this plan with the user before implementation begins.
- [x] Snapshot the current implementation and tests for all 11 organizations against `docs/arch/spaceAgency/corporations/` only.
- [x] Ensure all 11 documented `frontend-reference image` paths are present or copied into the client asset tree without renaming.
- [ ] Add shared common metadata for corporation zh/en names, frontend-reference type/display name, ability text, reference logic summary, and documented image paths.
- [x] Fix common data mismatches against the corporation docs, starting with Deep Sky Survey start resources.
- [x] Add common tests that compare all 11 docs-derived metadata/setup/income/image expectations to `ORGANIZATIONS`.
- [x] Fix server behavior mismatches against the corporation docs, starting with Futurespan countdown direction and Sentinel Probe Network timing.
- [ ] Add server tests for each corporation rule, reset boundary, state persistence boundary, and invalid-action guard.
- [ ] Update client organization rendering to show the correct corporation image and useful rule/ability metadata.
- [ ] Add client tests for setup choice rendering, dashboard/opponent badges, action controls, and image fallback behavior.
- [ ] Add or update E2E coverage for real setup plus a representative organization power/main-action flow.
- [ ] Run focused common/server/client/e2e checks, typechecks, Biome on touched files, and `git diff --check`.
- [ ] Run an independent code-review pass and fix confirmed findings.
- [ ] Run an independent test/E2E review pass and fix confirmed findings.
- [ ] Repeat the confidence loop until this section records no known in-scope loopholes.
- [ ] Record final evidence, residual risks, and any external blockers here.

Corporation checklist:
- [x] Cosmos Strategy Group: verify start/income data, card-color passive reward marks, immediate rewards, once-per-round card gain, reward marker clearing, round reset, `cards.jpg` client image wiring, and tests.
- [ ] Deep Sky Survey: fix start resources to 0 card and 3 publicity per doc, verify no-energy Analyze Data, swap one hand card with one card-row card, round reset, `look.jpg` asset wiring, and tests.
- [ ] Fenwick Research Center: verify 5-publicity tech research, spend-1-publicity row/deck card gain, immediate free-action corner resolution, round reset, `publ.jpg` asset wiring, and tests.
- [x] Futurespan Institute: verify sponsor-card selection, countdown creation as cost x 10 + 5, score-gain countdown reduction, sponsored free play when unlocked, once-per-round delay action increasing countdown by 3 and gaining 1 card from row/deck, image wiring, and tests.
- [ ] Helion Assembly: verify tech-category reward marks, immediate probe/scan/computer rewards, non-computer tech destruction, hand-card tuck income, reward clearing, disabled-tech persistence, `techSeller.jpg` asset wiring, and tests.
- [ ] Mission Relay: verify setup mission-gold premark, mission-card publicity trigger, spend-2-publicity row/deck card gain, income-corner resolution with refill, `missions.jpg` asset wiring, and tests.
- [ ] Orbital Dynamics: verify +1 probe capacity, setup launches 2 probes, up-to-2 different probe one-step movement, round reset, `probes.jpg` client image wiring, and tests.
- [ ] Sentinel Probe Network: verify launch-probe signal marking, post-resolution non-alien card free-action corner storage, once-per-round replay of stored corner effect, alien-card exclusion, turn/round state clearing, `probeSignal.jpg` asset wiring, and tests.
- [ ] Stratus Core: verify all current card-row free-action corners resolve in row order, offered cards are kept and not refilled, once-per-round reset, `offerEffects.jpg` asset wiring, and tests.
- [ ] Turing Systems: verify computer-tech publicity trigger, temporary probe/scan tech selection, no immediate bonuses, turn-end expiration, `testTech.jpg` asset wiring, and tests.
- [ ] Xenolab: verify three active trace tiles, direct organization use prevention, discounted launch/scan/research main actions, tile flip inactive on use, matching trace reactivation without spending the trace, no once-per-round reset, `traces.jpg` asset wiring, and tests.

Known implementation gaps from initial audit:
- [x] Common data mismatch: Deep Sky Survey currently appears to grant 1 card and 4 publicity, while `docs/arch/spaceAgency/corporations/deep-sky-survey.md` requires 0 card and 3 publicity.
- [x] Server behavior mismatch: Futurespan Institute delay action appears to move the unlock threshold in the wrong direction compared with `docs/arch/spaceAgency/corporations/futurespan.md`.
- [x] Server behavior mismatch: Sentinel Probe Network currently appears to arm before a main action, while `docs/arch/spaceAgency/corporations/sentinel-probe-network.md` requires replaying a stored corner after a fully resolved eligible non-alien card.
- [x] Client asset gap: all 11 documented corporation images are now present in `frontend-reference/storage.googleapis.com/cgo-projects/seti/assets/corporations/` and copied into `packages/client/public/assets/seti/corporations/` without renaming.
- [x] Server behavior mismatch: Cosmos Strategy Group once-per-round card gain only drew from deck; it now uses the same any-card choice semantics as frontend-reference/card text and clears markers after the card is gained.
- [x] Server behavior mismatch: Sentinel Probe Network stored other players' non-alien card corners; it now records only the owning player's fully resolved non-alien main-action card.
- [x] Server behavior mismatch: Futurespan Institute once-per-round delay only drew from deck; it now uses the same row/deck any-card gain semantics required by `docs/arch/spaceAgency/corporations/futurespan.md`.
- [x] Server behavior risk: Sentinel Probe Network now only offers/stores cards with an actual free-action corner and uses ID-based owner filtering for main-action events.
- [ ] Client metadata gap: organization badges now render source-backed images/display-name tooltips, but power labels are still generic and full ability text is not yet surfaced.
- [ ] E2E gap: existing Space Agency E2E covers setup and selected organization paths, but not the full corrected corporation behavior matrix.

Review:
- 2026-05-19: Implemented common metadata/resource fixes, Futurespan delay direction, Sentinel stored-corner replay timing, and organization badge image rendering/display-name tooltip from shared metadata.
- Verification passed: `pnpm --filter @ender-seti/common test -- __tests__/data/organizations.test.ts __tests__/rules/actions.test.ts`; `pnpm --filter @seti/server test -- __tests__/engine/organization`; `pnpm --filter @seti/client test -- __tests__/features/actions/FreeActionBar.test.tsx __tests__/features/player/PlayerDashboard.test.tsx __tests__/features/player/OpponentSummary.test.tsx`; common/server/client typechecks; `git diff --check`.
- Independent review completed; addressed the client invalid-organization fallback and clarified the Futurespan test name.
- 2026-05-19: Found the previously missing corporation images under `frontend-reference/storage.googleapis.com/cgo-projects/seti/assets/corporations/`, copied all 11 documented assets into the client asset tree, fixed Cosmos row/deck card gain choice, and fixed Sentinel owner filtering.
- 2026-05-19: Renamed the 11 client corporation image files to the exact documented English corporation names and updated shared metadata, docs, and client/common tests to reference the new project image paths.

## Mobile game layout - 2026-05-19

Plan:
- [x] Remove the mobile personal-info overlay toggle -> Verify: no `Info` sidebar toggle renders in `GameLayout`.
- [x] Place the mobile player board below the solar board -> Verify: `Board` tab solar column contains the mobile player board.
- [x] Preserve the desktop personal column -> Verify: desktop `PersonalColumn` remains `lg:flex`.
- [x] Run focused layout tests -> Verify: `GameLayout.test.tsx` passes.

Review:
- Mobile `Board` tab now renders the personal panel directly below `SolarSystemView` instead of behind the top-right info overlay.
- Desktop still uses the right-side `PersonalColumn`; the event log drawer is unchanged.
- Verification passed: `pnpm --filter @seti/client test -- __tests__/pages/game/GameLayout.test.tsx`.

## Space Agency main-deck card completion - 2026-05-19

Assumptions:
- Scope is `packages/server/src/engine/cards/register/registerSpaceAgencyCards.ts` and Space Agency main-deck cards `SA.1` through `SA.42`; Space Agency alien cards are out of scope unless a shared helper must stay compatible.
- Authoritative behavior sources, in order, are `packages/common/src/data/spaceAgencyCards.ts`, `packages/common/locales/en/seti.json`, `docs/arch/spaceAgency/rulebook.md`, and `docs/arch/spaceAgency/faq.md`.
- Existing dedicated classes for `SA.1`, `SA.2`, `SA.6`, `SA.12`, `SA.13`, `SA.14`, `SA.15`, `SA.17`, `SA.18`, `SA.19`, `SA.20`, `SA.22`, `SA.27`, `SA.28`, `SA.29`, `SA.30`, `SA.32`, `SA.34`, `SA.37`, and `SA.38` are not assumed correct; they remain under audit and will receive regression tests/fixes if a concrete gap is found.
- Cards with generic registration are acceptable only when all printed behavior is covered by the generic behavior, mission tracker, and end-game scoring paths.
- Existing unrelated dirty worktree changes are not in scope and must not be reverted.
- "100% confidence" means no known in-scope discrepancy remains after repeated source audit -> failing test -> minimal fix -> focused verification -> independent re-review loops; if a rule or engine hook cannot support a card safely, record the blocker instead of guessing.

Known confirmed gaps before implementation:
- `SA.5` Servicing Mission: generic data/move works, but the return-to-hand `DESC` remains unhandled and must check adjacency after movement resolves.
- `SA.7` Twin Probes: quick mission `sa.desc.card_7` has no server condition for two probes in space at two different non-Earth planets.
- `SA.8` Quantum Data Storage: end-game text scores 0 generically; it must score 3 VP per remaining data in the data pool only.
- `SA.10` First Human in Space: end-game text scores 0 generically; it must score 1 VP per remaining publicity.
- `SA.11` Psyche Probe: quick mission `sa.desc.card_11` has no server condition for a probe on asteroids.
- `SA.16` Astronaut Training Experience: quick mission `sa.desc.card_16` has no server condition for 0 publicity after resolving the main effect.
- `SA.21` Orbital Refueling: full mission has empty generic trigger requirements; it must trigger when visiting a planet where the player has an orbiter.
- `SA.23` Neutral Buoyancy Training: launch branch is likely generic-safe, but the second branch uses an orbit/land action trigger that generic `ORBIT_OR_LAND_COUNT` full-mission matching does not handle.
- `SA.31` Ingenuity Helicopter: generic end scoring returns flat 6 instead of 6 VP per non-moon planet where the player has two landers.
- `SA.33` Delayed Launch: full mission has no pass event support; it must trigger on pass and complete even if probe-limit blocks the launch reward.
- `SA.35` NASA Exoplanet Archive: quick mission `sa.desc.card_35` has no server condition for 12 total data in data pool plus computer.
- `SA.39` Grand Tour Program: generic end scoring returns flat 2 instead of 2 VP per non-moon planet where the player has an orbiter or lander.
- `SA.41` Exoplanet Survey: quick mission `sa.desc.card_41` has no server condition for player signals in red, yellow, blue, and black sectors.
- `SA.42` LOFAR Array: quick mission `sa.desc.card_42` has no server condition for every sector having either a player signal or a player-won fulfillment.
- `SA.12` Two-planet Flyby Maneuver: current check runs once during card resolution and misses later free-action movement in the same turn.
- `SA.38` Space Rendezvous: current check can run before the card-granted movement is spent, contrary to FAQ timing.
- `SA.19` New Assignment: removing an orbiter with array `splice` can slide later orbiters into the first orbit slot, contrary to FAQ physical-slot semantics.
- `SA.22` TESS Satellite and `SA.37` Pandora Satellite: no-data signal placement records signal events but may skip normal sector-completion hooks.
- `SA.20` Well Executed Project: non-alien filtering excludes `ET.*` but not Space Agency alien `SA.ET.*` cards.
- `SA.9`, `SA.24`, `SA.25`, and `SA.26` appear generic-safe, but need regression tests to prove their mission conditions and rewards actually work.

Success criteria:
- Every Space Agency main-deck card is registered through either a dedicated class or a proven generic path with focused tests.
- All custom `DESC` gameplay tokens in Space Agency main-deck cards are either implemented or documented as informational-only with a test proving no unhandled runtime event is emitted.
- End-game Space Agency scoring for `SA.8`, `SA.10`, `SA.31`, and `SA.39` matches card text and FAQ edge cases.
- Quick missions and full missions listed above can complete through real `MissionTracker` flow, not by manually mutating completed mission arrays.
- Focused server tests fail before implementation, pass after implementation, and cover the FAQ timing/edge cases named above.
- Verification includes the new card tests, Space Agency registry tests, mission/scoring focused tests, server typecheck, server lint or touched-file Biome check, `git diff --check`, and a final independent review loop.

Plan:
- [x] Confirm this plan with the user before implementation begins.
- [x] Finish the read-only audit of already dedicated Space Agency card classes and add any confirmed gaps to this section before changing code.
- [x] Add failing focused tests for `SA.5`, `SA.7`, `SA.8`, `SA.10`, `SA.11`, `SA.12`, `SA.16`, `SA.19`, `SA.20`, `SA.21`, `SA.22`, `SA.23`, `SA.31`, `SA.33`, `SA.35`, `SA.37`, `SA.38`, `SA.39`, `SA.41`, and `SA.42`.
- [x] Add regression tests proving `SA.9`, `SA.24`, `SA.25`, and `SA.26` remain safe through generic mission handling.
- [x] Implement dedicated card classes for missing custom quick mission, full mission, immediate, and end-game behavior using existing mission/effect helpers where possible.
- [x] Add only minimal shared helpers for repeated Space Agency card predicates, such as probe planet occupancy, per-sector signal/fulfill checks, and non-moon landing/orbit counts.
- [x] Add pass-trigger support for `SA.33` in the smallest viable place, preferably via mission event plumbing rather than card-specific turn hacks.
- [x] Update `registerSpaceAgencyCards.ts` imports and registrations so every newly implemented card uses its dedicated class.
- [x] Update registry tests so migrated cards have no unhandled custom tokens and generic-safe cards remain registered.
- [x] Run the focused red/green tests after each card group and mark this checklist as items complete.
- [x] Run full focused verification: `pnpm --filter @seti/server test -- __tests__/engine/cards/spaceAgency __tests__/engine/cards/register/registerSpaceAgencyCards.test.ts __tests__/engine/missions __tests__/engine/scoring/GoldScoringTile.test.ts`.
- [x] Run server typecheck and lint or touched-file Biome check, then `git diff --check`.
- [x] Run an independent code-review pass and fix confirmed findings.
- [x] Run an independent test-review pass and fix confirmed coverage holes.
- [x] Repeat audit -> failing test -> minimal fix -> verification -> re-review until no known in-scope loopholes remain.
- [x] Record final evidence, residual risks, and any blockers in this Review section.

Card checklist:
- [x] `SA.5` Servicing Mission: return to hand after card-granted movement if the player has a probe adjacent to Earth; verify movement resolves before the adjacency check.
- [x] `SA.7` Twin Probes: quick mission requires two probes in space at two different non-Earth planets; verify orbiters/landers and Earth do not count.
- [x] `SA.8` Quantum Data Storage: score 3 VP per data in data pool only; verify computer data is excluded.
- [x] `SA.9` Lunar Crater Radio Telescope: prove generic quick mission completes with three fulfilled sectors and grants 3 publicity.
- [x] `SA.10` First Human in Space: score 1 VP per remaining publicity; verify current capped publicity value is used.
- [x] `SA.11` Psyche Probe: quick mission requires a probe on asteroids; verify launch/publicity effects remain intact.
- [x] `SA.12` Two-planet Flyby Maneuver: award 3 VP once if two different non-Earth planets are visited later in the same turn, including free-action movement after card resolution.
- [x] `SA.16` Astronaut Training Experience: quick mission requires 0 publicity after main effect resolution; verify starting at 0 does not allow immediate completion after gaining 4 publicity.
- [x] `SA.19` New Assignment: preserve physical orbit-slot vacancy when removing an orbiter, especially first-slot vacancy and later first-orbit reward eligibility.
- [x] `SA.20` Well Executed Project: exclude both `ET.*` and `SA.ET.*` alien cards from selectable non-alien discard targets.
- [x] `SA.21` Orbital Refueling: full mission triggers when visiting a planet where the player has an orbiter; verify two branches can be marked by separate eligible visits.
- [x] `SA.22` TESS Satellite: no-data signals must still behave like normal signal placement for sector completion and mission/event hooks.
- [x] `SA.23` Neutral Buoyancy Training: verify launch branch still grants a card and orbit/land action branch grants 3 VP.
- [x] `SA.24` Space Elevator: prove generic full mission launches on two probe-tech research triggers.
- [x] `SA.25` LIGO: prove generic full mission grants signal tokens on two scan-tech research triggers.
- [x] `SA.26` New AI Models: prove generic full mission grants data on two computer-tech research triggers.
- [x] `SA.31` Ingenuity Helicopter: score 6 VP per non-moon planet with two landers; verify moons are excluded.
- [x] `SA.33` Delayed Launch: full mission triggers on pass; verify mission can complete even when launch reward is skipped due to probe limit.
- [x] `SA.35` NASA Exoplanet Archive: quick mission requires at least 12 data in data pool plus computer; verify stash/other resources do not count.
- [x] `SA.37` Pandora Satellite: no-data signals must still behave like normal signal placement for sector completion and mission/event hooks.
- [x] `SA.38` Space Rendezvous: award 3 VP after card-granted movement can create a shared probe space, not only when probes already shared a space at play time.
- [x] `SA.39` Grand Tour Program: score 2 VP per non-moon planet with at least one orbiter or lander; verify moons are excluded.
- [x] `SA.41` Exoplanet Survey: quick mission requires at least one own signal in each signal color; verify base signal token/publicity/any-card effects remain intact.
- [x] `SA.42` LOFAR Array: quick mission requires all eight sectors to have either an own signal or own sector fulfillment; verify mixed signal/fulfillment coverage.

Review:
- Implemented and verified on 2026-05-19.
- Added dedicated one-card-per-file implementations for `SA.5`, `SA.7`, `SA.8`, `SA.10`, `SA.11`, `SA.16`, `SA.21`, `SA.23`, `SA.31`, `SA.33`, `SA.35`, `SA.39`, `SA.41`, and `SA.42`; `SA.9`, `SA.24`, `SA.25`, and `SA.26` remain generic with focused regression coverage.
- Fixed audited dedicated-card issues for `SA.12`, `SA.19`, `SA.20`, `SA.22`/`SA.37` shared no-data signal handling, and `SA.38`.
- Added mission pass events and player/game-aware full-mission matchers so `SA.33` and `SA.21` can use real `MissionTracker` flow.
- Self-review found and fixed an additional return-to-hand zone bug: Space Agency return-to-hand helpers now remove the card from discard when available before putting it in hand.
- Verification passed: focused Space Agency main-deck tests; `pnpm --filter @seti/server test -- __tests__/engine/cards/spaceAgency __tests__/engine/cards/register/registerSpaceAgencyCards.test.ts __tests__/engine/missions __tests__/engine/scoring/GoldScoringTile.test.ts`; `pnpm --filter @seti/server typecheck`; touched-file Biome check; `git diff --check`.
- Full `pnpm --filter @seti/server lint` was attempted but remains blocked by pre-existing unrelated formatting/import diagnostics outside this change set, so only touched-file Biome verification was used.
- Residual risk: exact Space Agency physical slot UI representation after `SA.19` removal is still backed by compact occupied-slot arrays; the gameplay consequence, first-slot reward re-opening and insertion order on the next orbit, is now covered.
