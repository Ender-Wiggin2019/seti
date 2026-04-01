import {
  createDefaultSetupConfig,
  EStarName,
} from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { Sector } from '@/engine/board/Sector.js';
import { SolarSystem } from '@/engine/board/SolarSystem.js';
import {
  SOLAR_SYSTEM_CELL_CONFIGS,
  SOLAR_SYSTEM_NEAR_STAR_POOL,
} from '@/engine/board/SolarSystemConfig.js';
import {
  type IMarkSectorSignalResult,
  MarkSectorSignalEffect,
} from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

function createMarkCompleteSpy() {
  return vi.fn<(result: IMarkSectorSignalResult | null) => undefined>(
    () => undefined,
  );
}

function createMockPlayer(): IPlayer {
  return {
    id: 'p1',
    score: 0,
    resources: { gain: vi.fn() },
  } as unknown as IPlayer;
}

function createMockSector(id: string, color: ESector) {
  return new Sector({ id, color, dataSlotCapacity: 3 });
}

function hasPlayerMarker(sector: Sector, playerId: string): boolean {
  return sector.signals.some(
    (s) => s.type === 'player' && s.playerId === playerId,
  );
}

function createMockGame(sectors: unknown[]): IGame {
  return {
    sectors,
    solarSystemSetup: createDefaultSetupConfig(),
    missionTracker: {
      recordEvent: vi.fn(),
    },
  } as unknown as IGame;
}

function createSolarSystem(): SolarSystem {
  const spaces = SOLAR_SYSTEM_CELL_CONFIGS.map((cell) => ({
    ...cell,
    elements: cell.elements.map((e) => ({ ...e })),
    occupants: [],
  }));
  return new SolarSystem(spaces, [...SOLAR_SYSTEM_NEAR_STAR_POOL]);
}

