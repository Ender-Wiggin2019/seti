import {
  ORBIT_CREDIT_COST,
  ORBIT_ENERGY_COST,
} from '@seti/common/constant/actionCosts';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import {
  type IOrbitProbeEffectResult,
  OrbitProbeEffect,
} from '../effects/probe/OrbitProbeEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export type IOrbitExecutionResult = IOrbitProbeEffectResult;

export class OrbitAction {
  public static canExecute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
  ): boolean {
    if (
      planet === EPlanet.EARTH ||
      game.solarSystem === null ||
      game.planetaryBoard === null
    ) {
      return false;
    }

    if (
      !player.resources.has({
        credits: ORBIT_CREDIT_COST,
        energy: ORBIT_ENERGY_COST,
      })
    ) {
      return false;
    }
    return OrbitProbeEffect.canExecute(player, game, planet);
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
  ): IOrbitExecutionResult {
    if (!this.canExecute(player, game, planet)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Orbit action is not currently legal',
        {
          playerId: player.id,
          planet,
        },
      );
    }

    player.resources.spend({
      credits: ORBIT_CREDIT_COST,
      energy: ORBIT_ENERGY_COST,
    });
    return OrbitProbeEffect.execute(player, game, planet);
  }
}
