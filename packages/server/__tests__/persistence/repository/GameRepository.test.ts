import { vi } from 'vitest';
import { GameRepository } from '@/persistence/repository/GameRepository.js';
import { games } from '@/persistence/schema/games.js';
import { turnSnapshots } from '@/persistence/schema/turnSnapshots.js';
import { buildTestGame } from '../../helpers/TestGameBuilder.js';

function createDbMock() {
  const turnSnapshotConflict = {
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  };
  const values = vi.fn().mockImplementation((input) => {
    if ('turnIndex' in input) {
      return turnSnapshotConflict;
    }
    return Promise.resolve(undefined);
  });
  const set = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  });

  return {
    db: {
      insert: vi.fn().mockReturnValue({ values }),
      update: vi.fn().mockReturnValue({ set }),
    },
    values,
    set,
    turnSnapshotConflict,
  };
}

describe('GameRepository', () => {
  it('creates game metadata and an initial turn snapshot', async () => {
    const game = buildTestGame();
    const { db, values, turnSnapshotConflict } = createDbMock();
    const repo = new GameRepository(db as never);

    await repo.create(game);

    expect(db.insert).toHaveBeenCalledWith(games);
    expect(db.insert).toHaveBeenCalledWith(turnSnapshots);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: game.id,
        status: 'playing',
        playerCount: 2,
      }),
    );
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: game.id,
        turnIndex: game.turnIndex,
        seq: game.eventLog.toArray().at(-1)?.seq ?? 0,
        playerId: game.activePlayer.id,
        state: expect.objectContaining({
          gameId: game.id,
          turnIndex: game.turnIndex,
        }),
      }),
    );
    expect(turnSnapshotConflict.onConflictDoUpdate).toHaveBeenCalledWith({
      target: [turnSnapshots.gameId, turnSnapshots.turnIndex],
      set: expect.objectContaining({
        state: expect.objectContaining({ gameId: game.id }),
      }),
    });
  });

  it('starts a lobby game by updating metadata and upserting an initial turn snapshot', async () => {
    const game = buildTestGame();
    const { db, set, values } = createDbMock();
    const repo = new GameRepository(db as never);

    await repo.startFromLobby(game);

    expect(db.update).toHaveBeenCalledWith(games);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'playing',
        playerCount: 2,
        currentRound: game.round,
      }),
    );
    expect(db.insert).toHaveBeenCalledWith(turnSnapshots);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: game.id,
        turnIndex: game.turnIndex,
      }),
    );
  });
});
