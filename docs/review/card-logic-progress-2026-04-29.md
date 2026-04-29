# Card Logic Progress Review

**Date:** 2026-04-29
**Scope:** current card logic across `common`, `server`, and `client`
**Reviewer:** AI Code Review Skill
**Last updated:** 2026-04-29 implementation pass

## Summary

The card system is structurally in place, and the most critical runtime creation gap has been fixed. It is still not rules-complete.

| Area | Status |
|---|---:|
| Card data in `common` | 257 cards |
| Registered server card IDs | 257 / 257 |
| Runtime-creatable cards | 257 / 257 |
| Strictly clean cards in current registry, with no unhandled custom token | 244 / 257 |
| Newly added dedicated card class/test pairs in this pass | 87 |
| Newly added card class/test pairs still pending registry integration | 0 |
| Server card/mission/scoring broad regression after registry integration | 160 files, 641 tests passing |
| Client card/input tests run | 6 files, 13 tests passing |

Interpreting this:

- Registry coverage is high: every card ID is registered.
- Runtime creation is now covered for all registered cards, including ET.31-55.
- Base framework is usable: play-card, card row, hand, free-action corner, mission tracking, and final scoring have passing tests.
- Rules completeness is still lower than registry coverage: current registered behavior has 244 / 257 cards clean under a strict "creatable and no unhandled custom effect" check.
- The latest subagent-generated base and Space Agency class/test files have now been wired into the registries.

## Implementation Update

### Completed And Registered

- [x] Added a default registry audit that creates every card from shared `ALL_CARDS`.
- [x] Fixed the ET.31-55 runtime creation crash by making card creation tolerate missing `effects`.
- [x] Added Centaurian runtime cost inference so ET.31-40 use energy cost by default.
- [x] Registered dedicated base card classes for 90 Fuel Tanks Construction, 91 Fusion Reactor, 92 NASA Image of the Day, 93 Government Funding, 108 SETI@Home, and 119 PIXL.
- [x] Registered pending dedicated base card classes for 27 Hubble Space Telescope, 28 Kepler Space Telescope, 29 James Webb Space Telescope, 55 Arecibo Observatory, 67 Yevpatoria Telescope Construction, 73 Clean Space Initiative, 74 Pre-launch Testing, 75 Extremophiles Study, 84 Sample Return, 98 Coronal Spectrograph, 99 Electron Microscope, 100 Exascale Supercomputer, and 133 Optimal Launch Window.
- [x] Registered dedicated alien card classes for ET.11, ET.12, ET.14, ET.15, ET.16, ET.17, ET.20, ET.21, ET.22, ET.23, ET.24, ET.25, ET.27, ET.28, and ET.30.
- [x] Registered pending dedicated Space Agency card classes for SA.1 Reusable Lander, SA.2 Tracking and Data Relay Satellite, SA.12 Two-planet Flyby Maneuver, SA.13 James Clerk Maxwell Telescope, SA.14 Reusable Rocket, SA.17 Paid Media Coverage, SA.20 Well Executed Project, SA.27 Better Solar Panels, SA.30 Akatsuku Orbiter, SA.32 MUREP Idea Competition, SA.34 Private Sector Investment, and SA.38 Space Rendezvous.
- [x] Added a scoped turn-effect/event hook for this-turn movement, visit, asteroid, comet, and sector-completion card effects.
- [x] Registered dedicated base card classes for 9, 11, 12, 13, 15, 17, 18, 19-26, 30, 45-47, 52-54, 71, 72, 81, 114, 118, 122-126, and 136.
- [x] Registered dedicated base observation endgame classes for 38 Barnard's Star Observation, 40 Kepler 22 Observation, 42 Procyon Observation, and 44 Vega Observation.
- [x] Registered dedicated base card class for 120 Orbiting Lagrange Point with post-discard return-to-hand hook support.
- [x] Registered SE EN 01 Not a planet since 2006 as an intentionally disabled no-op runtime card, per current rule scope, so it stays creatable without emitting an unhandled DESC/custom event.
- [x] Registered dedicated Space Agency card classes for SA.6, SA.15, SA.18, SA.19, SA.22, SA.28, SA.29, and SA.37.
- [x] Removed migrated legacy handlers for `desc.card-55`, `desc.card-67`, and `sa.desc.card_13`.

