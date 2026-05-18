# TODO (Tong)

> Parallel-development log. Original author tracks expansion/backend work in
> `docs/TODO.md`; this file tracks UI/UX/asset polish and supporting fixes
> contributed by Tong. Coordinate before touching items in `docs/TODO.md` to
> avoid duplicate work.
>
> **Coordination rules:**
> - Anything actively listed under "In progress" or "Open" here is owned by Tong.
> - Original-author scope (Space Agency, expansion alien backend, source-data
>   recovery for Glyphids/Amoeba/Arkhos) belongs in `docs/TODO.md` and should
>   not be picked up here unless explicitly handed over.
> - When a slice lands, move it to "Done" with the same Plan/Review/Verification
>   format used in `docs/TODO.md`.

---

## In progress

_(none — most recent slice just landed)_

## Open

> Items are roughly ordered by priority within each P-tier. P0 = act first,
> P1 = important once P0 lands, P2 = quality polish.

### P0 — WS auto-reconnect listener attached to wrong emitter

- `packages/client/src/hooks/useReconnection.ts:19` registers
  `socket.on('reconnect', handleReconnect)`. In socket.io v4 the `reconnect`
  event fires on the **manager** (`socket.io`), not the socket. After an
  auto-reconnect, the client never re-sends `room:join`, so the player sees a
  perpetual loading spinner.
- Fix: switch to `socket.io.on('reconnect', …)` and `socket.io.off('reconnect', …)`,
  matching the pattern `wsClient.ts` already uses for `reconnect_failed`.
- Add a regression covering "reconnect → state push" through the existing WS
  mocks rather than a real network test.

### P0 — Anomalies plugin token-trigger and `executeRewards` short-circuit footguns

- Two related fragility issues in the alien reward delivery path. Each is safe
  given today's data, but both will break silently the moment data shifts —
  and they will be hit by the planned reward-ladder cross-check below.
  - `packages/server/src/engine/alien/AlienState.ts:587-611` —
    `executeRewards` returns immediately when it encounters a `CUSTOM`
    reward, dropping any later entries in the same `rewards` array. Today's
    Anomaly ladder lists VP first then `DRAW_ALIEN_CARD`, so we are safe; any
    future slot that lists CUSTOM before VP would silently lose VP. Fix:
    apply all simple rewards in one pass, then return the first CUSTOM input.
  - `packages/server/src/engine/alien/plugins/AnomaliesAlienPlugin.ts:135` —
    `onSolarSystemRotated` pays the column leader via
    `executeSimpleSlotRewards`, which silently skips `CUSTOM` rewards. Fix:
    route through `AlienState.executeRewards` and surface any returned
    PlayerInput (mirroring the pattern used in `applyTraceToSlotInternal`).
- Both fixes belong in the same slice as the cross-check below; pair them.

### P0 — Cross-check the rest of the alien reward ladders for similar bugs

- `ANOMALY_TOKEN_REWARD_OPTIONS`, `LEFT_ALIEN_REWARDS`, `RIGHT_ALIEN_REWARDS`,
  and `OUMUAMUA_TRACE_SLOT_DEFS` should all be cross-checked against the rule
  book the same way `ANOMALY_COLUMN_REWARD_LADDER` was.
- If any alien-card reward is encoded as `CARD` (regular deck) but the rule
  says it should be alien-deck, they need the same treatment as the Anomalies
  fix: switch to `CUSTOM:DRAW_ALIEN_CARD` and ensure the path delivers through
  `executeRewards` (not `executeSimpleSlotRewards`).
- Pair with the executeRewards short-circuit fix above so the cross-check
  doesn't trip the latent footgun on landing.

### P0 — `JwtAuthGuard` does a DB roundtrip on every authenticated request

- `packages/server/src/auth/jwt-auth.guard.ts:53` calls
  `this.authService.getProfile(payload.sub)` after JWT verification. This
  adds one synchronous `SELECT * FROM users` to every authenticated HTTP
  request and every WS message that passes through the guard.
- The token is already cryptographically signed; user-existence revalidation
  belongs only on sensitive operations (profile update, account deletion),
  not on every single request. Drop the `getProfile` call from the guard.
- Note: `lessons.md` says the engine should still 401 if `sub` no longer
  resolves to a real user; honour that by keeping the existence check on
  the user-write paths (`PUT /auth/me`) where the FK matters.

### P1 — Lobby `startGame` has no transaction; double-start race

