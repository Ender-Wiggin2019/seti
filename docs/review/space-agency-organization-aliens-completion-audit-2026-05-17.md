# Space Agency Organization And Aliens Completion Audit

Date: 2026-05-17
Status: not complete

## Objective

Audit the current Space Agency organization and alien implementation against
`docs/plan/space-agency-implementation-plan.md`, with source-backed behavior as
the standard for completion. This review does not implement new rules. It
records which deliverables have concrete code and verification evidence, which
ones are weakly verified, and which ones remain blocked by missing structured
source data.

## Completion Standard

A deliverable counts as complete only when all of these are true:

- Common protocol/data, server runtime, serializer/projection, and client UI are
  consistent for the same behavior.
- Focused tests prove the behavior at the layer where it lives.
- Any rule/reward execution is backed by `docs/arch`, FAQ text, or checked-in
  `frontend-reference` data/code. Card images or rendered DOM are acceptable as
  visual references, but not as executable reward payload sources.
- E2E or browser evidence exists for the user-facing flow when the plan calls
  for release-quality evidence.

## Plan Checklist

| Area | Plan requirement | Current artifact evidence | Audit result |
| --- | --- | --- | --- |
| Organizations | SA-4/SA-5/SA-5R organization runtime, powers, setup, quick start, and metadata consistency. | `packages/common/src/data/organizations.ts`; `packages/server/src/engine/organization/OrganizationRegistry.ts`; focused organization tests under `packages/server/__tests__/engine/organization`; common metadata tests in `packages/common/__tests__/data/organizations.test.ts`; client setup/badge/free-action tests. | Mostly implemented for current runtime surface. Recent metadata test closes a common/server consistency gap. Needs release E2E evidence before final completion. |
| New deck + signal token | SA-6 option-gated SA cards and signal-token scan branch. | `registerSpaceAgencyAliens`, signal-token free-action and scan tests, client `FreeActionBar` tests, common free-action rules tests. | Implemented at focused-test level. Full release regression remains under SA-10. |
| Glyphids | SA-7 dedicated plugin, board state, public projection, client board, card/deck integration. | `GlyphidsAlienPlugin`, `GlyphidsAlienBoard`, serializer/deserializer tests, `AlienBoardView` tests, scoring/card tests, `SpaceAgencyAlienPlugins.test.ts`. | Partial. Core board/plugin/projection/UI surfaces exist, but translated reward execution and some token-source/refill behavior are not complete. |
| Amoeba | SA-7 dedicated plugin, board state, public projection, client board, card/deck integration. | `AmoebaAlienPlugin`, `AmoebaAlienBoard`, serializer/deserializer tests, `AlienBoardView` tests, Amoeba card scoring tests, recent organelle movement/section/marker helper tests. | Partial. Board movement and target helpers are implemented, but organelle reward execution and full `SA.ET.19` flow remain incomplete. |
| Arkhos | SA-8 complete option-gated species with cards, board, plugin, serializer/projection, client board. | `ARKHOS_EXPLORATION_CARDS`, `ArkhosAlienPlugin`, `ArkhosAlienBoard`, Arkhos card registry tests, serializer/deserializer tests, `AlienBoardView` tests, solo/rival tests. | Partial. State, cards, security lifecycle, projection, UI, and solo/rival paths exist. Human exploration reward payload execution remains blocked by missing `effectSmall`/`effectBig` source data. |
| Client integration | SA-9 full SA flow through production UI with i18n and no client rule drift. | Lobby options tests, setup modal tests, organization badge/free-action tests, alien board tests, Arkhos event-log tests, locale files, and recent Playwright screenshot evidence for lobby/setup/organization/Amoeba board surfaces. | Partial. Organization and alien surfaces are covered for the implemented server surface. Main-deck preview/confirm polish and full release evidence remain. |
| E2E/release audit | SA-10 real-flow specs, full tests/typecheck/build, BASE and SA regression evidence, browser screenshots. | Existing `packages/e2e/tests/space-agency-options.spec.ts`, `packages/e2e/tests/space-agency-setup.spec.ts`, `packages/e2e/tests/space-agency-agencies-setup.spec.ts`, `packages/e2e/tests/space-agency-organization-power.spec.ts`, `packages/e2e/tests/space-agency-new-aliens.spec.ts`, and `packages/e2e/tests/space-agency-event-bus.spec.ts`. `space-agency-agencies-setup.spec.ts` and `space-agency-new-aliens.spec.ts` now attach browser screenshots for key SA surfaces. | Not complete. Current E2E coverage is still narrower than the full release plan and does not prove full organization/alien release readiness. |

