import { ETechBonusType } from '@seti/common/types/tech';
import { TECH_BONUS_POOLS } from '@/engine/tech/TechBonusConfig.js';

describe('TECH_BONUS_POOLS', () => {
  it('contains all 12 tech stacks with 4 bonuses each', () => {
    expect(Object.keys(TECH_BONUS_POOLS)).toHaveLength(12);

    for (const pool of Object.values(TECH_BONUS_POOLS)) {
      expect(pool).toHaveLength(4);
    }
  });

  it('assigns the same four printed tech bonuses to every stack', () => {
    const expectedTypes = [
      ETechBonusType.CARD,
      ETechBonusType.ENERGY,
      ETechBonusType.PUBLICITY,
      ETechBonusType.VP_3,
    ].sort();

    for (const pool of Object.values(TECH_BONUS_POOLS)) {
      expect(pool.map((token) => token.type).sort()).toEqual(expectedTypes);
    }
  });
});
