import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import {
  type ILandProbeEffectOptions,
  type ILandProbeEffectResult,
  LandProbeEffect,
} from '../effects/probe/LandProbeEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export type ILandActionOptions = ILandProbeEffectOptions;
export type ILandExecutionResult = ILandProbeEffectResult;

export class LandAction {
  public static canExecute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandActionOptions = {},
  ): boolean {
    if (
      planet === EPlanet.EARTH ||
      game.solarSystem === null ||
      game.planetaryBoard === null
    ) {
      return false;
    }

    if (!LandProbeEffect.canExecute(player, game, planet, options)) {
      return false;
    }

    const landingCost = LandProbeEffect.getLandingCost(
      player,
      game,
      planet,
      options,
    );
    return player.resources.has({ energy: landingCost });
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandActionOptions = {},
  ): ILandExecutionResult {
    if (!this.canExecute(player, game, planet, options)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Land action is not currently legal',
        {
          playerId: player.id,
          planet,
          isMoon: options.isMoon ?? false,
        },
      );
    }

    const landingCost = LandProbeEffect.getLandingCost(
      player,
      game,
      planet,
      options,
    );
    player.resources.spend({ energy: landingCost });
    return LandProbeEffect.execute(player, game, planet, options);
  }
}
