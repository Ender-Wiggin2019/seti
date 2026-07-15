import type {
  ISolarSystemWheelCell,
  TSolarSystemWheelIndex,
  TSolarSystemWheels,
} from '../constant/sectorSetup';

export const SOLAR_WHEEL_LAYER_ORDER: ReadonlyArray<TSolarSystemWheelIndex> = [
  1, 2, 3, 4,
];

export type TSolarWheelDiscAngles = readonly number[];

export function normalizeSolarWheelSlotIndex(index: number): number {
  return ((index % 8) + 8) % 8;
}

export function getSolarWheelAngle(
  wheel: TSolarSystemWheelIndex,
  discAngles: TSolarWheelDiscAngles,
): number {
  if (wheel === 4) {
    return 0;
  }
  return discAngles[wheel - 1] ?? 0;
}

export function getSolarWheelLocalIndexFromBoardIndex(
  boardIndex: number,
  wheel: TSolarSystemWheelIndex,
  discAngles: TSolarWheelDiscAngles,
): number {
  return normalizeSolarWheelSlotIndex(
    boardIndex + getSolarWheelAngle(wheel, discAngles),
  );
}

export function getSolarWheelBoardIndexFromLocalIndex(
  localIndex: number,
  wheel: TSolarSystemWheelIndex,
  discAngles: TSolarWheelDiscAngles,
): number {
  return normalizeSolarWheelSlotIndex(
    localIndex - getSolarWheelAngle(wheel, discAngles),
  );
}

export function getSolarWheelCellAtBoard(
  wheels: TSolarSystemWheels,
  wheel: TSolarSystemWheelIndex,
  bandIndex: number,
  boardIndex: number,
  discAngles: TSolarWheelDiscAngles,
): ISolarSystemWheelCell {
  const localIndex = getSolarWheelLocalIndexFromBoardIndex(
    boardIndex,
    wheel,
    discAngles,
  );
  return wheels[wheel][bandIndex][localIndex];
}

export function isSolarWheelCellOpaque(cell: ISolarSystemWheelCell): boolean {
  return cell.cell.type !== 'NULL';
}

export function resolveTopVisibleSolarWheelCell(
  wheels: TSolarSystemWheels,
  bandIndex: number,
  boardIndex: number,
  discAngles: TSolarWheelDiscAngles,
): { wheel: TSolarSystemWheelIndex; cell: ISolarSystemWheelCell } | null {
  for (const wheel of SOLAR_WHEEL_LAYER_ORDER) {
    const cell = getSolarWheelCellAtBoard(
      wheels,
      wheel,
      bandIndex,
      boardIndex,
      discAngles,
    );
    if (isSolarWheelCellOpaque(cell)) {
      return { wheel, cell };
    }
  }
  return null;
}
