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
