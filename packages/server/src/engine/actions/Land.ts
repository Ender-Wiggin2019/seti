import type { EPlanet } from '@seti/common/types/protocol/enums';
import type {
  ILandOptions,
  ILandResult,
} from '../effects/probe/LandProbeEffect.js';
import type { IPlayer } from '../player/IPlayer.js';

export type { ILandOptions, ILandResult };

export class LandAction {
  public static canExecute(
    player: IPlayer,
    planet: EPlanet,
    options: ILandOptions = {},
  ): boolean {
    return player.canLand(planet, options);
  }

  public static execute(
    player: IPlayer,
    planet: EPlanet,
    options: ILandOptions = {},
  ): ILandResult {
    return player.land(planet, options);
  }
}