- `packages/server/src/lobby/lobby.service.ts:296-363` reads `room.status`,
  validates it is `'waiting'`, then calls `Game.create`, then writes
  `status='playing'`, all in separate un-transacted DB calls. Concurrent
  `POST /lobby/rooms/:id/start` (double-click, retry) can both pass the
  guard, creating two diverging game instances for the same `gameId`.
- Fix: wrap the entire method in `db.transaction()` with `SELECT ... FOR
  UPDATE` on the games row. Add a regression that fires two starts in
  parallel and asserts exactly one succeeds.

### P1 — `AndOptionsInput` Back button preserves stale response

- `packages/client/src/features/input/AndOptionsInput.tsx:111` —
  `setCurrentStepIndex(prev - 1)` decrements without clearing
  `responses[currentStepIndex]`. If the player goes Back and Next without
  re-answering, the old response is silently re-submitted as part of the AND
  payload.
- Fix: clear `responses[currentStepIndex]` (set to `undefined`) before
  decrementing.

### P1 — `AlienBoardInit` accepts both `overflowSlot?` and `overflowSlots?`

- `packages/server/src/engine/alien/AlienBoard.ts:414-418` —
  `hydrateTraceSlots` pushes `init.overflowSlot` and then every entry in
  `init.overflowSlots`. No current caller sets both, but if a future
  migration or fixture does, the slot is duplicated, doubling capacity and
  corrupting occupant counts on reload.
- Fix: drop the singular `overflowSlot?` path from the init shape; require
  callers to use `overflowSlots: [slot]`. The read-only `get overflowSlot()`
  getter can stay.

### P1 — `gameSnapshots` table grows unbounded

- `packages/server/src/persistence/repository/GameRepository.ts:57-68` —
  every `processAction` / `processEndTurn` / `processInput` / `unloadGame`
  inserts a snapshot row, with no prune. `turnCheckpoints` already has a
  `pruneBefore` step; snapshots do not. A long game (or an idle long-lived
  room) accumulates hundreds of rows.
- Fix: add a prune step in `unloadGame`, or on the game-completion path,
  keeping only the last N snapshots (configurable, default ~50).

### P2 — Calibrate base alien art coordinates

- 5 base aliens have art frames + overlays + placeholder coordinates.
  - Anomalies coordinates are calibrated.
  - Centaurians / Exertians / Mascamites / Oumuamua use rough placeholder
    coordinates that need pixel measurement.
- Use `?calibrate=1` overlay to read deltas; update each renderer's layout
  constants until rings sit on printed circles.
- Once art mode is solid, evaluate whether to extract a shared
  `<TraceOnlyAlienBoardArt>` for the four trace-only renderers.

_(Done: hi-res replacements landed for the 5 base aliens + face-down back.
See "Done → Hi-res alien art + face-down back" below.)_

### P2 — Polish overflow rendering for other aliens

- Anomalies overflow stacks tokens vertically with a 1.5 % stride. When other
  aliens get art-mode renderers (Oumuamua tier 6 is `maxOccupants: -1`), apply
  the same pattern via the shared `TraceMarkerOverlay`.

### P2 — `sync-card-assets.sh` runs twice on build and is destructive

- `scripts/sync-card-assets.sh` does an unconditional
  `rm -rf` of `packages/{web,client}/public/seti-assets`, then re-copies.
  `packages/client/package.json` runs it as `prebuild` AND inlines it inside
  the `build` script body, so it runs **twice** per turbo build. It also
  exits non-zero if `packages/cards/assets/images` is missing (CI without a
  prior cards build).
- Fix: drop the inline call from the `build` script body; add a "missing
  source" guard that warns and exits 0 instead of failing.

### P2 — `useGameEvents` re-runs seed-merge effect on every state push

- `packages/client/src/hooks/useGameEvents.ts:21-32` keys the seed-merge
  `useEffect` on `seedEvents`, which is `gameState?.recentEvents ?? []` from
  `GameContext.tsx:76`. `recentEvents` is a fresh array reference on every
  `game:state` push, so the effect re-runs continually. The internal
  `next === prev` guard prevents redundant `setEvents`, but the merge work
  still runs and dedupes by an event-key that includes `JSON.stringify(details)`
  — events without an `id` and without `details` collapse to a degenerate
  key and can collide.
- Fix: stabilise `recentEvents` with `useMemo` in the caller, or compute a
  stable identity (e.g. last-event id) and key the effect on that.

