import { ETrace } from '@seti/common/types/element';
import type { TAlienSlotReward } from './alienBoardConfig';

export interface ICentauriansRewardSlotDef {
  slotId: string;
  rewards: TAlienSlotReward[];
  dataCost: number;
  repeatable?: boolean;
}

export const CENTAURIANS_REWARD_SLOT_DEFS: readonly ICentauriansRewardSlotDef[] =
  [
    {
      slotId: 'any-trace',
      rewards: [{ type: 'CUSTOM', effectId: 'CENTAURIANS_ANY_TRACE' }],
      dataCost: 0,
    },
    {
      slotId: 'energy-and-alien-card',
      rewards: [
        { type: 'ENERGY', amount: 1 },
        { type: 'CUSTOM', effectId: 'CENTAURIANS_DRAW_ALIEN_CARD' },
      ],
      dataCost: 0,
    },
    {
      slotId: 'publicity-3',
      rewards: [{ type: 'PUBLICITY', amount: 3 }],
      dataCost: 0,
    },
    { slotId: 'score-8', rewards: [{ type: 'VP', amount: 8 }], dataCost: 0 },
  ];

export const CENTAURIANS_TRACE_SLOT_PREFIX = 'centaurians-trace';

export const CENTAURIANS_TRACE_COLORS: readonly ETrace[] = [
  ETrace.PINK,
  ETrace.YELLOW,
  ETrace.BLUE,
];

/**
 * Per-tier trace ladder rewards on the Centaurian alien board, read
 * bottom-to-top (tier 1 = first placement, tier 5 = topmost). Each
 * color column shares the same ladder. Tier 4 carries a data cost
 * (player must spend `dataCost` data to place there).
 */
export interface ICentauriansTraceSlotDef {
  tierFromBottom: number;
  maxOccupants: number;
  dataCost: number;
  rewards: readonly TAlienSlotReward[];
}

export const CENTAURIANS_TRACE_SLOT_DEFS: readonly ICentauriansTraceSlotDef[] =
  [
    {
      tierFromBottom: 1,
      maxOccupants: 1,
      dataCost: 0,
      rewards: [
        { type: 'VP', amount: 5 },
        { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
      ],
    },
    {
      tierFromBottom: 2,
      maxOccupants: 1,
      dataCost: 0,
      rewards: [
        { type: 'VP', amount: 3 },
        { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
      ],
    },
    {
      tierFromBottom: 3,
      maxOccupants: 1,
      dataCost: 0,
      rewards: [{ type: 'VP', amount: 5 }],
    },
    {
      tierFromBottom: 4,
      maxOccupants: 1,
      dataCost: 3,
      rewards: [{ type: 'VP', amount: 15 }],
    },
    {
      tierFromBottom: 5,
      maxOccupants: -1,
      dataCost: 1,
      rewards: [{ type: 'VP', amount: 6 }],
    },
  ];
