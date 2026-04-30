import { ensureDatabaseExists, getTargetDatabaseName } from './lib/dbAdmin';

async function initDatabase(): Promise<void> {
  const targetDatabase = getTargetDatabaseName();
  await ensureDatabaseExists(targetDatabase);
  // biome-ignore lint/suspicious/noConsole: database bootstrap should emit readiness for troubleshooting.
  console.log(`[db:init] Ready: ${targetDatabase}`);
}

void initDatabase().catch((error: unknown) => {
  // biome-ignore lint/suspicious/noConsole: bootstrap failures must be visible in CI/local logs.
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
