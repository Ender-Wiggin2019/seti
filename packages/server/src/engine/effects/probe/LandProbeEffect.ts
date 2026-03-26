import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import {
  consumeProbeFromPlanet,
  syncProbeCountsForPlayer,
} from './ProbeEffectUtils.js';

export interface ILandProbeEffectOptions {
  isMoon?: boolean;
}

export interface ILandProbeEffectResult {
  planet: EPlanet;
  isMoon: boolean;
  landingCost: number;
  vpGained: number;
  firstLandDataGained: number;
  lifeTraceGained: number;
}

export class LandProbeEffect {
  public static canExecute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandProbeEffectOptions = {},
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
    });
  }

  public static getLandingCost(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandProbeEffectOptions = {},
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

    return game.planetaryBoard!.getLandingCost(planet, player.id);
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandProbeEffectOptions = {},
  ): ILandProbeEffectResult {
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
    const landingResult = game.planetaryBoard!.land(planet, player.id, {
      isMoon: options.isMoon,
    });
    syncProbeCountsForPlayer(game, player.id);
    player.score += landingResult.centerReward.vpGained;
    if (landingResult.firstLandDataGained > 0) {
      player.resources.gain({ data: landingResult.firstLandDataGained });
    }

    return {
      planet,
      isMoon: landingResult.isMoon,
      landingCost: landingResult.landingCost,
      vpGained: landingResult.centerReward.vpGained,
      firstLandDataGained: landingResult.firstLandDataGained,
      lifeTraceGained: landingResult.centerReward.lifeTraceGained,
    };
  }
}