### Implemented With Class/Test And Registry Integration

- [x] Base: 55 Arecibo Observatory, 67 Yevpatoria Telescope Construction, 73 Clean Space Initiative, 74 Pre-launch Testing, 75 Extremophiles Study, 84 Sample Return, 98 Coronal Spectrograph, 99 Electron Microscope, 100 Exascale Supercomputer.
- [x] Base movement/signal subset: 27 Hubble Space Telescope, 28 Kepler Space Telescope, 29 James Webb Space Telescope, 133 Optimal Launch Window.
- [x] Base scan/signal subset: 52 Parkes Observatory, 53 Deep Synoptic Array, 54 VERITAS Telescopes, 114 Planet Hunters, 118 PLATO, 122 Amateur Astronomers, and 136 Algonquin Radio Observatory.
- [x] Base action/resource/tech subset: 9 Falcon Heavy, 11 Grant, 12 Europa Clipper, 13 Perseverance Rover, 15 Atmospheric Entry, 17 OSIRIS-REx, 18 Hayabusa, 30 Great Observatories Project, 71 Focused Research, 72 Scientific Cooperation, 81 International Collaboration, and 126 Euclid Telescope Construction.
- [x] Base observation endgame subset: 38 Barnard's Star Observation, 40 Kepler 22 Observation, 42 Procyon Observation, and 44 Vega Observation, with sector-fulfillment scoring by `sectorWinners`.
- [x] Base return-to-hand subset: 120 Orbiting Lagrange Point marks a signal in a probe sector and returns from discard when that sector has exactly one own signal.
- [x] Base turn-effect/flyby subset: 19 Gravitational Slingshot, 20 Mercury Flyby, 21 Venus Flyby, 22 Mars Flyby, 23 Jupiter Flyby, 24 Saturn Flyby, 25 Lightsail, 26 Through Asteroid Belt, 45 Allen Telescope Array, 46 ALMA Observatory, 47 Very Large Array, 123 Asteroids Flyby, 124 Cometary Encounter, and 125 Trajectory Correction.
- [x] Base special edition no-op: SE EN 01 Not a planet since 2006 is explicitly disabled in server runtime and suppresses its unimplemented DESC custom token.
- [x] Space Agency: SA.1 Reusable Lander, SA.2 Tracking and Data Relay Satellite, SA.12 Two-planet Flyby Maneuver, SA.13 James Clerk Maxwell Telescope, SA.14 Reusable Rocket, SA.17 Paid Media Coverage, SA.20 Well Executed Project, SA.27 Better Solar Panels, SA.30 Akatsuku Orbiter, SA.32 MUREP Idea Competition, SA.34 Private Sector Investment, SA.38 Space Rendezvous.
- [x] Space Agency latest subset: SA.6 Live Landing Broadcast, SA.15 Iterative Engineering, SA.18 Contracted Research, SA.19 New Assignment, SA.22 TESS Satellite, SA.28 Restructuring, SA.29 Abandoned Mission, and SA.37 Pandora Satellite.

### Blocked Or Partial

- [ ] No base cards currently expose unhandled custom tokens; SE EN 01 remains intentionally disabled rather than rule-implemented.
- [ ] SA.5 Servicing Mission still needs movement/turn-effect implementation.
- [ ] SA.12 is clean at registry level, but should be revisited to use the new turn-effect hook if its full text must cover later free-action movement in the same turn.
- [ ] Mascamites ET.1-7 still need a sample/capsule runtime state model.
- [ ] Space Agency Alien Glyphids/Amoeba cards still need species-specific runtime state and reward accounting.

