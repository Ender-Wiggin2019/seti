import { describe, expect, it, vi } from 'vitest';
import {
  buildE2eResetSql,
  resetE2eDatabase,
} from '../../scripts/lib/resetE2eDatabase';

describe('resetE2eDatabase', () => {
  it('builds a truncation statement for all persisted e2e state', () => {
    expect(buildE2eResetSql()).toBe(
      'TRUNCATE TABLE turn_checkpoints, game_snapshots, game_players, games, users RESTART IDENTITY CASCADE',
    );
  });

  it('executes the e2e reset statement against the provided client', async () => {
    const query = vi.fn().mockResolvedValue(undefined);

    await resetE2eDatabase({ query });

    expect(query).toHaveBeenCalledWith(buildE2eResetSql());
  });
});
