import { EEffectType } from '@seti/common/types/effect';
import { EAlienIcon, EResource } from '@seti/common/types/element';
import type { IGame } from '@/engine/IGame.js';
import { applyMissionRewards } from '@/engine/missions/MissionReward.js';
import { Player } from '@/engine/player/Player.js';
import { stubTurnLockFields } from '../../helpers/stubTurnLock.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
  });
}

function createGame(draws: string[] = []): IGame {
  return {
    ...stubTurnLockFields(),
    random: { next: () => 0.5 },
    mainDeck: {
      drawWithReshuffle: () => draws.shift(),
    },
  } as unknown as IGame;
}

describe('applyMissionRewards', () => {
  it('applies score and resource rewards', () => {
    const player = createPlayer();
    const beforeScore = player.score;
    const beforeEnergy = player.resources.energy;

    applyMissionRewards(
      [
        { effectType: EEffectType.BASE, type: EResource.SCORE, value: 2 },
        { effectType: EEffectType.BASE, type: EResource.ENERGY, value: 1 },
      ],
      player,
      createGame(),
    );

    expect(player.score).toBe(beforeScore + 2);
    expect(player.resources.energy).toBe(beforeEnergy + 1);
  });

  it('draws cards for CARD reward and ignores undefined draws', () => {
    const player = createPlayer();

    applyMissionRewards(
      [{ effectType: EEffectType.BASE, type: EResource.CARD, value: 2 }],
      player,
      createGame(['c1']),
    );

    expect(player.hand).toEqual(['c1']);
  });

  it('handles exofossil gain and spend rewards', () => {
    const player = createPlayer();

    applyMissionRewards(
      [
        { effectType: EEffectType.BASE, type: EAlienIcon.EXOFOSSIL, value: 2 },
        {
          effectType: EEffectType.BASE,
          type: EAlienIcon.USE_EXOFOSSIL,
          value: 1,
        },
      ],
      player,
      createGame(),
    );

    expect(player.exofossils).toBe(1);
  });
});
