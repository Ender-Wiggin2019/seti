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

> **Audit notes (2026-05-20):**
> - Re-scanned the backlog after the Oumuamua art + plugin audit pass.
>   Still-open items below have been re-verified against the current
>   `feature/server` HEAD; closed items moved to "Done".
> - Test baseline now: server 2159/2162 (3 pre-existing failures, none
>   Tong-owned: `OrganizationCardPowers > Cosmos Strategy Group …`,
>   `OrganizationTechProbePowers > Helion Assembly …`,
>   `SpaceAgencyAlienPlugins > deals Amoeba discovery cards …`); client
>   316/316; `pnpm -r typecheck` clean.
> - Pulled upstream merge `225745f` adding more org/expansion content
>   on top of `f560f47 feat: update unit test`. The two new
>   organization-power test failures came in with that merge — flagged
>   to the original author, not picked up here.
> - 2026-05-19/20 update: backend-only P0/P1 slice landed (see Done) +
>   Oumuamua planet art on solar wheel + Oumuamua rule-coverage audit
>   sweep (see Done). Anomalies P0 cross-check and WS reconnect P0 are
>   still open below.

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
- _Audit (2026-05-19): still broken — `socket.on('reconnect', …)` is
  unchanged at line 19._

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

### P1 — `AndOptionsInput` Back button preserves stale response

- `packages/client/src/features/input/AndOptionsInput.tsx:111` —
  `setCurrentStepIndex(prev - 1)` decrements without clearing
  `responses[currentStepIndex]`. If the player goes Back and Next without
  re-answering, the old response is silently re-submitted as part of the AND
  payload.
- Fix: clear `responses[currentStepIndex]` (set to `undefined`) before
  decrementing.

### P1 — Calibrate Centaurians / Exertians / Mascamites / Oumuamua art

- Anomalies coordinates were re-tuned (`AnomaliesBoardArt`'s
  `ANOMALIES_LAYOUTS`) and the four other aliens still use rough
  placeholder coordinates from the original art-mode landing.
- Use `?calibrate=1` + `?previewOverflow=N` overlay (already wired) plus
  `/tmp/try-layout.mjs` (the iteration script used for Anomalies) to
  read deltas and update each renderer's layout constants until rings
  sit on printed circles.
- Once all five are calibrated, evaluate whether to extract a shared
  `<TraceOnlyAlienBoardArt>` for the four non-Anomalies renderers.
- Bumped from P2 → P1 because the user-visible misalignment is the next
  obvious blocker after Anomalies looked right.

### P2 — Apply tile-half overflow stacking to non-Anomalies aliens

- The shared `SlotOccupantOverlay` now centre-stacks tokens inside
  overflow pills (per the pink-trace UX slice). When the other four
  aliens get their art-mode coordinates calibrated above, double-check
  the overflow rendering on Oumuamua tier 6 (`maxOccupants: -1`) and
  any other `maxOccupants: -1` slot — the existing `TraceMarkerOverlay`
  already supports this, but it hasn't been visually verified for the
  hi-res art.

### P2 — Tune per-tile sector data-slot layouts

- `SectorNodeView.tsx` `PER_TILE_SIGNAL_LAYOUT` currently holds the
  same default layout for all four tiles (TILE_1..TILE_4). The plumbing
  is there for per-tile overrides — each tile's printed data-slot oval
  has slightly different positioning, so this is where remaining
  pixel-level tuning lives.
- Tune visually using a fresh game (each tile gets randomly placed at a
  cardinal each game). Five knobs per half: `sigX`, `sigY`, `sigRot`,
  `arcRadiusPx`, `dotDiameterPx`. `dotDiameterPx`/`arcRadiusPx` already
  scale automatically with `boardScale`; `sigRot` is angular — leave
  alone.

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

### P1 — Base-board terrain layer not modeled (Oumuamua-cover semantics)

- The printed game board has a static base layer underneath disc 3
  with asteroid / comet markers that show through disc-3 NULL slots
  as the disc rotates. Today's data model has only one terrain layer
  per cell (the visible disc-band element), so when Oumuamua's tile
  sits on top of a base-board asteroid or comet, there's no
  underlying record to suppress.
