import { EPhase } from '@seti/common/types/protocol/enums';
import { Game } from './Game.js';

const BASE_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
  { id: 'p3', name: 'Cathy', color: 'green', seatIndex: 2 },
  { id: 'p4', name: 'Dylan', color: 'yellow', seatIndex: 3 },
] as const;

describe('GameSetup', () => {
  it('initializes 2-player setup values', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-2p',
    );

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.hiddenAliens).toHaveLength(2);
    expect(game.cardRow).toHaveLength(3);
    expect(game.endOfRoundStacks).toHaveLength(4);
    expect(game.endOfRoundStacks[0]).toHaveLength(3);
    expect(game.neutralMilestones).toEqual([20, 20, 30, 30]);
  });

  it('initializes 3-player and 4-player neutral milestones correctly', () => {
    const game3 = Game.create(
      BASE_PLAYERS.slice(0, 3),
      { playerCount: 3 },
      'seed-3p',
    );
    const game4 = Game.create(BASE_PLAYERS, { playerCount: 4 }, 'seed-4p');

    expect(game3.neutralMilestones).toEqual([20, 30]);
    expect(game4.neutralMilestones).toEqual([]);
  });

  it('assigns player defaults by seat and setup draw/tuck', () => {
    const game = Game.create(
      BASE_PLAYERS.slice(0, 2),
      { playerCount: 2 },
      'seed-setup',
    );

    expect(game.players[0].score).toBe(1);
    expect(game.players[1].score).toBe(2);
    expect(game.players[0].publicity).toBe(4);
    expect(game.players[0].resources.toObject()).toEqual({
      credits: 4,
      energy: 3,
      publicity: 4,
      data: 0,
    });
    expect(game.players[0].hand).toHaveLength(4);
    expect(game.players[0].tuckedIncomeCards).toHaveLength(1);
  });
});
