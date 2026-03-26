import { EPlanet } from '@seti/common/types/protocol/enums';
import type { IGame } from '../../IGame.js';

const NON_EARTH_PLANETS: readonly EPlanet[] = [
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
];

export function syncProbeCountsForPlayer(game: IGame, playerId: string): void {
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

export function consumeProbeFromPlanet(
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
