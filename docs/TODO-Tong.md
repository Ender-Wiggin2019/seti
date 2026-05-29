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
> - When a slice lands, move it to "Done" with a short one-line summary +
>   commit ref so the file stays scannable.

---

## In progress

_(none — most recent slice just landed)_

> **Audit notes (2026-05-29):**
> - Pulled `origin/feature/server` up to `f1dbc6c` (rulebook palette +
>   i18n sweep + gold tile scoring + log/score colorization). Notable
>   upstream commits since the 2026-05-27 audit: `52b6d51` (configurable
>   layout V2 — gated behind `useNewLayout` debug flag, default off),
>   `a1f238a` (trace hotspot debug overlays), `cb8c579` (board asset
>   refresh), `77136ec` (hotspot calibration), `c2ef2e7` (resizable
>   game layout).
> - Test baseline: server **2222/2223** (1 pre-existing peer failure
>   in `debugReplayPresets` — Exertians replay length 9 vs 15;
>   verified failing on upstream tip without our changes), client
>   **411/419** (8 pre-existing peer failures in PlanetaryBoardView,
>   SectorView, PlayerDashboard, RivalPanel hotspot-debug overlay
>   tests; all introduced by `52b6d51`/`77136ec` and verified failing
>   on upstream without our changes). `pnpm -r typecheck` clean.
> - Player palette migrated to the rulebook (green/orange/purple/white)
>   with hex `#219449 / #d46d1e / #801da1 / #e6eded`. Probe + sky
>   tokens now CSS-mask-tinted from a single white asset; score ladder
>   + event log player names colored. Solo rival uses orange.
> - Gold scoring tile formulas were realigned to the rulebook (p.21):
>   per-tile slot multipliers + corrected A/B side assignments. The
>   scoring tab shows tile descriptions + ranked slot chips.
> - Comprehensive input-text i18n pipeline (titles + option labels)
>   landed; server emits `[[card:NN]]` sentinel for card refs and the
>   client localizes via the `seti` namespace. Sector star names,
>   color words, "from card row", "Choose any card", "Mission
>   triggered! Claim reward?", reward tokens (publicity ×2 → 声望 ×2)
>   all translatable.
> - WS reconnect P0, `AndOptionsInput` Back-clear P1, asteroid-leave
>   P2, `sync-card-assets.sh` P2, `useGameEvents` P2,
>   `ScoreBreakdown` 👑 P2, `isHandLimitExemptCard` P2, root
>   `pnpm dev` P3, and `tsconfig.base.json` P3 are all unchanged in
>   upstream — still applicable.
> - V2 layout (`52b6d51`) introduces a parallel `CardRowsSection.tsx`
>   under `features/layout/sections/` that doesn't pick up the buy-
>   confirm dialog or final-round banner from V1. Toggle is gated
>   off by default; flagged as a follow-up if it gets enabled.

## Open

> Items are roughly ordered by priority within each P-tier. P0 = act first,
> P1 = important once P0 lands, P2 = quality polish.

### P0 — WS auto-reconnect listener attached to wrong emitter

- `packages/client/src/hooks/useReconnection.ts:19` registers
  `socket.on('reconnect', handleReconnect)`. In socket.io v4 the
  `reconnect` event fires on the **manager** (`socket.io`), not the
  socket. After an auto-reconnect, the client never re-sends
  `room:join`, so the player sees a perpetual loading spinner.
- Fix: switch to `socket.io.on('reconnect', …)` /
  `socket.io.off('reconnect', …)`, matching the pattern `wsClient.ts`
  already uses for `reconnect_failed`.
- Add a regression covering "reconnect → state push" through the
  existing WS mocks rather than a real network test.

### P0 — Cross-check the rest of the alien reward ladders for similar bugs

- `ANOMALY_TOKEN_REWARD_OPTIONS`, `LEFT_ALIEN_REWARDS`,
  `RIGHT_ALIEN_REWARDS`, and `OUMUAMUA_TRACE_SLOT_DEFS` should be
  cross-checked against the rulebook the same way
  `ANOMALY_COLUMN_REWARD_LADDER` was.
- If any alien-card reward is encoded as `CARD` (regular deck) but
  the rule says alien-deck, switch to `CUSTOM:DRAW_ALIEN_CARD` and
  ensure `executeRewards` (not `executeSimpleSlotRewards`) delivers
  it. Pair with the executeRewards short-circuit fix.

