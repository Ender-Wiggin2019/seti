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
