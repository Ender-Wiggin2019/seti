import { EEffectType } from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import type { IGame } from '@/engine/IGame.js';
import {
  EMissionEventType,
  EMissionType,
  type IMissionDef,
} from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { Player } from '@/engine/player/Player.js';

function createPlayer(): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    playedMissions: ['m1'],
  });
}

function createGame(): IGame {
  return {
    round: 3,
    random: { next: () => 0.5 },
    mainDeck: {
      drawWithReshuffle: () => undefined,
    },
  } as unknown as IGame;
}

describe('MissionTracker', () => {
  it('registers mission from card data and avoids duplicates', () => {
    const tracker = new MissionTracker();

    tracker.registerMissionFromCard('70', 'p1');
    tracker.registerMissionFromCard('70', 'p1');

    const missions = tracker.getAllMissions('p1');
    expect(missions).toHaveLength(1);
    expect(missions[0]?.def.cardId).toBe('70');
  });

  it('detects triggered FULL mission and returns selection input', () => {
    const tracker = new MissionTracker();
    const player = createPlayer();
    const game = createGame();

    const mission: IMissionDef = {
      cardId: 'm1',
      cardName: 'Mission One',
      type: EMissionType.FULL,
      branches: [
        {
          req: [{ effectType: EEffectType.BASE, type: EResource.CREDIT, value: 1 }],
          rewards: [{ effectType: EEffectType.BASE, type: EResource.SCORE, value: 2 }],
        },
      ],
    };

    tracker.registerMission(mission, player.id);
    tracker.recordEvent({
      type: EMissionEventType.CARD_PLAYED,
      cost: 1,
      costType: EResource.CREDIT,
    });

    const input = tracker.checkAndPromptTriggers(player, game);

    expect(input).toBeDefined();
    expect(input?.toModel().type).toBe(EPlayerInputType.OPTION);
  });

  it('completes mission branch and moves mission to completed list when done', () => {
    const tracker = new MissionTracker();
    const player = createPlayer();
    const game = createGame();

    tracker.registerMission(
      {
        cardId: 'm1',
        cardName: 'Mission One',
        type: EMissionType.QUICK,
        branches: [
          {
            req: [{ effectType: EEffectType.BASE, type: EResource.CREDIT, value: 1 }],
            rewards: [{ effectType: EEffectType.BASE, type: EResource.SCORE, value: 1 }],
            checkCondition: () => true,
          },
        ],
      },
      player.id,
    );

    const beforeScore = player.score;
    tracker.completeMissionBranch(player, game, 'm1', 0);

    expect(player.score).toBe(beforeScore + 1);
    expect(player.completedMissions).toContain('m1');
    expect(tracker.getMissionState(player.id, 'm1')).toBeUndefined();
  });
});
