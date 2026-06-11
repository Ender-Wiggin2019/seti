import { Test } from '@nestjs/testing';
import { EResource } from '@seti/common/types/element';
import type { IFreeActionRequest } from '@seti/common/types/protocol/actions';
import { EAnimationStepKind } from '@seti/common/types/protocol/animation';
import {
  EFreeAction,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import {
  EErrorCode,
  EErrorDisplay,
  EErrorSeverity,
} from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { Deck } from '@/engine/deck/Deck.js';
import {
  createActionEvent,
  createFreeActionEvent,
  createProbeMovedEvent,
} from '@/engine/event/GameEvent.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { GameManager } from '@/gateway/GameManager.js';
import { DRIZZLE_DB } from '@/persistence/drizzle.module.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import { serializeGame } from '@/persistence/serializer/GameSerializer.js';
import { resolveSetupTucks } from '../helpers/TestGameBuilder.js';

function createTestGame(): IGame {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'manager-test-seed',
    'game-mgr-test',
  );
  resolveSetupTucks(game);
  return game;
}

function createSoloTestGame(): Game {
  const game = Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      {
        id: 'rival:game-mgr-solo',
        name: 'Rival Institution',
        color: 'blue',
        seatIndex: 1,
      },
    ],
    {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 3,
    } as Parameters<typeof Game.create>[1],
    'manager-solo-seed',
    'game-mgr-solo',
  );
  resolveSetupTucks(game);
  return game;
}

function normalizedState(game: IGame, version: number) {
  return serializeGame(deserializeGame(serializeGame(game, version)), version);
}

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
};

function createInsertChain() {
  const insertResult = {
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  };
  const insertChain = {
    values: vi.fn().mockReturnValue(insertResult),
  };

  return insertChain;
}

function setupMockDbForSnapshot() {
  const insertChain = createInsertChain();
  mockDb.insert.mockReturnValue(insertChain);
  mockDb.transaction.mockImplementation(
    async (callback: (tx: typeof mockDb) => Promise<unknown>) =>
      callback(mockDb),
  );

  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  mockDb.select.mockReturnValue(selectChain);
}

function cacheGame(
  manager: GameManager,
  game: IGame,
  version = 0,
): void {
  (manager as unknown as { cache: Map<string, IGame> }).cache.set(
    game.id,
    game,
  );
  (manager as unknown as { versions: Map<string, number> }).versions.set(
    game.id,
    version,
  );
  (
    manager as unknown as { lastCommittedSeqs?: Map<string, number> }
  ).lastCommittedSeqs?.set(game.id, game.eventLog.toArray().at(-1)?.seq ?? 0);
}

