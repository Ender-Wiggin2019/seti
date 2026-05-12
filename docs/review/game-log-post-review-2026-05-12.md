# Game Log Post-Review — 2026-05-12

## Scope

Reviewed the game log refactor across common protocol, server event producers and transport, client event ingestion, rendering, and responsive log layout.

## Fixed Findings

- Added stable optional `id` to `TGameEvent` and server event helpers. Client now dedupes by `id` first, so same-timestamp same-action events are not collapsed.
- Made `useGameEvents` return the previous state when a seed/live merge adds no events, avoiding redundant render loops from repeated seed arrays.
- Prevented card-reference clicks inside compact logs from bubbling into the compact log expander.
- Expanded compact-dialog log scroll height to `68vh` while keeping the side log compact.
- Kept newest-first logs scrolled to the top instead of forcing the view to the oldest entries.
- Made score source and alien names readable instead of rendering raw enum/backend tokens.
- Made scan sector debug logging non-blocking for lightweight `IGame` test doubles that do not provide `eventLog`.
- Updated the stale computer-tech unit assertion to match the existing `{ anyCard: 1 }` behavior used by implementation and sibling tests.

## Verification

- `pnpm --filter @ender-seti/common test` — 13 files / 142 tests passed.
- `pnpm --filter @seti/client test` — 63 files / 227 tests passed.
- `pnpm --filter @seti/server test` — 298 files / 1898 tests passed.
- `pnpm --filter @ender-seti/common typecheck` passed.
- `pnpm --filter @seti/server typecheck` passed.
- `pnpm --filter @seti/client typecheck` passed.
- Touched-file `pnpm exec biome check --diagnostic-level=error ...` passed.
- `git diff --check` passed.
- Vite dev server started and the app shell loaded at `http://127.0.0.1:5173/`.

## Residual Risk

- `/debug/game` still redirects to `/`, so this pass could not visually inspect an authenticated/live game log route in browser. Component, layout, hook, gateway, and full package tests cover the changed behavior.
- The full client suite still emits the existing jsdom `window.scrollTo` warning in `ProtectedRoute.test.tsx`; tests pass and the warning is unrelated to game log behavior.
