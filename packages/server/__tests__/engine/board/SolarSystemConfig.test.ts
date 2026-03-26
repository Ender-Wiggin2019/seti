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
});
