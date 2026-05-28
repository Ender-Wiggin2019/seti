import type { THotspotOverrides } from '@/features/hotspots/hotspotConfig';

const HOTSPOT_OVERRIDES_FILE = '/hotspot-overrides.json';
const HOTSPOT_OVERRIDES_WRITE_ENDPOINT = '/__debug/hotspot-overrides';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseHotspotOverrides(value: unknown): THotspotOverrides {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([, sceneOverrides]) =>
      isObject(sceneOverrides),
    ),
  ) as THotspotOverrides;
}

export async function loadHotspotOverridesFile(): Promise<THotspotOverrides> {
  const response = await fetch(`${HOTSPOT_OVERRIDES_FILE}?t=${Date.now()}`, {
    cache: 'no-store',
  });
  if (response.status === 404) return {};
  if (!response.ok) {
    throw new Error(`Failed to load hotspot overrides: ${response.status}`);
  }
  return parseHotspotOverrides(await response.json());
}

export async function saveHotspotOverridesFile(
  overrides: THotspotOverrides,
): Promise<void> {
  const response = await fetch(HOTSPOT_OVERRIDES_WRITE_ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrides, null, 2),
  });
  if (!response.ok) {
    throw new Error(`Failed to save hotspot overrides: ${response.status}`);
  }
}