### P2 — `ScoreBreakdown` injects 👑 emoji into a tabular-nums readout

- `packages/client/src/features/scoring/ScoreBreakdown.tsx:120` renders
  `${row.total} 👑` in a monospace cell. Across players the emoji glyph
  width disrupts the score column alignment and conflicts with
  `.impeccable.md` "instrumentation, not decoration" / "data readouts are
  white phosphor on dark, never dressed up as marketing stat tiles."
- Fix: replace the emoji with a small inline SVG indicator or a row-level
  highlight (border/background tint) so the data column stays uniform.

### P2 — `isHandLimitExemptCard` redundantly checks the same condition

- `packages/common/src/rules/handLimit.ts:18-23` ORs `isExertianCard(card)`
  and `EXERTIAN_CARD_IDS.has(cardId)`. Any card with `alien === EXERTIANS`
  is already in `EXERTIAN_CARD_IDS` (the set is built from the same data).
  Harmless today; diverges silently if a future card sets one and not the
  other.
- Fix: prefer the id-based check, fall back to the alien-field check only
  when no id is available (partial objects).

### P3 — Root `pnpm dev` starts the Next.js card-browser, not the game

- `package.json` `"dev": "pnpm --filter @seti/web dev"` is documented in
  `README.md` as the "重点入口" (primary entry). New contributors running
  `pnpm dev` at the root get the card-browser app, not the game; the actual
  game lives in `pnpm dev:client-server`.
- This is documented as intentional, but `@seti/web` and `@seti/client`
  have drifted onto different React/Tailwind/Radix major versions, which
  is a maintenance hazard regardless of which is the "default" entry.
- Fix options (pick one once the team confirms the intent):
  (a) keep `web` as default, but document the split in README and align
      shared dependency majors so the two apps don't drift further apart;
  (b) flip root `dev` to `dev:client-server`, marking `web` as a
      separate utility entry.

### P3 — `tsconfig.base.json` `moduleResolution` is dead config

- `tsconfig.base.json:12` sets `"moduleResolution": "node"` (legacy), but
  every package overrides this (server → `NodeNext`, client → `Bundler`,
  e2e → `bundler`). The base value is misleading and never wins.
- Fix: drop the field from the base. Same for `incremental: true` which is
  flipped to `false` in most packages.

## Done

### Hi-res alien art + face-down back - 2026-05-18

Assumptions:
- The 5 base aliens (Anomalies, Centaurians, Exertians, Mascamites,
  Oumuamua) have stable art that won't be re-skinned by the original author.
- `HiddenBoard` should match the printed board's aspect/frame so the
  discovery transition is purely a face flip, not a size jump.
- The new images are the same artwork at higher resolution, so the calibrated
  Anomalies coordinates (xPct/yPctBottomToTop) remain valid.

Success criteria:
- Each base alien shows its hi-res board in real mode while text-mode is
  byte-for-byte unchanged.
- The not-yet-discovered alien slot shows a face-down "back" image, not
  an empty black placeholder.
- Anomalies marker calibration still passes (rings sit on printed circles).

Plan:
- [x] Convert the 5 hi-res steam PNGs (777x1415) to webp, drop into
  `packages/client/public/assets/seti/aliens/<alien>/board.webp`.
- [x] Add `packages/client/public/assets/seti/aliens/back.webp` for the
  face-down state.
- [x] Update `AlienBoardArtFrame` aspect ratio to `777/1415` so the source
  PNG fits without distortion.
- [x] Branch `HiddenBoard` on `useTextMode()`: real mode renders the back
  image at the same frame; text mode keeps the original empty placeholder.
- [x] Verify calibration overlay rings still align on the new image.

Review:
- The aspect-ratio bump is small (0.5565 → 0.5491, ~1% delta). Anomalies
  marker positions remained correct without re-tuning.
- Image file sizes ~285-432 KB each at q=92 webp (~2.5 MB total for the
  5 boards + back).
- `HiddenBoard` previously rendered as a black box with `min-h-[360px]`;
  the new face-down rendering uses the same fixed-aspect frame as a
  discovered board, so both alien slots size identically before/after
  discovery (no layout shift on reveal).
- Verification:
  - `pnpm --filter @seti/client typecheck`
  - Headless screenshots of all 5 base aliens in real mode + text mode
    confirmed art renders and text-mode unchanged.
  - DOM probe confirmed `?calibrate=1` produces 15 rings + 1 badge on the
    new image, same as before.

