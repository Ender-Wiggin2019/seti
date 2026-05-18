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

### Calibrate base alien art coordinates

- 5 base aliens have art frames + overlays + placeholder coordinates.
  - Anomalies coordinates are calibrated.
  - Centaurians / Exertians / Mascamites / Oumuamua use rough placeholder
    coordinates that need pixel measurement.
- Use `?calibrate=1` overlay to read deltas; update each renderer's layout
  constants until rings sit on printed circles.
- Once art mode is solid, evaluate whether to extract a shared
  `<TraceOnlyAlienBoardArt>` for the four trace-only renderers.

### Drop in higher-resolution alien-board PNGs

- Source PNGs in `packages/client/public/assets/seti/aliens/<alien>/board.webp`
  are ~250 px wide rule-book crops; they upscale soft.
- Replace each with a higher-res version (same filename) when available; the
  art frame already letterboxes by aspect ratio, so no layout change required.

### Cross-check the rest of the alien reward ladders for similar bugs

- `ANOMALY_TOKEN_REWARD_OPTIONS`, `LEFT_ALIEN_REWARDS`, `RIGHT_ALIEN_REWARDS`,
  and `OUMUAMUA_TRACE_SLOT_DEFS` should all be cross-checked against the rule
  book the same way `ANOMALY_COLUMN_REWARD_LADDER` was.
- If any alien card reward is encoded as `CARD` (regular deck) but the rule
  says it should be alien-deck, they need the same treatment as the Anomalies
  fix: switch to `CUSTOM:DRAW_ALIEN_CARD` and ensure the path delivers through
  `executeRewards` (not `executeSimpleSlotRewards`).

### Polish overflow rendering for other aliens

- Anomalies overflow stacks tokens vertically with a 1.5 % stride. When other
  aliens get art-mode renderers (Oumuamua tier 6 is `maxOccupants: -1`), apply
  the same pattern via the shared `TraceMarkerOverlay`.

## Done

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