## What Is Done

### Shared Data And Rendering

- Card definitions live in `packages/common/src/data`.
- Client card normalization maps card IDs in public state and input models back to `IBaseCard` data.
- `packages/cards` renders card assets/effects, while `packages/client` renders row, hand, detail, and end-of-round stack views.

### Server Runtime Framework

- `Card`, `ImmediateCard`, `MissionCard`, `EndGameScoringCard`, `Behavior`, `BehaviorExecutor`, `Requirements`, and `CardRegistry` exist.
- Play-card flow pays cost, removes from hand, runs card behavior, and routes cards to discard / mission / end-game zones.
- Card row buy/refill, free-action corner discard, mission completion, and end-game scoring are implemented and tested.

### Base Game Coverage

- All 140 base cards are registered and runtime-creatable.
- Dedicated base-card implementation coverage increased in this pass, and newly added class/test files are now registered.
- Major representative paths are covered: resource gain, draw, movement, launch/orbit/land, scan/signal, tech, quick missions, full missions, and end-game cards.
- Strict Base custom-token coverage is now clean, but Base rule completeness is not yet 100% because several desc-only end-game formulas and scan/card-row lifecycles still need follow-up work.

## Remaining Gaps

### Completed: 25 Alien Cards Were Registered But Not Creatable

This gap is now fixed. ET.31-55 can be created at runtime even though their shared card data entries do not define `effects`.

Relevant files:

- `packages/server/src/engine/cards/base/GenericCards.ts`
- `packages/server/src/engine/cards/Card.ts`
- `packages/server/__tests__/engine/cards/CardRegistry.test.ts`
- `packages/server/__tests__/engine/cards/register/registerAlienCards.test.ts`

Remaining caveat: ET.31-40 and ET.41-55 are runtime-creatable, but their individual advanced-card gameplay rules are not implemented because common card data does not currently encode the per-card effects/scoring conditions.

### Major: Many Custom Text Effects Still Fall Through

`Behavior` turns `CUSTOMIZED`/`DESC` effects into `behavior.custom`. In the current registry, 13 cards still have at least one custom token without a handler.

Not all of these are necessarily gameplay logic; some are location text or reminders. However, the runtime currently emits `CARD_CUSTOM_EFFECT_UNHANDLED`, and the client shows a toast for it. That makes the untriaged set visible to players and not shippable as "complete".

Relevant files:

- `packages/server/src/engine/cards/BehaviorExecutor.ts:430`
- `packages/server/src/engine/cards/registerDescHandlers.ts:1`
- `packages/client/src/pages/game/GameLayout.tsx:149`

Breakdown:

| Group | Total | Creatable | Cards With Unhandled Custom Tokens |
|---|---:|---:|---:|
| Base | 140 | 140 | 0 |
| Space Agency | 42 | 42 | 1 |
| Alien | 55 | 55 | 7 |
| Space Agency Alien | 20 | 20 | 5 |

Current unhandled IDs:

- Space Agency: SA.5.
- Alien: ET.1, ET.2, ET.3, ET.4, ET.5, ET.6, ET.7.
- Space Agency Alien: SA.ET.1, SA.ET.2, SA.ET.8, SA.ET.9, SA.ET.19.

### Major: Base Desc-Only End-Game Scoring Follow-Up

These Base cards are registered and do not expose unhandled custom tokens, but their `END_GAME` effects are encoded only as locale-backed description text. The clear formulas are now implemented in `scoreEndGameCard()`:

- [x] 12 Europa Clipper: 3 points per own orbiter/lander at Jupiter, including moons.
- [x] 14 Mars Science Laboratory: 4 points per own orbiter/lander at Mars, including moons.
- [x] 86 Giant Magellan Telescope: 1 point per sector where the player has a signal.
- [x] 113 Solvay Conference: score the best rightmost slot on a gold scoring tile the player did not mark.
- [x] 127 NEAR Shoemaker: 13 points if the player has a probe on asteroids.