- Tong has observed asteroid / comet effects firing through disc 3
  in the live game, so the gap is real and applies generally — not
  just to Oumuamua. The Oumuamua case adds the extra wrinkle that
  the rulebook says the tile "covers" the underlying terrain while
  it sits there, but uncovers it again if/when the disc rotates the
  Oumuamua tile away from that physical base-board cell.
- Fix shape (sketch — needs investigation first):
  1. Confirm how the existing code surfaces base-board markers today
     (rendering or visit-event paths) — there may already be a
     hidden code path; if not, this whole layer is missing.
  2. Add a per-cell `baseBoardElements` slot or equivalent so the
     stationary terrain stays attached to the physical wedge rather
     than the rotating disc cells.
  3. When iterating elements at a cell (visit events, leave-cost,
     card scans), skip the base-board layer when a planet element
     covers it.
- Pair with the Oumuamua audit slice's `isCoveredByPlanet` helper
  hook, which was reverted from this round because there's nothing
  for it to cover until the base layer is modeled.

### P3 — `tsconfig.base.json` `moduleResolution` is dead config

- `tsconfig.base.json:12` sets `"moduleResolution": "node"` (legacy), but
  every package overrides this (server → `NodeNext`, client → `Bundler`,
  e2e → `bundler`). The base value is misleading and never wins.
- Fix: drop the field from the base. Same for `incremental: true` which is
  flipped to `false` in most packages.

## Done

### Oumuamua rule-coverage audit + planet-visit hardening + exofossil cell visibility - 2026-05-20

Single audit pass through `docs/arch/aliens/oumuamua/rule.md` against
the live code. Most of the rulebook was already implemented; one
real bug fixed and two defence-in-depth tweaks landed.

Plan:
- [x] **Audit:** Walk through every rule-line — setup, exofossils,
  signal routing, tile completion, planet semantics, solo/rival,
  FAQ — and locate the corresponding implementation.
- [x] **Fix the rotation-hook publicity-icon regression.** My earlier
  `OumuamuaAlienPlugin.onSolarSystemRotated` slice called
  `setDynamicPlanetAtSpace(... grantVisitPublicity: false)`, which
  would have stripped the visit-publicity icon from Oumuamua's space
  after the first wheel rotation. Replaced with a metadata-only
  update — `SolarSystem.rotateRing` already moves the planet element
  + publicity icon together via the wheel snapshot, so the hook just
  refreshes the cached `tile.spaceId` / `tile.sectorId` for
  dual-routing, projection, and rival logic.
- [x] **Investigated underlying-terrain coverage and reverted the
  initial fix.** First pass had `setDynamicPlanetAtSpace` strip
  ASTEROID/COMET so probes visiting Oumuamua wouldn't fire those
  events. Reverted on review: that layer of terrain belongs to the
  static base-board *under* disc 3, not to disc 3 itself, and
  destructively dropping it means the marker would never re-emerge
  when the disc rotates Oumuamua away. Today's data model only has
  one terrain layer per cell, so there's nothing to "cover" yet —
  filed as a separate P1 ("Base-board terrain layer not modeled").
- [x] **Per-player exofossil cell hidden when Oumuamua absent.**
  `ResourceBar` now takes a `showExofossils` prop (default `false`).
  `PlayerDashboard` forwards it; `GameLayout`'s `PersonalColumn`
  computes `findOumuamuaTile(gameState?.aliens) !== null` and feeds
  the result. The tile is set in the plugin's `onDiscover`, so the
  cell appears post-discovery and stays hidden in non-Oumuamua
  games. Grid switches between 5 and 6 columns to keep cell widths
  uniform.

Review:
- The audit covered all 24 rule-lines across the raw + detailed
  rule.md layers. Coverage was already broad — VP at marker 1/0/2,
  tile completion exofossil-per-contributor + refill + no winner +
  no publicity, dual-routing wired through `MarkSectorSignalEffect`
  + `OrbitProbeEffect`, rival's "always marks tile" short-circuit,
  rival's "treat as occupied" via `canPlaceTraceOnSlot`, exofossil
  exclusion from `TExchangeableResource`, no end-game VP scoring on
  exofossils, Oumuamua present in `ORBITABLE_PLANETS`, and the
  alien-board's Orbit/Land surface in `AlienBoardView`.
- Top-tier (`maxOccupants: -1`) "marked any number of times, each
  spends 1 exofossil" already works because `parseTraceSlotCost`
  reads cost from the slotId on every placement and
  `onPlaceTraceOnSlot` always spends it once per mark.

