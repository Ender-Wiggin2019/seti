import { ESector, ETrace } from '@seti/common/types/element';
import { EFreeAction, EMainAction } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Deck } from '@/engine/deck/Deck.js';
import { CompleteMissionFreeAction } from '@/engine/freeActions/CompleteMission.js';
import { Game } from '@/engine/Game.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function resolveCardId(card: string | { id?: string }): string | undefined {
  return typeof card === 'string' ? card : card.id;
}

describe('CompleteMissionFreeAction', () => {
  function resolveEndOfRoundPickIfAny(game: Game, playerId: string): void {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player?.waitingFor) {
      return;
    }

    const model = player.waitingFor.toModel();
    if (model.type !== EPlayerInputType.END_OF_ROUND) {
      return;
    }

    const picker = model as ISelectEndOfRoundCardInputModel;
    game.processInput(playerId, {
      type: EPlayerInputType.END_OF_ROUND,
      cardId: picker.cards[0].id,
    });
  }

  it('completes an active quick mission through game.processFreeAction', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-integration',
    );
    const player = game.players[0];
    const card = getCardRegistry().create('64');

    game.missionTracker.registerMission(card.getMissionDef?.()!, player.id);
    player.playedMissions.push(card);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 1, false);

    const dataBefore = player.resources.data;

    game.processFreeAction(player.id, {
      type: EFreeAction.COMPLETE_MISSION,
      cardId: '64',
    });

    expect(player.resources.data).toBe(dataBefore + 2);
    expect(player.playedMissions).toHaveLength(0);
    expect(player.completedMissions).toHaveLength(1);
    expect(
      game.missionTracker.getMissionState(player.id, '64'),
    ).toBeUndefined();
  });

  it('rejects completing a full mission through game.processFreeAction', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-branch-index',
    );
    const player = game.players[0];

    game.missionTracker.registerMissionFromCard('106', player.id);
    player.playedMissions.push('106');

    const publicityBefore = player.resources.publicity;
    const handBefore = player.hand.length;

    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '106',
        branchIndex: 2,
      }),
    ).toThrow('Mission 106 branch 2 is not completable');

    const missionState = game.missionTracker.getMissionState(player.id, '106');
    expect(player.resources.publicity).toBe(publicityBefore);
    expect(player.hand).toHaveLength(handBefore);
    expect(missionState).toBeDefined();
    expect(missionState!.branchStates[2].completed).toBe(false);
    expect(missionState!.branchStates[0].completed).toBe(false);
    expect(missionState!.branchStates[1].completed).toBe(false);
  });

  it('rejects completing a quick mission that has not been played yet', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-not-played',
    );
    const player = game.players[0];
    const card = getCardRegistry().create('64');

    game.missionTracker.registerMission(card.getMissionDef?.()!, player.id);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 1, false);

    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '64',
      }),
    ).toThrow('Mission 64 branch 0 is not completable');

    expect(player.completedMissions).toHaveLength(0);
    expect(game.missionTracker.getMissionState(player.id, '64')).toBeDefined();
  });

  it('rejects completing the same quick mission twice', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-double-complete',
    );
    const player = game.players[0];
    const card = getCardRegistry().create('64');

    game.missionTracker.registerMission(card.getMissionDef?.()!, player.id);
    player.playedMissions.push(card);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 0, false);
    game.alienState.applyTrace(player, game, ETrace.BLUE, 1, false);

    game.processFreeAction(player.id, {
      type: EFreeAction.COMPLETE_MISSION,
      cardId: '64',
    });

    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '64',
      }),
    ).toThrow('Mission 64 branch 0 is not completable');

    expect(player.completedMissions).toHaveLength(1);
    expect(
      game.missionTracker.getMissionState(player.id, '64'),
    ).toBeUndefined();
  });

  it('integrates real mission play, delayed completion, and reward payout for an observation quick mission', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-real-play-delay',
    );
    const player = game.players[0];
    const opponent = game.players[1];
    player.hand = ['37'];
    game.mainDeck = new Deck(['refill-1', 'refill-2'], []);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(player.playedMissions.map(resolveCardId)).toEqual(['37']);
    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(false);

    for (const sector of game.sectors.filter(
      (sector) => sector.color === ESector.RED,
    )) {
      sector.sectorWinners.push(player.id);
    }

    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(true);

    game.processEndTurn(player.id);
    game.processMainAction(opponent.id, { type: EMainAction.PASS });
    resolveEndOfRoundPickIfAny(game, opponent.id);

    const scoreBefore = player.score;
    const publicityBefore = player.resources.publicity;

    game.processFreeAction(player.id, {
      type: EFreeAction.COMPLETE_MISSION,
      cardId: '37',
    });

    expect(player.score).toBe(scoreBefore + 4);
    expect(player.resources.publicity).toBe(publicityBefore + 1);
    expect(player.playedMissions).toHaveLength(0);
    expect(
      player.completedMissions.map((card) =>
        typeof card === 'string' ? card : card.id,
      ),
    ).toEqual(['37']);
    expect(
      game.missionTracker.getMissionState(player.id, '37'),
    ).toBeUndefined();
  });

  it('keeps canExecute false for an unmet quick mission that was played through the real action pipeline', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-unmet-condition',
    );
    const player = game.players[0];
    player.hand = ['37'];
    game.mainDeck = new Deck(['refill-1'], []);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(false);
  });

  it('rejects completing a satisfied quick mission outside the owner turn', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-not-your-turn',
    );
    const player = game.players[0];
    player.hand = ['37'];
    game.mainDeck = new Deck(['refill-1'], []);

    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });
    game.processEndTurn(player.id);

    for (const sector of game.sectors.filter(
      (sector) => sector.color === ESector.RED,
    )) {
      sector.sectorWinners.push(player.id);
    }

    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(true);
    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '37',
      }),
    ).toThrow('not the active player');
  });
});