Relevant files:

- `packages/common/src/data/baseCards.ts`
- `packages/common/locales/en/seti.json`
- `packages/server/src/engine/scoring/GoldScoringTile.ts`

### Fixed: Base Scan And Display-Card Lifecycles

These Base cards are clean under `behavior.custom`, and their card-row lifecycle now follows the clarified rule:

- [x] 45 Allen Telescope Array, 46 ALMA Observatory, 47 Very Large Array, 50 Square Kilometre Array, 65 FAST Telescope, and 86 Giant Magellan Telescope use DISPLAY_CARD signal behavior that discards selected row cards during the batch, then refills after the card effect completes.
- [x] 51 Lovell Telescope, 105 Green Bank Telescope, and 135 Noto Radio Observatory now route generic `SCAN` behavior through a no-cost full `ScanActionPool`, including scan tech sub-actions and final row refill.
- [x] 52 Parkes Observatory, 53 Deep Synoptic Array, 54 VERITAS Telescopes, and 55 Arecibo Observatory now use the same full scan path; 52-54 score from all matching-color signals marked by that scan.

Relevant files:

- `packages/server/src/engine/cards/utils/Mark.ts`
- `packages/server/src/engine/cards/BehaviorExecutor.ts`
- `packages/server/src/engine/effects/scan/ScanEffect.ts`
- `docs/arch/rule-faq.md`

### Fixed: Base Behavioral And Test Coverage Gaps

- [x] 19 Gravitational Slingshot now prompts the player to convert one planet-visit publicity into movement, or keep the publicity.
- [x] 62 Onsala Telescope Construction, 63 SHERLOC, 68 DUNE, and 126 Euclid Telescope Construction now have card-specific end-game scoring tests.

### Major: Space Agency Alien Mechanics Are Explicitly Deferred

`registerSpaceAgencyAliens` notes that Glyphids and Amoeba resource accounting is deferred until those species are enabled in setup. These cards are creatable but not rules-complete.

Relevant file:

- `packages/server/src/engine/cards/register/registerSpaceAgencyAliens.ts:20`

### Warning: Direct `PlayerInput` Return From Card Play Is Not Wired Through

`Card.play()` can return `IPlayerInput | undefined`, but `PlayCardAction.execute()` currently ignores the return value. Existing bespoke card implementations mostly work around this by pushing deferred actions, so current tests pass. This is still a framework gap against the planned card pipeline and will matter for future cards that return an input directly.

Relevant files:

- `packages/server/src/engine/cards/Card.ts:123`
- `packages/server/src/engine/actions/PlayCard.ts:94`

## Estimate

If the target is "base game skeleton with representative cards and common effects," the implementation is mostly there: roughly 80-85%.

If the target is "all current card data in this repo works without runtime gaps," it is closer to 70-75%:

- 244 / 257 cards are clean under the strict current-registry check.
- 13 currently registered cards still need custom-effect triage or registry migration.
- Species-specific alien card systems, especially Glyphids/Amoeba and advanced alien cards, remain incomplete.

## Recommended Next Tasks

