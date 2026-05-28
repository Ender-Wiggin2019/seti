import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadHotspotOverridesFile,
  saveHotspotOverridesFile,
} from '@/features/hotspots/hotspotOverridesApi';

describe('hotspotOverridesApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads hotspot overrides from the shared JSON file', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        'solar-system:image': {
          'space-0': { x: 120, y: 88, width: 32, height: 32 },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadHotspotOverridesFile()).resolves.toEqual({
      'solar-system:image': {
        'space-0': { x: 120, y: 88, width: 32, height: 32 },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/hotspot-overrides\.json\?t=/),
      { cache: 'no-store' },
    );
  });

  it('writes hotspot overrides back through the dev file endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await saveHotspotOverridesFile({
      'solar-system:image': {
        'space-0': { x: 120, y: 88, width: 32, height: 32 },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('/__debug/hotspot-overrides', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        {
          'solar-system:image': {
            'space-0': { x: 120, y: 88, width: 32, height: 32 },
          },
        },
        null,
        2,
      ),
    });
  });
});
