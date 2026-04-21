import { validateMovementPath } from '@seti/common/rules/freeActions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { isMovementPublicityDisabledForCurrentTurn } from '../alien/plugins/AnomaliesTurnEffects.js';
import { ESolarSystemElementType } from '../board/SolarSystem.js';
import type { IGame } from '../IGame.js';
import { EMissionEventType } from '../missions/IMission.js';
import type { IPlayer } from '../player/IPlayer.js';
import { TechModifierQuery } from '../tech/TechModifierQuery.js';
import { toPublicSolarSystemState } from '../utils/stateProjection.js';
import { findProbeAtSpace } from './probeUtils.js';

export interface IMovementResult {
  probeId: string;
  path: string[];
  totalCost: number;
  publicityGained: number;
}

export class MovementFreeAction {
  static canExecute(player: IPlayer, game: IGame): boolean {
    if (game.solarSystem === null) return false;
    if (player.probesInSpace <= 0) return false;
    return player.getMoveStash() > 0 || player.resources.energy > 0;
  }

  static execute(
    player: IPlayer,
    game: IGame,
    path: string[],
  ): IMovementResult {
    if (game.solarSystem === null) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Solar system not initialized',
      );
    }

    if (path.length < 2) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Movement path must have at least 2 spaces',
      );
    }

    const startSpaceId = path[0];
    const probe = findProbeAtSpace(game, player.id, startSpaceId);
    if (!probe) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `No probe found at space ${startSpaceId}`,
        { playerId: player.id, spaceId: startSpaceId },
      );
    }

    const publicState = toPublicSolarSystemState(game.solarSystem);
    const validation = validateMovementPath(publicState, path);

    if (!validation.valid) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Invalid movement path: ${validation.errors.join(', ')}`,
        { path, errors: validation.errors },
      );
    }

    const effectiveCost = this.getEffectiveMovementCost(player, game, path);

    if (effectiveCost > player.getMoveStash()) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough movement points',
        {
          required: effectiveCost,
          available: player.getMoveStash(),
        },
      );
    }

    const techQuery = TechModifierQuery.fromTechIds(player.techs);
    let totalPublicity = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const result = game.solarSystem.moveProbe(probe.id, path[i], path[i + 1]);
      totalPublicity += result.publicityGained;
      this.recordVisitEvents(game, path[i + 1]);

      if (
        techQuery.hasAsteroidPublicity() &&
        this.isAsteroidSpace(game, path[i + 1])
      ) {
        totalPublicity += 1;
      }
    }

    player.spendMove(effectiveCost);

    if (isMovementPublicityDisabledForCurrentTurn(game, player.id)) {
      totalPublicity = 0;
    }

    if (totalPublicity > 0) {
      player.resources.gain({ publicity: totalPublicity });
    }

    return {
      probeId: probe.id,
      path,
      totalCost: effectiveCost,
      publicityGained: totalPublicity,
    };
  }

  private static getEffectiveMovementCost(
    player: IPlayer,
    game: IGame,
    path: string[],
  ): number {
    const asteroidLeaveCost = TechModifierQuery.fromTechIds(
      player.techs,
    ).getAsteroidLeaveCost(1);

    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const fromSpace = game.solarSystem?.spaces.find((s) => s.id === path[i]);
      const fromIsAsteroid =
        fromSpace?.elements.some(
          (element) =>
            element.type === ESolarSystemElementType.ASTEROID &&
            element.amount > 0,
        ) ?? false;
      totalCost += 1 + (fromIsAsteroid ? asteroidLeaveCost : 0);
    }

    return totalCost;
  }

  private static isAsteroidSpace(game: IGame, spaceId: string): boolean {
    const space = game.solarSystem?.spaces.find(
      (candidate) => candidate.id === spaceId,
    );
    if (!space) {
      return false;
    }

    return space.elements.some(
      (element) =>
        element.type === ESolarSystemElementType.ASTEROID && element.amount > 0,
    );
  }

  private static recordVisitEvents(game: IGame, spaceId: string): void {
    const space = game.solarSystem?.spaces.find(
      (candidate) => candidate.id === spaceId,
    );
    if (!space) {
      return;
    }

    for (const element of space.elements) {
      if (
        (element.type === ESolarSystemElementType.PLANET ||
          element.type === ESolarSystemElementType.EARTH) &&
        element.planet
      ) {
        game.missionTracker.recordEvent({
          type: EMissionEventType.PROBE_VISITED_PLANET,
          planet: element.planet,
        });
      }
      if (
        element.type === ESolarSystemElementType.ASTEROID &&
        element.amount > 0
      ) {
        game.missionTracker.recordEvent({
          type: EMissionEventType.PROBE_VISITED_ASTEROIDS,
        });
      }
    }
  }
}
