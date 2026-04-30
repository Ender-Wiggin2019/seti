import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { vi } from 'vitest';
import { TechBonusEffect } from '@/engine/effects/tech/TechBonusEffect.js';

function mockPlayer() {
  return {
    id: 'p1',
    resources: {
      gain: vi.fn(),
    },
    hand: [] as string[],
    score: 0,
    techs: [] as ETechId[],
    probesInSpace: 0,
    probeSpaceLimit: 1,
  };
}

function mockGame(drawn: string[] = []) {
  return {
    mainDeck: {
      drawWithReshuffle: () => drawn.shift(),
    },
    solarSystem: null,
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

  it('applies LAUNCH_IGNORE_LIMIT as a free probe launch using the acquired tech limit', () => {
    const player = mockPlayer();
    player.techs = [ETechId.PROBE_DOUBLE_PROBE];
    player.probesInSpace = 1;
    const game = mockGame();
    const solarSystem = {
      getSpacesOnPlanet: vi.fn(() => [{ id: 'earth-space' }]),
      placeProbe: vi.fn(() => ({ id: 'probe-1' })),
    };
    game.solarSystem = solarSystem as never;

    const result = TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.LAUNCH_IGNORE_LIMIT,
    });

    expect(result.applied).toBe(true);
    expect(player.probeSpaceLimit).toBe(1);
    expect(player.probesInSpace).toBe(2);
    expect(solarSystem.placeProbe).toHaveBeenCalledWith('p1', 'earth-space');
  });

  it('skips LAUNCH_IGNORE_LIMIT when a launch cannot be resolved', () => {
    const player = mockPlayer();
    const game = mockGame();

    const result = TechBonusEffect.apply(player as never, game as never, {
      type: ETechBonusType.LAUNCH_IGNORE_LIMIT,
    });

    expect(result.applied).toBe(false);
    expect(player.probesInSpace).toBe(0);
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
