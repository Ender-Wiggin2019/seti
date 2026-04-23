import { EPlanet } from '@seti/common/types/protocol/enums';
import type { IGame } from '../../IGame.js';

export function syncProbeCountsForPlayer(game: IGame, playerId: string): void {
  if (game.solarSystem === null || game.planetaryBoard === null) {
    return;
  }

  for (const planet of Object.values(EPlanet)) {
    if (planet === EPlanet.EARTH) {
      continue;
    }
    if (!game.solarSystem.getPlanetLocation(planet)) {
      continue;
    }
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

  const ss = game.solarSystem as unknown as {
    consumeProbeByPlanet?: (pid: string, p: EPlanet) => unknown;
    getSpacesOnPlanet: (p: EPlanet) => Array<{
      occupants: Array<{ playerId: string }>;
    }>;
  };

  if (typeof ss.consumeProbeByPlanet === 'function') {
    return ss.consumeProbeByPlanet(playerId, planet) !== null;
  }

  const spaces = ss.getSpacesOnPlanet(planet);
  for (const space of spaces) {
    const probeIndex = space.occupants.findIndex(
      (probe) => probe.playerId === playerId,
    );
    if (probeIndex >= 0) {
      space.occupants.splice(probeIndex, 1);
      return true;
    }
  }
  return false;
}
