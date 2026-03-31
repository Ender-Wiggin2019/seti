export const GAME_DEBUG_DEFAULTS = {
  pushedProbeDelayMsByRing: {
    1: 90,
    2: 150,
    3: 180,
  } as const,
  probeInsetPxByRing: {
    1: 89,
    2: 95,
    3: 91,
    4: 229,
  } as const,
  sectorSignal: {
    sigRot0: -24,
    sigX0: -3,
    sigY0: 10,
    sigRot1: 21,
    sigX1: -19,
    sigY1: -1,
    sectorDataSize: 21,
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
  probeInsetPx: {
    min: 0,
    max: 260,
    step: 1,
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
