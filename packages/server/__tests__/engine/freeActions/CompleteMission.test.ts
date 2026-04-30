import { ESector, ETrace } from '@seti/common/types/element';
import { EFreeAction, EMainAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { getCardRegistry } from '@/engine/cards/CardRegistry.js';
import { Deck } from '@/engine/deck/Deck.js';
import { CompleteMissionFreeAction } from '@/engine/freeActions/CompleteMission.js';
import { Game } from '@/engine/Game.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

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

  function resolveMissionPromptIfAny(game: Game, playerId: string): void {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player?.waitingFor) {
      return;
    }

    const model = player.waitingFor.toModel();
    if (model.type !== EPlayerInputType.OPTION) {
      return;
    }

    const prompt = model as ISelectOptionInputModel;
    const completeOption = prompt.options.find((option) =>
      option.id.startsWith('complete-'),
    );
    if (!completeOption) {
      return;
    }

    game.processInput(playerId, {
      type: EPlayerInputType.OPTION,
      optionId: completeOption.id,
    });
  }

  // Phase 3.3: Real integration tests (outside skip block)

  it('3.3.3 [integration] allows deferred completion when condition is met but player chooses not to complete immediately', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-defer',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.hand = ['37'];
    game.mainDeck = new Deck(['refill-1'], []);

    // Play the mission card
    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    expect(player.playedMissions.map(resolveCardId)).toEqual(['37']);
    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(false);

    // Satisfy the condition (win all red sectors)
    for (const sector of game.sectors.filter(
      (sector) => sector.color === ESector.RED,
    )) {
      sector.sectorWinners.push(player.id);
    }

    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(true);

    // Player chooses not to complete immediately - can still play the turn
    game.processEndTurn(player.id);

    // Mission still in playedMissions, not completed yet
    expect(player.playedMissions.map(resolveCardId)).toEqual(['37']);
    expect(player.completedMissions).toHaveLength(0);

    // Next turn, can still complete
    const opponent = game.players[1];
    game.processMainAction(opponent.id, { type: EMainAction.PASS });
    resolveEndOfRoundPickIfAny(game, opponent.id);

    expect(CompleteMissionFreeAction.canExecute(player, game)).toBe(true);

    const scoreBefore = player.score;
    const publicityBefore = player.resources.publicity;

    // Now complete the mission
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
  });

  it('3.3.4 [integration] moves the mission card to completedMissions after successful completion', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-flip',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.hand = ['37'];
    game.mainDeck = new Deck(['refill-1'], []);

    // Play and satisfy the mission
    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    for (const sector of game.sectors.filter(
      (sector) => sector.color === ESector.RED,
    )) {
      sector.sectorWinners.push(player.id);
    }

    expect(player.playedMissions.map(resolveCardId)).toEqual(['37']);
    expect(player.completedMissions).toHaveLength(0);

    // Complete the mission
    game.processFreeAction(player.id, {
      type: EFreeAction.COMPLETE_MISSION,
      cardId: '37',
    });

    // Verify card moved from played to completed
    expect(player.playedMissions).toHaveLength(0);
    expect(player.completedMissions).toHaveLength(1);
    expect(
      player.completedMissions.map((card) =>
        typeof card === 'string' ? card : card.id,
      ),
    ).toEqual(['37']);
  });

  it('3.3E.2 [error] rejects completing a mission that has already been completed', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'complete-mission-already-completed',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    player.hand = ['37'];
    game.mainDeck = new Deck(['refill-1'], []);

    // Play and satisfy the mission
    game.processMainAction(player.id, {
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });

    for (const sector of game.sectors.filter(
      (sector) => sector.color === ESector.RED,
    )) {
      sector.sectorWinners.push(player.id);
    }

    // Complete the mission once
    game.processFreeAction(player.id, {
      type: EFreeAction.COMPLETE_MISSION,
      cardId: '37',
    });

    expect(player.completedMissions).toHaveLength(1);
    expect(
      game.missionTracker.getMissionState(player.id, '37'),
    ).toBeUndefined();

    // Try to complete it again
    expect(() =>
      game.processFreeAction(player.id, {
        type: EFreeAction.COMPLETE_MISSION,
        cardId: '37',
      }),
    ).toThrow('Mission 37 branch 0 is not completable');
  });
});
