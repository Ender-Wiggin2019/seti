import { createDefaultSolarSystemWheels } from '@seti/common/constant/sectorSetup';
import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  SOLAR_SYSTEM_CELL_CONFIGS,
  SOLAR_SYSTEM_CUTOUT_SPACE_IDS,
  SOLAR_SYSTEM_PLANET_SPACE_IDS,
  SOLAR_SYSTEM_PUBLICITY_SPACE_IDS,
} from '@/engine/board/SolarSystemConfig.js';

describe('SolarSystemConfig', () => {
  it('builds expected cell count and planet anchors', () => {
    expect(SOLAR_SYSTEM_CELL_CONFIGS).toHaveLength(80);
    expect(SOLAR_SYSTEM_PLANET_SPACE_IDS[EPlanet.EARTH]).toBeDefined();
    expect(SOLAR_SYSTEM_PLANET_SPACE_IDS[EPlanet.MARS]).toBeDefined();
  });

  it('exposes cutout/publicity positions', () => {
    expect(SOLAR_SYSTEM_CUTOUT_SPACE_IDS.length).toBeGreaterThan(0);
    expect(SOLAR_SYSTEM_PUBLICITY_SPACE_IDS.length).toBeGreaterThan(0);
  });

  it('derives visible planet anchors from the shared debug solar wheels', () => {
    const wheels = createDefaultSolarSystemWheels();

    for (const ringIndex of [1, 2, 3, 4] as const) {
      const visibleBandIndex = ringIndex - 1;
      const visibleBand = wheels[ringIndex][visibleBandIndex];

      for (let slotIndex = 0; slotIndex < visibleBand.length; slotIndex += 1) {
        const planet = visibleBand[slotIndex].cell.planet;
        if (!planet) {
          continue;
        }

        expect(SOLAR_SYSTEM_PLANET_SPACE_IDS[planet]).toBe(
          `ring-${ringIndex}-cell-${slotIndex * ringIndex}`,
        );
      }
    }
  });
});
