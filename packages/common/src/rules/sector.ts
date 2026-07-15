import type { IPublicSectorState } from '../types/protocol/gameState';

export interface ISectorProgress {
  filled: number;
  total: number;
}

export interface ISectorStanding {
  playerId: string;
  markerCount: number;
}

/** Whether the sector still has data signals that can be displaced. */
export function canPlaceSignal(sector: IPublicSectorState): boolean {
  return sector.signals.some((s) => s.type === 'data');
}

/** Sector fill progress (filled = player markers, total = capacity). */
export function getSectorProgress(sector: IPublicSectorState): ISectorProgress {
  const total = sector.dataSlotCapacity;
  const filled = sector.signals.filter((s) => s.type === 'player').length;
  return { filled, total };
}

/** True when no data signals remain — sector is fulfilled. */
export function isSectorComplete(sector: IPublicSectorState): boolean {
  return (
    sector.signals.length > 0 && !sector.signals.some((s) => s.type === 'data')
  );
}

/** Marker counts per player sorted descending (for UI standings display). */
export function getSectorStandings(
  sector: IPublicSectorState,
): ISectorStanding[] {
  const markerCountByPlayer = new Map<string, number>();
  for (const signal of sector.signals) {
    if (signal.type === 'player' && signal.playerId) {
      markerCountByPlayer.set(
        signal.playerId,
        (markerCountByPlayer.get(signal.playerId) ?? 0) + 1,
      );
    }
  }

  return Array.from(markerCountByPlayer.entries())
    .map(([playerId, markerCount]) => ({
      playerId,
      markerCount,
    }))
    .sort((left, right) => right.markerCount - left.markerCount);
}
