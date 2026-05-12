import { ETech } from '@seti/common/types/element';
import { type ETechId, getTechDescriptor } from '@seti/common/types/tech';

const COMPUTER_TILE_BY_LEVEL: Record<number, string> = {
  0: '/assets/seti/tech/tiles/techComp3.webp',
  1: '/assets/seti/tech/tiles/techComp4.webp',
  2: '/assets/seti/tech/tiles/techComp2.webp',
  3: '/assets/seti/tech/tiles/techComp1.webp',
};

export function getTechTileImageByCategory(tech: ETech, level: number): string {
  if (tech === ETech.PROBE) {
    if (level === 0) return '/assets/seti/tech/tiles/techFly1_SE.0.0.3.webp';
    if (level === 2) return '/assets/seti/tech/tiles/techFly3_SE0.2.jpg';
    return `/assets/seti/tech/tiles/techFly${level + 1}.webp`;
  }

  if (tech === ETech.SCAN) {
    if (level === 2) return '/assets/seti/tech/tiles/techLook3_SE0.1.webp';
    if (level === 3) return '/assets/seti/tech/tiles/techLook4_SE0.4.jpg';
    return `/assets/seti/tech/tiles/techLook${level + 1}.webp`;
  }

  return (
    COMPUTER_TILE_BY_LEVEL[level] ??
    `/assets/seti/tech/tiles/techComp${level + 1}.webp`
  );
}

export function getTechTileImageById(techId: ETechId): string {
  const { type, level } = getTechDescriptor(techId);
  return getTechTileImageByCategory(type, level);
}
