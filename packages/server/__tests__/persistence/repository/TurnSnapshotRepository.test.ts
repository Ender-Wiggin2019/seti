import type { IGameStateDto } from '@/persistence/dto/GameStateDto.js';
import { TurnSnapshotRepository } from '@/persistence/repository/TurnSnapshotRepository.js';
import { turnSnapshots } from '@/persistence/schema/turnSnapshots.js';
import { serializeGame } from '@/persistence/serializer/GameSerializer.js';
import { vi } from 'vitest';
import { buildTestGame } from '../../helpers/TestGameBuilder.js';

const gameId = '00000000-0000-0000-0000-000000000001';

function stateDto(turnIndex: number): IGameStateDto {
  return {
    ...serializeGame(
      buildTestGame({ seed: `turn-snapshot-repo-${turnIndex}` }),
      turnIndex,
    ),
    version: turnIndex,
    gameId,
    turnIndex,
  };
}

describe('TurnSnapshotRepository', () => {
  it('upserts turn snapshots by game id and turn index', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const db = { insert: vi.fn().mockReturnValue({ values }) };
    const repo = new TurnSnapshotRepository(db as never);
    const state = stateDto(4);

    await repo.save({
      gameId,
      turnIndex: 4,
      seq: 12,
      playerId: 'p2',
      round: 1,
      state,
      interactedPlayerIds: ['p1'],
    });

    expect(db.insert).toHaveBeenCalledWith(turnSnapshots);
    expect(values).toHaveBeenCalledWith({
      gameId,
      turnIndex: 4,
      seq: 12,
      playerId: 'p2',
      round: 1,
      state,
      interactedPlayerIds: ['p1'],
    });
    expect(onConflictDoUpdate).toHaveBeenCalledWith({
      target: [turnSnapshots.gameId, turnSnapshots.turnIndex],
      set: {
        seq: 12,
        playerId: 'p2',
        round: 1,
        state,
        interactedPlayerIds: ['p1'],
      },
    });
  });

  it('loads the latest turn snapshot with its replay sequence', async () => {
    const row = {
      gameId,
      turnIndex: 5,
      seq: 20,
      playerId: 'p1',
      round: 2,
      state: stateDto(5),
      interactedPlayerIds: ['p2'],
    };
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([row]),
    };
    const db = { select: vi.fn().mockReturnValue(query) };
    const repo = new TurnSnapshotRepository(db as never);

    await expect(repo.loadLatest(gameId)).resolves.toEqual(row);
    expect(query.from).toHaveBeenCalledWith(turnSnapshots);
    expect(query.where).toHaveBeenCalled();
    expect(query.orderBy).toHaveBeenCalled();
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it('loads a turn snapshot by turn index', async () => {
    const row = {
      gameId,
      turnIndex: 3,
      seq: 11,
      playerId: 'p2',
      round: 1,
      state: stateDto(3),
      interactedPlayerIds: [],
    };
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([row]),
    };
    const db = { select: vi.fn().mockReturnValue(query) };
    const repo = new TurnSnapshotRepository(db as never);

    await expect(repo.loadByTurn(gameId, 3)).resolves.toEqual(row);
    expect(query.from).toHaveBeenCalledWith(turnSnapshots);
    expect(query.where).toHaveBeenCalled();
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it('returns null when the requested turn snapshot does not exist', async () => {
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    const db = { select: vi.fn().mockReturnValue(query) };
    const repo = new TurnSnapshotRepository(db as never);

    await expect(repo.loadByTurn(gameId, 99)).resolves.toBeNull();
  });

  it('returns null when no turn snapshot exists', async () => {
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    const db = { select: vi.fn().mockReturnValue(query) };
    const repo = new TurnSnapshotRepository(db as never);

    await expect(repo.loadLatest(gameId)).resolves.toBeNull();
  });

  it('deletes all turn snapshots for a game', async () => {
    const query = { where: vi.fn().mockResolvedValue(undefined) };
    const db = { delete: vi.fn().mockReturnValue(query) };
    const repo = new TurnSnapshotRepository(db as never);

    await repo.deleteAll(gameId);

    expect(db.delete).toHaveBeenCalledWith(turnSnapshots);
    expect(query.where).toHaveBeenCalled();
  });
});
