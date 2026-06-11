import { describe, expect, it, vi } from 'vitest';

describe('runMigrations', () => {
  it('checks player-state schema after applying drizzle migrations', async () => {
    vi.resetModules();

    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          game_events: true,
          turn_snapshots: true,
          game_events_id: true,
          game_events_game_id: true,
          game_events_seq: true,
          game_events_turn_index: true,
          game_events_round: true,
          game_events_actor_id: true,
          game_events_type: true,
          game_events_payload: true,
          game_events_created_at: true,
          turn_snapshots_game_id: true,
          turn_snapshots_turn_index: true,
          turn_snapshots_seq: true,
          turn_snapshots_player_id: true,
          turn_snapshots_round: true,
          turn_snapshots_state: true,
          turn_snapshots_interacted_player_ids: true,
          turn_snapshots_created_at: true,
        },
      ],
      rowCount: 1,
    });
    const end = vi.fn().mockResolvedValue(undefined);
    const pool = { query, end };
    const Pool = vi.fn(() => pool);
    const db = {};
    const drizzle = vi.fn(() => db);
    const migrate = vi.fn().mockResolvedValue(undefined);

    vi.doMock('pg', () => ({ Pool }));
    vi.doMock('drizzle-orm/node-postgres', () => ({ drizzle }));
    vi.doMock('drizzle-orm/node-postgres/migrator', () => ({ migrate }));

    const { runMigrations } = await import(
      '../../scripts/lib/migrateDatabase.js'
    );

    await expect(runMigrations()).resolves.toBeDefined();

    expect(migrate).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('to_regclass'));
    const readinessQueryIndex = query.mock.calls.findIndex((call) =>
      String(call[0]).includes('to_regclass'),
    );
    expect(readinessQueryIndex).toBeGreaterThanOrEqual(0);
    expect(migrate.mock.invocationCallOrder[0]).toBeLessThan(
      query.mock.invocationCallOrder[readinessQueryIndex],
    );
    expect(end).toHaveBeenCalledTimes(1);

    vi.doUnmock('pg');
    vi.doUnmock('drizzle-orm/node-postgres');
    vi.doUnmock('drizzle-orm/node-postgres/migrator');
  });
});