### Anomalies art renderer + ladder reward fix - 2026-05-18

Assumptions:
- Original author owns Space Agency / expansion backend; UI/asset polish on
  base aliens is in scope for Tong.
- The five base aliens (Anomalies, Centaurians, Exertians, Mascamites,
  Oumuamua) are stable enough on the backend that visual reskinning won't
  conflict with active backend work.
- `useTextMode()` is the canonical way to toggle text vs image-mode in the
  rest of the codebase (PlanetaryBoardView, SolarSystemView).

Success criteria:
- Real-mode renders the printed alien-board art with player markers landing
  on the printed token-circles, while text-mode is byte-for-byte unchanged.
- Anomalies column rewards match the rule book: 4 VP + alien card on the 1st
  token, 2 VP + alien card on the 2nd, 2 VP + 1 publicity on the 3rd, 3 VP
  on the 4th, 2 VP on each overflow token.
- Custom (alien-card) rewards are delivered through a real `PlayerInput` so
  the player picks face-up vs deck.
- All affected unit tests fail before the fix and pass after.

Plan:
- [x] Add `AlienBoardArtFrame` and `TraceMarkerOverlay` shared components.
- [x] Add `AnomaliesBoardArt`, `CentauriansBoardArt`, `ExertiansBoardArt`,
  `MascamitesBoardArt`, `OumuamuaBoardArt` (placeholder coordinates for the
  last four).
- [x] Calibrate Anomalies coordinates (4 single-cap circles + 1 overflow
  circle, R/B vs Y column offset).
- [x] Add `?calibrate=1` and `?previewOverflow=N` debug flags via a new
  `useCalibrationMode` / `usePreviewOverflowCount` hook.
- [x] Fix `ANOMALY_COLUMN_REWARD_LADDER` data: 1st/2nd token now `4 VP +
  CUSTOM:DRAW_ALIEN_CARD` and `2 VP + CUSTOM:DRAW_ALIEN_CARD`.
- [x] Route Anomalies plugin rewards through `AlienState.executeRewards`
  (assign to `slot.rewards` instead of calling `executeSimpleSlotRewards`).
- [x] Widen `applyTraceToSlot` return type to `PlayerInput | boolean` so the
  alien-card draw input round-trips.
- [x] Map solo rival's `DRAW_ALIEN_CARD` custom reward to `+1 progress`
  (mirrors the existing `CARD` → progress conversion).
- [x] Update tests: `AnomaliesAlienPlugin`, `ResolveDiscovery`,
  `RivalTurnController`.

Review:
- Anomalies art is the only renderer with a fully calibrated layout; the
  other four base aliens still ship with rough placeholder coordinates and
  must be calibrated before they're production-ready.
- The redundant `overflowStrideYPct` field in `AnomaliesBoardArt` was renamed
  to `overflowStridePct` to match `TraceMarkerOverlay`'s field name.
- `useCalibrationMode.ts` was refactored to share a `useQueryParam` helper
  between the two URL flags, dropping ~20 lines of duplicate state-and-effect
  scaffolding.
- The Anomalies trace marker uses `#9ca3af` / `#cbd5e1` (Tailwind grays) for
  neutral / fallback fills; this matches existing usage elsewhere in the
  client but does not strictly conform to `.impeccable.md`'s OKLCH-only
  token policy. Treated as pre-existing convention; not changed in this slice.
- Verification:
  - `pnpm --filter @seti/client typecheck`
  - `pnpm --filter @seti/server typecheck`
  - `pnpm --filter @ender-seti/common typecheck`
  - `pnpm --filter @seti/server test --
    __tests__/engine/alien/plugins/AnomaliesAlienPlugin.test.ts
    __tests__/engine/deferred/ResolveDiscovery.test.ts
    __tests__/engine/solo/RivalTurnController.test.ts` — `2088 passed, 1 failed`.
    The single failure (`SpaceAgencyAlienPlugins > deals Amoeba discovery
    cards once per marked discovery space`) is the pre-existing failure
    documented in `docs/TODO.md` (audit 2026-05-17), unrelated to this slice.
  - Headless-browser screenshots under `?calibrate=1` and `?previewOverflow=3`
    verified Anomalies marker placement and overflow stack visuals.
- Residual risk:
  - Centaurians / Exertians / Mascamites / Oumuamua art coordinates are not
    calibrated; in real mode their player markers may sit visibly off the
    printed circles. Tracked under "Open → Calibrate base alien art coordinates".