### P1 — Show gold scoring tile art (PNG) + place player markers in the scoring tab

- Today the scoring tab renders gold tiles as plain text rows
  (description + multiplier chips). The rulebook ships 4 double-sided
  printed tiles (TECH / MISSION / INCOME / OTHER, sides A/B) with
  distinct iconography for the formula and three rank slots.
- Plan:
  - Author 8 PNG/WEBP assets (`tile_<id>_<side>.webp`) at the same
    resolution as the alien board art; store under
    `packages/client/public/assets/seti/scoring/`.
  - Build a `<GoldTileArt>` component that paints the asset behind
    three absolute-positioned slot anchors (1st / 2nd / 3rd; the 3rd
    rank holds 2 markers). Calibrate the anchors with the existing
    `?calibrate=1` overlay flow.
  - In image mode the scoring tab renders the art version; in text
    mode keep the existing description rows. The 3 anchors paint
    player tokens (`<ProbeToken>`-style mask-tinted disc) for each
    claim. Bottom rank shows two side-by-side markers.

### P1 — Richer event log: cost+action coupling and card hover/click previews

- Today log lines like `Alice spent 2 credit` and `Alice played 14`
  emit as separate events, and most card refs are bare ids.
- Plan:
  - Server: extend `RESOURCE_CHANGE` events with `before`/`after`
    balance fields so the log can render `2 credit (6 → 4)`.
    Alternatively (simpler): the log component runs a per-player
    resource accumulator over the event stream and infers
    before/after from the deltas.
  - Server: when an action's cost is paid, emit a single composite
    event (or tag the cost event with the parent action id) so the
    log can collapse `paid 3 publicity (5 → 2) → bought card #67
    Yevpatoria Telescope` into one line instead of two.
  - Client `EventEntry`: every card reference (played, discarded,
    bought, scanned, taken from row, refilled) goes through
    `<CardReference>`. The popover currently only shows id; upgrade
    it to render `<CardRender card={card} />` on hover and a full-
    size dialog on click. Skip the link only when the card is a
    blind draw from the deck (private to the drawer).

### P1 — Debug-log show/hide toggle in debug mode

- `EventLog` already filters `level === 'debug'` events out of the
  compact 2-line preview, but the full log dialog and the desktop
  sidebar log show every event including `ACTION_COST` /
  `ACTION_REWARD` / `MILESTONE_CHECK` / debug-only diagnostic events.
  Power users want a toggle.
- Plan: add a checkbox-style chip in the EventLog header
  ("Hide debug" → defaults on for non-debug players; toggleable from
  `gameViewStore` so it persists across navigations). When on, drop
  events with `level === 'debug'` AND collapse `ACTION_COST` /
  `ACTION_REWARD` parents under their main action.

### P1 — Cross-check land + moon rewards against the printed board

- The orbit-bonus pass (2026-05-21) updated every native planet's
  printed orbit rewards in `boardLayout.ts:PLANETARY_BOARD_CONFIG`
  to match the rulebook. The corresponding land rewards and moon
  rewards have not been re-verified.
- Today's land payload per planet: `${planet}_VP + 1 yellow trace`
  with `firstData: [N]` for first-land bonuses. Some printed boards
  add publicity / signals / traces — needs a rulebook pass.
- Pair with the slot-keyed reward model TODO (each landing anchor
  carries its own reward set instead of a flat list).

### P1 — Anchor planet hotspots to the printed image-mode board

- `PlanetaryBoardView`'s image mode renders one anchor button per
  printed planet, but the (`x`, `y`) coordinates in
  `PLANETARY_BOARD_CONFIG[planet]` (anchor / orbitSlots /
  landingSlots) are still rough first-pass values. The picker now
  relies on those positions for the parallel-click affordance —
  visual misalignment makes it look like the hotspot is "off".
- The hotspot calibration debug editor (`HotspotsDebugPage`,
  `3ae7f75`) is in place for tuning. Calibrate per planet using the
  same `?calibrate=1` overlay approach as the alien boards.

### P1 — `AndOptionsInput` Back button preserves stale response

- `packages/client/src/features/input/AndOptionsInput.tsx:122`
  decrements `currentStepIndex` without clearing
  `responses[currentStepIndex]`. If the player goes Back then Next
  without re-answering, the old response is silently re-submitted as
  part of the AND payload.
