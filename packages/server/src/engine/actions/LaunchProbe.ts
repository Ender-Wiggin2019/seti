import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

const LAUNCH_PROBE_CREDIT_COST = 2;

export interface ILaunchProbeResult {
  probeId: string;
  spaceId: string;
}

export class LaunchProbeAction {
  public static canExecute(player: IPlayer, game: IGame): boolean {
    if (game.solarSystem === null) return false;
    if (!player.resources.has({ credits: LAUNCH_PROBE_CREDIT_COST })) {
      return false;
    }
    return player.probesInSpace < player.probeSpaceLimit;
  }

  public static execute(player: IPlayer, game: IGame): ILaunchProbeResult {
    if (!this.canExecute(player, game)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'LaunchProbe action is not currently legal',
        { playerId: player.id },
      );
    }

    const solarSystem = game.solarSystem!;
    player.resources.spend({ credits: LAUNCH_PROBE_CREDIT_COST });

    const earthSpaces = solarSystem.getSpacesOnPlanet(EPlanet.EARTH);
    if (earthSpaces.length === 0) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'No Earth space found on solar system',
      );
    }
    const earthSpaceId = earthSpaces[0].id;
    const probe = solarSystem.placeProbe(player.id, earthSpaceId);
    player.probesInSpace += 1;

    return { probeId: probe.id, spaceId: earthSpaceId };
  }
}