## Source-Backed Blockers

### Glyphids

- `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/alphabetLife.js`
  gives the translated reward coordinate formula through `getAlphabetEffect`.
  The implementation now records `rewardRowIndex` and `rewardColumnIndex`.
- The actual `dataSheet.alphabetTable` payload table has not been recovered.
  Without that table, translated reward execution must remain blocked.
- Sky/planet/tech glyph token setup is not complete. Implementing only one
  container would make token-bank ordering misleading unless all equivalent
  token destinations are represented.
- Board-token trace rewards and top-three refill behavior are not source-backed
  enough for executable trace/refill wiring.

### Amoeba

- `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/amoebaLife.js`
  backs section lookup, activation order, movement, and occupied-position skip
  behavior. Recent helpers cover those mechanics.
- Organelle reward payloads are still not represented as executable shared
  data, so activation can identify organelles but cannot safely pay all rewards.
- `SA.ET.19` marker target scope is now covered for board, discovery, and
  overflow slots, but the full card flow remains incomplete because it depends
  on source-backed organelle reward execution.

### Arkhos

- Common data currently uses explicit opaque IDs such as
  `ARKHOS_EXPLORATION_03_MINOR_UNMAPPED`, and server/client surfaces preserve
  those IDs in projected reward history.
- Checked-in `frontend-reference` code calls `effectSmall` and `effectBig`, but
  the structured exploration deck data table is not present in the checked-in
  source.
- Images for `AI_01.jpg` through `AI_09.jpg` and `sheet.jpg` are useful for
  visual presentation, but several executable semantics remain ambiguous from
  images alone. They cannot be converted into server effects with 100% factual
  confidence.

## Verification Evidence Already Recorded

Recent focused verification from the implementation notes:

- `pnpm --filter @ender-seti/common test -- organizations`
- `pnpm --filter @seti/server test -- __tests__/engine/organization/OrganizationRegistry.test.ts`
- `pnpm --filter @seti/client test -- AlienBoardView`
- `pnpm --filter @seti/server test -- __tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts`
- `pnpm --filter @ender-seti/common typecheck`
- `pnpm --filter @seti/server typecheck`
- `pnpm --filter @seti/client typecheck`
- `corepack pnpm typecheck`
- `corepack pnpm --filter @seti/server build`
- `corepack pnpm build`
- Clean sequential `corepack pnpm test` attempted on 2026-05-18 after clearing
  stale prior E2E harnesses; package tests passed, then the full E2E stage failed
  with `62 passed, 8 failed`.
- `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/alien-pool-config.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/space-agency-organization-power.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/space-agency-new-aliens.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/space-agency-event-bus.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts tests/space-agency-agencies-setup.spec.ts tests/space-agency-organization-power.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts tests/space-agency-agencies-setup.spec.ts tests/space-agency-organization-power.spec.ts tests/space-agency-new-aliens.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts tests/space-agency-agencies-setup.spec.ts tests/space-agency-organization-power.spec.ts tests/space-agency-new-aliens.spec.ts tests/space-agency-event-bus.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/space-agency-agencies-setup.spec.ts tests/space-agency-new-aliens.spec.ts`
- `pnpm --filter @seti/server test -- __tests__/persistence/serializer/GameSerializer.test.ts`
- `pnpm --filter @seti/client test -- EndOfRoundStacks`
- `pnpm --filter @seti/e2e test -- tests/space-agency-setup.spec.ts`
- `pnpm --filter @seti/e2e test -- tests/space-agency-options.spec.ts tests/space-agency-setup.spec.ts tests/space-agency-agencies-setup.spec.ts tests/space-agency-organization-power.spec.ts tests/space-agency-new-aliens.spec.ts tests/space-agency-event-bus.spec.ts`
- `pnpm --filter @seti/e2e typecheck`
- Biome checks on touched common/server/client files
- `git diff --check`

