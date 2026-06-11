import { describe, expect, it, vi } from 'vitest';
import {
  assertPlayerStateSchemaReady,
  createReadyPool,
} from '@/persistence/schemaReadiness.js';

function readySchemaRow() {
  return {
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
  };
}

describe('schema readiness', () => {
  it('accepts a database with the player-state tables installed', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [readySchemaRow()],
      rowCount: 1,
    });

    await expect(assertPlayerStateSchemaReady({ query })).resolves.toBeUndefined();

    expect(query).toHaveBeenCalledWith(expect.stringContaining('to_regclass'));
  });

  it('throws a clear migration hint when a player-state table is missing', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ game_events: true, turn_snapshots: false }],
      rowCount: 1,
    });

    await expect(assertPlayerStateSchemaReady({ query })).rejects.toThrow(
      'Database schema is not ready: missing required table(s) public.turn_snapshots. Run `pnpm --filter @seti/server db:migrate` before starting the server.',
    );
  });

  it('throws a clear migration hint when a player-state column is missing', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          ...readySchemaRow(),
          turn_snapshots_interacted_player_ids: false,
        },
      ],
      rowCount: 1,
    });

    await expect(assertPlayerStateSchemaReady({ query })).rejects.toThrow(
      'Database schema is not ready: missing required column(s) public.turn_snapshots.interacted_player_ids. Run `pnpm --filter @seti/server db:migrate` before starting the server.',
    );
  });

  it('checks schema before exposing the application pool', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [readySchemaRow()],
        rowCount: 1,
      }),
      end: vi.fn().mockResolvedValue(undefined),
    };

    await expect(createReadyPool(() => pool)).resolves.toBe(pool);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('to_regclass'));
    expect(pool.end).not.toHaveBeenCalled();
  });

  it('closes the application pool when schema readiness fails', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ game_events: false, turn_snapshots: true }],
        rowCount: 1,
      }),
      end: vi.fn().mockResolvedValue(undefined),
    };

    await expect(createReadyPool(() => pool)).rejects.toThrow(
      'public.game_events',
    );

    expect(pool.end).toHaveBeenCalledTimes(1);
  });
});