Verification:
- `pnpm -r typecheck` clean.
- `pnpm --filter @seti/server test -- --run` — 2159/2162 (3
  pre-existing failures unrelated: two upstream organization-power
  tests from the `225745f` merge, plus the long-standing
  `SpaceAgencyAlienPlugins > deals Amoeba discovery cards…` flake).
- `pnpm --filter @seti/client test -- --run` — 316/316. Updated
  `ResourceBar.test.tsx` to assert both the visible (with
  `showExofossils`) and hidden (default-off) cell paths.

Residual:
- The audit also confirmed the dual-routing and rival paths are
  correct against the rulebook. No follow-ups needed.

### Oumuamua planet art on the solar wheel - 2026-05-19

Plan:
- [x] **Pin Oumuamua 2 sectors clockwise of Jupiter on ring 3.**
  `OUMUAMUA_SOLAR_SYSTEM_WHEEL_POSITION.sourceSlotIndex: 1 → 5`.
  Same band as Jupiter so the tile rotates in lockstep — no
  computation needed beyond the existing `getOumuamuaSolarSystemSpaceId`.
- [x] **Add `onSolarSystemRotated` hook** to `OumuamuaAlienPlugin`
  so the plugin's cached `tile.spaceId` / `tile.sectorId` follow
  the wheel after each rotation. (Later refined — see audit slice
  above — to *only* update metadata, since the wheel snapshot
  already moves the planet element + publicity icon together.)
- [x] **Render the printed Oumuamua planet PNG on the solar
  board.** Drop `planet.webp` into
  `packages/client/public/assets/seti/aliens/oumuamua/`. Add an
  `OumuamuaPlanetArt` component in `SolarSystemView.tsx` that
  positions the image at the tile's space-centre with calibrated
  rotation/scale/offset constants. URL params
  `?oumRot=…&oumScale=…&oumT=…&oumR=…` allow live tuning before
  baking values in.
- [x] **Switch the 3-data marker pill to arc layout.** Reuses
  `SectorSignalList`'s `arc` mode (same as the per-tile sector
  data slots in `PER_TILE_SIGNAL_LAYOUT`). Arc geometry and the
  group offset both scale with the solar-board zoom factor
  (`normalizedSolarBoardZoom`) so dots stay visually consistent
  with the rest of the board at any zoom. The dark pill chrome
  is dropped in image mode so dots overlay the planet art
  directly; text mode keeps the pill for debug readability.

Verification:
- `pnpm -r typecheck` clean.
- `pnpm --filter @seti/server test -- --run OumuamuaAlienPlugin`
  passes after updating the `places oumuamua on the fixed ring-3
  wheel slot` assertion to expect `ring-3-cell-15` (slot 5 of
  band-2 expanded by `cellsPerSector: 3`).
- `pnpm --filter @seti/client test -- --run` — 303/303.
- Live tuning in `/debug/replay` with the Oumuamua preset.

### Backend P0/P1 backlog: alien reward delivery + auth guard + lobby + persistence - 2026-05-19

Single sweep through four backend-only items the user picked from the open
backlog. Two commits on `feature/server`: `c0c66cf` (P0 footguns) and
`2b52b85` (P1 backlog).

