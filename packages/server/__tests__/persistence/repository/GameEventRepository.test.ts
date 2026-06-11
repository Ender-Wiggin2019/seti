import { EGameEventType, type TGameEvent } from '@seti/common/types/protocol/events';
import { vi } from 'vitest';
import { GameEventRepository } from '@/persistence/repository/GameEventRepository.js';
import { gameEvents } from '@/persistence/schema/gameEvents.js';

const gameId = '00000000-0000-0000-0000-000000000001';

function actionEvent(seq: number, action = 'SCAN'): TGameEvent {
  return {
    id: `event-${seq}`,
    seq,
    turnIndex: 3,
    round: 1,
    actorId: 'p1',
    level: 'info',
    type: EGameEventType.ACTION,
    action,
  };
}

describe('GameEventRepository', () => {
  it('appendMany is idempotent on game id and sequence', async () => {
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoNothing });
    const db = { insert: vi.fn().mockReturnValue({ values }) };
    const repo = new GameEventRepository(db as never);
    const events = [actionEvent(1), actionEvent(2, 'PASS')];

    await repo.appendMany(gameId, events);
    await repo.appendMany(gameId, events);

    expect(db.insert).toHaveBeenCalledWith(gameEvents);
    expect(values).toHaveBeenCalledWith([
      {
        gameId,
        seq: 1,
        turnIndex: 3,
        round: 1,
        actorId: 'p1',
        type: EGameEventType.ACTION,
        payload: events[0],
      },
      {
        gameId,
        seq: 2,
        turnIndex: 3,
        round: 1,
        actorId: 'p1',
        type: EGameEventType.ACTION,
        payload: events[1],
      },
    ]);
    expect(onConflictDoNothing).toHaveBeenCalledTimes(2);
    expect(onConflictDoNothing).toHaveBeenCalledWith({
      target: [gameEvents.gameId, gameEvents.seq],
    });
  });

  it('does not write when appendMany receives no events', async () => {
    const db = { insert: vi.fn() };
    const repo = new GameEventRepository(db as never);

    await repo.appendMany(gameId, []);

    expect(db.insert).not.toHaveBeenCalled();
  });

  it('loadSince returns payloads after the given sequence in order', async () => {
    const rows = [{ payload: actionEvent(2) }, { payload: actionEvent(3) }];
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(rows),
    };
    const db = { select: vi.fn().mockReturnValue(query) };
    const repo = new GameEventRepository(db as never);

    await expect(repo.loadSince(gameId, 1)).resolves.toEqual([
      actionEvent(2),
      actionEvent(3),
    ]);
    expect(query.from).toHaveBeenCalledWith(gameEvents);
    expect(query.where).toHaveBeenCalled();
    expect(query.orderBy).toHaveBeenCalledWith(gameEvents.seq);
  });

  it('loadByTurn returns payloads for a turn in sequence order', async () => {
    const rows = [{ payload: actionEvent(4) }];
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(rows),
    };
    const db = { select: vi.fn().mockReturnValue(query) };
    const repo = new GameEventRepository(db as never);

    await expect(repo.loadByTurn(gameId, 3)).resolves.toEqual([actionEvent(4)]);
    expect(query.from).toHaveBeenCalledWith(gameEvents);
    expect(query.where).toHaveBeenCalled();
    expect(query.orderBy).toHaveBeenCalledWith(gameEvents.seq);
  });

  it('loadByActor returns payloads for an actor in sequence order', async () => {
    const rows = [{ payload: actionEvent(5) }];
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(rows),
    };
    const db = { select: vi.fn().mockReturnValue(query) };
    const repo = new GameEventRepository(db as never);

    await expect(repo.loadByActor(gameId, 'p1')).resolves.toEqual([
      actionEvent(5),
    ]);
    expect(query.from).toHaveBeenCalledWith(gameEvents);
    expect(query.where).toHaveBeenCalled();
    expect(query.orderBy).toHaveBeenCalledWith(gameEvents.seq);
  });

  it('countByType returns numeric counts keyed by event type', async () => {
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockResolvedValue([
        { type: EGameEventType.ACTION, count: '2' },
        { type: EGameEventType.PROBE_MOVED, count: 1 },
      ]),
    };
    const db = { select: vi.fn().mockReturnValue(query) };
    const repo = new GameEventRepository(db as never);

    await expect(repo.countByType(gameId)).resolves.toEqual({
      [EGameEventType.ACTION]: 2,
      [EGameEventType.PROBE_MOVED]: 1,
    });
    expect(query.from).toHaveBeenCalledWith(gameEvents);
    expect(query.where).toHaveBeenCalled();
    expect(query.groupBy).toHaveBeenCalledWith(gameEvents.type);
  });
});
