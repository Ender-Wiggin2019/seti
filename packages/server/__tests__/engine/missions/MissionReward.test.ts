import { EEffectType } from '@seti/common/types/effect';
import {
  EAlienIcon,
  EResource,
  EScanAction,
  ESector,
  ESpecialAction,
} from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { applyMissionRewards } from '@/engine/missions/MissionReward.js';
import { Player } from '@/engine/player/Player.js';
import { buildTestGame, getPlayer } from '../../helpers/TestGameBuilder.js';
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
    sectors: [],
    missionTracker: new MissionTracker(),
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

  it('returns a signal placement input for signal rewards', () => {
    const player = createPlayer();
    const markedBy: string[] = [];
    const game = createGame();
    game.sectors = [
      {
        id: 'yellow-a',
        color: ESector.YELLOW,
        completed: false,
        markSignal: (playerId: string) => {
          markedBy.push(playerId);
          return { dataGained: true, vpAwarded: 0 };
        },
      },
      {
        id: 'yellow-b',
        color: ESector.YELLOW,
        completed: false,
        markSignal: (playerId: string) => {
          markedBy.push(playerId);
          return { dataGained: true, vpAwarded: 0 };
        },
      },
    ] as never;

    const input = applyMissionRewards(
      [{ effectType: EEffectType.BASE, type: EScanAction.YELLOW, value: 1 }],
      player,
      game,
    );

    expect(input?.toModel().type).toBe(EPlayerInputType.OPTION);

    const next = input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'yellow-a',
    });

    expect(next).toBeUndefined();
    expect(markedBy).toEqual([player.id]);
  });

  it('executes launch rewards', () => {
    const game = buildTestGame({
      seed: 'mission-reward-launch',
      initialDiscAngles: [0, 0, 0],
    });
    const player = getPlayer(game, 'p1');
    const beforeProbeCount = player.probesInSpace;

    const input = applyMissionRewards(
      [{ effectType: EEffectType.BASE, type: ESpecialAction.LAUNCH, value: 1 }],
      player,
      game,
    );

    expect(input).toBeUndefined();
    expect(player.probesInSpace).toBe(beforeProbeCount + 1);
    expect(
      game.missionTracker.hasTurnEvent(
        (event) => event.type === EMissionEventType.PROBE_LAUNCHED,
      ),
    ).toBe(true);
  });
});
