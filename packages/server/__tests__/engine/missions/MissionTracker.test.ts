import { EEffectType } from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
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

  it('does not expose quick missions as completable before the card is in playedMissions', () => {
    const tracker = new MissionTracker();
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      playedMissions: [],
    });
    const game = createGame();

    tracker.registerMission(
      {
        cardId: 'm1',
        cardName: 'Mission One',
        type: EMissionType.QUICK,
        branches: [
          {
            req: [
              {
                effectType: EEffectType.BASE,
                type: EResource.CREDIT,
                value: 1,
              },
            ],
            rewards: [
              { effectType: EEffectType.BASE, type: EResource.SCORE, value: 1 },
            ],
            checkCondition: () => true,
          },
        ],
      },
      player.id,
    );

    expect(tracker.getCompletableQuickMissions(player, game)).toEqual([]);
    expect(tracker.hasCompletableQuickMissions(player, game)).toBe(false);
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
          req: [
            { effectType: EEffectType.BASE, type: EResource.CREDIT, value: 1 },
          ],
          rewards: [
            { effectType: EEffectType.BASE, type: EResource.SCORE, value: 2 },
          ],
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

  it('does not trigger a full mission before the card is in playedMissions', () => {
    const tracker = new MissionTracker();
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      playedMissions: [],
    });
    const game = createGame();

    tracker.registerMissionFromCard('106', player.id);
    tracker.recordEvent({
      type: EMissionEventType.CARD_PLAYED,
      cost: 1,
      costType: EResource.CREDIT,
    });

    expect(tracker.checkAndPromptTriggers(player, game)).toBeUndefined();
  });

  it('offers all matching branches when one event satisfies multiple branches (choose one at a time per rules)', () => {
    const tracker = new MissionTracker();
    const card = getCardRegistry().create('128');
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      playedMissions: ['128'],
    });
    const game = createGame();

    tracker.registerMission(card.getMissionDef?.()!, player.id);
    tracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.MARS,
    });

    const input = tracker.checkAndPromptTriggers(player, game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(model?.type).toBe(EPlayerInputType.OPTION);
    const branchOptions = model?.options.filter((option) =>
      option.id.startsWith('complete-128-'),
    );
    expect(branchOptions).toHaveLength(3);
    expect(branchOptions?.map((o) => o.id)).toEqual([
      'complete-128-0',
      'complete-128-1',
      'complete-128-2',
    ]);
  });

  it('selecting one triggered branch discards remaining branches from the same checkpoint', () => {
    const tracker = new MissionTracker();
    const card = getCardRegistry().create('128');
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      playedMissions: ['128'],
    });
    const game = createGame();

    tracker.registerMission(card.getMissionDef?.()!, player.id);
    tracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.MARS,
    });

    const prompt = tracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeDefined();

    const model = prompt!.toModel() as ISelectOptionInputModel;
    expect(
      model.options.filter((o) => o.id.startsWith('complete-128-')),
    ).toHaveLength(3);

    const nextInput = prompt!.process({
      type: EPlayerInputType.OPTION,
      optionId: 'complete-128-1',
    });

    expect(nextInput).toBeUndefined();

    const state = tracker.getMissionState(player.id, '128');
    expect(state!.branchStates[1].completed).toBe(true);
    expect(state!.branchStates[0].completed).toBe(false);
    expect(state!.branchStates[2].completed).toBe(false);
  });

  it('two planet visits in one buffer produce two separate prompts, each allowing one branch', () => {
    const tracker = new MissionTracker();
    const card = getCardRegistry().create('128');
    const player = new Player({
      id: 'p1',
      name: 'Alice',
      color: 'red',
      seatIndex: 0,
      playedMissions: ['128'],
    });
    const game = createGame();

    tracker.registerMission(card.getMissionDef?.()!, player.id);
    tracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.MARS,
    });
    tracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.JUPITER,
    });

    const prompt1 = tracker.checkAndPromptTriggers(player, game);
    expect(prompt1).toBeDefined();

    const model1 = prompt1!.toModel() as ISelectOptionInputModel;
    const branches1 = model1.options.filter((o) =>
      o.id.startsWith('complete-128-'),
    );
    expect(branches1.length).toBeGreaterThanOrEqual(1);

    const prompt2 = prompt1!.process({
      type: EPlayerInputType.OPTION,
      optionId: branches1[0].id,
    });

    expect(prompt2).toBeDefined();

    const model2 = prompt2!.toModel() as ISelectOptionInputModel;
    const branches2 = model2.options.filter((o) =>
      o.id.startsWith('complete-128-'),
    );
    expect(branches2.length).toBeGreaterThanOrEqual(1);

    const prompt3 = prompt2!.process({
      type: EPlayerInputType.OPTION,
      optionId: branches2[0].id,
    });
    expect(prompt3).toBeUndefined();

    const state = tracker.getMissionState(player.id, '128');
    const completedCount = state!.branchStates.filter(
      (b) => b.completed,
    ).length;
    expect(completedCount).toBe(2);
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
            req: [
              {
                effectType: EEffectType.BASE,
                type: EResource.CREDIT,
                value: 1,
              },
            ],
            rewards: [
              { effectType: EEffectType.BASE, type: EResource.SCORE, value: 1 },
            ],
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
