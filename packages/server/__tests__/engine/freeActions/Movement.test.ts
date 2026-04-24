import {
  EFreeAction,
  EMainAction,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { vi } from 'vitest';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
  SolarSystem,
} from '@/engine/board/SolarSystem.js';
import { MovementFreeAction } from '@/engine/freeActions/Movement.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { Player } from '@/engine/player/Player.js';
import { GameError } from '@/shared/errors/GameError.js';
import {
  buildTestGame,
  getPlayer,
  requireSolarSystem,
  resolveAllInputsDefault,
  setSolarSystemInitialDiscAngles,
} from '../../helpers/TestGameBuilder.js';

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

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed: string): Game {
  return Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
}

function resolvePassEndOfRoundPick(game: Game, playerId: string): void {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player?.waitingFor) {
    return;
  }

  const model = player.waitingFor.toModel() as ISelectEndOfRoundCardInputModel;
  if (model.type !== EPlayerInputType.END_OF_ROUND) {
    return;
  }

  game.processInput(playerId, {
    type: EPlayerInputType.END_OF_ROUND,
    cardId: model.cards[0].id,
  });
}

/** PASS resolves discard / end-of-round picks and auto-ends the turn (no processEndTurn). */
function passTurn(game: Game, playerId: string): void {
  const player = getPlayer(game, playerId);
  game.processMainAction(playerId, { type: EMainAction.PASS });
  let guard = 0;
  while (player.waitingFor && guard < 50) {
    resolveAllInputsDefault(game, player);
    resolvePassEndOfRoundPick(game, playerId);
    guard += 1;
  }
}

function relocateProbeAlongPath(
  ss: SolarSystem,
  probeId: string,
  path: string[],
): void {
  for (let i = 0; i < path.length - 1; i += 1) {
    ss.moveProbe(probeId, path[i]!, path[i + 1]!);
  }
}

