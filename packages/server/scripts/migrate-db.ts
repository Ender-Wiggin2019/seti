import { runMigrations } from './lib/migrateDatabase';

async function main(): Promise<void> {
  const targetDatabase = await runMigrations();
  // biome-ignore lint/suspicious/noConsole: database bootstrap should emit readiness for troubleshooting.
  console.log(`[db:migrate] Ready: ${targetDatabase}`);
}

void main().catch((error: unknown) => {
  // biome-ignore lint/suspicious/noConsole: bootstrap failures must be visible in CI/local logs.
  console.error('Failed to run database migrations:', error);
  process.exit(1);
});
