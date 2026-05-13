import { PLANETARY_BOARD_CONFIG } from '@seti/common/constant/boardLayout';
import { EResource, ESector, ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { describe, expect, it } from 'vitest';

type TConfiguredPlanet = keyof typeof PLANETARY_BOARD_CONFIG;

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
      expect(PLANETARY_BOARD_CONFIG[planet].orbit.firstRewards).toEqual([
        { type: 'resource', resource: EResource.SCORE, amount: 3 },
      ]);
    }
  });

  it('configures Mercury, Venus, Mars, and mock outer-planet rewards', () => {
    expect(PLANETARY_BOARD_CONFIG[EPlanet.MERCURY].orbit.rewards).toEqual([
      { type: 'signal', target: 'planet-sector', amount: 2 },
      { type: 'card', source: 'random', amount: 1 },
      { type: 'tuck', amount: 1 },
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.MERCURY].land.rewards).toEqual([
      { type: 'resource', resource: EResource.SCORE, amount: 12 },
      { type: 'trace', trace: ETrace.YELLOW, amount: 1 },
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.MERCURY].land.firstData).toEqual([3]);

    expect(PLANETARY_BOARD_CONFIG[EPlanet.VENUS].orbit.rewards).toEqual([
      { type: 'resource', resource: EResource.SCORE, amount: 6 },
      { type: 'tuck', amount: 1 },
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.VENUS].land.firstData).toEqual([2]);

    expect(PLANETARY_BOARD_CONFIG[EPlanet.MARS].orbit.rewards).toEqual([
      { type: 'signal', target: 'planet-sector', amount: 1 },
      { type: 'card', source: 'any', amount: 1 },
      { type: 'tuck', amount: 1 },
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.MARS].land.firstData).toEqual([2, 1]);

    for (const planet of MOCK_OUTER_PLANETS) {
      expect(PLANETARY_BOARD_CONFIG[planet].orbit.rewards).toEqual([
        { type: 'resource', resource: EResource.SCORE, amount: 6 },
        { type: 'tuck', amount: 1 },
      ]);
      expect(PLANETARY_BOARD_CONFIG[planet].land.rewards).toEqual([
        { type: 'resource', resource: EResource.SCORE, amount: 5 },
        { type: 'trace', trace: ETrace.YELLOW, amount: 1 },
      ]);
      expect(PLANETARY_BOARD_CONFIG[planet].land.firstData).toEqual([2]);
    }
  });

  it('configures stable moon ids, names, and land bonuses in landing-slot order', () => {
    expect(PLANETARY_BOARD_CONFIG[EPlanet.MARS].moonIds).toEqual([
      'mars-phobos-deimos',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.MARS].moonNames).toEqual([
      'Phobos & Deimos',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.MARS].land.moonRewards).toEqual([
      [
        { type: 'resource', resource: EResource.SCORE, amount: 8 },
        { type: 'tuck', amount: 2 },
      ],
    ]);

    expect(PLANETARY_BOARD_CONFIG[EPlanet.JUPITER].moonIds).toEqual([
      'jupiter-ganymede',
      'jupiter-europa',
      'jupiter-callisto',
      'jupiter-io',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.JUPITER].moonNames).toEqual([
      'Ganymede',
      'Europa',
      'Callisto',
      'Io',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.JUPITER].land.moonRewards).toEqual([
      [
        { type: 'resource', resource: EResource.SCORE, amount: 12 },
        { type: 'resource', resource: EResource.PUBLICITY, amount: 5 },
      ],
      [
        { type: 'resource', resource: EResource.SCORE, amount: 7 },
        { type: 'trace', trace: ETrace.YELLOW, amount: 2 },
      ],
      [
        { type: 'resource', resource: EResource.SCORE, amount: 10 },
        { type: 'resource', resource: EResource.ENERGY, amount: 4 },
      ],
      [
        { type: 'resource', resource: EResource.SCORE, amount: 13 },
        { type: 'resource', resource: EResource.DATA, amount: 4 },
      ],
    ]);

    expect(PLANETARY_BOARD_CONFIG[EPlanet.SATURN].moonIds).toEqual([
      'saturn-enceladus',
      'saturn-titan',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.SATURN].moonNames).toEqual([
      'Enceladus',
      'Titan',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.SATURN].land.moonRewards).toEqual([
      [
        { type: 'resource', resource: EResource.SCORE, amount: 12 },
        { type: 'signal', sector: ESector.RED, amount: 1 },
        { type: 'signal', sector: ESector.YELLOW, amount: 1 },
        { type: 'signal', sector: ESector.BLUE, amount: 1 },
      ],
      [
        { type: 'resource', resource: EResource.SCORE, amount: 7 },
        { type: 'trace', trace: ETrace.ANY, amount: 2 },
      ],
    ]);

    expect(PLANETARY_BOARD_CONFIG[EPlanet.URANUS].moonIds).toEqual([
      'uranus-titania',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.URANUS].moonNames).toEqual([
      'Titania',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.URANUS].land.moonRewards).toEqual([
      [{ type: 'resource', resource: EResource.SCORE, amount: 25 }],
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.NEPTUNE].moonIds).toEqual([
      'neptune-triton',
    ]);
    expect(PLANETARY_BOARD_CONFIG[EPlanet.NEPTUNE].land.moonRewards).toEqual([
      [{ type: 'resource', resource: EResource.SCORE, amount: 26 }],
    ]);
  });

  it('keeps moon ids aligned with names, rewards, and landing slots', () => {
    const allMoonIds = new Set<string>();

    for (const planet of CONFIGURED_PLANETS) {
      const config = PLANETARY_BOARD_CONFIG[planet];
      expect(config.moonIds).toHaveLength(config.moonSlots);
      expect(config.moonNames).toHaveLength(config.moonSlots);
      expect(config.land.moonRewards).toHaveLength(config.moonSlots);
      expect(
        config.landingSlotKinds.filter((kind) => kind === 'moon'),
      ).toHaveLength(config.moonSlots);
      for (const moonId of config.moonIds) {
        expect(allMoonIds.has(moonId)).toBe(false);
        allMoonIds.add(moonId);
      }
    }
  });
});
