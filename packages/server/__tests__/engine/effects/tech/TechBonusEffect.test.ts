import { ETechBonusType } from '@seti/common/types/tech';
import { vi } from 'vitest';
import { TechBonusEffect } from '@/engine/effects/tech/TechBonusEffect.js';

function mockPlayer() {
  return {
    resources: {
      gain: vi.fn(),
    },
    hand: [] as string[],
    score: 0,
    probeSpaceLimit: 1,
  };
}

function mockGame(drawn: string[] = []) {
  return {
    mainDeck: {
      drawWithReshuffle: () => drawn.shift(),
    },
    lockCurrentTurn: vi.fn(),
  };
}

describe('TechBonusEffect', () => {
  it('applies ENERGY', () => {
    const player = mockPlayer();
    const game = mockGame();

    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.ENERGY,
    });

    expect(player.resources.gain).toHaveBeenCalledWith({ energy: 1 });
  });

  it('applies DATA and DATA_2', () => {
    const player = mockPlayer();
    const game = mockGame();

    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.DATA,
    });
    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.DATA_2,
    });

    expect(player.resources.gain).toHaveBeenCalledWith({ data: 1 });
    expect(player.resources.gain).toHaveBeenCalledWith({ data: 2 });
  });

  it('applies PUBLICITY and CREDIT', () => {
    const player = mockPlayer();
    const game = mockGame();

    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.PUBLICITY,
    });
    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.CREDIT,
    });

    expect(player.resources.gain).toHaveBeenCalledWith({ publicity: 1 });
    expect(player.resources.gain).toHaveBeenCalledWith({ credits: 1 });
  });

  it('applies CARD via mainDeck', () => {
    const player = mockPlayer();
    const game = mockGame(['c1']);

    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.CARD,
    });

    expect(player.hand).toEqual(['c1']);
    expect(game.lockCurrentTurn).toHaveBeenCalled();
  });

  it('applies VP_2 and VP_3', () => {
    const player = mockPlayer();
    const game = mockGame();

    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.VP_2,
    });
    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.VP_3,
    });

    expect(player.score).toBe(5);
  });

  it('applies LAUNCH_IGNORE_LIMIT', () => {
    const player = mockPlayer();
    const game = mockGame();

    TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.LAUNCH_IGNORE_LIMIT,
    });

    expect(player.probeSpaceLimit).toBe(2);
  });

  it('returns applied: true with the bonus', () => {
    const player = mockPlayer();
    const game = mockGame();
    const bonus = { type: ETechBonusType.ENERGY };

    const result = TechBonusEffect.apply(player as never, game as never, bonus);

    expect(result.applied).toBe(true);
    expect(result.bonus).toBe(bonus);
  });
});
