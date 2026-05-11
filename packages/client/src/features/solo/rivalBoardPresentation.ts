import { RIVAL_TECH_CATEGORY_ORDER_BY_BOARD } from '@seti/common/constant/solo';
import { ETech } from '@seti/common/types/element';
import {
  type ETechId,
  getTechDescriptor,
  type TTechCategory,
} from '@seti/common/types/tech';
import type { TRivalBoardConfigId } from '@/types/re-exports';

export interface IRivalBoardPoint {
  x: number;
  y: number;
}

export const RIVAL_BOARD_IMAGE_SRC_BY_ID: Record<TRivalBoardConfigId, string> =
  {
    'rival-board-1': '/assets/seti/solo/boards/rival-board-1.jpg',
    'rival-board-2': '/assets/seti/solo/boards/rival-board-2.jpg',
    'rival-board-3': '/assets/seti/solo/boards/rival-board-3.jpg',
    'rival-board-4': '/assets/seti/solo/boards/rival-board-4.jpg',
  };

export const RIVAL_BOARD_PROGRESS_MARKER_POINTS: readonly IRivalBoardPoint[] = [
  { x: 85.36, y: 19.02 },
  { x: 88.11, y: 32.65 },
  { x: 89, y: 49.13 },
  { x: 87.85, y: 65.39 },
  { x: 84.88, y: 78.44 },
  { x: 80.64, y: 85.86 },
  { x: 75.91, y: 86.29 },
  { x: 71.57, y: 79.63 },
  { x: 68.41, y: 67.13 },
  { x: 67.03, y: 51.1 },
  { x: 67.68, y: 34.48 },
  { x: 70.24, y: 20.37 },
];

export const RIVAL_BOARD_COMPUTER_POINTS: readonly IRivalBoardPoint[] = [
  { x: 26, y: 83 },
  { x: 31, y: 83 },
  { x: 36, y: 83 },
  { x: 41, y: 83 },
  { x: 46, y: 83 },
  { x: 51, y: 83 },
];

export const RIVAL_BOARD_DATA_POOL_POINTS: readonly IRivalBoardPoint[] = [
  { x: 20, y: 75 },
  { x: 20, y: 89 },
  { x: 15, y: 75 },
  { x: 15, y: 89 },
  { x: 10, y: 75 },
  { x: 10, y: 89 },
  { x: 5, y: 75 },
  { x: 5, y: 89 },
  { x: 3, y: 75 },
  { x: 3, y: 89 },
];

export const RIVAL_BOARD_TECH_SLOT_POINTS: readonly IRivalBoardPoint[] = [
  { x: 20, y: 30 },
  { x: 35, y: 30 },
  { x: 50, y: 30 },
];

export function getRivalBoardImageSrc(
  boardConfigId: TRivalBoardConfigId,
): string {
  return RIVAL_BOARD_IMAGE_SRC_BY_ID[boardConfigId];
}

export function getRivalProgressMarkerPoint(
  progressSlot: number,
): IRivalBoardPoint {
  const normalized =
    ((progressSlot % RIVAL_BOARD_PROGRESS_MARKER_POINTS.length) +
      RIVAL_BOARD_PROGRESS_MARKER_POINTS.length) %
    RIVAL_BOARD_PROGRESS_MARKER_POINTS.length;
  return RIVAL_BOARD_PROGRESS_MARKER_POINTS[normalized];
}

export function getRivalBoardTechCategoryOrder(
  boardConfigId: TRivalBoardConfigId,
): readonly TTechCategory[] {
  return (
    RIVAL_TECH_CATEGORY_ORDER_BY_BOARD[boardConfigId] ??
    RIVAL_TECH_CATEGORY_ORDER_BY_BOARD['rival-board-1']
  );
}

export function getRivalBoardTechPoint(
  boardConfigId: TRivalBoardConfigId,
  category: TTechCategory,
): IRivalBoardPoint {
  const categoryOrder = getRivalBoardTechCategoryOrder(boardConfigId);
  const slotIndex = categoryOrder.indexOf(category);
  return (
    RIVAL_BOARD_TECH_SLOT_POINTS[slotIndex] ?? RIVAL_BOARD_TECH_SLOT_POINTS[0]
  );
}

export function getRivalTechTileImage(techId: ETechId): string {
  const { type, level } = getTechDescriptor(techId);

  if (type === ETech.PROBE) {
    if (level === 0) return '/assets/seti/tech/tiles/techFly1_SE.0.0.3.webp';
    if (level === 2) return '/assets/seti/tech/tiles/techFly3_SE0.2.jpg';
    return `/assets/seti/tech/tiles/techFly${level + 1}.webp`;
  }

  if (type === ETech.SCAN) {
    if (level === 2) return '/assets/seti/tech/tiles/techLook3_SE0.1.webp';
    if (level === 3) return '/assets/seti/tech/tiles/techLook4_SE0.4.jpg';
    return `/assets/seti/tech/tiles/techLook${level + 1}.webp`;
  }

  return `/assets/seti/tech/tiles/techComp${level + 1}.webp`;
}