describe('MarkSectorSignalEffect', () => {
  describe('markOnSector', () => {
    it('marks sector, emits mission event, and applies data reward', () => {
      const player = createMockPlayer();
      const game = createMockGame([]);
      const sector = {
        id: 's1',
        color: ESector.RED,
        completed: false,
        markSignal: vi.fn(() => ({ dataGained: true, vpAwarded: 0 })),
      };

      const result = MarkSectorSignalEffect.markOnSector(player, game, sector);

      expect(result).toEqual({
        sectorId: 's1',
        dataGained: true,
        vpAwarded: 0,
        completed: false,
      });
      expect(game.missionTracker.recordEvent).toHaveBeenCalledWith({
        type: EMissionEventType.SIGNAL_PLACED,
        color: ESector.RED,
      });
      expect(player.resources.gain).toHaveBeenCalledWith({ data: 1 });
    });

    it('does not grant data when dataGained is false', () => {
      const player = createMockPlayer();
      const game = createMockGame([]);
      const sector = {
        id: 's1',
        color: ESector.BLUE,
        completed: false,
        markSignal: vi.fn(() => ({ dataGained: false, vpAwarded: 0 })),
      };

      const result = MarkSectorSignalEffect.markOnSector(player, game, sector);

      expect(result.dataGained).toBe(false);
      expect(player.resources.gain).not.toHaveBeenCalled();
    });

    it('awards VP when position has a reward', () => {
      const player = createMockPlayer();
      const game = createMockGame([]);
      const sector = {
        id: 's1',
        color: ESector.RED,
        completed: false,
        markSignal: vi.fn(() => ({ dataGained: true, vpAwarded: 2 })),
      };

      const result = MarkSectorSignalEffect.markOnSector(player, game, sector);

      expect(result.vpAwarded).toBe(2);
      expect(player.score).toBe(2);
    });
  });

  describe('markById', () => {
    it('finds sector by ID and marks it', () => {
      const player = createMockPlayer();
      const sector = createMockSector('target-sector', ESector.RED);
      const game = createMockGame([
        createMockSector('other', ESector.BLUE),
        sector,
      ]);

      const result = MarkSectorSignalEffect.markById(
        player,
        game,
        'target-sector',
      );

      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('target-sector');
      expect(hasPlayerMarker(sector, 'p1')).toBe(true);
    });

    it('returns null when sector ID is not found', () => {
      const player = createMockPlayer();
      const game = createMockGame([createMockSector('s1', ESector.RED)]);

      const result = MarkSectorSignalEffect.markById(
        player,
        game,
        'nonexistent',
      );

      expect(result).toBeNull();
    });
  });

  describe('markByStarName', () => {
    it('resolves star name to sector and marks it', () => {
      const player = createMockPlayer();
      const sector5 = createMockSector('sector-5', ESector.RED);
      const game = createMockGame([
        createMockSector('sector-0', ESector.BLUE),
        createMockSector('sector-1', ESector.BLACK),
        createMockSector('sector-2', ESector.BLUE),
        createMockSector('sector-3', ESector.RED),
        createMockSector('sector-4', ESector.YELLOW),
        sector5,
        createMockSector('sector-6', ESector.YELLOW),
        createMockSector('sector-7', ESector.BLACK),
      ]);

      const result = MarkSectorSignalEffect.markByStarName(
        player,
        game,
        EStarName.PROXIMA_CENTAURI,
      );

      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('sector-5');
      expect(hasPlayerMarker(sector5, 'p1')).toBe(true);
    });

    it('returns null when setup is missing', () => {
      const player = createMockPlayer();
      const game = { sectors: [], solarSystemSetup: null } as unknown as IGame;

      const result = MarkSectorSignalEffect.markByStarName(
        player,
        game,
        EStarName.VEGA,
      );

      expect(result).toBeNull();
    });
  });

  describe('markByColor', () => {
    it('marks directly when only one sector of that color exists', () => {
      const player = createMockPlayer();
      const redSector = createMockSector('only-red', ESector.RED);
      const game = createMockGame([
        redSector,
        createMockSector('blue', ESector.BLUE),
      ]);
      const onComplete = createMarkCompleteSpy();

      const input = MarkSectorSignalEffect.markByColor(
        player,
        game,
        ESector.RED,
        onComplete,
      );

      expect(input).toBeUndefined();
      expect(onComplete).toHaveBeenCalledOnce();
      expect(onComplete.mock.calls[0][0]!.sectorId).toBe('only-red');
      expect(hasPlayerMarker(redSector, 'p1')).toBe(true);
    });

    it('presents SelectOption when multiple sectors share the color', () => {
      const player = createMockPlayer();
      const red1 = createMockSector('red-1', ESector.RED);
      const red2 = createMockSector('red-2', ESector.RED);
      const game = createMockGame([red1, red2]);

      const input = MarkSectorSignalEffect.markByColor(
        player,
        game,
        ESector.RED,
      );

      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.OPTION);
    });

    it('marks chosen sector when player selects from ambiguous color', () => {
      const player = createMockPlayer();
      const red1 = createMockSector('red-1', ESector.RED);
      const red2 = createMockSector('red-2', ESector.RED);
      const game = createMockGame([red1, red2]);
      const onComplete = createMarkCompleteSpy();

      const input = MarkSectorSignalEffect.markByColor(
        player,
        game,
        ESector.RED,
        onComplete,
      );

      input!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'red-2',
      });

      expect(onComplete).toHaveBeenCalledOnce();
      expect(onComplete.mock.calls[0][0]!.sectorId).toBe('red-2');
      expect(hasPlayerMarker(red2, 'p1')).toBe(true);
      expect(hasPlayerMarker(red1, 'p1')).toBe(false);
    });

    it('calls onComplete with null when no sector of that color exists', () => {
      const player = createMockPlayer();
      const game = createMockGame([createMockSector('blue', ESector.BLUE)]);
      const onComplete = createMarkCompleteSpy();

      MarkSectorSignalEffect.markByColor(player, game, ESector.RED, onComplete);

      expect(onComplete).toHaveBeenCalledWith(null);
    });
  });

  describe('markByPlanet', () => {
    it('marks the sector that Earth currently occupies', () => {
      const player = createMockPlayer();
      const solarSystem = createSolarSystem();
      const sectors = Array.from({ length: 8 }, (_, i) =>
        createMockSector(`sector-${i}`, ESector.RED),
      );
      const game = {
        ...createMockGame(sectors),
        solarSystem,
      } as unknown as IGame;

      const result = MarkSectorSignalEffect.markByPlanet(
        player,
        game,
        EPlanet.EARTH,
      );

      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('sector-3');
    });

    it('marks the sector that Mercury currently occupies', () => {
      const player = createMockPlayer();
      const solarSystem = createSolarSystem();
      const sectors = Array.from({ length: 8 }, (_, i) =>
        createMockSector(`sector-${i}`, ESector.RED),
      );
      const game = {
        ...createMockGame(sectors),
        solarSystem,
      } as unknown as IGame;

      const result = MarkSectorSignalEffect.markByPlanet(
        player,
        game,
        EPlanet.MERCURY,
      );

      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('sector-7');
    });

    it('reflects rotation — planet moves to adjacent sector', () => {
      const player = createMockPlayer();
      const solarSystem = createSolarSystem();
      solarSystem.rotate(0);
      const sectors = Array.from({ length: 8 }, (_, i) =>
        createMockSector(`sector-${i}`, ESector.RED),
      );
      const game = {
        ...createMockGame(sectors),
        solarSystem,
      } as unknown as IGame;

      const result = MarkSectorSignalEffect.markByPlanet(
        player,
        game,
        EPlanet.EARTH,
      );

      expect(result).not.toBeNull();
      expect(result!.sectorId).toBe('sector-4');
    });

    it('returns null when solar system is absent', () => {
      const player = createMockPlayer();
      const game = {
        sectors: [],
        solarSystem: null,
        solarSystemSetup: null,
      } as unknown as IGame;

      const result = MarkSectorSignalEffect.markByPlanet(
        player,
        game,
        EPlanet.EARTH,
      );

      expect(result).toBeNull();
    });
  });

  describe('markByColorChain', () => {
    it('marks all colors in sequence with unique sectors', () => {
      const player = createMockPlayer();
      const red = createMockSector('red', ESector.RED);
      const blue = createMockSector('blue', ESector.BLUE);
      const game = createMockGame([red, blue]);
      const onComplete = vi.fn(() => undefined);

      MarkSectorSignalEffect.markByColorChain(
        player,
        game,
        [ESector.RED, ESector.BLUE],
        onComplete,
      );

      expect(onComplete).toHaveBeenCalledOnce();
      expect(hasPlayerMarker(red, 'p1')).toBe(true);
      expect(hasPlayerMarker(blue, 'p1')).toBe(true);
    });

    it('chains interactive selections for ambiguous colors', () => {
      const player = createMockPlayer();
      const red1 = createMockSector('red-1', ESector.RED);
      const red2 = createMockSector('red-2', ESector.RED);
      const blue = createMockSector('blue', ESector.BLUE);
      const game = createMockGame([red1, red2, blue]);
      const onComplete = vi.fn(() => undefined);

      const input = MarkSectorSignalEffect.markByColorChain(
        player,
        game,
        [ESector.RED, ESector.BLUE],
        onComplete,
      );

      expect(input).toBeDefined();
      expect(input!.type).toBe(EPlayerInputType.OPTION);

      input!.process({
        type: EPlayerInputType.OPTION,
        optionId: 'red-1',
      });

      expect(hasPlayerMarker(red1, 'p1')).toBe(true);
      expect(hasPlayerMarker(blue, 'p1')).toBe(true);
      expect(onComplete).toHaveBeenCalledOnce();
    });

    it('calls onComplete immediately for empty color list', () => {
      const player = createMockPlayer();
      const game = createMockGame([]);
      const onComplete = vi.fn(() => undefined);

      MarkSectorSignalEffect.markByColorChain(player, game, [], onComplete);

      expect(onComplete).toHaveBeenCalledOnce();
    });
  });
});