describe('GameManager', () => {
  let manager: GameManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    setupMockDbForSnapshot();

    const module = await Test.createTestingModule({
      providers: [GameManager, { provide: DRIZZLE_DB, useValue: mockDb }],
    }).compile();

    manager = module.get(GameManager);
  });

  describe('getGame', () => {
    it('returns cached game on second call', async () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );

      const result = await manager.getGame('game-mgr-test');
      expect(result.id).toBe('game-mgr-test');
      expect(result).toBe(game);
    });

    it('throws when game not in cache or DB', async () => {
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(selectChain);

      await expect(manager.getGame('nonexistent')).rejects.toMatchObject({
        code: EErrorCode.GAME_NOT_FOUND,
        display: EErrorDisplay.BLOCKING,
        message: 'Game nonexistent not found',
        severity: EErrorSeverity.BLOCKING,
      });
    });
  });

  describe('processAction', () => {
    it('executes a main action and returns per-player states', async () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      const result = await manager.processAction('game-mgr-test', 'p1', {
        type: EMainAction.PASS,
      });

      expect(result.states.size).toBe(2);
      expect(result.states.has('p1')).toBe(true);
      expect(result.states.has('p2')).toBe(true);

      const p1State = result.states.get('p1');
      expect(p1State).toBeDefined();
    });

    it('returns only appended events and animation batches for the command', async () => {
      const game = createTestGame();
      game.eventLog.append(createActionEvent('p1', 'PRE_EXISTING'));
      vi.spyOn(game, 'processMainAction').mockImplementation(() => {
        game.eventLog.append(
          createProbeMovedEvent('p1', 'probe-1', ['s0', 's1']),
        );
      });
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      const result = await manager.processAction('game-mgr-test', 'p1', {
        type: EMainAction.PASS,
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        type: 'PROBE_MOVED',
      });
      expect(result.animationBatches).toHaveLength(1);
      expect(result.animationBatches[0]).toMatchObject({
        actorId: 'p1',
        finalStateVersion: 1,
        steps: [
          expect.objectContaining({
            kind: EAnimationStepKind.PROBE_MOVE,
            sourceEventId: result.events[0].id,
          }),
        ],
      });
    });

    it('does not persist same-turn events before the turn is complete', async () => {
      const game = createTestGame();
      cacheGame(manager, game);

      const result = await manager.processFreeAction('game-mgr-test', 'p1', {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CREDIT,
        to: EResource.ENERGY,
      });

      expect(result.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'FREE_ACTION' }),
        ]),
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('does not persist when end-turn flow is still waiting for follow-up input', async () => {
      const game = createTestGame();
      game.phase = EPhase.AWAIT_END_TURN;
      vi.spyOn(game, 'processEndTurn').mockImplementation(() => {
        game.eventLog.append(createActionEvent('p1', 'END_TURN'));
        game.players[0].waitingFor = new SelectOption(game.players[0], [
          { id: 'continue', label: 'Continue', onSelect: () => undefined },
        ]);
      });
      cacheGame(manager, game);

      await manager.processEndTurn('game-mgr-test', 'p1');

      expect(game.turnIndex).toBe(1);
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('commits all accumulated turn events and the turn snapshot in one database transaction', async () => {
      const game = createTestGame();
      cacheGame(manager, game);

      await manager.processFreeAction('game-mgr-test', 'p1', {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CREDIT,
        to: EResource.ENERGY,
      });
      vi.clearAllMocks();

      game.phase = EPhase.AWAIT_END_TURN;
      const txInsertChain = createInsertChain();
      const txDb = {
        ...mockDb,
        insert: vi.fn().mockReturnValue(txInsertChain),
      };
      mockDb.transaction.mockImplementationOnce(
        async (callback: (tx: typeof mockDb) => Promise<unknown>) =>
          callback(txDb),
      );

      await manager.processEndTurn('game-mgr-test', 'p1');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(txDb.insert).toHaveBeenCalledTimes(2);
      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(txInsertChain.values).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({
            gameId: 'game-mgr-test',
            payload: expect.objectContaining({ type: 'FREE_ACTION' }),
          }),
          expect.objectContaining({
            gameId: 'game-mgr-test',
            payload: expect.objectContaining({
              type: 'ACTION',
              action: 'END_TURN',
            }),
          }),
        ]),
      );
    });

    it('commits accumulated turn events even when they exceed the display event window', async () => {
      const game = createTestGame();
      cacheGame(manager, game);
      const committedSeq =
        game.eventLog.toArray().at(-1)?.seq ?? 0;

      for (let index = 0; index < 501; index += 1) {
        game.eventLog.append(createActionEvent('p1', `LONG_TURN_${index}`));
      }
      const firstLongTurnSeq = committedSeq + 1;
      const txInsertChain = createInsertChain();
      const txDb = {
        ...mockDb,
        insert: vi.fn().mockReturnValue(txInsertChain),
      };
      mockDb.transaction.mockImplementationOnce(
        async (callback: (tx: typeof mockDb) => Promise<unknown>) =>
          callback(txDb),
      );
      game.phase = EPhase.AWAIT_END_TURN;

      await manager.processEndTurn('game-mgr-test', 'p1');

      const persistedEvents = txInsertChain.values.mock.calls[0]?.[0] as Array<{
        payload: { seq: number; action?: unknown };
      }>;
      expect(persistedEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            payload: expect.objectContaining({
              seq: firstLongTurnSeq,
              action: 'LONG_TURN_0',
            }),
          }),
        ]),
      );
      expect(persistedEvents.length).toBeGreaterThan(501);
    });

    it('rejects the turn completion when committed event persistence fails', async () => {
      const game = createTestGame();
      game.phase = EPhase.AWAIT_END_TURN;
      const stateBefore = normalizedState(game, 0);
      cacheGame(manager, game);

      const eventInsertChain = {
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi
            .fn()
            .mockRejectedValue(new Error('event store unavailable')),
        }),
      };
      const txDb = {
        ...mockDb,
        insert: vi.fn().mockReturnValueOnce(eventInsertChain),
      };
      mockDb.transaction.mockImplementationOnce(
        async (callback: (tx: typeof mockDb) => Promise<unknown>) =>
          callback(txDb),
      );

      await expect(
        manager.processEndTurn('game-mgr-test', 'p1'),
      ).rejects.toThrow('event store unavailable');

      const restored = await manager.getGame('game-mgr-test');
      expect(serializeGame(restored, 0)).toEqual(stateBefore);
      expect(
        (manager as unknown as { versions: Map<string, number> }).versions.get(
          'game-mgr-test',
        ),
      ).toBe(0);
    });

    it('persists one turn snapshot when a command crosses a turn boundary', async () => {
      const game = createTestGame();
      cacheGame(manager, game);
      const txInsertChain = createInsertChain();
      const txDb = {
        ...mockDb,
        insert: vi.fn().mockReturnValue(txInsertChain),
      };
      mockDb.transaction.mockImplementationOnce(
        async (callback: (tx: typeof mockDb) => Promise<unknown>) =>
          callback(txDb),
      );

      game.phase = EPhase.AWAIT_END_TURN;

      await manager.processEndTurn('game-mgr-test', 'p1');

      expect(txInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: 'game-mgr-test',
          turnIndex: game.turnIndex,
          seq: game.eventLog.toArray().at(-1)?.seq,
          state: expect.objectContaining({ turnIndex: game.turnIndex }),
        }),
      );
    });

    it('rejects the command when turn snapshot persistence fails', async () => {
      const game = createTestGame();
      game.phase = EPhase.AWAIT_END_TURN;
      const stateBefore = normalizedState(game, 0);
      cacheGame(manager, game);
      const eventInsertChain = createInsertChain();
      const snapshotInsertChain = {
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
          onConflictDoUpdate: vi
            .fn()
            .mockRejectedValue(new Error('turn snapshot unavailable')),
        }),
      };
      const txDb = {
        ...mockDb,
        insert: vi
          .fn()
          .mockReturnValueOnce(eventInsertChain)
          .mockReturnValueOnce(snapshotInsertChain),
      };
      mockDb.transaction.mockImplementationOnce(
        async (callback: (tx: typeof mockDb) => Promise<unknown>) =>
          callback(txDb),
      );

      await expect(
        manager.processEndTurn('game-mgr-test', 'p1'),
      ).rejects.toThrow('turn snapshot unavailable');

      const restored = await manager.getGame('game-mgr-test');
      expect(serializeGame(restored, 0)).toEqual(stateBefore);
      expect(
        (manager as unknown as { versions: Map<string, number> }).versions.get(
          'game-mgr-test',
        ),
      ).toBe(0);
    });

    it('advances the projected version after replaying post-snapshot events on cold load', async () => {
      const base = createTestGame();
      const snapshotSeq = base.eventLog.toArray().at(-1)?.seq ?? 0;
      const snapshot = serializeGame(base, 1);
      const live = deserializeGame(snapshot);
      live.processFreeAction('p1', {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CREDIT,
        to: EResource.ENERGY,
      });
      const persistedEvents = live.eventLog.since(snapshotSeq);
      const loadLatestMock = vi.fn().mockResolvedValue({
        gameId: 'game-mgr-test',
        turnIndex: snapshot.turnIndex,
        seq: snapshotSeq,
        playerId: snapshot.currentPlayerId,
        round: snapshot.round,
        state: snapshot,
        interactedPlayerIds: [],
      });
      const loadSinceMock = vi.fn().mockResolvedValue(persistedEvents);
      (
        manager as unknown as {
          turnSnapshotRepo: { loadLatest: typeof loadLatestMock };
        }
      ).turnSnapshotRepo = { loadLatest: loadLatestMock };
      (
        manager as unknown as {
          gameEventRepo: { loadSince: typeof loadSinceMock };
        }
      ).gameEventRepo = { loadSince: loadSinceMock };

      await manager.getGame('game-mgr-test');

      expect(manager.getProjectedState('game-mgr-test', 'p1')?.version).toBe(2);
    });

    it('records a durable journal when an action pauses for player input', async () => {
      const game = createTestGame();
      const player = game.players[0];
      player.resources.gain({ publicity: 20 });
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      await manager.processAction('game-mgr-test', 'p1', {
        type: EMainAction.RESEARCH_TECH,
      });

      expect(game.pendingResolutionJournal).toMatchObject({
        version: 1,
        steps: [
          {
            type: 'MAIN_ACTION',
            playerId: 'p1',
            action: { type: EMainAction.RESEARCH_TECH },
          },
        ],
      });

      const restored = deserializeGame(serializeGame(game, 1));
      const restoredPlayer = restored.players[0];
      const restoredModel = restoredPlayer.waitingFor?.toModel() as
        | ISelectOptionInputModel
        | undefined;

      expect(restoredModel?.title).toBe('Select a technology to research');
      expect(restoredModel?.inputId).toBeDefined();

      await manager.processInput('game-mgr-test', 'p1', {
        inputId: game.players[0].waitingFor?.inputId,
        type: EPlayerInputType.OPTION,
        optionId: restoredModel?.options[0]?.id ?? '',
      });
    });

    it('appends input responses while a resolution remains paused', async () => {
      const game = createTestGame();
      const player = game.players[0];
      player.resources.gain({ publicity: 20 });
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      await manager.processAction('game-mgr-test', 'p1', {
        type: EMainAction.RESEARCH_TECH,
      });

      const techModel = player.waitingFor?.toModel() as ISelectOptionInputModel;
      const computerTech = techModel.options.find((option) =>
        option.id.startsWith('comp-'),
      );
      expect(computerTech).toBeDefined();

      await manager.processInput('game-mgr-test', 'p1', {
        inputId: techModel.inputId,
        type: EPlayerInputType.OPTION,
        optionId: computerTech?.id ?? '',
      });

      expect(game.pendingResolutionJournal?.steps).toHaveLength(2);
      const liveModel = player.waitingFor?.toModel() as
        | ISelectOptionInputModel
        | undefined;

      const restored = deserializeGame(serializeGame(game, 1));
      const restoredModel = restored.players[0].waitingFor?.toModel() as
        | ISelectOptionInputModel
        | undefined;
      expect(restoredModel?.title).toBe(liveModel?.title);
      expect(restoredModel?.type).toBe(liveModel?.type);
    });

    it('automatically resolves rival turns before returning projected states', async () => {
      const game = createSoloTestGame();
      const rivalState = game.rivalState;
      if (!rivalState) throw new Error('expected rival state');
      rivalState.actionDeck = new Deck(['S.1']);
      game.startPlayer = game.players[0];
      game.activePlayer = game.players[0];
      game.processMainAction('p1', { type: EMainAction.LAUNCH_PROBE });
      expect(game.phase).toBe(EPhase.AWAIT_END_TURN);

      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-solo',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-solo',
        0,
      );

      const result = await manager.processEndTurn('game-mgr-solo', 'p1');

      expect(game.activePlayer.id).toBe('p1');
      expect(result.states.get('p1')?.currentPlayerId).toBe('p1');
      expect(rivalState.actionDeck.discardSize).toBe(1);
      expect(game.players[1].probesInSpace).toBe(1);
    });
  });

  describe('processFreeAction', () => {
    it('returns updated state after free action', async () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );

      const result = await manager.processFreeAction('game-mgr-test', 'p1', {
        type: 'EXCHANGE_RESOURCES' as never,
        from: 'credit' as never,
        to: 'energy' as never,
      });

      expect(result.states.size).toBe(2);
    });

    it('keeps free-action events in memory when the free action leaves pending input', async () => {
      const game = createTestGame();
      const player = game.players[0];
      const prompt = new SelectOption(player, [
        { id: 'confirm', label: 'Confirm', onSelect: () => undefined },
      ]);
      const action = {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CREDIT,
        to: EResource.ENERGY,
      } satisfies IFreeActionRequest;
      vi.spyOn(game, 'processFreeAction').mockImplementation(() => {
        player.waitingFor = prompt;
        game.eventLog.append(createFreeActionEvent('p1', action));
      });
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      await manager.processFreeAction('game-mgr-test', 'p1', action);

      expect(game.pendingResolutionJournal).toMatchObject({
        version: 1,
        steps: [
          {
            type: 'FREE_ACTION',
            playerId: 'p1',
          },
        ],
      });
      expect(game.eventLog.toArray()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'FREE_ACTION' }),
        ]),
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('undoToTurnStart', () => {
    it('rolls back same-turn work in memory without persisting undo', async () => {
      const game = createTestGame();
      manager.registerGame(game);
      game.turnLocked = false;
      const stateBefore = normalizedState(game, 0);
      await manager.processFreeAction('game-mgr-test', 'p1', {
        type: EFreeAction.EXCHANGE_RESOURCES,
        from: EResource.CREDIT,
        to: EResource.ENERGY,
      });
      vi.clearAllMocks();

      const result = await manager.undoToTurnStart('game-mgr-test', 'p1');

      const restored = await manager.getGame('game-mgr-test');
      expect(serializeGame(restored, 0)).toEqual(stateBefore);
      expect(result.events).toEqual([
        expect.objectContaining({
          type: 'UNDO',
          level: 'info',
          actorId: 'p1',
        }),
      ]);
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('returns an ephemeral undo log event after rollback', async () => {
      const game = createTestGame();
      manager.registerGame(game);
      game.turnLocked = false;
      vi.clearAllMocks();

      const result = await manager.undoToTurnStart('game-mgr-test', 'p1');
      const events = (result as { events?: unknown[] }).events;

      expect(events).toEqual([
        expect.objectContaining({
          type: 'UNDO',
          level: 'info',
          actorId: 'p1',
          turnIndex: expect.any(Number),
        }),
      ]);

      const restored = await manager.getGame('game-mgr-test');
      expect(restored.eventLog.toArray()).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'UNDO' })]),
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('processInput', () => {
    it('rejects a response that is missing the current inputId before mutating the prompt', async () => {
      const game = createTestGame();
      const player = game.players[0];
      const prompt = new SelectOption(player, [
        { id: 'confirm', label: 'Confirm', onSelect: () => undefined },
      ]);
      player.waitingFor = prompt;
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      await expect(
        manager.processInput('game-mgr-test', 'p1', {
          type: EPlayerInputType.OPTION,
          optionId: 'confirm',
        }),
      ).rejects.toMatchObject({
        code: EErrorCode.STALE_INPUT_RESPONSE,
        display: EErrorDisplay.NONE,
        severity: EErrorSeverity.SILENT,
      });

      expect(player.waitingFor).toBe(prompt);
      expect(
        (manager as unknown as { versions: Map<string, number> }).versions.get(
          'game-mgr-test',
        ),
      ).toBe(0);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('rejects a response for a stale inputId before mutating the prompt', async () => {
      const game = createTestGame();
      const player = game.players[0];
      const prompt = new SelectOption(player, [
        { id: 'confirm', label: 'Confirm', onSelect: () => undefined },
      ]);
      player.waitingFor = prompt;
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      await expect(
        manager.processInput('game-mgr-test', 'p1', {
          inputId: 'stale-input',
          type: EPlayerInputType.OPTION,
          optionId: 'confirm',
        }),
      ).rejects.toMatchObject({
        code: EErrorCode.STALE_INPUT_RESPONSE,
        display: EErrorDisplay.NONE,
        severity: EErrorSeverity.SILENT,
      });

      expect(player.waitingFor).toBe(prompt);
      expect(
        (manager as unknown as { versions: Map<string, number> }).versions.get(
          'game-mgr-test',
        ),
      ).toBe(0);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('accepts a response that matches the current inputId without persisting before turn completion', async () => {
      const game = createTestGame();
      const player = game.players[0];
      const prompt = new SelectOption(player, [
        { id: 'confirm', label: 'Confirm', onSelect: () => undefined },
      ]);
      player.waitingFor = prompt;
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      await manager.processInput('game-mgr-test', 'p1', {
        inputId: prompt.inputId,
        type: EPlayerInputType.OPTION,
        optionId: 'confirm',
      });

      expect(player.waitingFor).toBeUndefined();
      expect(game.eventLog.toArray()).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'INPUT' })]),
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('records a base state when a non-resolution input leaves another prompt pending', async () => {
      const game = createTestGame();
      const player = game.players[0];
      const secondPrompt = new SelectOption(
        player,
        [{ id: 'second', label: 'Second', onSelect: () => undefined }],
        'Second prompt',
      );
      const firstPrompt = new SelectOption(
        player,
        [{ id: 'first', label: 'First', onSelect: () => secondPrompt }],
        'First prompt',
      );
      player.waitingFor = firstPrompt;
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      (manager as unknown as { versions: Map<string, number> }).versions.set(
        'game-mgr-test',
        0,
      );

      await manager.processInput('game-mgr-test', 'p1', {
        inputId: firstPrompt.inputId,
        type: EPlayerInputType.OPTION,
        optionId: 'first',
      });

      expect(player.waitingFor?.toModel()).toMatchObject({
        type: EPlayerInputType.OPTION,
        title: 'Second prompt',
      });
      expect(game.pendingResolutionJournal).toMatchObject({
        version: 1,
        steps: [
          {
            type: 'INPUT_RESPONSE',
            playerId: 'p1',
          },
        ],
      });
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('getProjectedState', () => {
    it('returns null for unloaded game', () => {
      const state = manager.getProjectedState('nonexistent', 'p1');
      expect(state).toBeNull();
    });

    it('returns per-player projected state', () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );

      const state = manager.getProjectedState('game-mgr-test', 'p1');
      expect(state).toBeDefined();
      expect(state?.gameId).toBe('game-mgr-test');
    });
  });

  describe('registerGame', () => {
    it('automatically resolves a ready solo rival start turn before projection', () => {
      const game = createSoloTestGame();
      const rivalState = game.rivalState;
      if (!rivalState) throw new Error('expected rival state');
      rivalState.actionDeck = new Deck(['S.1']);
      game.startPlayer = game.players[1];
      game.activePlayer = game.players[1];
      game.phase = EPhase.AWAIT_MAIN_ACTION;

      manager.registerGame(game);

      expect(game.activePlayer.id).toBe('p1');
      expect(rivalState.actionDeck.discardSize).toBe(1);
      expect(
        manager.getProjectedState('game-mgr-solo', 'p1')?.currentPlayerId,
      ).toBe('p1');
    });
  });

  describe('isGameLoaded', () => {
    it('returns false for unloaded game', () => {
      expect(manager.isGameLoaded('nonexistent')).toBe(false);
    });

    it('returns true for loaded game', () => {
      const game = createTestGame();
      (manager as unknown as { cache: Map<string, IGame> }).cache.set(
        'game-mgr-test',
        game,
      );
      expect(manager.isGameLoaded('game-mgr-test')).toBe(true);
    });
  });

  describe('unloadGame', () => {
    it('removes game from cache', async () => {
      const game = createTestGame();
      const cache = (manager as unknown as { cache: Map<string, IGame> }).cache;
      cache.set('game-mgr-test', game);

      await manager.unloadGame('game-mgr-test');

      expect(cache.has('game-mgr-test')).toBe(false);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });
});
