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

export interface IOrbitExecutionResult {
  planet: EPlanet;
  vpGained: number;
}

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

    if (!player.resources.has({ credits: 1, energy: 1 })) {
      return false;
    }

    this.syncProbeCountsForPlayer(game, player.id);
    return game.planetaryBoard.canOrbit(planet, player.id);
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

    const planetaryBoard = game.planetaryBoard;
    if (planetaryBoard === null) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'PlanetaryBoard is not initialized',
      );
    }

    player.resources.spend({ credits: 1, energy: 1 });
    const consumed = this.consumeProbeFromPlanet(game, player.id, planet);
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
    const orbitResult = planetaryBoard.orbit(planet, player.id);
    this.syncProbeCountsForPlayer(game, player.id);
    player.score += orbitResult.vpGained;

    return {
      planet,
      vpGained: orbitResult.vpGained,
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
