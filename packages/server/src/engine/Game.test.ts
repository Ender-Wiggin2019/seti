import { EPhase } from '@seti/common/types/protocol/enums';
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
    expect(game.phase).toBe(EPhase.SETUP);
    expect(game.round).toBe(1);
    expect(game.activePlayer.id).toBe('p1');
    expect(game.startPlayer.id).toBe('p1');
    expect(game.rotationCounter).toBe(0);
    expect(game.hasRoundFirstPassOccurred).toBe(false);
  });

  it('transitions through valid phases', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');

    game.transitionTo(EPhase.AWAIT_MAIN_ACTION);
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
});
