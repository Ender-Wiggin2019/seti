import { ETrace } from '@seti/common/types/element';

/**
 * Alien board slot reward configuration.
 *
 * Left alien (index 0) discovery slots grant 5 VP + 1 publicity.
 * Right alien (index 1) discovery slots grant 3 VP + 1 publicity.
 * All overflow areas grant 3 VP.
 */

export type TAlienSlotResourceRewardType =
  | 'VP'
  | 'PUBLICITY'
  | 'CREDIT'
  | 'ENERGY'
  | 'DATA'
  | 'CARD'
  | 'CARD_ANY';

export interface IAlienSlotRewardDef {
  type: TAlienSlotResourceRewardType;
  amount: number;
}

export type TAlienSlotReward =
  | IAlienSlotRewardDef
  | { type: 'CUSTOM'; effectId: string };

export interface IAlienBoardRewardConfig {
  discoveryRewards: TAlienSlotReward[];
  overflowRewards: TAlienSlotReward[];
}

export const LEFT_ALIEN_REWARDS: Readonly<IAlienBoardRewardConfig> = {
  discoveryRewards: [
    { type: 'VP', amount: 5 },
    { type: 'PUBLICITY', amount: 1 },
  ],
  overflowRewards: [{ type: 'VP', amount: 3 }],
};

export const RIGHT_ALIEN_REWARDS: Readonly<IAlienBoardRewardConfig> = {
  discoveryRewards: [
    { type: 'VP', amount: 3 },
    { type: 'PUBLICITY', amount: 1 },
  ],
  overflowRewards: [{ type: 'VP', amount: 3 }],
};

export function getAlienRewardsForIndex(
  alienIndex: number,
): IAlienBoardRewardConfig {
  return alienIndex === 0 ? LEFT_ALIEN_REWARDS : RIGHT_ALIEN_REWARDS;
}

export const ANOMALY_TOKEN_REWARD_OPTIONS: Readonly<
  Record<ETrace.RED | ETrace.YELLOW | ETrace.BLUE, readonly TAlienSlotReward[]>
> = {
  [ETrace.RED]: [
    { type: 'CREDIT', amount: 1 },
    { type: 'VP', amount: 4 },
  ],
  [ETrace.YELLOW]: [
    { type: 'CARD', amount: 1 },
    { type: 'PUBLICITY', amount: 2 },
  ],
  [ETrace.BLUE]: [
    { type: 'DATA', amount: 1 },
    { type: 'ENERGY', amount: 1 },
  ],
};

export const ANOMALY_COLUMN_REWARD_LADDER: readonly (readonly TAlienSlotReward[])[] =
  [
    [
      { type: 'VP', amount: 5 },
      { type: 'CARD', amount: 1 },
    ],
    [
      { type: 'VP', amount: 3 },
      { type: 'CARD', amount: 1 },
    ],
    [
      { type: 'VP', amount: 2 },
      { type: 'PUBLICITY', amount: 1 },
    ],
    [{ type: 'VP', amount: 3 }],
    [{ type: 'VP', amount: 2 }],
  ];

export function getAnomalyColumnRewardsForPlacement(
  occupantCountAfterPlacement: number,
): TAlienSlotReward[] {
  if (occupantCountAfterPlacement <= 0) return [];
  const index = Math.min(
    occupantCountAfterPlacement - 1,
    ANOMALY_COLUMN_REWARD_LADDER.length - 1,
  );
  return ANOMALY_COLUMN_REWARD_LADDER[index].map((reward) => ({ ...reward }));
}

export const OUMUAMUA_TRACE_SLOT_PREFIX = 'oumuamua-trace';
export const OUMUAMUA_TILE_DATA_CAPACITY = 3;
export const OUMUAMUA_TRACE_COLORS: readonly ETrace[] = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
];

export interface IOumuamuaTraceSlotDef {
  tierFromBottom: number;
  maxOccupants: number;
  exofossilCost: number;
  rewards: readonly TAlienSlotReward[];
}

export const OUMUAMUA_TRACE_SLOT_DEFS: readonly IOumuamuaTraceSlotDef[] = [
  {
    tierFromBottom: 1,
    maxOccupants: 1,
    exofossilCost: 4,
    rewards: [{ type: 'VP', amount: 25 }],
  },
  {
    tierFromBottom: 2,
    maxOccupants: 1,
    exofossilCost: 0,
    rewards: [
      { type: 'VP', amount: 3 },
      { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
    ],
  },
  {
    tierFromBottom: 3,
    maxOccupants: 1,
    exofossilCost: 0,
    rewards: [
      { type: 'VP', amount: 2 },
      { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
    ],
  },
  {
    tierFromBottom: 4,
    maxOccupants: 1,
    exofossilCost: 0,
    rewards: [
      { type: 'VP', amount: 3 },
      { type: 'CUSTOM', effectId: 'GAIN_EXOFOSSIL' },
      { type: 'PUBLICITY', amount: 1 },
    ],
  },
  {
    tierFromBottom: 5,
    maxOccupants: 1,
    exofossilCost: 0,
    rewards: [
      { type: 'VP', amount: 2 },
      { type: 'CUSTOM', effectId: 'GAIN_EXOFOSSIL' },
    ],
  },
  {
    tierFromBottom: 6,
    maxOccupants: -1,
    exofossilCost: 1,
    rewards: [{ type: 'VP', amount: 6 }],
  },
];
