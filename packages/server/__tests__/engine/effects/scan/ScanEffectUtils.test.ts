import {
  createDefaultSetupConfig,
  EStarName,
} from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { SolarSystem } from '@/engine/board/SolarSystem.js';
import {
  SOLAR_SYSTEM_CELL_CONFIGS,
  SOLAR_SYSTEM_NEAR_STAR_POOL,
} from '@/engine/board/SolarSystemConfig.js';
import {
  extractSectorColorFromCardItem,
  findAllSectorsByColor,
  findSectorByColor,
  findSectorById,
  findSectorIdByStarName,
  getAllSectors,
  getSectorAt,
  getSectorIndexByPlanet,
} from '@/engine/effects/scan/ScanEffectUtils.js';

describe('ScanEffectUtils', () => {
  it('gets sector by index and color', () => {
    const sectors = [
      { id: 's0', color: ESector.BLUE, markSignal: () => ({}) },
      { id: 's1', color: ESector.RED, markSignal: () => ({}) },
    ];
    const game = { sectors };

    expect(getSectorAt(game as never, 1)?.id).toBe('s1');
    expect(findSectorByColor(game as never, ESector.BLUE)?.id).toBe('s0');
    expect(getAllSectors(game as never)).toHaveLength(2);
  });

  it('extracts sector color from card-like object', () => {
    expect(extractSectorColorFromCardItem({ sector: ESector.YELLOW })).toBe(
      ESector.YELLOW,
    );
    expect(extractSectorColorFromCardItem('c1')).toBeNull();
  });

  describe('findSectorById', () => {
    it('returns the sector matching the given ID', () => {
      const sectors = [
        { id: 's0', color: ESector.RED, markSignal: () => ({}) },
        { id: 's1', color: ESector.BLUE, markSignal: () => ({}) },
      ];
      const game = { sectors };

      expect(findSectorById(game as never, 's1')?.id).toBe('s1');
    });

    it('returns null when no sector matches', () => {
      const game = { sectors: [{ id: 's0', markSignal: () => ({}) }] };
      expect(findSectorById(game as never, 'nonexistent')).toBeNull();
    });
  });

  describe('findAllSectorsByColor', () => {
    it('returns all sectors of a given color', () => {
      const sectors = [
        { id: 's0', color: ESector.RED, markSignal: () => ({}) },
        { id: 's1', color: ESector.BLUE, markSignal: () => ({}) },
        { id: 's2', color: ESector.RED, markSignal: () => ({}) },
      ];
      const game = { sectors };

      const reds = findAllSectorsByColor(game as never, ESector.RED);
      expect(reds).toHaveLength(2);
      expect(reds.map((s) => s.id)).toEqual(['s0', 's2']);
    });

    it('returns empty array when no sector matches', () => {
      const game = {
        sectors: [{ id: 's0', color: ESector.BLUE, markSignal: () => ({}) }],
      };
      expect(findAllSectorsByColor(game as never, ESector.YELLOW)).toHaveLength(
        0,
      );
    });
  });

  describe('findSectorIdByStarName', () => {
    it('resolves star name to sector ID from default setup', () => {
      const setup = createDefaultSetupConfig();

      expect(findSectorIdByStarName(setup, EStarName.PROCYON)).toBe('sector-0');
      expect(findSectorIdByStarName(setup, EStarName.VEGA)).toBe('sector-1');
      expect(findSectorIdByStarName(setup, EStarName.PROXIMA_CENTAURI)).toBe(
        'sector-5',
      );
    });

    it('returns undefined for null setup', () => {
      expect(findSectorIdByStarName(null, EStarName.VEGA)).toBeUndefined();
    });
  });

  describe('getSectorIndexByPlanet', () => {
    function createSolarSystem(): SolarSystem {
      const spaces = SOLAR_SYSTEM_CELL_CONFIGS.map((cell) => ({
        ...cell,
        elements: cell.elements.map((e) => ({ ...e })),
        occupants: [],
      }));
      return new SolarSystem(spaces, [...SOLAR_SYSTEM_NEAR_STAR_POOL]);
    }

    it('resolves initial planet positions to correct wedge indices', () => {
      const ss = createSolarSystem();

      expect(getSectorIndexByPlanet(ss, EPlanet.EARTH)).toBe(3);
      expect(getSectorIndexByPlanet(ss, EPlanet.MERCURY)).toBe(7);
      expect(getSectorIndexByPlanet(ss, EPlanet.VENUS)).toBe(1);
      expect(getSectorIndexByPlanet(ss, EPlanet.MARS)).toBe(6);
      expect(getSectorIndexByPlanet(ss, EPlanet.JUPITER)).toBe(5);
      expect(getSectorIndexByPlanet(ss, EPlanet.SATURN)).toBe(1);
      expect(getSectorIndexByPlanet(ss, EPlanet.NEPTUNE)).toBe(2);
      expect(getSectorIndexByPlanet(ss, EPlanet.URANUS)).toBe(7);
    });

    it('updates after disc rotation', () => {
      const ss = createSolarSystem();

      expect(getSectorIndexByPlanet(ss, EPlanet.EARTH)).toBe(3);
      ss.rotate(0);
      expect(getSectorIndexByPlanet(ss, EPlanet.EARTH)).toBe(2);
    });
  });
});