Recent browser screenshot evidence from the focused Playwright run:

- `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-01-room-options.png`
- `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-02-host-setup-choice.png`
- `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-02-guest-setup-choice.png`
- `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-03-host-organization-surface.png`
- `packages/e2e/test-results/space-agency-agencies-setu-1b672-ick-Start-setup-enters-game-chromium/space-agency-agencies-03-guest-organization-surface.png`
- `packages/e2e/test-results/space-agency-new-aliens--r-445a6-can-reveal-the-Amoeba-board-chromium/space-agency-new-aliens-01-room-options.png`
- `packages/e2e/test-results/space-agency-new-aliens--r-445a6-can-reveal-the-Amoeba-board-chromium/space-agency-new-aliens-02-hidden-board.png`
- `packages/e2e/test-results/space-agency-new-aliens--r-445a6-can-reveal-the-Amoeba-board-chromium/space-agency-new-aliens-03-amoeba-board-actor.png`
- `packages/e2e/test-results/space-agency-new-aliens--r-445a6-can-reveal-the-Amoeba-board-chromium/space-agency-new-aliens-03-amoeba-board-other.png`

These commands prove focused slices plus the current repo-level typecheck/build
gates. The clean repo-level test attempt now gives concrete failing release-gate
evidence rather than missing evidence: full E2E is not green yet, and complete
screenshot coverage for every organization/new-alien case is still absent.

## Missing Or Weak Evidence

- Full repo-level test evidence is now recorded, but it is failing rather than
  green: `corepack pnpm test` ended in eight broader E2E failures
  (`centaurians-real-flow`, `debug-replay`, two `debug-snapshot-replay` cases,
  `free-action-complete-mission`, `oumuamua-real-flow`,
  `room-configured-flow`, and `room-multiplayer`).
- E2E coverage now includes the named SA-10 setup, organization-power,
  new-aliens, and event-bus specs, but still does not prove all organization
  and new alien cases or a full release pass.
- Arkhos human exploration rewards are displayed as unresolved IDs, not
  executed concrete effects.
- Glyphids translated rewards stop at source-backed coordinate lookup.
- Amoeba organelle rewards and card `SA.ET.19` payout remain incomplete.
- Browser screenshot evidence now covers lobby Space Agency options, setup
  choice, organization surfaces, hidden alien board, and the revealed Amoeba
  board. It does not yet cover every organization, every Space Agency alien
  board renderer, or a full release pass.

## Conclusion

The active goal cannot be marked complete. Organization behavior is largely
implemented for the current runtime surface, and the three Space Agency alien
species have meaningful common/server/client scaffolding plus focused tests.
However, several alien reward paths remain intentionally blocked because their
structured source payloads are missing, and the remaining SA-10 test/E2E/browser
evidence is not yet green.

The safe conclusion is: keep the implementation status as in progress, preserve
opaque unmapped IDs where source data is missing, and continue with narrow
source-backed slices.

## Safe Next Slices

1. Fix or explicitly triage the current full-suite E2E failures, then rerun the
   remaining SA-10 release gates: full `pnpm test`, full
   `pnpm --filter @seti/e2e test`, BASE long regression, and SA long regression.
2. Continue source recovery for `alphabetTable`, Amoeba organelle rewards, and
   Arkhos `effectSmall`/`effectBig`; implement execution only after a structured
   source is available.
