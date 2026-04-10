import { Client, type ClientConfig } from 'pg';

const DEFAULT_ADMIN_DATABASE = 'postgres';

function escapeIdentifier(identifier: string): string {
  return identifier.replaceAll('"', '""');
}

function getTargetDatabaseName(): string {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const pathname = url.pathname.replace(/^\/+/, '');
      if (pathname) {
        return decodeURIComponent(pathname);
      }
    } catch {
      throw new Error('Invalid DATABASE_URL format.');
    }
  }

  return (
    process.env.PGDATABASE ??
    process.env.PGUSER ??
    process.env.USER ??
    process.env.USERNAME ??
    DEFAULT_ADMIN_DATABASE
  );
}

function getAdminConnectionConfig(): ClientConfig {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    url.pathname = `/${DEFAULT_ADMIN_DATABASE}`;
    return { connectionString: url.toString() };
  }

  return {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: DEFAULT_ADMIN_DATABASE,
    ssl:
      process.env.PGSSLMODE === 'require'
        ? { rejectUnauthorized: false }
        : undefined,
  };
}

function getTargetConnectionConfig(targetDatabase: string): ClientConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }

  return {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: targetDatabase,
    ssl:
      process.env.PGSSLMODE === 'require'
        ? { rejectUnauthorized: false }
        : undefined,
  };
}

async function ensureDatabaseExists(targetDatabase: string): Promise<void> {
  if (targetDatabase === DEFAULT_ADMIN_DATABASE) {
    return;
  }

  const adminClient = new Client(getAdminConnectionConfig());
  await adminClient.connect();

  try {
    const existingDbResult = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDatabase],
    );

    if (existingDbResult.rowCount && existingDbResult.rowCount > 0) {
      return;
    }

    const escapedDatabaseName = escapeIdentifier(targetDatabase);
    await adminClient.query(`CREATE DATABASE "${escapedDatabaseName}"`);
  } finally {
    await adminClient.end();
  }
}

async function ensureSchema(targetDatabase: string): Promise<void> {
  const client = new Client(getTargetConnectionConfig(targetDatabase));
  await client.connect();

  try {
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: E2E bootstrap should log optional extension setup failures.
      console.warn('[db:prepare:e2e] Skip pgcrypto extension:', error);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS game_players (
        game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seat_index integer NOT NULL,
        color text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (game_id, user_id)
      );
    `);

    await client.query(`
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
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const targetDatabase = getTargetDatabaseName();
  await ensureDatabaseExists(targetDatabase);
  await ensureSchema(targetDatabase);
  // biome-ignore lint/suspicious/noConsole: E2E bootstrap should emit readiness for troubleshooting.
  console.log(`[db:prepare:e2e] Ready: ${targetDatabase}`);
}

void main().catch((error: unknown) => {
  // biome-ignore lint/suspicious/noConsole: bootstrap failures must be visible in CI/local logs.
  console.error('Failed to prepare e2e database:', error);
  process.exit(1);
});
