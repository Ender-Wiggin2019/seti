import { EMainAction, EPhase } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { vi } from 'vitest';
import type { DebugSessionRegistry } from '@/debug/DebugSessionRegistry.js';
import { DebugService } from '@/debug/debug.service.js';
import type { GameManager } from '@/gateway/GameManager.js';
import type { GameRepository } from '@/persistence/repository/GameRepository.js';
import { serializeGame } from '@/persistence/serializer/GameSerializer.js';
import { buildTestGame } from '../helpers/TestGameBuilder.js';

type TMockRepository = Pick<
  GameRepository,
  'loadLatestSnapshot' | 'loadSnapshot' | 'create'
>;

function createService(repo: TMockRepository): {
  service: DebugService;
  gameManager: Pick<GameManager, 'registerGame'>;
  registry: Pick<DebugSessionRegistry, 'register'>;
} {
  const jwtService = {
    sign: vi.fn(() => 'debug-token'),
  };
  const gameManager = {
    registerGame: vi.fn(),
  };
  const registry = {
    register: vi.fn(),
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
});
