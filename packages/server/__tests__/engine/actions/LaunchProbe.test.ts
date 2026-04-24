import { validateMovementPath } from '@seti/common/rules/freeActions';
import {
  EFreeAction,
  EMainAction,
  EPhase,
  EPlanet,
} from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
  type ISelectOptionInputModel,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { LaunchProbeAction } from '@/engine/actions/LaunchProbe.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { toPublicSolarSystemState } from '@/engine/utils/stateProjection.js';
import { GameError } from '@/shared/errors/GameError.js';
import {
  resolveSetupTucks,
  setSolarSystemInitialDiscAngles,
} from '../../helpers/TestGameBuilder.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function resolvePassFollowUp(game: Game, playerId: string): void {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    return;
  }

  while (player.waitingFor) {
    const model = player.waitingFor.toModel() as
      | ISelectEndOfRoundCardInputModel
      | { type: string; cards?: Array<{ id: string }> };

    if (model.type === EPlayerInputType.CARD) {
      const firstCardId = model.cards?.[0]?.id;
      if (!firstCardId) {
        throw new Error('expected card discard options after PASS');
      }
      game.processInput(playerId, {
        type: EPlayerInputType.CARD,
        cardIds: [firstCardId],
      });
      continue;
    }

    if (model.type === EPlayerInputType.END_OF_ROUND) {
      const endCardId = model.cards?.[0]?.id;
      if (!endCardId) {
        throw new Error('expected end-of-round card options after PASS');
      }
      game.processInput(playerId, {
        type: EPlayerInputType.END_OF_ROUND,
        cardId: endCardId,
      });
      continue;
    }

    throw new Error(`Unexpected input after PASS: ${model.type}`);
  }
}

function requireSolarSystem(game: IGame) {
  if (game.solarSystem === null) {
    throw new Error('Expected solar system to be initialized');
  }

  return game.solarSystem;
}

function resolveLandFollowUpInputs(game: Game, playerId: string): void {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error('player');
  }
  while (player.waitingFor) {
    const model = player.waitingFor.toModel();
    if (model.type === EPlayerInputType.TRACE) {
      const traceModel = model as ISelectTraceInputModel;
      game.processInput(playerId, {
        type: EPlayerInputType.TRACE,
        trace: traceModel.options[0],
      });
    } else if (model.type === EPlayerInputType.OPTION) {
      const optModel = model as ISelectOptionInputModel;
      game.processInput(playerId, {
        type: EPlayerInputType.OPTION,
        optionId: optModel.options[0].id,
      });
    } else {
      break;
    }
  }
}

/**
 * Aligns the board like `GameFlowBehavior` after first disc rotation:
 * Earth on `ring-1-cell-4`, asteroid on `ring-1-cell-3`, Venus on `ring-1-cell-2`.
 */
function alignSolarSystemForEarthToVenusMovement(game: Game): void {
  setSolarSystemInitialDiscAngles(game, [0, 0, 0]);
  const solar = game.solarSystem;
  if (!solar) {
    throw new Error('Expected solar system');
  }
  const cell2 = solar.spaces.find((space) => space.id === 'ring-1-cell-2');
  if (!cell2) {
    throw new Error('ring-1-cell-2 not found');
  }
  cell2.elements = [{ type: ESolarSystemElementType.ASTEROID, amount: 1 }];
  solar.rotateNextDisc();
}

function shortestMovePathForPlayerToPlanet(
  game: Game,
  playerId: string,
  planet: EPlanet,
): string[] {
  const solar = game.solarSystem;
  if (!solar) {
    throw new Error('Expected solar system');
  }
  const publicSolar = toPublicSolarSystemState(solar);
  const goalId = solar.getSpacesOnPlanet(planet)[0].id;
  const startIds = solar.spaces
    .filter((space) =>
      solar.getProbesAt(space.id).some((probe) => probe.playerId === playerId),
    )
    .map((space) => space.id);

  let best: string[] | null = null;
  for (const startId of startIds) {
    const queue: string[][] = [[startId]];
    const seen = new Set<string>([startId]);
    while (queue.length > 0) {
      const path = queue.shift()!;
      const cur = path[path.length - 1]!;
      if (cur === goalId) {
        if (best === null || path.length < best.length) {
          best = path;
        }
        break;
      }
      for (const adj of solar.getAdjacentSpaces(cur)) {
        if (seen.has(adj.id)) {
          continue;
        }
        const step = validateMovementPath(publicSolar, [cur, adj.id]);
        if (!step.valid) {
          continue;
        }
        seen.add(adj.id);
        queue.push([...path, adj.id]);
      }
    }
  }

  if (best === null) {
    throw new Error(`No path to ${planet} for ${playerId}`);
  }

  return best;
}

