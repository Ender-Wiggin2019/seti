import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export default function globalSetup(): void {
  if (process.env.SKIP_E2E_DB_PREPARE === '1') {
    return;
  }

  const rootDir = resolve(process.cwd(), '../..');
  execFileSync('pnpm', ['--filter', '@seti/server', 'db:prepare:e2e'], {
    cwd: rootDir,
    stdio: 'inherit',
  });
}
