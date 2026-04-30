import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { TechModifierQuery } from '../../tech/TechModifierQuery.js';

export interface ILaunchProbeEffectResult {
  probeId: string;
  spaceId: string;
}

export class LaunchProbeEffect {
  public static canExecute(player: IPlayer, game: IGame): boolean {
    if (game.solarSystem === null) {
      return false;
    }

    const effectiveLimit = TechModifierQuery.fromTechIds(
      player.techs,
    ).getProbeSpaceLimit(player.probeSpaceLimit);
    return player.probesInSpace < effectiveLimit;
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

    const solarSystem = game.solarSystem;
    if (solarSystem === null) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'Solar system not initialized',
      );
    }

    const earthSpaceId = resolveEarthSpaceId(solarSystem);
    if (earthSpaceId === null) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'No Earth space found on solar system',
      );
    }

    const probe = solarSystem.placeProbe(player.id, earthSpaceId);
    player.probesInSpace += 1;

    return { probeId: probe.id, spaceId: earthSpaceId };
  }
}

function resolveEarthSpaceId(solarSystem: {
  getPlanetLocation?: (planet: EPlanet) => { space: { id: string } } | null;
  getSpacesOnPlanet: (planet: EPlanet) => Array<{ id: string }>;
}): string | null {
  if (typeof solarSystem.getPlanetLocation === 'function') {
    const location = solarSystem.getPlanetLocation(EPlanet.EARTH);
    return location?.space.id ?? null;
  }
  const spaces = solarSystem.getSpacesOnPlanet(EPlanet.EARTH);
  return spaces[0]?.id ?? null;
}
