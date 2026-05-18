# Code Review: Uncommitted Space Agency Diff

**Date:** 2026-05-18
**Scope:** Current staged Space Agency expansion diff on `feature/server`,
including supporting common/server/client/e2e/documentation changes.
**Mode:** Review and fix

## Summary

| Severity | Count |
| --- | --- |
| Critical | 1 fixed |
| Warning | 1 fixed |
| Suggestion | 0 |

The Space Agency-specific review found one confirmed rules bug and one stale E2E
assertion caused by the new lobby UI shape. After both fixes, a second pass did
not find another confirmed in-scope Space Agency behavioral gap. Whole-branch
release confidence is still blocked by broader E2E failures and already-known
source-data gaps.

## Fixed Findings

### C-01: Amoeba discovery cards were dealt twice

**Files:** `packages/server/src/engine/alien/plugins/AmoebaAlienPlugin.ts`,
`packages/server/__tests__/engine/alien/plugins/SpaceAgencyAlienPlugins.test.ts`

`AlienState.resolveDiscoverySlots()` already deals one alien card per occupied
discovery slot. `AmoebaAlienPlugin.onDiscover()` then dealt one more card per
discoverer, so a player with two discovery markers received three Amoeba cards
instead of the rule-required two. The new regression failed before the fix with
`expected ... to have a length of 2 but got 3`; the plugin now only handles
organelle/board setup and leaves discovery-card dealing to the generic path.

### W-01: Configured-room E2E still assumed one alien-module switch

**File:** `packages/e2e/tests/room-configured-flow.spec.ts`

The staged lobby UI now renders five core alien switches, but the older E2E used
a singular locator under `game-setting-alien-modules`. The assertion now checks
that the default room has two enabled core switches, matching the new contract.

## Verification

Passed:

- Focused server/common/client checks for the reviewed Space Agency surfaces.
- Focused Space Agency E2E bundle:
  `space-agency-options`, `space-agency-setup`,
  `space-agency-agencies-setup`, `space-agency-organization-power`,
  `space-agency-new-aliens`, `space-agency-event-bus`.
- `corepack pnpm typecheck`
- `corepack pnpm build`
- `git diff --check`

Broader check:

- Clean sequential `corepack pnpm test` after clearing stale E2E harnesses:
  failed in the full E2E stage with `62 passed, 8 failed`.
- The failures were outside the Space Agency-specific focused bundle:
  `centaurians-real-flow`, `debug-replay`, two `debug-snapshot-replay`
  cases, `free-action-complete-mission`, `oumuamua-real-flow`,
  `room-configured-flow`, and `room-multiplayer`.

## Remaining

- Full-branch release readiness is not proven until the eight broader E2E
  failures above are resolved.
- The existing Space Agency completion blockers remain factual blockers, not
  review omissions:
  - Glyphids translated reward payload table plus token placement/refill data.
  - Amoeba organelle reward payloads and full `SA.ET.19` execution.
  - Arkhos human exploration `effectSmall`/`effectBig` reward mapping.
  - Broader SA-10 release/browser evidence beyond the current focused slice.
