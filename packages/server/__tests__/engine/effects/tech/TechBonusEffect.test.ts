import { ETechBonusType } from '@seti/common/types/tech';
import { vi } from 'vitest';
import { TechBonusEffect } from '@/engine/effects/tech/TechBonusEffect.js';

describe('TechBonusEffect', () => {
  it('applies energy bonus', () => {
    const player = {
      resources: {
        gain: vi.fn(),
      },
      hand: [],
      score: 0,
      probeSpaceLimit: 1,
    };
    const game = { mainDeck: { drawN: () => [] } };

    const result = TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.ENERGY,
    });

    expect(result.applied).toBe(true);
    expect(player.resources.gain).toHaveBeenCalledWith({ energy: 1 });
  });

  it('applies VP and probe limit bonuses', () => {
    const player = {
      resources: { gain: vi.fn() },
      hand: [],
      score: 0,
      probeSpaceLimit: 1,
    };
    const game = { mainDeck: { drawN: () => [] } };

    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.VP_3,
    });
    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.LAUNCH_IGNORE_LIMIT,
    });

    expect(player.score).toBe(3);
    expect(player.probeSpaceLimit).toBe(2);
  });
});
