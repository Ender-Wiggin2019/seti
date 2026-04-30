import type { IInputResponse } from '@seti/common/types/protocol/actions';
import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type IPlayerInputModel,
} from '@seti/common/types/protocol/playerInput';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { Game } from '@/engine/Game.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import {
  resolveAllInputsDefault,
  resolveSetupTucks,
} from '../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createGame(): Game {
  return Game.create(TEST_PLAYERS, { playerCount: 2 }, 'test-seed');
}

function createOptionInput(
  player: Game['players'][number],
  process: (response: IInputResponse) => PlayerInput | undefined,
): PlayerInput {
  return {
    inputId: 'test-option-input',
    type: EPlayerInputType.OPTION,
    player,
    title: 'Test option',
    toModel: (): IPlayerInputModel => ({
      inputId: 'test-option-input',
      type: EPlayerInputType.OPTION,
      title: 'Test option',
      options: [{ id: 'ok', label: 'OK' }],
    }),
    process,
  };
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
    const game = createGame();

    game.transitionTo(EPhase.IN_RESOLUTION);
    game.transitionTo(EPhase.BETWEEN_TURNS);

    expect(game.phase).toBe(EPhase.BETWEEN_TURNS);
  });

  it('returns active and next players', () => {
    const game = createGame();

    expect(game.getActivePlayer().id).toBe('p1');
    expect(game.getNextPlayer().id).toBe('p2');

    game.setActivePlayer('p2');
    expect(game.getActivePlayer().id).toBe('p2');
    expect(game.getNextPlayer().id).toBe('p1');
  });

  it('blocks turn actions until all players resolve setup tuck prompts', () => {
    const game = createGame();
    const p1 = game.players.find((p) => p.id === 'p1')!;

    resolveAllInputsDefault(game, p1);

    expect(() =>
      game.processMainAction('p1', { type: EMainAction.PASS }),
    ).toThrow(/setup tuck input/i);
  });

  it('processes a full turn and hands off to next player', () => {
    const game = createGame();
    resolveSetupTucks(game);

    const p1 = game.players.find((p) => p.id === 'p1')!;
    game.processMainAction('p1', { type: EMainAction.PASS });
    resolveAllInputsDefault(game, p1);

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p2');
    expect(
      game.eventLog.recent(5).some((event) => event.type === 'ACTION'),
    ).toBe(true);
  });

  it('advances round after all players pass', () => {
    const game = createGame();
    resolveSetupTucks(game);

    const p1 = game.players.find((p) => p.id === 'p1')!;
    const p2 = game.players.find((p) => p.id === 'p2')!;

    game.processMainAction('p1', { type: EMainAction.PASS });
    resolveAllInputsDefault(game, p1);

    game.processMainAction('p2', { type: EMainAction.PASS });
    resolveAllInputsDefault(game, p2);

    expect(game.round).toBe(2);
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.activePlayer.id).toBe('p2');
  });

  it('ends game after round 5 pass sequence', () => {
    const game = createGame();
    resolveSetupTucks(game);

    for (let index = 0; index < 5; index += 1) {
      const activeId = game.activePlayer.id;
      const activePlayer = game.players.find((p) => p.id === activeId)!;

      game.processMainAction(activeId, { type: EMainAction.PASS });
      resolveAllInputsDefault(game, activePlayer);

      if ((game.phase as string) === EPhase.GAME_OVER) break;

      const nextId = game.activePlayer.id;
      const nextPlayer = game.players.find((p) => p.id === nextId)!;

      game.processMainAction(nextId, { type: EMainAction.PASS });
      resolveAllInputsDefault(game, nextPlayer);

      if ((game.phase as string) === EPhase.GAME_OVER) break;
    }

    expect(game.phase).toBe(EPhase.GAME_OVER);
  });

  it('cleans mission checkpoint when waiting input processing throws', () => {
    const game = createGame();
    resolveSetupTucks(game);
    const player = game.players[0];
    const error = new Error('input failed');
    game.transitionTo(EPhase.IN_RESOLUTION);
    game.missionTracker.beginCheckpoint();
    player.waitingFor = createOptionInput(player, () => {
      throw error;
    });

    expect(() =>
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'ok',
      }),
    ).toThrow(error);
    expect(game.missionTracker.hasActiveCheckpoint()).toBe(false);
    expect(player.waitingFor).toBeUndefined();
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });

  it('cleans mission checkpoint and pending deferred actions when input resolution throws', () => {
    const game = createGame();
    resolveSetupTucks(game);
    const player = game.players[0];
    const error = new Error('pipeline failed');
    game.transitionTo(EPhase.IN_RESOLUTION);
    game.missionTracker.beginCheckpoint();
    player.waitingFor = createOptionInput(player, () => undefined);
    game.deferredActions.push(
      new SimpleDeferredAction(player, () => {
        throw error;
      }),
    );
    game.deferredActions.push(
      new SimpleDeferredAction(player, () => undefined),
    );

    expect(() =>
      game.processInput(player.id, {
        type: EPlayerInputType.OPTION,
        optionId: 'ok',
      }),
    ).toThrow(error);
    expect(game.missionTracker.hasActiveCheckpoint()).toBe(false);
    expect(player.waitingFor).toBeUndefined();
    expect(game.deferredActions.isEmpty()).toBe(true);
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
  });
});
