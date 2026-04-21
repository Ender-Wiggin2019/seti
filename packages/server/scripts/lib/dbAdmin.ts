import { Client, type ClientConfig } from 'pg';

const DEFAULT_ADMIN_DATABASE = 'postgres';

function parseSslModeFromEnv(): ClientConfig['ssl'] {
  return process.env.PGSSLMODE === 'require'
    ? { rejectUnauthorized: false }
    : undefined;
}

export function getTargetDatabaseName(): string {
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

function escapeIdentifier(identifier: string): string {
  return identifier.replaceAll('"', '""');
}

function buildBaseConnectionConfig(database: string): ClientConfig {
  return {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database,
    ssl: parseSslModeFromEnv(),
  };
}

export function getAdminConnectionConfig(): ClientConfig {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    url.pathname = `/${DEFAULT_ADMIN_DATABASE}`;
    return { connectionString: url.toString() };
  }

  return buildBaseConnectionConfig(DEFAULT_ADMIN_DATABASE);
}

export function getTargetConnectionConfig(
  targetDatabase: string,
): ClientConfig {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  return buildBaseConnectionConfig(targetDatabase);
}

export async function ensureDatabaseExists(
  targetDatabase: string,
): Promise<void> {
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
