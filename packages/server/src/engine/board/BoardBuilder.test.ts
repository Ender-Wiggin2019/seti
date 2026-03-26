import { EPlanet } from '@seti/common/types/protocol/enums';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { BoardBuilder } from './BoardBuilder.js';
import {
  SOLAR_SYSTEM_CUTOUT_SPACE_IDS,
  SOLAR_SYSTEM_PLANET_SPACE_IDS,
  SOLAR_SYSTEM_PUBLICITY_SPACE_IDS,
} from './SolarSystemConfig.js';

function snapshotLayout(seed: string): {
  elements: string[];
  publicity: string[];
  stars: string[];
} {
  const board = BoardBuilder.buildSolarSystem(new SeededRandom(seed));
  return {
    elements: board.spaces.map(
      (space) =>
        `${space.id}:${space.elements
          .map(
            (element) =>
              `${element.type}:${element.planet ?? ''}:${element.amount}`,
          )
          .join(',')}`,
    ),
    publicity: board.spaces
      .filter((space) => space.hasPublicityIcon)
      .map((space) => space.id)
      .sort(),
    stars: [...board.sectorNearStars],
  };
}

describe('BoardBuilder', () => {
  it('generates deterministic layout for the same seed', () => {
    const first = snapshotLayout('same-seed');
    const second = snapshotLayout('same-seed');

    expect(first).toEqual(second);
  });

  it('generates exactly 8 sectors with one nearby star each', () => {
    const board = BoardBuilder.buildSolarSystem(
      new SeededRandom('sector-test'),
    );

    expect(board.sectorNearStars).toHaveLength(8);
    expect(new Set(board.sectorNearStars).size).toBe(8);
  });

  it('generates different layouts for different seeds', () => {
    const first = snapshotLayout('seed-a');
    const second = snapshotLayout('seed-b');

    expect(first).not.toEqual(second);
  });

  it('uses real board constants for planets, cutouts, and publicity', () => {
    const board = BoardBuilder.buildSolarSystem(
      new SeededRandom('real-config'),
    );

    expect(board.getSpacesOnPlanet(EPlanet.EARTH)[0]?.id).toBe(
      SOLAR_SYSTEM_PLANET_SPACE_IDS[EPlanet.EARTH],
    );
    expect(board.getSpacesOnPlanet(EPlanet.MERCURY)[0]?.id).toBe(
      SOLAR_SYSTEM_PLANET_SPACE_IDS[EPlanet.MERCURY],
    );
    expect(board.getSpacesOnPlanet(EPlanet.MARS)[0]?.id).toBe(
      SOLAR_SYSTEM_PLANET_SPACE_IDS[EPlanet.MARS],
    );
    expect(board.getSpacesOnPlanet(EPlanet.JUPITER)[0]?.id).toBe(
      SOLAR_SYSTEM_PLANET_SPACE_IDS[EPlanet.JUPITER],
    );
    expect(board.getSpacesOnPlanet(EPlanet.NEPTUNE)[0]?.id).toBe(
      SOLAR_SYSTEM_PLANET_SPACE_IDS[EPlanet.NEPTUNE],
    );

    expect(SOLAR_SYSTEM_CUTOUT_SPACE_IDS.length).toBeGreaterThan(0);
    expect(SOLAR_SYSTEM_PUBLICITY_SPACE_IDS.length).toBeGreaterThan(0);
  });
});
