import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import {
  consumeProbeFromPlanet,
  syncProbeCountsForPlayer,
} from './ProbeEffectUtils.js';

export interface IOrbitProbeEffectResult {
  planet: EPlanet;
  vpGained: number;
}

export class OrbitProbeEffect {
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

    syncProbeCountsForPlayer(game, player.id);
    return game.planetaryBoard.canOrbit(planet, player.id);
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
  ): IOrbitProbeEffectResult {
    if (!this.canExecute(player, game, planet)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'OrbitProbe effect is not currently legal',
        {
          playerId: player.id,
          planet,
        },
      );
    }

    const consumed = consumeProbeFromPlanet(game, player.id, planet);
    if (!consumed) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No probe available to enter orbit',
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

    const orbitResult = planetaryBoard.orbit(planet, player.id);
    syncProbeCountsForPlayer(game, player.id);
    player.score += orbitResult.vpGained;
    player.income.addTuckedIncome(orbitResult.incomeResource);

    return {
      planet,
      vpGained: orbitResult.vpGained,
    };
  }
}