/** BFS path on solar adjacency; skips stepping into SUN cells. */
function shortestPathBetween(
  ss: SolarSystem,
  fromId: string,
  toId: string,
): string[] | null {
  const queue: string[][] = [[fromId]];
  const seen = new Set<string>([fromId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const cur = path[path.length - 1]!;
    if (cur === toId) {
      return path;
    }
    for (const n of ss.getAdjacentSpaces(cur)) {
      if (seen.has(n.id)) {
        continue;
      }
      if (
        n.elements.some(
          (el) => el.type === ESolarSystemElementType.SUN && el.amount > 0,
        )
      ) {
        continue;
      }
      seen.add(n.id);
      queue.push([...path, n.id]);
    }
  }
  return null;
}

function patchAsteroidAtRing1Cell2(game: Game): void {
  setSolarSystemInitialDiscAngles(game, [0, 0, 0]);
  const ss = requireSolarSystem(game);
  const cell3 = ss.spaces.find((s) => s.id === 'ring-1-cell-3');
  if (!cell3) {
    throw new Error('Test setup: ring-1-cell-3 missing');
  }
  cell3.elements = [{ type: ESolarSystemElementType.EMPTY, amount: 1 }];
  ss.setDynamicPlanetAtSpace(EPlanet.EARTH, 'ring-1-cell-3');

  const cell2 = ss.spaces.find((s) => s.id === 'ring-1-cell-2');
  if (!cell2) {
    throw new Error('Test setup: ring-1-cell-2 missing');
  }
  cell2.elements = [{ type: ESolarSystemElementType.ASTEROID, amount: 1 }];
  cell2.hasPublicityIcon = false;
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

  describe('Phase 3.1 — Movement (integration, Game.create + processFreeAction)', () => {
    it('3.1.1 [集成] real board: orthogonal adjacency only — valid neighbor move succeeds; non-adjacent hop fails', () => {
      const game = buildTestGame({
        seed: 'phase-3-1-1-orthogonal',
        playerCount: 2,
      });
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const probeOnEarth = ss
        .getProbesAt(earthId)
        .find((pr) => pr.playerId === p1.id)!;

      const ring1 = ss.spaces
        .filter((s) => s.ringIndex === 1)
        .sort((a, b) => a.indexInRing - b.indexInRing);
      const start = ring1[0]!;
      const pathToStart = shortestPathBetween(ss, earthId, start.id);
      expect(pathToStart).not.toBeNull();
      relocateProbeAlongPath(ss, probeOnEarth.id, pathToStart!);
      const neighbor = ss.getAdjacentSpaces(start.id)[0]!;

      p1.gainMove(1);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: [start.id, neighbor.id],
      });
      expect(
        ss.getProbesAt(neighbor.id).some((pr) => pr.playerId === p1.id),
      ).toBe(true);

      const illegalHop = ss.spaces.find(
        (cell) =>
          cell.id !== neighbor.id &&
          !ss.getAdjacentSpaces(neighbor.id).some((a) => a.id === cell.id),
      );
      expect(illegalHop).toBeDefined();

      p1.gainMove(1);
      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.MOVEMENT,
          path: [neighbor.id, illegalHop!.id],
        }),
      ).toThrow(GameError);
    });

    it('3.1.2 [集成] leaving an asteroid costs +1 movement without meteorite tech', () => {
      const game = buildTestGame({
        seed: 'phase-3-1-2-asteroid-cost',
        playerCount: 2,
      });
      patchAsteroidAtRing1Cell2(game);
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const asteroidSpace = ss.spaces.find((s) => s.id === 'ring-1-cell-2')!;
      const dest = ss
        .getAdjacentSpaces(asteroidSpace.id)
        .find((a) => a.id !== earthId);
      expect(dest).toBeDefined();

      const pathToAsteroid = shortestPathBetween(ss, earthId, asteroidSpace.id);
      expect(pathToAsteroid).not.toBeNull();

      p1.gainMove(12);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: pathToAsteroid!,
      });
      const moveAfterArrive = p1.getMoveStash();
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: [asteroidSpace.id, dest!.id],
      });
      expect(moveAfterArrive - p1.getMoveStash()).toBe(2);
    });

    it('3.1.3 [集成] probe tech (meteorite): ignore +1 when leaving an asteroid', () => {
      const game = buildTestGame({
        seed: 'phase-3-1-3-meteorite-tech',
        playerCount: 2,
      });
      patchAsteroidAtRing1Cell2(game);
      const p1 = getPlayer(game, 'p1');
      p1.gainTech(ETechId.PROBE_ASTEROID);
      const ss = requireSolarSystem(game);

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const asteroidSpace = ss.spaces.find((s) => s.id === 'ring-1-cell-2')!;
      const dest = ss
        .getAdjacentSpaces(asteroidSpace.id)
        .find((a) => a.id !== earthId);
      expect(dest).toBeDefined();
      const pathToAsteroid = shortestPathBetween(ss, earthId, asteroidSpace.id);
      expect(pathToAsteroid).not.toBeNull();
      p1.gainMove(12);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: pathToAsteroid!,
      });
      const moveAfterArrive = p1.getMoveStash();
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: [asteroidSpace.id, dest!.id],
      });
      expect(moveAfterArrive - p1.getMoveStash()).toBe(1);
    });

    it('3.1.4 [集成] passing through a publicity icon grants publicity on entry (intermediate step)', () => {
      const game = buildTestGame({
        seed: 'phase-3-1-4-publicity-pass',
        playerCount: 2,
      });
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);

      const chain = ss.spaces
        .filter((s) => s.hasPublicityIcon)
        .find((icon) => {
          const adj = ss.getAdjacentSpaces(icon.id);
          const prev = adj.find(
            (a) =>
              ss.getAdjacentSpaces(a.id).some((b) => b.id === icon.id) &&
              !a.hasPublicityIcon,
          );
          if (!prev) {
            return false;
          }
          const next = ss
            .getAdjacentSpaces(icon.id)
            .find((c) => c.id !== prev.id && !c.hasPublicityIcon);
          return next !== undefined;
        });

      expect(chain).toBeDefined();
      const iconSpace = chain!;
      const neighbors = ss.getAdjacentSpaces(iconSpace.id);
      const prev = neighbors.find((a) => !a.hasPublicityIcon)!;
      const next = neighbors.find(
        (c) => c.id !== prev.id && !c.hasPublicityIcon,
      )!;

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const path1 = shortestPathBetween(ss, earthId, prev.id);
      expect(path1).not.toBeNull();
      p1.gainMove(20);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: path1!,
      });

      const pubBefore = p1.resources.publicity;
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: [prev.id, iconSpace.id, next.id],
      });
      expect(p1.resources.publicity).toBeGreaterThan(pubBefore);
    });

    it('3.1.5 [集成] cannot enter a SUN space', () => {
      const game = buildTestGame({ seed: 'phase-3-1-5-sun', playerCount: 2 });
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);

      const victim = ss.spaces.find(
        (s) =>
          s.ringIndex === 2 &&
          !s.elements.some((e) => e.type === ESolarSystemElementType.SUN),
      );
      expect(victim).toBeDefined();
      victim!.elements = [{ type: ESolarSystemElementType.SUN, amount: 1 }];

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const neighbor = ss.getAdjacentSpaces(victim!.id)[0];
      expect(neighbor).toBeDefined();

      const pathToNeighbor = shortestPathBetween(ss, earthId, neighbor!.id);
      expect(pathToNeighbor).not.toBeNull();
      p1.gainMove(20);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: pathToNeighbor!,
      });

      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.MOVEMENT,
          path: [neighbor!.id, victim!.id],
        }),
      ).toThrow(GameError);
    });

    it('3.1.6 [集成] FAQ: multiple movement points can be split across two probes', () => {
      const game = buildTestGame({
        seed: 'phase-3-1-6-split-probes',
        playerCount: 2,
      });
      const p1 = getPlayer(game, 'p1');
      const p2 = getPlayer(game, 'p2');
      const ss = requireSolarSystem(game);
      p1.gainTech(ETechId.PROBE_DOUBLE_PROBE);
      p1.resources.gain({ credits: 10 });

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const away = ss.getAdjacentSpaces(earthId)[0]!;
      p1.gainMove(1);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: [earthId, away.id],
      });
      game.processEndTurn(p1.id);

      // Avoid solar rotation on p2's pass so the first probe stays on `away`.
      game.hasRoundFirstPassOccurred = true;
      passTurn(game, p2.id);

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      expect(
        ss.getProbesAt(earthId).filter((pr) => pr.playerId === p1.id),
      ).toHaveLength(1);

      const earthAdj = ss.getAdjacentSpaces(earthId);
      const stepEarth = earthAdj.find((c) => c.id !== away.id) ?? earthAdj[0]!;
      const stepAway =
        ss.getAdjacentSpaces(away.id).find((c) => c.id !== earthId) ??
        ss.getAdjacentSpaces(away.id)[0]!;
      p1.gainMove(2);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: [earthId, stepEarth.id],
      });
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: [away.id, stepAway.id],
      });
      expect(p1.getMoveStash()).toBe(0);
    });

    it('3.1.7 [集成] FAQ: revisiting a publicity space in the same turn awards publicity again', () => {
      const game = buildTestGame({
        seed: 'phase-3-1-7-revisit-pub',
        playerCount: 2,
      });
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);

      const iconSpace = ss.spaces.find((s) => s.hasPublicityIcon);
      expect(iconSpace).toBeDefined();
      const other = ss
        .getAdjacentSpaces(iconSpace!.id)
        .find((a) => !a.hasPublicityIcon);
      expect(other).toBeDefined();

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const toIcon = shortestPathBetween(ss, earthId, iconSpace!.id);
      expect(toIcon).not.toBeNull();
      p1.gainMove(20);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: toIcon!,
      });

      const pub0 = p1.resources.publicity;
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: [
          iconSpace!.id,
          other!.id,
          iconSpace!.id,
          other!.id,
          iconSpace!.id,
        ],
      });
      expect(p1.resources.publicity - pub0).toBeGreaterThanOrEqual(2);
    });

    it('3.1.8 [集成] probe tech (meteorite): entering an asteroid grants +1 publicity', () => {
      const game = buildTestGame({
        seed: 'phase-3-1-8-asteroid-pub',
        playerCount: 2,
      });
      patchAsteroidAtRing1Cell2(game);
      const p1 = getPlayer(game, 'p1');
      p1.gainTech(ETechId.PROBE_ASTEROID);
      const ss = requireSolarSystem(game);

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const asteroidSpace = ss.spaces.find((s) => s.id === 'ring-1-cell-2')!;
      const pathToAsteroid = shortestPathBetween(ss, earthId, asteroidSpace.id);
      expect(pathToAsteroid).not.toBeNull();

      const pubBefore = p1.resources.publicity;
      p1.gainMove(12);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: pathToAsteroid!,
      });
      expect(p1.resources.publicity).toBe(pubBefore + 1);
    });

    it('3.1.9 [集成] movement records PROBE_VISITED in real MissionTracker (card 128)', () => {
      const game = buildTestGame({
        seed: 'phase-3-1-9-mission-tracker',
        playerCount: 2,
      });
      const p1 = getPlayer(game, 'p1');
      const p2 = getPlayer(game, 'p2');
      const ss = requireSolarSystem(game);

      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      game.processEndTurn(p1.id);
      game.hasRoundFirstPassOccurred = true;
      passTurn(game, p2.id);

      p1.hand.unshift('128');
      game.processMainAction(p1.id, {
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: 0 },
      });
      resolveAllInputsDefault(game, p1);

      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const marsSpace = ss.getSpacesOnPlanet(EPlanet.MARS)[0]!;
      const pathToMars = shortestPathBetween(ss, earthId, marsSpace.id);
      expect(pathToMars).not.toBeNull();

      p1.gainMove(30);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: pathToMars!,
      });

      expect(p1.waitingFor).toBeDefined();
      const model = p1.waitingFor!.toModel() as ISelectOptionInputModel;
      expect(model.type).toBe(EPlayerInputType.OPTION);
      expect(model.options.some((o) => o.id.startsWith('complete-128-'))).toBe(
        true,
      );
    });

    it('3.1E.1 [错误] cannot move with 0 movement stash and 0 energy', () => {
      const game = buildTestGame({ seed: 'phase-3-1-e1', playerCount: 2 });
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);
      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      p1.resources.spend({ energy: p1.resources.energy });
      expect(MovementFreeAction.canExecute(p1, game)).toBe(false);

      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const dest = ss.getAdjacentSpaces(earthId)[0]!;
      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.MOVEMENT,
          path: [earthId, dest.id],
        }),
      ).toThrow(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });

    it('3.1E.2 [错误] rejects a single step to a non-adjacent space', () => {
      const game = buildTestGame({ seed: 'phase-3-1-e2', playerCount: 2 });
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);
      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });

      const ring1 = ss.spaces
        .filter((s) => s.ringIndex === 1)
        .sort((a, b) => a.indexInRing - b.indexInRing);
      const a = ring1[0]!;
      const b = ring1[2]!;
      expect(ss.getAdjacentSpaces(a.id).some((n) => n.id === b.id)).toBe(false);

      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const path = shortestPathBetween(ss, earthId, a.id);
      expect(path).not.toBeNull();
      p1.gainMove(15);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: path!,
      });

      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.MOVEMENT,
          path: [a.id, b.id],
        }),
      ).toThrow(expect.objectContaining({ code: EErrorCode.INVALID_ACTION }));
    });

    it('3.1E.3 [错误] rejects entering a SUN space', () => {
      const game = buildTestGame({ seed: 'phase-3-1-e3', playerCount: 2 });
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);
      const victim = ss.spaces.find((s) => s.ringIndex === 2)!;
      victim.elements = [{ type: ESolarSystemElementType.SUN, amount: 1 }];
      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });
      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const neighbor = ss.getAdjacentSpaces(victim.id)[0]!;
      const path = shortestPathBetween(ss, earthId, neighbor.id);
      expect(path).not.toBeNull();
      p1.gainMove(20);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: path!,
      });

      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.MOVEMENT,
          path: [neighbor.id, victim.id],
        }),
      ).toThrow(GameError);
    });

    it('3.1E.4 [错误] rejects diagonal / non-orthogonal single hop along ring', () => {
      const game = buildTestGame({ seed: 'phase-3-1-e4', playerCount: 2 });
      const p1 = getPlayer(game, 'p1');
      const ss = requireSolarSystem(game);
      game.processMainAction(p1.id, { type: EMainAction.LAUNCH_PROBE });

      const ring2 = ss.spaces
        .filter((s) => s.ringIndex === 2)
        .sort((a, b) => a.indexInRing - b.indexInRing);
      const from = ring2[0]!;
      const diagonal = ring2[2]!;
      expect(
        ss.getAdjacentSpaces(from.id).some((n) => n.id === diagonal.id),
      ).toBe(false);

      const earthId = ss.getSpacesOnPlanet(EPlanet.EARTH)[0]!.id;
      const path = shortestPathBetween(ss, earthId, from.id);
      expect(path).not.toBeNull();
      p1.gainMove(25);
      game.processFreeAction(p1.id, {
        type: EFreeAction.MOVEMENT,
        path: path!,
      });

      expect(() =>
        game.processFreeAction(p1.id, {
          type: EFreeAction.MOVEMENT,
          path: [from.id, diagonal.id],
        }),
      ).toThrow(expect.objectContaining({ code: EErrorCode.INVALID_ACTION }));
    });
  });
});
