import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

const NON_EARTH_PLANETS: readonly EPlanet[] = [
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
];

export interface ILandActionOptions {
  isMoon?: boolean;
}

export interface ILandExecutionResult {
  planet: EPlanet;
  isMoon: boolean;
  landingCost: number;
  vpGained: number;
  firstLandDataGained: number;
  lifeTraceGained: number;
}

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

    this.syncProbeCountsForPlayer(game, player.id);
    return game.planetaryBoard.canLand(planet, player.id, {
      isMoon: options.isMoon,
      energy: player.resources.energy,
    });
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

    const planetaryBoard = game.planetaryBoard;
    if (planetaryBoard === null) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'PlanetaryBoard is not initialized',
      );
    }

    const landingCost = planetaryBoard.getLandingCost(planet, player.id);
    player.resources.spend({ energy: landingCost });

    const consumed = this.consumeProbeFromPlanet(game, player.id, planet);
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
    const landingResult = planetaryBoard.land(planet, player.id, {
      isMoon: options.isMoon,
    });
    this.syncProbeCountsForPlayer(game, player.id);
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

  private static syncProbeCountsForPlayer(game: IGame, playerId: string): void {
    if (game.solarSystem === null || game.planetaryBoard === null) {
      return;
    }

    for (const planet of NON_EARTH_PLANETS) {
      const spaces = game.solarSystem.getSpacesOnPlanet(planet);
      let count = 0;
      for (const space of spaces) {
        count += game.solarSystem
          .getProbesAt(space.id)
          .filter((probe) => probe.playerId === playerId).length;
      }
      game.planetaryBoard.setProbeCount(planet, playerId, count);
    }
  }

  private static consumeProbeFromPlanet(
    game: IGame,
    playerId: string,
    planet: EPlanet,
  ): boolean {
    if (game.solarSystem === null) {
      return false;
    }

    const spaces = game.solarSystem.getSpacesOnPlanet(planet);
    for (const space of spaces) {
      const probeIndex = space.occupants.findIndex(
        (probe) => probe.playerId === playerId,
      );
      if (probeIndex < 0) {
        continue;
      }

      space.occupants.splice(probeIndex, 1);
      return true;
    }

    return false;
  }
}
