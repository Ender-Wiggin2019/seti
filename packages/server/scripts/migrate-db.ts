import { runMigrations } from './lib/migrateDatabase.ts';

async function main(): Promise<void> {
  const targetDatabase = await runMigrations();
  console.log(`[db:migrate] Ready: ${targetDatabase}`);
}

void main().catch((error: unknown) => {
  console.error('Failed to run database migrations:', error);
  process.exit(1);
});
