import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { assertPlayerStateSchemaReady } from '../../src/persistence/schemaReadiness.js';
import { getTargetConnectionConfig, getTargetDatabaseName } from './dbAdmin.js';

function resolveMigrationsFolder(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return resolve(currentDir, '../../drizzle');
}

export async function runMigrations(): Promise<string> {
  const targetDatabase = getTargetDatabaseName();
  const pool = new Pool(getTargetConnectionConfig(targetDatabase));
  const db = drizzle(pool);
  const migrationsFolder = resolveMigrationsFolder();

  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await migrate(db, { migrationsFolder });
    await assertPlayerStateSchemaReady(pool);
    return targetDatabase;
  } finally {
    await pool.end();
  }
}
