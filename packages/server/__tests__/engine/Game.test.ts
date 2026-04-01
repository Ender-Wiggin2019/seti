import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import type { ISelectEndOfRoundCardInputModel } from '@seti/common/types/protocol/playerInput';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { Game } from '@/engine/Game.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function resolvePassInputs(game: Game, player: IPlayer): void {
  while (player.waitingFor) {
    const model = player.waitingFor.toModel();

    if (model.type === EPlayerInputType.CARD) {
      const cardIds = (
        model as { cards: { id: string }[]; minSelections: number }
      ).cards
        .slice(0, (model as { minSelections: number }).minSelections)
        .map((c) => c.id);
      game.processInput(player.id, { type: EPlayerInputType.CARD, cardIds });
    } else if (model.type === EPlayerInputType.END_OF_ROUND) {
      const eorModel = model as ISelectEndOfRoundCardInputModel;
      game.processInput(player.id, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: eorModel.cards[0].id,
      });
    } else {
      break;
    }
  }
}

describe('Game', () => {
  it('creates game with expected initial state', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'test-seed',
      'test-game-id',
    );

    expect(game.id).toBe('test-game-id');
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.round).toBe(1);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.startPlayer.id).toBe('p1');
    expect(game.rotationCounter).toBe(0);
    expect(game.hasRoundFirstPassOccurred).toBe(false);
    expect(game.cardRow).toHaveLength(3);
  });

  it('transitions through valid phases', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');

    game.transitionTo(EPhase.IN_RESOLUTION);
    game.transitionTo(EPhase.BETWEEN_TURNS);

    expect(game.phase).toBe(EPhase.BETWEEN_TURNS);
  });

  it('returns active and next players', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');

    expect(game.getActivePlayer().id).toBe('p1');
    expect(game.getNextPlayer().id).toBe('p2');

    game.setActivePlayer('p2');
    expect(game.getActivePlayer().id).toBe('p2');
    expect(game.getNextPlayer().id).toBe('p1');
  });

  it('processes a full turn and hands off to next player', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');

    const p1 = game.players.find((p) => p.id === 'p1')!;
    game.processMainAction('p1', { type: EMainAction.PASS });
    resolvePassInputs(game, p1);

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p2');
    expect(
      game.eventLog.recent(5).some((event) => event.type === 'ACTION'),
    ).toBe(true);
  });

  it('advances round after all players pass', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');

    const p1 = game.players.find((p) => p.id === 'p1')!;
    const p2 = game.players.find((p) => p.id === 'p2')!;

    game.processMainAction('p1', { type: EMainAction.PASS });
    resolvePassInputs(game, p1);

    game.processMainAction('p2', { type: EMainAction.PASS });
    resolvePassInputs(game, p2);

    expect(game.round).toBe(2);
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p2');
  });

  it('ends game after round 5 pass sequence', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');

    for (let index = 0; index < 5; index += 1) {
      const activeId = game.activePlayer.id;
      const activePlayer = game.players.find((p) => p.id === activeId)!;

      game.processMainAction(activeId, { type: EMainAction.PASS });
      resolvePassInputs(game, activePlayer);

      if ((game.phase as string) === EPhase.GAME_OVER) break;

      const nextId = game.activePlayer.id;
      const nextPlayer = game.players.find((p) => p.id === nextId)!;

      game.processMainAction(nextId, { type: EMainAction.PASS });
      resolvePassInputs(game, nextPlayer);

      if ((game.phase as string) === EPhase.GAME_OVER) break;
    }

    expect(game.phase).toBe(EPhase.GAME_OVER);
  });
});
