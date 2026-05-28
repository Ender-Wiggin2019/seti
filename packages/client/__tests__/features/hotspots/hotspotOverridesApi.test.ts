import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSolarHotspotSpaceId,
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
        'ring-1-cell-0': { x: 120, y: 88, width: 32, height: 32 },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/hotspot-overrides\.json\?t=/),
      { cache: 'no-store' },
    );
  });

  it('maps legacy solar debug space ids to real game space ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        'solar-system:image': {
          'space-8': { x: 200, y: 180, width: 30, height: 30 },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadHotspotOverridesFile()).resolves.toEqual({
      'solar-system:image': {
        'space-8': { x: 200, y: 180, width: 30, height: 30 },
        'ring-2-cell-0': { x: 200, y: 180, width: 30, height: 30 },
      },
    });
  });

  it('creates real game solar hotspot ids from the debug index order', () => {
    expect(createSolarHotspotSpaceId(0)).toBe('ring-1-cell-0');
    expect(createSolarHotspotSpaceId(8)).toBe('ring-2-cell-0');
    expect(createSolarHotspotSpaceId(31)).toBe('ring-4-cell-28');
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
