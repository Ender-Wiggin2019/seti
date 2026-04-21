import { ensureDatabaseExists, getTargetDatabaseName } from './lib/dbAdmin.ts';

async function initDatabase(): Promise<void> {
  const targetDatabase = getTargetDatabaseName();
  await ensureDatabaseExists(targetDatabase);
  console.log(`[db:init] Ready: ${targetDatabase}`);
}

void initDatabase().catch((error: unknown) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
