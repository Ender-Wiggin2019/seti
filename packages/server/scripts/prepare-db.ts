import { ensureDatabaseExists, getTargetDatabaseName } from './lib/dbAdmin';
import { runMigrations } from './lib/migrateDatabase';

async function main(): Promise<void> {
  const targetDatabase = getTargetDatabaseName();
  await ensureDatabaseExists(targetDatabase);
  await runMigrations();
  // biome-ignore lint/suspicious/noConsole: database bootstrap should emit readiness for troubleshooting.
  console.log(`[db:prepare] Ready: ${targetDatabase}`);
}

void main().catch((error: unknown) => {
  // biome-ignore lint/suspicious/noConsole: bootstrap failures must be visible in CI/local logs.
  console.error('Failed to prepare database:', error);
  process.exit(1);
});