1. [x] Add a card audit test that creates every registered card and fails on runtime creation errors.
2. [x] Fix the ET.31-55 generic-card crash by either adding empty/default effects handling or excluding them from runtime registration until implemented.
3. [x] Integrate the pending Worker A/B/C class files into `registerBaseCards.ts` and `registerSpaceAgencyCards.ts`.
4. [x] Remove migrated legacy handlers for `desc.card-55`, `desc.card-67`, and `sa.desc.card_13` after the matching card classes are registered.
5. [x] Re-run strict registry audit after registry integration and update the clean/unhandled counts.
6. [ ] Split remaining unhandled custom tokens into informational-only vs gameplay-required.
7. [x] Add a scoped turn-effect/event hook for "this turn" future visit/movement cards.
8. [x] Suppress remaining base deck custom token: SE EN 01 is intentionally disabled as a no-op runtime card.
9. [ ] Implement SA.5 and revisit SA.12 against the new turn-effect hook.
10. [x] Confirm and implement Base 113 Solvay Conference end-game scoring.
11. [x] Implement clear Base desc-only end-game scoring for 12, 14, 86, and 127.
12. [x] Fix Base scan/display-card card-row lifecycle semantics for 45, 46, 47, 50, 51, 52, 53, 54, 55, 65, 86, 105, and 135.
13. [x] Add optional-choice support for 19 Gravitational Slingshot.
14. [x] Add card-specific end-game scoring tests for 62, 63, 68, and 126.
15. [ ] Suppress/log informational custom tokens without player-facing warning.
16. [ ] Implement remaining gameplay-required alien handlers after the base/SA deck is clean.
17. [ ] Wire `Card.play()` returned `IPlayerInput` through `PlayCardAction` / `Game` or formally remove that contract and require deferred actions.

## Verification

Passed:

- `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH ./node_modules/.bin/vitest run __tests__/engine/cards __tests__/engine/missions __tests__/engine/actions/PlayCard.test.ts __tests__/engine/freeActions/FreeActionCorner.test.ts __tests__/engine/freeActions/BuyCard.test.ts __tests__/engine/effects/cardRow __tests__/engine/scoring` from `packages/server`: 160 files, 641 tests passing.
- `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH ./node_modules/.bin/vitest run __tests__/features/cards __tests__/features/input/SelectCardInput.test.tsx __tests__/features/input/SelectEndOfRoundCardInput.test.tsx __tests__/lib/cardNormalization.test.ts` from `packages/client`
- Focused new-card tests for registered base/alien migrations: 21 files, 30 tests passing.
- Focused registration tests for alien/base registry, desc handlers, and `CardRegistry`: passing.
- `pnpm --filter @seti/server typecheck`: passing before later worker class/test-only output.
- `pnpm --filter @seti/server lint`: passing before later worker class/test-only output.
- Worker A focused card tests: 9 files, 16 tests passing.
- Worker B focused card tests: 4 files, 8 tests passing.
- Worker C focused Space Agency tests: 12 files, 12 tests passing.
- `pnpm exec biome check packages/server/src/engine/cards/spaceAgency packages/server/__tests__/engine/cards/spaceAgency`: passing.
- Pending registry integration focused test run: 29 files, 49 tests passing.
- Latest base/Space Agency card test run: 113 files, 401 tests passing.
- Latest focused registry tests for base/Space Agency registry, desc handlers, and `CardRegistry`: 4 files, 9 tests passing.
- Registry audit after latest integration: 243 / 257 cards clean; 14 cards still expose custom tokens.
- Registry audit after SE EN 01 no-op suppression: 244 / 257 cards clean; 13 cards still expose custom tokens, all outside the base deck.
- SE EN 01 focused tests plus base registry and `CardRegistry`: 3 files, 8 tests passing.
- Focused Base scoring / scan / display-card / movement lifecycle run: 21 files, 207 tests passing.
- Latest Base + scan + free-action + scoring regression: 120 files, 691 tests passing.
- Registry audit after latest Base follow-up: 244 / 257 cards clean; Base remains 0 unhandled custom tokens.
- Base 113 Solvay Conference scoring follow-up: 2 scoring files, 33 tests passing.
- Broad server card/mission/action/scoring regression after latest integration: 160 files, 641 tests passing.
- `pnpm --filter @seti/server typecheck`: passing after latest Base follow-up.
- `pnpm --filter @seti/server lint`: passing after latest Base follow-up.
- `git diff --check`: passing after latest Base follow-up.

Notes:

- The working tree already had unrelated modified client/server files before this review.
- Current worker-generated class/test files have been registered and covered by final broad regression.
