import { describe, expect, it, vi } from 'vitest';
import {
  buildE2eResetSql,
  resetE2eDatabase,
} from '../../scripts/lib/resetE2eDatabase';

describe('resetE2eDatabase', () => {
  it('builds a truncation statement for e2e game state without clearing users', () => {
    expect(buildE2eResetSql()).toBe(
      'TRUNCATE TABLE turn_checkpoints, game_snapshots, game_players, games RESTART IDENTITY CASCADE',
    );
    expect(buildE2eResetSql()).not.toContain('users');
  });

  it('executes the e2e reset statement against the provided client', async () => {
    const query = vi.fn().mockResolvedValue(undefined);

    await resetE2eDatabase({ query });

    expect(query).toHaveBeenCalledWith(buildE2eResetSql());
  });
});