- Fix: clear `responses[currentStepIndex]` (set to `undefined`)
  before decrementing.

### P1 — Calibrate Centaurians / Exertians / Mascamites / Oumuamua art

- Anomalies coordinates were re-tuned (`AnomaliesBoardArt`'s
  `ANOMALIES_LAYOUTS`) and the four other aliens still use rough
  placeholder coordinates.
- Use `?calibrate=1` + `?previewOverflow=N` overlay (already wired)
  plus `/tmp/try-layout.mjs` (the iteration script used for
  Anomalies) to tune each renderer's layout constants.
- Once all five are calibrated, evaluate extracting a shared
  `<TraceOnlyAlienBoardArt>` for the four non-Anomalies renderers.

### P2 — Apply tile-half overflow stacking to non-Anomalies aliens

- The shared `SlotOccupantOverlay` centre-stacks tokens inside
  overflow pills. Once the other four aliens get art-mode
  coordinates calibrated above, double-check the overflow rendering
  on Oumuamua tier 6 (`maxOccupants: -1`) and any other
  `maxOccupants: -1` slot.

### P2 — Tune per-tile sector data-slot layouts

- `SectorNodeView.tsx` `PER_TILE_SIGNAL_LAYOUT` currently holds the
  same default layout for all four tiles. The plumbing is there for
  per-tile overrides — each printed tile's data-slot oval has
  slightly different positioning.
- Five knobs per half: `sigX`, `sigY`, `sigRot`, `arcRadiusPx`,
  `dotDiameterPx`. `dotDiameterPx`/`arcRadiusPx` already scale with
  `boardScale`; `sigRot` is angular — leave alone.

### P2 — Client `getReachableSpaces` ignores Probe Tech 1 asteroid-leave discount

- `getMoveCost` in `packages/common/src/rules/movement.ts:44` always
  adds `ASTEROID_EXTRA_COST = 1` for asteroid leaves. The server
  applies `TechModifierQuery.getAsteroidLeaveCost(1)` (reduces to 0
  with Probe Tech 1) — but the client never applies this discount.
- Result: a Probe-Tech-1 player sees fewer highlighted destinations
  than the server would accept (server still allows the move).
- Fix: thread the player's effective asteroid-leave-cost into
  `getReachableSpaces` as an optional parameter.
  `IPublicPlayerState.techs: ETechId[]` carries the data.

### P2 — `sync-card-assets.sh` runs twice on build and is destructive

- `scripts/sync-card-assets.sh` does an unconditional `rm -rf` of
  `packages/{web,client}/public/seti-assets`, then re-copies.
  `packages/client/package.json` runs it as `prebuild` AND inlines
  it inside the `build` script body, so it runs **twice** per turbo
  build. Also exits non-zero if `packages/cards/assets/images` is
  missing (CI without a prior cards build).
- Fix: drop the inline call from the `build` script body; add a
  "missing source" guard that warns and exits 0.

### P2 — `useGameEvents` re-runs seed-merge effect on every state push

- `packages/client/src/hooks/useGameEvents.ts:32` keys the seed-merge
  `useEffect` on `seedEvents`, which is a fresh array reference on
  every `game:state` push. The internal `next === prev` guard
  prevents redundant `setEvents`, but the merge work still runs.
  The dedupe key uses `JSON.stringify(details)` — events without an
  `id` and without `details` collapse to a degenerate key and can
  collide.
- Fix: stabilise `recentEvents` with `useMemo` in the caller, or
  compute a stable identity (e.g. last-event id) and key on that.

### P2 — `ScoreBreakdown` injects 👑 emoji into a tabular-nums readout

- `packages/client/src/features/scoring/ScoreBreakdown.tsx:120`
  renders `${row.total} 👑` in a monospace cell. Across players the
  emoji glyph width disrupts the score column alignment and conflicts
  with the "instrumentation, not decoration" guideline.
- Fix: replace the emoji with a small inline SVG indicator or a
  row-level highlight (border/background tint).

### P2 — `isHandLimitExemptCard` redundantly checks the same condition

- `packages/common/src/rules/handLimit.ts:18-23` ORs
  `isExertianCard(card)` and `EXERTIAN_CARD_IDS.has(cardId)`. Any
  card with `alien === EXERTIANS` is already in `EXERTIAN_CARD_IDS`
  (the set is built from the same data). Diverges silently if a
  future card sets one and not the other.
