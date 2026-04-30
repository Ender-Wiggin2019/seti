import { Pool } from 'pg';
import { getTargetConnectionConfig, getTargetDatabaseName } from './dbAdmin';

export interface IDatabaseClient {
  query(sql: string): Promise<unknown>;
}

type TClosableDatabaseClient = IDatabaseClient & {
  end(): Promise<void>;
};

export const E2E_RESET_TABLES = [
  'turn_checkpoints',
  'game_snapshots',
  'game_players',
  'games',
  'users',
] as const;

export function buildE2eResetSql(
  tables: readonly string[] = E2E_RESET_TABLES,
): string {
  return `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`;
}

export async function resetE2eDatabase(client: IDatabaseClient): Promise<void> {
  await client.query(buildE2eResetSql());
}

export async function resetTargetE2eDatabase(): Promise<string> {
  const targetDatabase = getTargetDatabaseName();
  const pool = new Pool(
    getTargetConnectionConfig(targetDatabase),
  ) as unknown as TClosableDatabaseClient;

  try {
    await resetE2eDatabase(pool);
    return targetDatabase;
  } finally {
    await pool.end();
  }
}
