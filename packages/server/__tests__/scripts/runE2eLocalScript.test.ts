import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const script = readFileSync(
  new URL('../../../../scripts/run-e2e-local.sh', import.meta.url),
  'utf8',
);
const initScript = readFileSync(
  new URL('../../../../scripts/init-e2e-local.sh', import.meta.url),
  'utf8',
);

describe('run-e2e-local.sh', () => {
  it('uses isolated default ports for the local e2e harness', () => {
    expect(script).toContain(
      'SERVER_URL="${SERVER_URL:-http://127.0.0.1:3100}"',
    );
    expect(script).toContain(
      'CLIENT_URL="${CLIENT_URL:-http://127.0.0.1:5177}"',
    );
    expect(script).toContain('WS_URL="${WS_URL:-http://127.0.0.1:3100}"');
  });

  it('fails instead of silently switching or reusing occupied local ports', () => {
    expect(script).toContain('--strictPort');
    expect(script).toContain('server process exited before becoming ready');
    expect(script).toContain('client process exited before becoming ready');
  });

  it('does not let an ambient DATABASE_URL override the isolated e2e database', () => {
    expect(script).toContain('E2E_DATABASE_URL="${E2E_DATABASE_URL:-}"');
    expect(script).toContain('assert_e2e_database_env');
    expect(script).toContain('unset DATABASE_URL');
    expect(script).toContain('DATABASE_URL="${E2E_DATABASE_URL}"');
    expect(initScript).toContain('E2E_DATABASE_URL="${E2E_DATABASE_URL:-}"');
    expect(initScript).toContain('assert_e2e_database_env');
    expect(initScript).toContain('unset DATABASE_URL');
    expect(initScript).toContain('DATABASE_URL="${E2E_DATABASE_URL}"');
  });
});