- Fix: prefer the id-based check, fall back to the alien-field check
  only when no id is available (partial objects).

### P3 — Root `pnpm dev` starts the Next.js card-browser, not the game

- `package.json` `"dev": "pnpm --filter @seti/web dev"` is documented
  in `README.md` as the "重点入口". New contributors running
  `pnpm dev` at the root get the card-browser app, not the game; the
  actual game lives in `pnpm dev:client-server`.
- `@seti/web` and `@seti/client` have drifted onto different
  React/Tailwind/Radix major versions, which is a maintenance hazard.
- Fix options: (a) keep `web` as default, document the split, align
  shared dependency majors; (b) flip root `dev` to
  `dev:client-server`, mark `web` as a separate utility entry.

### P3 — `tsconfig.base.json` `moduleResolution` is dead config

- `tsconfig.base.json:12` sets `"moduleResolution": "node"` (legacy),
  but every package overrides this (server → `NodeNext`, client →
  `Bundler`, e2e → `bundler`). The base value is misleading.
- Fix: drop the field from the base. Same for `incremental: true`
  which is flipped to `false` in most packages.

## Done

> One-line summaries with commit refs. See git history (`git log
> --oneline -- docs/TODO-Tong.md` or the listed commit) for the full
> Plan/Review/Verification details that originally lived here.

### 2026-05-29

- **`f1dbc6c`** — rulebook palette (green/orange/purple/white) +
  comprehensive input-text i18n + gold scoring tile rulebook fix
  (per-tile multipliers + correct A/B formulas) + scoring tab tile
  descriptions + IncomeTracker tucked annotation + score ladder /
  event log player-name colorization + probe/sky CSS-mask tinting.

### 2026-05-28

- **`24a5170`** — Cards tab tidy-up (single buy entry via free-action
  bar, confirm dialog, discard pile preview, Final Round banner,
  rotation reminder token); per-rulebook end-of-round leftover sweep
  on round transition.
- **`af6c34d`** — Completed-mission stacked pile + branch claim tokens
  (generalized via per-card branch DOM anchors), enlarged-card cursor
  hint, replay preset for completed missions.
- **`21f9b8d`** — Fix Centaurian sprite truncation (skip card-render
  overlay when `enableEffectRender=false`) + render translated flavor
  strip without breaking layout.

### 2026-05-26

- **`ac5a8de`** — Centaurians messages panel + missions slot
  integration with VP-threshold annotations + cost-display fix
  (energy not credit).
- **`8bb40cc`** — Centaurians per-tier trace ladder bonuses + data
  cost gating.

### 2026-05-21

- **`8a8151a`** — Picker-driven ORBIT/LAND main action via server
  SelectOption (planet picker → slot picker), opt-in first-orbit
  bonus, per-planet orbit rewards refactor, 1-hop move picker, probe-
  shaped player markers on planetary slots, case-insensitive
  Oumuamua routing to Aliens tab.
- **Land main action on Oumuamua** — `eligibleLandPlanets` now
  includes Oumuamua when placed; `AlienBoardView` ships
  `planet-target-oumuamua` LAND button (folded into the
  picker-driven slice).
- **Flush per-turn move stash + restore YELLOW anomaly token art.**
- **Cap solar move picker to 1-hop neighbors.**
- **Layered disc model — base-board terrain visible after rotation.**
- **Defer Oumuamua tile completion to SECTOR_COMPLETION priority.**
- **Solar-system multi-cell movement-cost fix + sector-centre
  rendering.**

### 2026-05-20

- **Oumuamua trace ladder + cost badges + UI polish slice.**
- **Oumuamua rule-coverage audit + planet-visit hardening +
  exofossil cell visibility.**

### 2026-05-19

- **Oumuamua planet art on the solar wheel.**
- **Backend P0/P1 backlog**: alien reward delivery + auth guard +
  lobby + persistence.
- **Sector data dot arc + zoom-aware sizing + overflow bin.**
- **Anomalies token art + recalibrated anchors.**

### 2026-05-18

- **Earth-scan-marks-wrong-sector** fix.
- **Trace UX + sector labels + pink rename** (yellow→pink for the
  third trace color across UI + alien board art).
- **Anomalies trace placement**: per-tier slots, friendlier labels,
  auto-tab.
- **Hi-res alien art + face-down back.**
- **Anomalies art renderer + ladder reward fix.**
