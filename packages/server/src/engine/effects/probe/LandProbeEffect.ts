import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { TechModifierQuery } from '../../tech/TechModifierQuery.js';
import {
  consumeProbeFromPlanet,
  syncProbeCountsForPlayer,
} from './ProbeEffectUtils.js';

export interface ILandOptions {
  isMoon?: boolean;
  allowMoons?: boolean;
  allowDuplicate?: boolean;
}

export interface ILandResult {
  planet: EPlanet;
  isMoon: boolean;
  landingCost: number;
  vpGained: number;
  firstLandDataGained: number;
  lifeTraceGained: number;
}

/** @deprecated Use ILandOptions instead */
export type ILandProbeEffectOptions = ILandOptions;
/** @deprecated Use ILandResult instead */
export type ILandProbeEffectResult = ILandResult;

export class LandProbeEffect {
  private static resolveMoonFlag(
    player: IPlayer,
    options: ILandOptions,
  ): boolean {
    return (
      options.allowMoons ??
      TechModifierQuery.fromTechIds(player.techs).canLandOnMoon()
    );
  }

  public static canExecute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandOptions = {},
  ): boolean {
    if (
      planet === EPlanet.EARTH ||
      game.solarSystem === null ||
      game.planetaryBoard === null
    ) {
      return false;
    }

    syncProbeCountsForPlayer(game, player.id);
    return game.planetaryBoard.canLand(planet, player.id, {
      isMoon: options.isMoon,
      allowMoonLanding: this.resolveMoonFlag(player, options),
      allowDuplicate: options.allowDuplicate,
    });
  }

  public static getLandingCost(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandOptions = {},
  ): number {
    if (!this.canExecute(player, game, planet, options)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'LandProbe effect is not currently legal',
        {
          playerId: player.id,
          planet,
          isMoon: options.isMoon ?? false,
        },
      );
    }

    const planetaryBoard = game.planetaryBoard;
    if (planetaryBoard === null) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'Planetary board not initialized',
      );
    }

    const baseCost = planetaryBoard.getLandingCost(planet, player.id);
    return TechModifierQuery.fromTechIds(player.techs).getLandingCost(baseCost);
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandOptions = {},
  ): ILandResult {
    if (!this.canExecute(player, game, planet, options)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'LandProbe effect is not currently legal',
        {
          playerId: player.id,
          planet,
          isMoon: options.isMoon ?? false,
        },
      );
    }

    const effectiveLandingCost = this.getLandingCost(
      player,
      game,
      planet,
      options,
    );

    const consumed = consumeProbeFromPlanet(game, player.id, planet);
    if (!consumed) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No probe available to land',
        {
          playerId: player.id,
          planet,
        },
      );
    }

    player.probesInSpace = Math.max(0, player.probesInSpace - 1);
    const planetaryBoard = game.planetaryBoard;
    if (planetaryBoard === null) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'Planetary board not initialized',
      );
    }

    const landingResult = planetaryBoard.land(planet, player.id, {
      isMoon: options.isMoon,
      allowMoonLanding: this.resolveMoonFlag(player, options),
      allowDuplicate: options.allowDuplicate,
    });
    syncProbeCountsForPlayer(game, player.id);
    player.score += landingResult.centerReward.vpGained;
    if (landingResult.firstLandDataGained > 0) {
      player.resources.gain({ data: landingResult.firstLandDataGained });
    }

    return {
      planet,
      isMoon: landingResult.isMoon,
      landingCost: effectiveLandingCost,
      vpGained: landingResult.centerReward.vpGained,
      firstLandDataGained: landingResult.firstLandDataGained,
      lifeTraceGained: landingResult.centerReward.lifeTraceGained,
    };
  }
}
