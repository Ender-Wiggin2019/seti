import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { getTargetConnectionConfig, getTargetDatabaseName } from './dbAdmin.ts';

function resolveMigrationsFolder(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return resolve(currentDir, '../../drizzle');
}

async function ensureLegacyBaseline(pool: Pool, migrationsFolder: string) {
  const migrations = readMigrationFiles({ migrationsFolder });
  const firstMigration = migrations[0];
  if (!firstMigration) {
    return;
  }

  await pool.query('CREATE SCHEMA IF NOT EXISTS drizzle');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const migrationRows = await pool.query<{ has_rows: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM drizzle.__drizzle_migrations
    ) AS has_rows
  `);

  if (migrationRows.rows[0]?.has_rows) {
    return;
  }

  const legacyTables = [
    'users',
    'games',
    'game_players',
    'game_snapshots',
    'turn_checkpoints',
  ];
  const legacySchemaCheck = await pool.query<{ table_count: number }>(
    `
      SELECT COUNT(*)::int AS table_count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
    `,
    [legacyTables],
  );

  const existingLegacyTableCount = legacySchemaCheck.rows[0]?.table_count ?? 0;
  if (existingLegacyTableCount === 0) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS games (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL DEFAULT 'Game Room',
      host_user_id uuid REFERENCES users(id),
      status text NOT NULL,
      player_count integer NOT NULL,
      current_round integer NOT NULL,
      seed text NOT NULL,
      options jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_players (
      game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seat_index integer NOT NULL,
      color text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (game_id, user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_snapshots (
      id serial PRIMARY KEY,
      game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      version integer NOT NULL,
      state jsonb NOT NULL,
      event jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT game_snapshots_game_id_version_unique UNIQUE (game_id, version)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS turn_checkpoints (
      game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      turn_index integer NOT NULL,
      player_id text NOT NULL,
      round integer NOT NULL,
      state jsonb NOT NULL,
      interacted_player_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (game_id, turn_index)
    );
  `);

  await pool.query(
    `
      INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
      VALUES ($1, $2)
    `,
    [firstMigration.hash, firstMigration.folderMillis],
  );
}

export async function runMigrations(): Promise<string> {
  const targetDatabase = getTargetDatabaseName();
  const pool = new Pool(getTargetConnectionConfig(targetDatabase));
  const db = drizzle(pool);
  const migrationsFolder = resolveMigrationsFolder();

  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await ensureLegacyBaseline(pool, migrationsFolder);
    await migrate(db, { migrationsFolder });
    return targetDatabase;
  } finally {
    await pool.end();
  }
}
