import { EResource } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Deck } from '@/engine/deck/Deck.js';
import { DeferredActionsQueue } from '@/engine/deferred/DeferredActionsQueue.js';
import { EventLog } from '@/engine/event/EventLog.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { MissionTracker } from '@/engine/missions/MissionTracker.js';
import { Player } from '@/engine/player/Player.js';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';

function createPlayer(overrides: Record<string, unknown> = {}): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    resources: { credits: 10, energy: 5, publicity: 5, data: 3 },
    hand: [],
    ...overrides,
  });
}

function createGame(overrides: Record<string, unknown> = {}): IGame {
  return {
    sectors: [],
    mainDeck: new Deck<string>(['d1', 'd2', 'd3', 'd4']),
    cardRow: [],
    deferredActions: new DeferredActionsQueue(),
    eventLog: new EventLog(),
    random: new SeededRandom('full-mission-special-cards'),
    missionTracker: new MissionTracker(),
    solarSystem: null,
    techBoard: null,
    planetaryBoard: null,
    round: 1,
    ...overrides,
  } as unknown as IGame;
}

function registerCardMission(cardId: string, player: Player, game: IGame): void {
  const card = getCardRegistry().create(cardId);
  const missionDef = card.getMissionDef?.();
  if (missionDef) {
    game.missionTracker.registerMission(missionDef, player.id);
  } else {
    game.missionTracker.registerMissionFromCard(cardId, player.id);
  }
}

describe('Special full mission cards (128/129/138) and card 134 quick mission', () => {
  it('card 128 triggers all reward choices on one non-Earth planet visit', () => {
    const player = createPlayer();
    const game = createGame();
    registerCardMission('128', player, game);

    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.MARS,
    });

    const prompt = game.missionTracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeDefined();
    expect(prompt!.type).toBe(EPlayerInputType.OPTION);

    const model = prompt!.toModel() as ISelectOptionInputModel;
    const completeOptions = model.options.filter((o) =>
      o.id.startsWith('complete-128-'),
    );
    expect(completeOptions).toHaveLength(3);
  });

  it('card 129 auto-limits to one branch per asteroid visit event', () => {
    const player = createPlayer();
    const game = createGame();
    registerCardMission('129', player, game);

    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_ASTEROIDS,
    });

    const prompt = game.missionTracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeDefined();

    const model = prompt!.toModel() as ISelectOptionInputModel;
    const completeOptions = model.options.filter((o) =>
      o.id.startsWith('complete-129-'),
    );
    expect(completeOptions).toHaveLength(1);
  });

  it('card 138 branch matching follows card-corner resource type', () => {
    const player = createPlayer();
    const game = createGame();
    registerCardMission('138', player, game);

    game.missionTracker.recordEvent({
      type: EMissionEventType.CARD_CORNER_USED,
      resourceType: EResource.MOVE,
    });

    const prompt = game.missionTracker.checkAndPromptTriggers(player, game);
    expect(prompt).toBeDefined();
    const model = prompt!.toModel() as ISelectOptionInputModel;
    const completeOptions = model.options.filter((o) =>
      o.id.startsWith('complete-138-'),
    );

    expect(completeOptions).toHaveLength(1);
    expect(completeOptions[0].id).toBe('complete-138-2');
  });

  it('card 134 quick mission condition checks 4 different sectors', () => {
    const player = createPlayer();
    const card = getCardRegistry().create('134');
    const missionDef = card.getMissionDef?.();
    expect(missionDef).toBeDefined();
    expect(missionDef!.branches[0].checkCondition).toBeTypeOf('function');

    const gameWithFourSignals = createGame({
      sectors: [
        { signals: [{ type: 'player', playerId: player.id }] },
        { signals: [{ type: 'player', playerId: player.id }] },
        { signals: [{ type: 'player', playerId: player.id }] },
        { signals: [{ type: 'player', playerId: player.id }] },
      ],
    });
    const gameWithThreeSignals = createGame({
      sectors: [
        { signals: [{ type: 'player', playerId: player.id }] },
        { signals: [{ type: 'player', playerId: player.id }] },
        { signals: [{ type: 'player', playerId: player.id }] },
        { signals: [{ type: 'data' }] },
      ],
    });

    expect(missionDef!.branches[0].checkCondition!(player, gameWithFourSignals)).toBe(
      true,
    );
    expect(
      missionDef!.branches[0].checkCondition!(player, gameWithThreeSignals),
    ).toBe(false);
  });
});
