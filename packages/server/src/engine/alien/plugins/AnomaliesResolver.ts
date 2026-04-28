import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import type { ISolarSystemAlienTokenComponent } from '../../board/SolarSystem.js';
import { getSectorIndexByPlanet } from '../../effects/scan/ScanEffectUtils.js';
import type { IGame } from '../../IGame.js';
import type { AnomaliesAlienBoard, TSlotReward } from '../AlienBoard.js';
import { isAnomaliesAlienBoard } from '../AlienBoard.js';

export interface IAnomalyToken {
  board: AnomaliesAlienBoard;
  token: ISolarSystemAlienTokenComponent;
  sectorIndex: number;
  color: ETrace;
  rewards: TSlotReward[];
}

export function getAnomaliesBoard(
  game: IGame,
): AnomaliesAlienBoard | undefined {
  const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
  return isAnomaliesAlienBoard(board) ? board : undefined;
}

export function getEarthSectorIndex(game: IGame): number | undefined {
  if (!game.solarSystem) return undefined;
  return getSectorIndexByPlanet(game.solarSystem, EPlanet.EARTH) ?? undefined;
}

export function getAnomalyTokens(game: IGame): IAnomalyToken[] {
  const board = getAnomaliesBoard(game);
  if (!board || !game.solarSystem) return [];

  return game.solarSystem
    .getAlienTokensByType(EAlienType.ANOMALIES)
    .map((token) => ({
      board,
      token,
      sectorIndex: token.sectorIndex,
      color: token.traceColor,
      rewards: token.rewards,
    }));
}

export function getAnomalySectorIndexes(game: IGame): number[] {
  return [...new Set(getAnomalyTokens(game).map((token) => token.sectorIndex))];
}

export function getAnomalyTokenAtSector(
  game: IGame,
  sectorIndex: number,
): IAnomalyToken | undefined {
  return getAnomalyTokens(game).find(
    (token) => token.sectorIndex === sectorIndex,
  );
}

export function getNextTriggeredAnomalyToken(
  game: IGame,
): IAnomalyToken | undefined {
  const earthSector = getEarthSectorIndex(game);
  const sectorCount = game.sectors.length;
  if (earthSector === undefined || sectorCount <= 0) {
    return undefined;
  }

  const tokens = getAnomalyTokens(game);
  if (tokens.length === 0) {
    return undefined;
  }

  for (let offset = 1; offset <= sectorCount; offset += 1) {
    const targetSector = (earthSector + sectorCount - offset) % sectorCount;
    const token = tokens.find(
      (candidate) => candidate.sectorIndex === targetSector,
    );
    if (token) {
      return token;
    }
  }

  return undefined;
}

export function countPlayerSignalsInAnomalySectors(
  game: IGame,
  playerId: string,
): number {
  let total = 0;
  for (const sectorIndex of getAnomalySectorIndexes(game)) {
    const sector = game.sectors[sectorIndex];
    if (!sector) continue;
    total += sector.getPlayerMarkerCount(playerId);
  }
  return total;
}
