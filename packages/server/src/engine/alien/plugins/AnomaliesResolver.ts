import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import type { IGame } from '../../IGame.js';
import type { AlienBoard, ITraceSlot, TSlotReward } from '../AlienBoard.js';

const ANOMALY_TOKEN_PREFIX = 'anomaly-token';
const TOKEN_COLORS: readonly ETrace[] = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
];

export interface IAnomalyToken {
  board: AlienBoard;
  slot: ITraceSlot;
  sectorIndex: number;
  color: ETrace;
  rewards: TSlotReward[];
}

export function getAnomaliesBoard(game: IGame): AlienBoard | undefined {
  return game.alienState.getBoardByType(EAlienType.ANOMALIES);
}

export function getEarthSectorIndex(game: IGame): number | undefined {
  if (!game.solarSystem) return undefined;
  const earthSpace = game.solarSystem.getSpacesOnPlanet(EPlanet.EARTH)[0];
  if (!earthSpace) return undefined;
  return Math.floor(earthSpace.indexInRing / earthSpace.ringIndex);
}

export function getAnomalyTokens(game: IGame): IAnomalyToken[] {
  const board = getAnomaliesBoard(game);
  if (!board) return [];

  return board.slots
    .filter((slot) => slot.slotId.includes(ANOMALY_TOKEN_PREFIX))
    .map((slot) => {
      const parsed = parseAnomalyTokenSlotId(slot.slotId);
      if (!parsed) return undefined;
      return {
        board,
        slot,
        sectorIndex: parsed.sectorIndex,
        color: parsed.color,
        rewards: slot.rewards,
      } satisfies IAnomalyToken;
    })
    .filter((token): token is IAnomalyToken => token !== undefined);
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
    const targetSector = (earthSector + offset) % sectorCount;
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

function parseAnomalyTokenSlotId(
  slotId: string,
): { sectorIndex: number; color: ETrace } | undefined {
  const parts = slotId.split('|');
  if (parts.length !== 3) return undefined;

  const sectorIndex = Number(parts[1]);
  const color = parts[2] as ETrace;
  if (!Number.isInteger(sectorIndex)) return undefined;
  if (!TOKEN_COLORS.includes(color)) return undefined;

  return { sectorIndex, color };
}
