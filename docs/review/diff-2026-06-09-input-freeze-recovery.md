# Fix: "Waiting for input" freeze with no interactive UI

**Date:** 2026-06-09
**Scope:** Server + common + client changes on `feature/server` that
eliminate (and add recovery for) a deadlock where the game shows the
"Input Required" status but no interactive widget is reachable.
**Mode:** Diagnose and fix (two-step: fallback + root cause)

## Summary

Players frequently hit a deadlock: the top status bar showed the amber
**"Input Required"** chip, but there was no interactive widget anywhere to
satisfy it, so the page was stuck. The fix has two parts:

1. **Fallback / recovery** — an always-reachable escape hatch (Resync +
   Undo) so a stuck player can always get out.
2. **Root cause** — defense-in-depth: surgical fixes for the known gaps, a
   universal "always-clickable" fallback, and a structural change that makes
   the client derive the pending input from authoritative server state.

| Area | Change |
| --- | --- |
| Recovery | `game:resync` endpoint + always-visible Resync/Undo controls |
| Root cause (structural) | `pendingInput` is now part of the projected game state; client no longer guesses from phase |
| Root cause (surgical) | Sector inputs auto-focus their tab; top-level `OR` inputs now render |
| Root cause (safety net) | Every in-game input exposes a concrete "choose from list" fallback |

## Why it happened (verified in code)

The amber chip (`TopBar.tsx`) lit up purely from `pendingInput !== null`.
Whether a **clickable** widget appeared depended on the presentation mode:

- `DIALOG_ONLY` inputs → `PendingInputPrompt` rendered a modal with real
  buttons (robust).
- `IN_GAME_INTERACTIVE` inputs (sector / planet / sector-option /
  alien-trace / card-row) → `PendingInputPrompt` rendered only a small
  "select a highlighted target" aside; the actual clickable target had to
  come from a board component. If that target wasn't reachable, the player
  was frozen.

Confirmed freeze paths:

- **Sector inputs never auto-surfaced their tab.** `getInputFocusSection`
  returned `null` for `SECTOR` and `sector-N` option inputs (only
  alien/planet boards auto-focused). On another tab → chip shows, board is
  hidden.
- **Top-level `OR` inputs rendered nothing.** `shouldRenderPendingInputPrompt`
  excluded `OR`, so the action bar never mounted `OrOptionsInput`. Any
  top-level OR prompt was a guaranteed deadlock.
- **No dialog fallback for in-game inputs** — any ID/regex mismatch,
  collapsed section, or missing board element left zero clickable widget.
- **Recovery was hidden when needed.** While a pending input was active, the
  action bar replaced the `ActionMenu` (which holds Undo) with the prompt, so
  the Undo button disappeared precisely during the freeze.
- **Fragile clearing heuristic.** `usePlayerInput` kept/cleared `pendingInput`
  based on game `phase`, not authoritative server truth — a desync and
  stale-prompt source.

`undoToTurnStart` (`GameManager`) already rolls back to the start of the
current turn (before the blocking action), but only for the active player,
only when the turn is unlocked, and the button was unreachable during input.

## Changes

### Step 1 — Fallback / recovery (Resync + Undo)

- **`packages/server/src/gateway/game.gateway.ts`** — new
  `@SubscribeMessage('game:resync')` handler that re-emits the projected
  state (and any pending input) **to the requesting socket only**, with no
  room-level side effects. Pure recovery path for a client that believes it
  is stuck.
- **`packages/client/src/api/wsClient.ts`**,
  **`hooks/useGameActions.ts`**, **`pages/game/GameContext.tsx`** — wire a
  `resync()` action through the client stack (mirrors `requestUndo`).
- **`packages/client/src/components/layout/TopBar.tsx`** — new
  `InputRecoveryControls` rendered next to the "Input Required" chip whenever
  the local player has a pending input. The TopBar is never covered by the
  prompt, so these stay clickable even if the prompt fails to surface a
  target:
  - **Resync** (always) — re-pull authoritative state; no game mutation.
  - **Undo** (when `canUndo`) — roll the turn back to its start.

### Step 2a — Surgical fixes

- **`packages/client/src/features/layout/sectionInputs.ts`** — added
  `isSolarSystemInput` and routed it through `getInputFocusSection` so
  `SECTOR` and `sector-N` option inputs now auto-focus the `solarSystem`
  tab.
- **`packages/client/src/features/input/inputPresentation.ts`** —
  `shouldRenderPendingInputPrompt` now returns `model !== null` (dropped the
  `OR` exclusion). OR inputs present as a dialog via `OrOptionsInput`.

### Step 2b — Universal "always-clickable" fallback

- **`packages/client/src/features/input/PendingInputPrompt.tsx`** — the
  in-game hint (`InGameInputHint`) now includes a "Can't find it? Choose from
  list" toggle that renders the existing `InputRenderer` concrete-option
  buttons for the same model. Board interaction stays primary, but there is
  always a reachable widget if the board target can't be found.

### Step 2c — Structural fix (single source of truth)

- **`packages/common/src/types/protocol/gameState.ts`** — added
  `pendingInput: IPlayerInputModel | null` to `IPublicGameState`.
- **`packages/server/src/persistence/serializer/GameSerializer.ts`** —
  `projectGameState` (already per-viewer) now sets
  `pendingInput: viewer?.waitingFor?.toModel() ?? null`.
- **`packages/client/src/hooks/usePlayerInput.ts`** — rewritten to derive
  `pendingInput` from `gameState.pendingInput` (authoritative). The
  `game:waiting` socket event is kept only as a fast-path for the brief
  window before the first state frame arrives, and can never resurrect an
  input the state has cleared. The old phase-based clearing heuristic is
  removed, which kills the desync, the stale-prompt-after-resolve case, and
  the "kept on wrong phase" case in one move.

### Test/fixture updates

- New `pendingInput` field threaded through state/context mock builders:
  `packages/client/test/mocks/gameState.ts`, the `createMockContext` helpers
  in `__tests__/pages/game/*` and `__tests__/features/layout/*`, the two
  debug pages (`GameDebugPage.tsx`, `HotspotsDebugPage.tsx`), and the common
  rules-test state builders (`actions`, `freeActions`, `planet`).
- **`packages/client/__tests__/hooks/usePlayerInput.test.tsx`** — rewritten
  to assert the authoritative-state behavior, including the regression that a
  stale `game:waiting` cannot resurrect a cleared input and that clearing now
  follows server truth rather than phase.

## Verification

Passed:

- **Typecheck:** all six packages (`pnpm typecheck`).
- **Lint + format:** `pnpm lint`; Biome format on all edited files.
- **Unit tests (run per-package directly):**
  - common — 258 passed
  - client — 484 passed (incl. the rewritten `usePlayerInput` suite)
  - server — 2230 passed (incl. `GameSerializer`, `game.gateway`,
    `GameManager`)

Notes / follow-ups:

- The aggregate `pnpm test` (turbo) wrapper wedged at orchestration on this
  machine with no test process running; the suites pass when invoked
  directly per package. Unrelated to these changes but worth a look.
- Manual repro suggestions: trigger a `SECTOR` input while on a non-board
  tab (tab now auto-switches and the list fallback is available), and a
  top-level `OR` input (resolver dialog now renders).
- E2E (`packages/e2e`) not run here; recommended to extend an input
  resolution spec to assert a clickable widget is always present whenever the
  "Input Required" chip is shown.
