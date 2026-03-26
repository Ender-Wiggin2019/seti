import { ETechBonusType } from '@seti/common/types/tech';
import { TECH_BONUS_POOLS } from '@/engine/tech/TechBonusConfig.js';

describe('TECH_BONUS_POOLS', () => {
  it('contains all 12 tech stacks with 4 bonuses each', () => {
    expect(Object.keys(TECH_BONUS_POOLS)).toHaveLength(12);

    for (const pool of Object.values(TECH_BONUS_POOLS)) {
      expect(pool).toHaveLength(4);
    }
  });

  it('uses known bonus token types', () => {
    const allTypes = new Set(
      Object.values(TECH_BONUS_POOLS).flatMap((pool) =>
        pool.map((token) => token.type),
      ),
    );

    expect(allTypes.has(ETechBonusType.ENERGY)).toBe(true);
    expect(allTypes.has(ETechBonusType.VP_3)).toBe(true);
  });
});
