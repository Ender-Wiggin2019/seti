import { ensureDatabaseExists, getTargetDatabaseName } from './lib/dbAdmin';
import { runMigrations } from './lib/migrateDatabase';
import { resetTargetE2eDatabase } from './lib/resetE2eDatabase';

async function main(): Promise<void> {
  const targetDatabase = getTargetDatabaseName();
  await ensureDatabaseExists(targetDatabase);
  await runMigrations();
  await resetTargetE2eDatabase();
  // biome-ignore lint/suspicious/noConsole: E2E bootstrap should emit readiness for troubleshooting.
  console.log(`[db:prepare:e2e] Ready and reset: ${targetDatabase}`);
}

void main().catch((error: unknown) => {
  // biome-ignore lint/suspicious/noConsole: bootstrap failures must be visible in CI/local logs.
  console.error('Failed to prepare e2e database:', error);
  process.exit(1);
});