/** Advance turns until `playerId` may take a main action (handles round rollovers). */
function advanceUntilPlayersMainTurn(game: Game, playerId: string): void {
  for (let i = 0; i < 16; i += 1) {
    if (
      game.activePlayer.id === playerId &&
      game.phase === EPhase.AWAIT_MAIN_ACTION
    ) {
      return;
    }
    const active = game.activePlayer;
    if (active.id === playerId && game.phase === EPhase.AWAIT_END_TURN) {
      game.processEndTurn(active.id);
      continue;
    }
    game.processMainAction(active.id, { type: EMainAction.PASS });
    resolvePassFollowUp(game, active.id);
  }
  throw new Error(`could not reach main-action turn for ${playerId}`);
}

describe('LaunchProbeAction — integration', () => {
  describe('execute', () => {
    it('integration: double-probe tech allows launching again on a later turn until two probes are in space', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-double-tech',
      );
      resolveSetupTucks(game);
      const player = game.players[0];
      player.gainTech(ETechId.PROBE_DOUBLE_PROBE);
      const otherPlayer = game.players[1];

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      game.processEndTurn(player.id);
      game.processMainAction(otherPlayer.id, { type: EMainAction.PASS });
      resolvePassFollowUp(game, otherPlayer.id);
      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      game.processEndTurn(player.id);

      const solarSystem = requireSolarSystem(game);
      const earthSpaces = solarSystem.getSpacesOnPlanet(EPlanet.EARTH);
      const earthProbes = solarSystem.getProbesAt(earthSpaces[0].id);

      expect(player.resources.credits).toBe(0);
      expect(player.probesInSpace).toBe(2);
      expect(
        earthProbes.filter((probe) => probe.playerId === player.id),
      ).toHaveLength(2);
    });
  });

  describe('processMainAction integration', () => {
    it('2.1.1 spends 2 credits, places probe on Earth, increments probesInSpace', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1-1',
      );
      resolveSetupTucks(game);
      const player = game.players[0];
      const initialCredits = player.resources.credits;

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });

      expect(player.resources.credits).toBe(initialCredits - 2);
      expect(player.probesInSpace).toBe(1);
      const solarSystem = requireSolarSystem(game);
      const earthSpaces = solarSystem.getSpacesOnPlanet(EPlanet.EARTH);
      const earthProbes = solarSystem.getProbesAt(earthSpaces[0].id);
      expect(earthProbes.some((probe) => probe.playerId === player.id)).toBe(
        true,
      );
    });

    it('2.1.4 throws GameError when credits are below 2', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1-4',
      );
      resolveSetupTucks(game);
      const player = game.players[0];
      player.resources.spend({ credits: player.resources.credits - 1 });
      expect(player.resources.credits).toBe(1);

      expect(() =>
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE }),
      ).toThrow(GameError);

      try {
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      } catch (err) {
        expect((err as GameError).code).toBe(EErrorCode.INVALID_ACTION);
      }
      expect(player.resources.credits).toBe(1);
      expect(player.probesInSpace).toBe(0);
    });

    it('2.1.5 throws GameError when probesInSpace has reached the limit', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1-5',
      );
      resolveSetupTucks(game);
      const player = game.players[0];
      player.probesInSpace = player.probeSpaceLimit;

      expect(() =>
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE }),
      ).toThrow(GameError);

      try {
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      } catch (err) {
        expect((err as GameError).code).toBe(EErrorCode.INVALID_ACTION);
      }
    });

    it('2.1.2 after real ORBIT, orbiter does not count toward probesInSpace (third launch with double-probe tech)', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'behavior-flow-seed',
        'launch-probe-integration-2-1-2-orbit',
      );
      resolveSetupTucks(game);
      alignSolarSystemForEarthToVenusMovement(game);
      const player = game.players[0];
      const other = game.players[1];
      player.gainTech(ETechId.PROBE_DOUBLE_PROBE);
      player.resources.gain({ credits: 10 });
      const solar = requireSolarSystem(game);

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      game.processEndTurn(player.id);
      game.processMainAction(other.id, { type: EMainAction.PASS });
      resolvePassFollowUp(game, other.id);

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      expect(player.probesInSpace).toBe(2);
      game.processEndTurn(player.id);
      advanceUntilPlayersMainTurn(game, player.id);

      const pathToVenus = shortestMovePathForPlayerToPlanet(
        game,
        player.id,
        EPlanet.VENUS,
      );
      player.gainMove(10);
      game.processFreeAction(player.id, {
        type: EFreeAction.MOVEMENT,
        path: pathToVenus,
      });
      expect(player.probesInSpace).toBe(2);

      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.VENUS },
      });
      expect(player.probesInSpace).toBe(1);
      expect(
        game.planetaryBoard?.planets.get(EPlanet.VENUS)?.orbitSlots,
      ).toEqual([{ playerId: player.id }]);

      game.processEndTurn(player.id);
      advanceUntilPlayersMainTurn(game, player.id);

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      expect(player.probesInSpace).toBe(2);
      expect(() =>
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE }),
      ).toThrow(GameError);

      const playerProbesOnBoard = solar.spaces.reduce((count, space) => {
        return (
          count +
          solar.getProbesAt(space.id).filter((p) => p.playerId === player.id)
            .length
        );
      }, 0);
      expect(player.probesInSpace).toBe(2);
      expect(playerProbesOnBoard).toBe(2);
    });

    it('2.1.2 after real LAND, lander does not count toward probesInSpace (third launch with double-probe tech)', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'behavior-flow-seed',
        'launch-probe-integration-2-1-2-land',
      );
      resolveSetupTucks(game);
      alignSolarSystemForEarthToVenusMovement(game);
      const player = game.players[0];
      const other = game.players[1];
      player.gainTech(ETechId.PROBE_DOUBLE_PROBE);
      player.resources.gain({ credits: 10 });
      requireSolarSystem(game);

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      game.processEndTurn(player.id);
      game.processMainAction(other.id, { type: EMainAction.PASS });
      resolvePassFollowUp(game, other.id);

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      expect(player.probesInSpace).toBe(2);
      game.processEndTurn(player.id);
      advanceUntilPlayersMainTurn(game, player.id);

      const pathToVenusLand = shortestMovePathForPlayerToPlanet(
        game,
        player.id,
        EPlanet.VENUS,
      );
      player.gainMove(10);
      game.processFreeAction(player.id, {
        type: EFreeAction.MOVEMENT,
        path: pathToVenusLand,
      });

      game.processMainAction(player.id, {
        type: EMainAction.LAND,
        payload: { planet: EPlanet.VENUS },
      });
      resolveLandFollowUpInputs(game, player.id);

      expect(player.probesInSpace).toBe(1);
      expect(
        game.planetaryBoard?.planets
          .get(EPlanet.VENUS)
          ?.landingSlots.some((s) => s.playerId === player.id),
      ).toBe(true);

      game.processEndTurn(player.id);
      advanceUntilPlayersMainTurn(game, player.id);

      game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
      expect(player.probesInSpace).toBe(2);
      expect(() =>
        game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE }),
      ).toThrow(GameError);
    });

    it('2.1E.3 rejects launch attempted by a non-active player', () => {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        'launch-probe-integration-2-1E-3',
      );
      resolveSetupTucks(game);
      const active = game.activePlayer;
      const other = game.players.find((p) => p.id !== active.id);
      if (!other) {
        throw new Error('Expected a second player');
      }

      expect(() =>
        game.processMainAction(other.id, { type: EMainAction.LAUNCH_PROBE }),
      ).toThrow(GameError);

      try {
        game.processMainAction(other.id, { type: EMainAction.LAUNCH_PROBE });
      } catch (err) {
        expect((err as GameError).code).toBe(EErrorCode.NOT_YOUR_TURN);
      }
      expect(other.probesInSpace).toBe(0);
    });
  });
});