Plan:
- [x] **P0 — `executeRewards` short-circuit + `onSolarSystemRotated` CUSTOM-skip.**
  Make `AlienState.executeRewards` apply all simple rewards inline first,
  then build at most one `CUSTOM:DRAW_ALIEN_CARD` PlayerInput at the end
  (boolean `hasPendingDrawAlienCard` flag — a typed accumulator was
  rejected because it couldn't be narrowed without an unsafe cast).
  Make it `public`. In `AnomaliesAlienPlugin.onSolarSystemRotated`, swap
  `executeSimpleSlotRewards` for `executeRewards` and push any returned
  PlayerInput onto `game.deferredActions` with
  `EPriority.IMMEDIATE_REWARD`, mirroring the existing trace-slot path.
  Two regressions added — "applies simple rewards listed AFTER a
  CUSTOM:DRAW_ALIEN_CARD" and "routes CUSTOM token rewards through the
  deferred queue (no silent drop)".
- [x] **P0 — `JwtAuthGuard` per-request DB roundtrip.** Drop the
  `authService.getProfile(payload.sub)` call from the guard; trust the
  signed JWT for read paths, keep the existence check on user-write
  paths (`PUT /auth/me` etc.) where the FK matters. Removed the
  `AuthService` injection from the guard's constructor and the
  `auth.module.ts` `APP_GUARD` factory. Replaced the
  "rejects … no-longer-exists" integration test with a positive
  assertion that the guard does NOT round-trip authService for a
  missing user.
- [x] **P1 — Lobby `startGame` transaction with row lock.** Wrapped
  the whole method in `this.db.transaction(async tx => …)` and used
  `.limit(1).for('update')` on the games row so two concurrent
  `POST /lobby/rooms/:id/start` requests serialize. The second call
  sees `status='playing'` after the first commits and rejects with
  `BadRequestException`. `getPlayersForGame` now takes an optional
  `db` parameter (defaults to `this.db`) so the inner transactional
  call reuses the locked tx. Mock-db chain in the lobby test extended
  with a `transaction(callback)` impl that runs inline against the
  same db, plus `.for()` as the awaitable terminator after `.limit()`;
  added a "rejects a second concurrent start once the first one
  settles" regression that drives the lock via two `.for()` results.
- [x] **P1 — `AlienBoardInit` overflow plurals.** Dropped the singular
  `overflowSlot?` from `IAlienBoardInit` and the matching path in
  `hydrateTraceSlots` so the init shape can no longer specify both
  fields and accidentally duplicate the slot. The read-only
  `get overflowSlot()` accessor stays — it's a safe convenience.
- [x] **P1 — `gameSnapshots` prune on unload.** Added
  `GameRepository.pruneSnapshots(gameId, keep = 50)` that selects the
  most recent `keep` versions descending and deletes anything older
  than `oldestKept`, while preserving version 0 unconditionally
  (GAME_CREATED seed; sole loader entry-point for cold cache).
  `GameManager.unloadGame` now calls it inside try/catch; failures
  log a warning but don't fail the unload itself. Two regressions
  added — "prunes old snapshots when unloading" and "unloads cleanly
  even when prune throws".

Review:
- The `executeRewards` rewrite was the highest-risk change. The first
  attempt used a typed accumulator
  (`{ reward: TSlotReward & { type: 'CUSTOM'; effectId: 'DRAW_ALIEN_CARD' } }`)
  that TypeScript couldn't narrow from a generic CUSTOM reward
  assignment; replaced with a boolean flag, which is also semantically
  correct (we only ever build a single DRAW_ALIEN_CARD prompt per
  call). All existing call-sites pass without change.
- The two new Anomalies plugin tests both initially failed with
  `expected true to be false` / `expected boolean to be object`; the
  root cause was that the auto-draw fallback returns
  `onComplete?.()` (undefined) when there's only one drawable card.
  Seeding both `board.faceUpAlienCardId = 'ET.3'` AND
  `board.alienDeckDrawPile = ['ET.1', 'ET.2']` forces the
  SelectOption branch, which is what the regression actually wants
  to exercise.
- The lobby transaction test ran into two mock-chain quirks:
  (1) the row-lock select chains `.limit(1).for('update')`, so
  `.limit` can't be a terminal `.mockResolvedValue` — it needs to
  return a chainable object that exposes `.for`. Fixed by promoting
  the chain to `vi.fn().mockReturnThis()` and terminating on
  `.for()`. (2) The transaction-wrapped service builds a fresh
  `new GameRepository(tx)` inside the tx, which bypasses the
  field-replaced `service.gameRepo.startFromLobby` stub. Fixed by
  spying on `GameRepository.prototype.startFromLobby` instead.
- `JwtAuthGuard` change: the `lessons.md` constraint ("engine should
  still 401 if sub no longer resolves to a real user") is now honoured
  exclusively at user-write paths via `authService.updateProfile`,
  not on every guarded request. The integration test was rewritten
  to lock that intent in: a token whose `sub` doesn't exist in `users`
  still gets 200 from a generic GET endpoint.
- Snapshot prune is `keep = 50` (configurable) and runs only at
  unload. The keep-window naturally covers the undo subsystem's
  N-version peek, and version 0 stays regardless so cold-cache load
  always succeeds. Errors don't block unload — losing a few stale
  rows is preferable to leaving the game in memory.

Verification:
- `pnpm --filter @seti/server typecheck` — clean.
- `pnpm --filter @seti/server test -- --run` — 2127/2128 (the only
  failure is the pre-existing
  `SpaceAgencyAlienPlugins > deals Amoeba discovery cards…` flake,
  audit-tracked since 2026-05-17).
- All 4 new regressions pass: 2 in
  `AnomaliesAlienPlugin.test.ts`, 1 in `lobby.service.test.ts`
  (concurrent-start), 2 in `GameManager.test.ts` (prune happy +
  prune-throws). The rewritten JwtAuthGuard integration test passes.

Residual:
- "P0 — Cross-check the rest of the alien reward ladders" still
  open. The `executeRewards` short-circuit was the prerequisite; the
  cross-check itself wasn't part of this slice.
- All remaining "client/UI verification needed" P0/P1 items
  (WS reconnect, `AndOptionsInput` Back-clear, alien art
  calibration) are still open — not picked up because the user
  flagged UI testing as inconvenient.

### Sector data dot arc + zoom-aware sizing + overflow bin - 2026-05-19

Assumptions:
- Printed sector data slots are curved ovals along each tile's arc, not
  straight horizontal rows. Dots should match the curvature.
- Adjacent dots in the same slot should touch (no gaps) regardless of
  capacity (4/5/6) — a 6-data slot spans wider than a 4-data slot but
  the dot density is identical.
- Zooming the solar board must scale the data slot proportionally; the
  data row was previously frozen in CSS px and broke at non-default zoom.
- Per the rulebook, "any excess signals you mark in the sector count
  towards winning" — sector resolution only happens at the end of the
  active player's main action, so a player can pile up overflow markers
  within one turn.

Plan:
- [x] `SectorSignalList`: add an `arc` mode that places dots tangent to
  each other along an arc (`step = 2·asin(d / 2r)`). Concave side faces
  the sun (board centre).
- [x] `SectorNodeView`: per-(tileId, half-index) layout table
  (`PER_TILE_SIGNAL_LAYOUT`) with `sigX/sigY/sigRot/arcRadiusPx/dotDiameterPx`.
  Each tile has its own copy so they tune independently.
- [x] `SolarSystemView` → `SectorGrid` → `SectorView` → `SectorNodeView`:
  thread `boardScale` (= current zoom factor) and multiply px-based
  layout values by it so the slot stays aligned at any zoom.
- [x] When `signals.length > capacity`, render the extras as a
  horizontal stack flush to the right end of the arc — the temporary
  holding area for overflow markers.
- [x] Add a `Sector` regression test asserting overflow markers count
  toward majority (4-vs-1 with 3 overflow markers, p1 wins).

Review:
- The arc formula picks `step = 2·asin(d/(2r))` (chord-angle) so adjacent
  dots are exactly tangent; the slot's total angular span scales with
  count, which is what the user expected.
- `boardScale` is `normalizedSolarBoardZoom` (clamped 0.72…1.08), exposed
  via prop chain — no React context, no CSS-var-readback hacks.
- Server-side overflow logic was already correct (`Sector.markSignal`
  appends past capacity, `computeRanking` iterates all signals); the
  test locks that semantic in place.

Verification:
- `pnpm -r typecheck` clean.
- `pnpm --filter @seti/client test -- --run` — 303/303.
- `pnpm --filter @seti/server test -- --run` — 2122/2123 (only the
  pre-existing Amoeba flake; new `Sector` overflow-majority test passes).

Residual:
- Per-tile fine-tuning of `PER_TILE_SIGNAL_LAYOUT` is open under
  "P2 — Tune per-tile sector data-slot layouts". Today all four tile
  entries point at the same default layout.

### Anomalies token art + recalibrated anchors - 2026-05-19

Plan:
- [x] Drop 6 hi-res anomaly token PNGs (pink+credit/VP, yellow+card/publicity,
  blue+data/energy) into `packages/client/public/assets/seti/aliens/anomalies/tokens/`.
  Verified alpha channel (corners `a=0`, no white-bg leak).
- [x] `SolarAlienTokenMarker`: render `<img>` with the matching art when
  `(traceColor, headlineReward)` maps to a printed combo; fall back to
  the pre-existing pill UI for any unmapped combo.
- [x] Slide each token tangentially along its orbit
  (`ALIEN_TOKEN_TANGENTIAL_OFFSET_PX = 35`) so it sits next to the
  sector's planet/comet rather than on top of it.
- [x] Recalibrate Anomalies trace-slot anchors against the hi-res
  board art (`ANOMALIES_LAYOUTS`).

Verification:
- `pnpm --filter @seti/client typecheck` clean.
- `pnpm --filter @seti/client test -- --run SolarSystemView` — 302/302.
- Live board screenshot: 8 anomaly tokens render with their printed art
  on a fresh `anomaly-trigger-resolution` replay.

### Earth-scan-marks-wrong-sector - 2026-05-18

The actual bug:
- `getSectorAt(game, wedgeIndex)` did `game.sectors[wedgeIndex]`, but the
  `game.sectors` array was ordered by tile-placement (NORTH first, then
  EAST/SOUTH/WEST), NOT by wedge index. So the server's "Earth's wedge
  index = 5" lookup grabbed `sectors[5]` which was sector-4 — the next
  sector in placement order — and the marker landed on the wrong tile.
- Investigation went down a wrong path first (cardinal-position-vs-
  wheel-angle theory). The cardinal-walk and sector-pair changes are
  still correct rendering-side fixes, but they didn't address the actual
  bug — the wedge-index → array-index mismatch did.

Fix:
- [x] Sort `game.sectors` by the numeric suffix of `sector-${N}` in
  `buildSectorsFromPlacements` so `game.sectors[N]` is always sector-N.
  Restores the invariant `getSectorAt`/`getSectorIndexByPlanet` were
  written against.
- [x] `ALL_SECTOR_POSITIONS = [NORTH, EAST, SOUTH, WEST]` — walks tiles
  clockwise so sector-N's cardinal tile sits on the same arc as cell-N.
- [x] Sector pairing: NORTH→(7,0), EAST→(1,2), SOUTH→(3,4), WEST→(5,6),
  so the two sectors of each tile straddle the cardinal anchor.
- [x] Client `getFallbackSectorIndex` mirrors the server pairing.

Verification:
- Live: 8/8 fresh replays mark the same sector that contains Earth
  (wedge index match, cardinal-tile match).
- `pnpm -r typecheck` clean.
- `pnpm --filter @seti/server test -- --run` — 2089/2090 (pre-existing
  Amoeba flake unrelated).
- `pnpm --filter @seti/client test -- --run` — 301/301.

Lessons:
- When a server already exposes the correct value (`getSectorIndexOfPlanet`
  returned 5 correctly for cell-5), trust it and trace ONE level — check
  what the consumer does with that value. Going up to "the layout must be
  fundamentally wrong" was premature.

### Trace UX + sector labels + pink rename - 2026-05-18

Assumptions:
- The trace-of-life icon printed on components is magenta/pink (heart-shaped
  symbol on sector tiles), not red. The internal enum was named `ETrace.RED`
  for historical reasons; renaming the TypeScript identifier to `PINK` while
  keeping the persisted string value `'red-trace'` preserves DB / save-game
  compatibility.
- Sector RED (the **sector colour** on tiles like Procyon / Barnard's Star)
  is genuinely red on the printed components — that stays unchanged.
- Discovery + Overflow trace circles should read as the same kind of slot,
  with player tokens overlaid at the same size in both variants.
- Free-action sector resolution should read like the rulebook
  ("Red Barnard's Star"), not raw sector ids.

Success criteria:
- All trace-of-life UI uses magenta hex (#d63384) and the label "Pink".
- `ETrace.RED` is gone from TypeScript code; the enum value stays
  `'red-trace'` so saved games keep loading.
- Discovery vs Overflow tokens are the same size (55% of slot width); no
  trace-color ring on player markers — only player colour with a thin dark
  border.
- Trace Placement Replay starts the active player with 6 data on the
  computer, 6 data in the pool, a probe on Mars, and every sector
  pre-marked down to one signal — so any sector mark fulfils, the active
  player wins, and the pink trace-of-life prompt fires.
- Sector resolution and "Mark Earth" / "Mark sector by colour" / probe
  pickers all show "Red Barnard's Star (sector-3)" labels instead of raw
  sector ids.
- Test suite ≥ pre-slice baseline (no new pre-existing failures).

Plan:
- [x] Discovery / Overflow / AnomalyTier shared `SlotOccupantOverlay`
  re-tuned: tokens centre-stack inside overflow pills (matching the
  Anomalies overflow ladder, but symmetric instead of bottom-up).
- [x] Drop the trace-color ring from `SlotOccupantOverlay`,
  `AnomaliesBoardArt.SlotMarker`, `TraceMarkerOverlay.SlotMarker` —
  player tokens are pure player colour with `border-black/50`.
- [x] Resize Discovery / Overflow circles + AnomalyTier bubble to
  `w-[78%] max-w-16` so they read as the same size as the printed
  alien-board markers (and shrink/grow with column width).
- [x] Mass rename `ETrace.RED` → `ETrace.PINK` across all 96 source
  files (server, client, common, web, tests). String value stays
  `'red-trace'`.
- [x] Recolor `[ETrace.PINK]: '#e93e27'` → `'#d63384'` (magenta) in 6
  client renderers; sector RED hex stays red.
- [x] Update display labels: TRACE_LABEL `'Red'` → `'Pink'`,
  `formatTraceColor` `'Red'` → `'Pink'`, Centaurians plugin test
  assertion `'Place Red trace'` → `'Place Pink trace'`.
- [x] Replay preset bug fix: pre-mark sectors with the active player's
  id (was a fake "neutral debug" id, which would win the sector and
  rob the player of the trace prompt). Two-step data gain (gain 6 →
  place 6 → gain 6) works around the `DATA_POOL_MAX = 6` cap.
- [x] Add `SectorLabel.ts` (single source of truth for sector option
  labels) and reuse `formatSectorOptionLabel` across 9 callsites:
  `SectorFulfillmentEffect`, `MarkSectorSignalEffect.markByColor`,
  `markByColorWithoutData`, `ScanActionPool` Earth-Look picker,
  `ScanWithTechsEffect` candidate + earth picker, probe-sector card
  utils, `AnySignalQuickMissionCard`, `OrbitingLagrangePointCard`,
  `TessSatelliteCard`.
- [x] Add E2E test: `ResolveSectorCompletion.test.ts` "marking the
  last data signal in a pre-marked sector prompts the active player
  to place a pink trace" — exercises the full
  MarkSectorSignalEffect → deferred queue → trace input flow.
- [x] Defensive fix in client `getSectorIdByPlanet`: replaced
  `indexInRing % 8` with `floor(indexInRing / ringIndex)` so the
  helper agrees with server math on rings > 1.

Review:
- The bulk rename ran in two passes — BSD `sed -E '... \b'` doesn't
  treat `\b` as a word boundary, so the first sweep was a no-op.
  Second pass with `(ETrace\.RED)([^A-Za-z0-9_])` + `(ETrace\.RED)$`
  caught all 96 files cleanly.
- The replay-preset bug was a subtle ranking issue: 4 fake "neutral
  debug" markers + 1 real marker meant the fake player won the
  sector and the trace bonus never fired for the real player. Fixed
  by pre-marking with the active player's id.
- Earth-scan-marks-wrong-sector turned out to be a *different* bug
  (cardinal-position vs. wheel-angle disagreement). Documented as
  the next P0 with three candidate fix shapes.
- Verification:
  - `pnpm -r typecheck` — all 6 packages clean.
  - `pnpm --filter @seti/client test -- --run` — 301/301.
  - `pnpm --filter @seti/server test -- --run` — 2089/2090
    (pre-existing Amoeba flake unrelated to this slice).
- Residual:
  - Earth-scan-marks-wrong-sector layout fix tracked as P0
    "Sector-tile cardinal placement vs. wheel-cell angles disagree".

### Anomalies trace placement: per-tier slots, friendlier labels, auto-tab - 2026-05-18

Assumptions:
- Anomalies columns must let the player choose **any available tier**, not
  auto-fill bottom-up — only the top "overflow" space stacks tokens.
  Re-reading `docs/arch/aliens/anomalies/rule.md` confirmed: "later markers
  stack above earlier markers on top space" applies to the overflow only.
- Universally (across aliens), placement should target whichever printed
  circles still have capacity; this slice ships the Anomalies version, the
  same principle applies as we calibrate the other aliens.
- Discovery and overflow zone bonus circles, plus text-mode column bubbles,
  should share one visual size to read as the same kind of slot.

Success criteria:
- The Anomalies column exposes 5 distinct trace slots per color (4 single-cap
  tiers + 1 top overflow, matching the printed art).
- The trace input prompt lists each tier as its own option with a friendly
  label including the alien name (when discovered) and the slot's reward
  summary, so the player can read the option list and pick a tier.
- Discovery / overflow zones and the text-mode column bubble all use the
  same 64px circle / 128px pill, with player tokens overlaid on the bubble
  (like the AnomaliesBoardArt pattern) instead of in a row beneath.
- When a trace input arrives, the active tab auto-jumps to "Aliens" so the
  player sees the alien board where the choice has to be made.
- Test suite ≥ pre-slice baseline (no new pre-existing failures).

Plan:
- [x] Replace the single-slot-per-color Anomalies model with 5 per-tier
  slots (`AnomaliesAlienPlugin.onDiscover`); each slot carries the matching
  ladder rewards as static data.
- [x] Drop the dynamic `getAnomalyColumnRewardsForPlacement` projection
  from the plugin's `onPlaceTraceOnSlot` (no longer needed; framework
  delivers rewards).
- [x] Update `getColumnLeaderPlayerId` to walk tiers top→bottom and pick
  the highest non-neutral occupant (overflow latest-placed wins).
- [x] Widen `IPublicAnomaliesTraceBoard.columns` from
  `Record<color, IPublicTraceSlot>` to `Record<color, IPublicTraceSlot[]>`
  (bottom→top); update serializer.
- [x] Refit `AnomaliesBoardArt` (real-mode) and `AnomalyColumn` (text-mode)
  to consume the per-tier shape; render each tier as its own bubble with
  occupants overlaid.
- [x] Bump trace-grid bonus circles to `h-16 w-16` (pill `min-h-32 w-16`)
  and reward icons to `sm` so discovery zone, overflow zone, and text-mode
  columns share one visual.
- [x] Remove the pre-existing `compact` mode from the local
  `TraceRewardFrame`; collapse to one variant.
- [x] Update slot-label generator: alien name when discovered, plus
  inline reward summary (`4 VP + alien card`, `2 VP + 1 publicity`, etc).
- [x] Add `isAlienBoardInput` helper + `useEffect` in `GameLayout` to
  auto-jump to the Aliens tab on the first render of an alien-targeting
  pending input.
- [x] Add `Trace Placement Replay` debug preset and `place-trace` REST
  endpoint for fast UX testing without a full Scan/Analyze setup.

Review:
- The slot-label change made the previously broken option text
  ("Alien 1 — alien-0-anomaly-column|blue-trace") become
  "Anomalies — Blue tier 1 — 4 VP + alien card", which is exactly what
  the option list needs to be useful.
- The auto-tab effect is gated on a per-input id ref so the player can
  flip back to Board / Cards / Tech mid-prompt without us re-stomping
  their choice; only the first render of a *new* alien input triggers
  the switch.
- The `compact` removal touched layout only, no game-state
  consequences; existing `<TraceRewardFrame />` callsites work without
  the prop.
- Preserved API compatibility for the `applyTraceToSlot` callers from
  the prior slice — the wider `PlayerInput | boolean` return shape was
  already in place.
- Verification:
  - `pnpm --filter @seti/server typecheck`
  - `pnpm --filter @seti/client typecheck`
  - `pnpm --filter @ender-seti/common typecheck`
  - `pnpm --filter @seti/server test` — `2088 passed, 1 failed`. The
    single failure is the audit-tracked SA Amoeba test, unrelated to
    this slice.
  - `pnpm --filter @seti/client test -- AlienBoardView GameLayout` —
    `301 passed`.
  - Live REST probe of the trace input: option labels render as
    "Anomalies — Red tier 1 — 4 VP + alien card", "Anomalies — Red
    tier 3 — 2 VP + 1 publicity", "Anomalies — Red Overflow — 2 VP",
    "Alien 2 — Discovery (Red) — 3 VP + 1 publicity".

Residual:
- Other aliens (Centaurians/Exertians/Mascamites/Oumuamua) still use
  the old per-color shape and have not been calibrated against their
  hi-res art — tracked under "Open → P2 Calibrate base alien art
  coordinates".
- The `executeRewards` short-circuit and the Anomalies token-trigger
  CUSTOM-drop footguns (P0) are still in place: this slice only changed
  the slot model + labels, not the reward delivery path. The cross-check
  P0 still applies.

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
