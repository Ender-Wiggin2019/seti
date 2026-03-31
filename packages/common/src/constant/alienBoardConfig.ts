/**
 * Alien board slot reward configuration.
 *
 * Left alien (index 0) discovery slots grant 5 VP + 1 publicity.
 * Right alien (index 1) discovery slots grant 3 VP + 1 publicity.
 * All overflow areas grant 3 VP.
 */

export type TAlienSlotRewardType = 'VP' | 'PUBLICITY';

export interface IAlienSlotRewardDef {
  type: TAlienSlotRewardType;
  amount: number;
}

export interface IAlienBoardRewardConfig {
  discoveryRewards: IAlienSlotRewardDef[];
  overflowRewards: IAlienSlotRewardDef[];
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
