import {
  EAlienType,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import type { DebugSessionRegistry } from '@/debug/DebugSessionRegistry.js';
import { DebugService } from '@/debug/debug.service.js';
import type { IGame } from '@/engine/IGame.js';
import type { GameManager } from '@/gateway/GameManager.js';
import type { GameRepository } from '@/persistence/repository/GameRepository.js';
import {
  projectGameState,
  serializeGame,
} from '@/persistence/serializer/GameSerializer.js';
import { buildTestGame } from '../helpers/TestGameBuilder.js';

type TMockRepository = Pick<
  GameRepository,
  'loadLatestSnapshot' | 'loadSnapshot' | 'create'
>;

interface IGameManagerMock
  extends Pick<
    GameManager,
    'registerGame' | 'getGame' | 'getProjectedState' | 'processInput'
  > {
  registerGame: ReturnType<typeof vi.fn>;
  getGame: ReturnType<typeof vi.fn>;
  getProjectedState: ReturnType<typeof vi.fn>;
  processInput: ReturnType<typeof vi.fn>;
}

function createService(repo: TMockRepository): {
  service: DebugService;
  gameManager: IGameManagerMock;
  registry: Pick<
    DebugSessionRegistry,
    'register' | 'isDebugGame' | 'isBotPlayer'
  >;
} {
  const jwtService = {
    sign: vi.fn(() => 'debug-token'),
  };
  const gameManager = {
    registerGame: vi.fn(),
    getGame: vi.fn(),
    getProjectedState: vi.fn(),
    processInput: vi.fn(),
  } as IGameManagerMock;
  const registry = {
    register: vi.fn(),
    isDebugGame: vi.fn((gameId: string) => {
      const call = registry.register.mock.calls.find(
        ([registeredGameId]) => registeredGameId === gameId,
      );
      return call !== undefined;
    }),
    isBotPlayer: vi.fn((gameId: string, playerId: string) => {
      const call = registry.register.mock.calls.find(
        ([registeredGameId]) => registeredGameId === gameId,
      );
      const botIds = call?.[2] ?? [];
      return botIds.includes(playerId);
    }),
  };

  const service = new DebugService(
    {} as never,
    jwtService as never,
    gameManager as never,
    registry as never,
  );
  (service as unknown as { gameRepository: TMockRepository }).gameRepository =
    repo;

  return { service, gameManager, registry };
}

describe('DebugService snapshot replay', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('persists the cloned snapshot session and authenticates as the active player', async () => {
    const sourceGame = buildTestGame();
    sourceGame.setActivePlayer('p2');
    const snapshot = serializeGame(sourceGame, 3);
    const repo: TMockRepository = {
      loadLatestSnapshot: vi.fn().mockResolvedValue(snapshot),
      loadSnapshot: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
    } as TMockRepository;
    const { service, gameManager, registry } = createService(repo);

    const response = await service.createSnapshotSession({
      gameId: sourceGame.id,
    });

    expect(response.sourceGameId).toBe(sourceGame.id);
    expect(response.snapshotVersion).toBe(3);
    expect(response.user.id).toBe('p2');
    expect(response.gameId).not.toBe(sourceGame.id);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: response.gameId }),
    );
    expect(gameManager.registerGame).toHaveBeenCalledWith(
      expect.objectContaining({ id: response.gameId }),
    );
    expect(registry.register).toHaveBeenCalledWith(response.gameId, 'p2', [
      'p1',
    ]);
  });

  it('rejects snapshots captured while a non-resumable input is pending', async () => {
    const sourceGame = buildTestGame();
    sourceGame.processMainAction(sourceGame.activePlayer.id, {
      type: EMainAction.SCAN,
    });
    expect(sourceGame.phase).toBe(EPhase.IN_RESOLUTION);
    expect(sourceGame.activePlayer.waitingFor).toBeDefined();

    const repo: TMockRepository = {
      loadLatestSnapshot: vi
        .fn()
        .mockResolvedValue(serializeGame(sourceGame, 4)),
      loadSnapshot: vi.fn(),
      create: vi.fn(),
    } as TMockRepository;
    const { service, gameManager, registry } = createService(repo);

    await expect(
      service.createSnapshotSession({ gameId: sourceGame.id }),
    ).rejects.toMatchObject({
      code: EErrorCode.INVALID_PHASE,
    });
    expect(repo.create).not.toHaveBeenCalled();
    expect(gameManager.registerGame).not.toHaveBeenCalled();
    expect(registry.register).not.toHaveBeenCalled();
  });

  it('rejects snapshot replay in production', async () => {
    process.env.NODE_ENV = 'production';
    const sourceGame = buildTestGame();
    const repo: TMockRepository = {
      loadLatestSnapshot: vi
        .fn()
        .mockResolvedValue(serializeGame(sourceGame, 1)),
      loadSnapshot: vi.fn(),
      create: vi.fn(),
    } as TMockRepository;
    const { service } = createService(repo);

    await expect(
      service.createSnapshotSession({ gameId: sourceGame.id }),
    ).rejects.toMatchObject({
      code: EErrorCode.FORBIDDEN,
    });
    expect(repo.loadLatestSnapshot).not.toHaveBeenCalled();
  });

  it('rotates the solar system through the runtime next-disc order', async () => {
    const repo: TMockRepository = {
      loadLatestSnapshot: vi.fn(),
      loadSnapshot: vi.fn(),
      create: vi.fn(),
    } as TMockRepository;
    const { service, gameManager } = createService(repo);
    const state = { gameId: 'game-1' } as IPublicGameState;
    const solarSystem = { rotateNextDisc: vi.fn().mockReturnValue(1) };
    gameManager.getGame.mockResolvedValue({ solarSystem });
    gameManager.getProjectedState.mockReturnValue(state);

    const result = await service.solarRotateNext('game-1', 'viewer-1');

    expect(solarSystem.rotateNextDisc).toHaveBeenCalledTimes(1);
    expect(gameManager.getProjectedState).toHaveBeenCalledWith(
      'game-1',
      'viewer-1',
    );
    expect(result).toBe(state);
  });

  it('reveals a selected alien through the real discovery path', async () => {
    const repo: TMockRepository = {
      loadLatestSnapshot: vi.fn(),
      loadSnapshot: vi.fn(),
      create: vi.fn(),
    } as TMockRepository;
    const { service, gameManager } = createService(repo);
    const game = buildTestGame();
    game.hiddenAliens = [];
    gameManager.getGame.mockResolvedValue(game);
    gameManager.getProjectedState.mockImplementation((_gameId, viewerId) =>
      projectGameState(game, viewerId),
    );

    const result = await service.revealAlien(
      game.id,
      EAlienType.GLYPHIDS,
      'p1',
    );

    expect(result.aliens[0].board?.type).toBe('glyphids');
    expect(result.solarSystem.glyphidsSectorTokens).toHaveLength(8);
    expect(
      Object.values(result.planetaryBoard.planets).filter(
        (planet) => (planet.alienTokens ?? []).length > 0,
      ),
    ).toHaveLength(7);
    expect(
      result.techBoard.stacks.filter(
        (stack) => (stack.alienTokens ?? []).length > 0,
      ),
    ).toHaveLength(12);
  });
});

