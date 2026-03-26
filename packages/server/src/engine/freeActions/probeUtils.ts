import type { ISolarProbe } from '../board/SolarSystem.js';
import type { IGame } from '../IGame.js';

export interface IPlayerProbeLocation {
  probe: ISolarProbe;
  spaceId: string;
}

export function findPlayerProbes(
  game: IGame,
  playerId: string,
): IPlayerProbeLocation[] {
  if (game.solarSystem === null) {
    return [];
  }

  const result: IPlayerProbeLocation[] = [];
  for (const space of game.solarSystem.spaces) {
    for (const probe of space.occupants) {
      if (probe.playerId === playerId) {
        result.push({ probe, spaceId: space.id });
      }
    }
  }
  return result;
}

export function findProbeAtSpace(
  game: IGame,
  playerId: string,
  spaceId: string,
): ISolarProbe | undefined {
  if (game.solarSystem === null) {
    return undefined;
  }

  const occupants = game.solarSystem.getProbesAt(spaceId);
  return occupants.find((p) => p.playerId === playerId);
}
