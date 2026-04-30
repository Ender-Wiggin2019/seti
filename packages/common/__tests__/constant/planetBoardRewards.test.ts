import { PLANET_MISSION_CONFIG } from '@seti/common/constant/boardLayout';
import { EResource, ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { describe, expect, it } from 'vitest';

type TConfiguredPlanet = keyof typeof PLANET_MISSION_CONFIG;

const CONFIGURED_PLANETS: TConfiguredPlanet[] = [
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
];

const MOCK_OUTER_PLANETS: TConfiguredPlanet[] = [
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
];

describe('planet board reward config', () => {
  it('keeps first-orbit VP as an explicit per-planet reward', () => {
    for (const planet of CONFIGURED_PLANETS) {
      expect(PLANET_MISSION_CONFIG[planet].orbit.firstRewards).toEqual([
        { type: 'resource', resource: EResource.SCORE, amount: 3 },
      ]);
    }
  });

  it('configures Mercury, Venus, Mars, and mock outer-planet rewards', () => {
    expect(PLANET_MISSION_CONFIG[EPlanet.MERCURY].orbit.rewards).toEqual([
      { type: 'signal', target: 'planet-sector', amount: 2 },
      { type: 'card', source: 'random', amount: 1 },
      { type: 'tuck', amount: 1 },
    ]);
    expect(PLANET_MISSION_CONFIG[EPlanet.MERCURY].land.rewards).toEqual([
      { type: 'resource', resource: EResource.SCORE, amount: 12 },
      { type: 'trace', trace: ETrace.YELLOW, amount: 1 },
    ]);
    expect(PLANET_MISSION_CONFIG[EPlanet.MERCURY].land.firstData).toEqual([3]);

    expect(PLANET_MISSION_CONFIG[EPlanet.VENUS].orbit.rewards).toEqual([
      { type: 'resource', resource: EResource.SCORE, amount: 6 },
      { type: 'tuck', amount: 1 },
    ]);
    expect(PLANET_MISSION_CONFIG[EPlanet.VENUS].land.firstData).toEqual([2]);

    expect(PLANET_MISSION_CONFIG[EPlanet.MARS].orbit.rewards).toEqual([
      { type: 'signal', target: 'planet-sector', amount: 1 },
      { type: 'card', source: 'any', amount: 1 },
      { type: 'tuck', amount: 1 },
    ]);
    expect(PLANET_MISSION_CONFIG[EPlanet.MARS].land.firstData).toEqual([2, 1]);

    for (const planet of MOCK_OUTER_PLANETS) {
      expect(PLANET_MISSION_CONFIG[planet].orbit.rewards).toEqual([
        { type: 'resource', resource: EResource.SCORE, amount: 6 },
        { type: 'tuck', amount: 1 },
      ]);
      expect(PLANET_MISSION_CONFIG[planet].land.rewards).toEqual([
        { type: 'resource', resource: EResource.SCORE, amount: 5 },
        { type: 'trace', trace: ETrace.YELLOW, amount: 1 },
      ]);
      expect(PLANET_MISSION_CONFIG[planet].land.firstData).toEqual([2]);
    }
  });
});
