import type { IPublicSectorState } from '../types/protocol/gameState';

export interface ISectorProgress {
  filled: number;
  total: number;
}

export interface ISectorStanding {
  playerId: string;
  markerCount: number;
}

/** 扇区是否还能放置信号（还有数据槽未被移除） */
export function canPlaceSignal(sector: IPublicSectorState): boolean {
  return !isSectorComplete(sector);
}

/** 扇区完成进度 (filled = 已移除数据数, total = 总槽数) */
export function getSectorProgress(sector: IPublicSectorState): ISectorProgress {
  const total = sector.dataSlots.length;
  const remaining = sector.dataSlots.filter((slot) => slot !== null).length;
  return {
    filled: total - remaining,
    total,
  };
}

/** 扇区是否已完成（所有数据槽已移除） */
export function isSectorComplete(sector: IPublicSectorState): boolean {
  return sector.dataSlots.every((dataToken) => dataToken === null);
}

/** 获取各玩家在扇区的标记数量排名 (用于 UI 展示竞争态势) */
export function getSectorStandings(
  sector: IPublicSectorState,
): ISectorStanding[] {
  const markerCountByPlayer = new Map<string, number>();
  for (const marker of sector.markerSlots) {
    markerCountByPlayer.set(
      marker.playerId,
      (markerCountByPlayer.get(marker.playerId) ?? 0) + 1,
    );
  }

  return Array.from(markerCountByPlayer.entries())
    .map(([playerId, markerCount]) => ({
      playerId,
      markerCount,
    }))
    .sort((left, right) => right.markerCount - left.markerCount);
}