describe('DebugService server session setup', () => {
  it('resolves bot setup tuck inputs so only the debug viewer has to answer setup', async () => {
    const repo: TMockRepository = {
      loadLatestSnapshot: vi.fn(),
      loadSnapshot: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
    } as TMockRepository;
    const { service, gameManager, registry } = createService(repo);
    let registeredGame: IGame | null = null;
    gameManager.registerGame.mockImplementation((game) => {
      registeredGame = game;
      gameManager.getGame.mockResolvedValue(game);
    });

    const response = await service.createServerSession();

    expect(gameManager.processInput).not.toHaveBeenCalled();
    expect(registry.register).toHaveBeenCalledWith(
      response.gameId,
      response.user.id,
      [expect.any(String)],
    );
    const game = registeredGame as IGame | null;
    if (!game) {
      throw new Error('Expected debug game to be registered');
    }
    const human = game.players.find((player) => player.id === response.user.id);
    const bots = game.players.filter(
      (player) => player.id !== response.user.id,
    );
    expect(human?.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);
    expect(human?.pendingSetupTucks).toBeGreaterThan(0);
    expect(bots.every((bot) => bot.waitingFor === undefined)).toBe(true);
    expect(bots.every((bot) => bot.pendingSetupTucks === 0)).toBe(true);
  });
});
