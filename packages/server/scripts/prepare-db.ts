import { ensureDatabaseExists, getTargetDatabaseName } from './lib/dbAdmin.ts';
import { runMigrations } from './lib/migrateDatabase.ts';

async function main(): Promise<void> {
  const targetDatabase = getTargetDatabaseName();
  await ensureDatabaseExists(targetDatabase);
  await runMigrations();
  console.log(`[db:prepare] Ready: ${targetDatabase}`);
}

void main().catch((error: unknown) => {
  console.error('Failed to prepare database:', error);
  process.exit(1);
});
