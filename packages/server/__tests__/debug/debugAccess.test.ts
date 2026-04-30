import { isDebugApiEnabled } from '@/debug/debugAccess.js';

describe('debug access boundary', () => {
  it('enables debug API outside production by default', () => {
    expect(isDebugApiEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(isDebugApiEnabled({ NODE_ENV: 'test' })).toBe(true);
  });

  it('disables debug API in production unless explicitly enabled', () => {
    expect(isDebugApiEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(
      isDebugApiEnabled({
        NODE_ENV: 'production',
        SETI_ENABLE_DEBUG_API: 'true',
      }),
    ).toBe(true);
  });
});
