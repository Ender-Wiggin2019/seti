export const GAME_DEBUG_DEFAULTS = {
  pushedProbeDelayMsByRing: {
    1: 90,
    2: 150,
    3: 180,
  } as const,
  sectorSignal: {
    // These mirror `PER_TILE_SIGNAL_LAYOUT[TILE_1]` in
    // `SectorNodeView.tsx` so /debug/game opens with the same sector
    // data-dot positioning as a normal game / /debug/replay. Sliders
    // can still tune from here; reset returns to TILE_1's values.
    //
    // Caveat: the debug page sets these via global CSS variables, so
    // when sliders move they override every tile uniformly — TILE_2/
    // TILE_3/TILE_4 will visually drift slightly because their baked
    // per-tile offsets differ from TILE_1's by a few px.
    sigRot0: -23,
    sigX0: 2,
    sigY0: 3,
    sigRot1: 21,
    // Sliders use step:1, so non-integer offsets (e.g. TILE_1's
    // sigX1: -15.6) round to the nearest int. Visual diff is sub-px.
    sigX1: -16,
    sigY1: -3,
    sectorDataSize: 23,
    circleX0: 0,
    circleY0: -38,
    circleX1: 8,
    circleY1: -33,
  } as const,
} as const;

export const GAME_DEBUG_RANGES = {
  pushedProbeDelayMs: {
    min: 0,
    max: 700,
    step: 10,
  },
  rotation: {
    min: -180,
    max: 180,
    step: 1,
  },
  offset: {
    min: -50,
    max: 50,
    step: 1,
  },
  sectorDataSize: {
    min: 2,
    max: 30,
    step: 1,
  },
} as const;
