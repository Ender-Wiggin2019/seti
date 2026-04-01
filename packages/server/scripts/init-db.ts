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

    return {
      connectionString: url.toString(),
    };
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

async function initDatabase(): Promise<void> {
  const targetDatabase = getTargetDatabaseName();

  if (targetDatabase === DEFAULT_ADMIN_DATABASE) {
    console.log(
      `Target database is "${DEFAULT_ADMIN_DATABASE}", skip creation.`,
    );
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
      console.log(`Database "${targetDatabase}" already exists.`);
      return;
    }

    const escapedDatabaseName = escapeIdentifier(targetDatabase);
    await adminClient.query(`CREATE DATABASE "${escapedDatabaseName}"`);
    console.log(`Database "${targetDatabase}" created.`);
  } finally {
    await adminClient.end();
  }
}

void initDatabase().catch((error: unknown) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
