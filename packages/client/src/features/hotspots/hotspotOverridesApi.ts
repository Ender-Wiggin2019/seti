import type { THotspotOverrides } from '@/features/hotspots/hotspotConfig';

const HOTSPOT_OVERRIDES_FILE = '/hotspot-overrides.json';
const HOTSPOT_OVERRIDES_WRITE_ENDPOINT = '/__debug/hotspot-overrides';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseHotspotOverrides(value: unknown): THotspotOverrides {
  if (!isObject(value)) return {};

  return migrateLegacySolarSpaceOverrides(
    Object.fromEntries(
      Object.entries(value).filter(([, sceneOverrides]) =>
        isObject(sceneOverrides),
      ),
    ) as THotspotOverrides,
  );
}

function solarSpaceIdFromLegacyIndex(index: number): string | null {
  if (!Number.isInteger(index) || index < 0 || index >= 32) return null;
  const ringIndex = Math.floor(index / 8) + 1;
  const sectorIndex = index % 8;
  return `ring-${ringIndex}-cell-${sectorIndex * ringIndex}`;
}

function migrateLegacySolarSpaceOverrides(
  overrides: THotspotOverrides,
): THotspotOverrides {
  const nextOverrides: THotspotOverrides = { ...overrides };

  for (const [sceneId, sceneOverrides] of Object.entries(overrides).filter(
    ([sceneId, sceneOverrides]) =>
      (sceneId === 'solar-system' || sceneId.startsWith('solar-system:')) &&
      isObject(sceneOverrides),
  )) {
    const targetSceneIds =
      sceneId === 'solar-system'
        ? ['solar-system', 'solar-system:image']
        : [sceneId];

    for (const targetSceneId of targetSceneIds) {
      nextOverrides[targetSceneId] = {
        ...(nextOverrides[targetSceneId] ?? {}),
      };
      for (const [hotspotId, override] of Object.entries(sceneOverrides)) {
        const match = /^space-(\d+)$/.exec(hotspotId);
        if (!match) continue;
        const realSpaceId = solarSpaceIdFromLegacyIndex(Number(match[1]));
        if (!realSpaceId || nextOverrides[targetSceneId][realSpaceId]) continue;
        nextOverrides[targetSceneId][realSpaceId] = override;
      }
    }
  }

  return nextOverrides;
}

export function createSolarHotspotSpaceId(index: number): string {
  const spaceId = solarSpaceIdFromLegacyIndex(index);
  if (!spaceId) {
    throw new Error(`Invalid solar hotspot space index: ${index}`);
  }
  return spaceId;
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
