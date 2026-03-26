import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';

export interface ILaunchProbeEffectResult {
  probeId: string;
  spaceId: string;
}

export class LaunchProbeEffect {
  public static canExecute(player: IPlayer, game: IGame): boolean {
    if (game.solarSystem === null) {
      return false;
    }
    return player.probesInSpace < player.probeSpaceLimit;
  }

  public static execute(
    player: IPlayer,
    game: IGame,
  ): ILaunchProbeEffectResult {
    if (!this.canExecute(player, game)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'LaunchProbe effect is not currently legal',
        { playerId: player.id },
      );
    }

    const earthSpaces = game.solarSystem!.getSpacesOnPlanet(EPlanet.EARTH);
    if (earthSpaces.length === 0) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'No Earth space found on solar system',
      );
    }

    const earthSpaceId = earthSpaces[0].id;
    const probe = game.solarSystem!.placeProbe(player.id, earthSpaceId);
    player.probesInSpace += 1;

    return { probeId: probe.id, spaceId: earthSpaceId };
  }
}
