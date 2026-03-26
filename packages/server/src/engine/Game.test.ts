import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import { Game } from './Game.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

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

    game.processMainAction('p1', { type: EMainAction.SCAN });

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p2');
    expect(
      game.eventLog.recent(5).some((event) => event.type === 'ACTION'),
    ).toBe(true);
  });

  it('advances round after all players pass', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');

    game.processMainAction('p1', { type: EMainAction.PASS });
    game.processMainAction('p2', { type: EMainAction.PASS });

    expect(game.round).toBe(2);
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p2');
  });

  it('ends game after round 5 pass sequence', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');

    for (let index = 0; index < 5; index += 1) {
      game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });
      if (game.phase === EPhase.GAME_OVER) {
        break;
      }

      game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });
      if (game.phase === EPhase.GAME_OVER) {
        break;
      }
    }

    expect(game.phase).toBe(EPhase.GAME_OVER);
  });
});
