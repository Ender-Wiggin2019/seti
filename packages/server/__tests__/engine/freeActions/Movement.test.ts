import { EErrorCode } from '@seti/common/types/protocol/errors';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { ETechId } from '@seti/common/types/tech';
import { vi } from 'vitest';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
  SolarSystem,
} from '@/engine/board/SolarSystem.js';
import { MovementFreeAction } from '@/engine/freeActions/Movement.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { Player } from '@/engine/player/Player.js';

function createMockSpace(
  id: string,
  ringIndex: number,
  indexInRing: number,
  overrides?: Partial<ISolarSystemSpace>,
): ISolarSystemSpace {
  return {
    id,
    ringIndex,
    indexInRing,
    discIndex: null,
    hasPublicityIcon: false,
    elements: [{ type: ESolarSystemElementType.EMPTY, amount: 1 }],
    occupants: [],
    ...overrides,
  };
}

function createLinearSolarSystem(): SolarSystem {
  const spaces: ISolarSystemSpace[] = [
    createMockSpace('s0', 1, 0),
    createMockSpace('s1', 1, 1, { hasPublicityIcon: true }),
    createMockSpace('s2', 1, 2, {
      elements: [{ type: ESolarSystemElementType.ASTEROID, amount: 1 }],
    }),
    createMockSpace('s3', 1, 3),
    createMockSpace('s4', 1, 4),
    createMockSpace('s5', 1, 5),
    createMockSpace('s6', 1, 6),
    createMockSpace('s7', 1, 7),
  ];
  return new SolarSystem(spaces, []);
}

function createTestPlayer(overrides?: Record<string, unknown>): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    probesInSpace: 1,
    ...overrides,
  });
}

function createMockGame(
  ss: SolarSystem,
  overrides: Record<string, unknown> = {},
): IGame {
  return {
    solarSystem: ss,
    missionTracker: {
      recordEvent: vi.fn(),
    },
    ...overrides,
  } as unknown as IGame;
}

describe('MovementFreeAction', () => {
  describe('canExecute', () => {
    it('returns true when probe in space and has move stash', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      player.gainMove(2);
      expect(MovementFreeAction.canExecute(player, createMockGame(ss))).toBe(
        true,
      );
    });

    it('returns true when probe in space and has energy (convertible)', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      expect(player.resources.energy).toBeGreaterThan(0);
      expect(MovementFreeAction.canExecute(player, createMockGame(ss))).toBe(
        true,
      );
    });

    it('returns false when no probes in space', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer({ probesInSpace: 0 });
      player.gainMove(5);
      expect(MovementFreeAction.canExecute(player, createMockGame(ss))).toBe(
        false,
      );
    });

    it('returns false when solar system is null', () => {
      const player = createTestPlayer();
      player.gainMove(5);
      expect(
        MovementFreeAction.canExecute(player, {
          solarSystem: null,
        } as unknown as IGame),
      ).toBe(false);
    });
  });

  describe('execute', () => {
    it('moves probe along a valid 2-step path', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      player.gainMove(3);
      ss.placeProbe('p1', 's0');

      const result = MovementFreeAction.execute(player, createMockGame(ss), [
        's0',
        's1',
      ]);

      expect(result.totalCost).toBe(1);
      expect(result.path).toEqual(['s0', 's1']);
      expect(player.getMoveStash()).toBe(2);
      expect(ss.getProbesAt('s0')).toHaveLength(0);
      expect(ss.getProbesAt('s1')).toHaveLength(1);
    });

    it('grants publicity when passing through publicity icon space', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      player.gainMove(3);
      ss.placeProbe('p1', 's0');

      const result = MovementFreeAction.execute(player, createMockGame(ss), [
        's0',
        's1',
      ]);

      expect(result.publicityGained).toBe(1);
    });

    it('handles multi-step path', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      player.gainMove(5);
      ss.placeProbe('p1', 's0');

      const result = MovementFreeAction.execute(player, createMockGame(ss), [
        's0',
        's1',
        's2',
      ]);

      expect(result.totalCost).toBe(2);
      expect(ss.getProbesAt('s2')).toHaveLength(1);
    });

    it('records planet/asteroid visit mission events while moving', () => {
      const ss = createLinearSolarSystem();
      ss.spaces.find((space) => space.id === 's1')!.elements = [
        {
          type: ESolarSystemElementType.PLANET,
          amount: 1,
          planet: EPlanet.MARS,
        },
      ];
      ss.spaces.find((space) => space.id === 's2')!.elements = [
        {
          type: ESolarSystemElementType.ASTEROID,
          amount: 1,
        },
      ];

      const recordEvent = vi.fn();
      const game = createMockGame(ss, {
        missionTracker: { recordEvent },
      });
      const player = createTestPlayer();
      player.gainMove(3);
      ss.placeProbe('p1', 's0');

      MovementFreeAction.execute(player, game, ['s0', 's1', 's2']);

      expect(recordEvent).toHaveBeenCalledWith({
        type: EMissionEventType.PROBE_VISITED_PLANET,
        planet: EPlanet.MARS,
      });
      expect(recordEvent).toHaveBeenCalledWith({
        type: EMissionEventType.PROBE_VISITED_ASTEROIDS,
      });
    });

    it('costs extra to leave asteroid space', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      player.gainMove(5);
      ss.placeProbe('p1', 's2');

      const result = MovementFreeAction.execute(player, createMockGame(ss), [
        's2',
        's3',
      ]);

      expect(result.totalCost).toBe(2);
    });

    it('removes asteroid leave surcharge with asteroid tech', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer({ techs: [ETechId.PROBE_ASTEROID] });
      player.gainMove(5);
      ss.placeProbe('p1', 's2');

      const result = MovementFreeAction.execute(player, createMockGame(ss), [
        's2',
        's3',
      ]);

      expect(result.totalCost).toBe(1);
    });

    it('grants extra publicity when entering asteroid with asteroid tech', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer({ techs: [ETechId.PROBE_ASTEROID] });
      player.gainMove(3);
      ss.placeProbe('p1', 's1');

      const result = MovementFreeAction.execute(player, createMockGame(ss), [
        's1',
        's2',
      ]);

      expect(result.publicityGained).toBe(1);
    });

    it('throws when path is too short', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      player.gainMove(5);

      expect(() =>
        MovementFreeAction.execute(player, createMockGame(ss), ['s0']),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('throws when no probe at start space', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      player.gainMove(5);

      expect(() =>
        MovementFreeAction.execute(player, createMockGame(ss), ['s0', 's1']),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });

    it('throws when not enough movement points', () => {
      const ss = createLinearSolarSystem();
      const player = createTestPlayer();
      player.gainMove(1);
      ss.placeProbe('p1', 's0');

      expect(() =>
        MovementFreeAction.execute(player, createMockGame(ss), [
          's0',
          's1',
          's2',
          's3',
        ]),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });
  });
});
