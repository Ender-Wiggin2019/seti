interface ISectorSlotLayout {
  xPercent: number;
  yPercent: number;
  rotationDeg: number;
}

interface ISectorAssetSet {
  sectorSrc: string;
  labelSrc: string;
}

export interface ISectorVisualOverrides {
  slotIndex?: number;
  xPercent?: number;
  yPercent?: number;
  rotationDeg?: number;
  imageVariant?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export interface ISectorVisualConfig {
  slotIndex: number;
  xPercent: number;
  yPercent: number;
  rotationDeg: number;
  sectorSrc: string;
  labelSrc: string;
}

const SECTOR_SLOT_LAYOUTS: readonly ISectorSlotLayout[] = [
  { xPercent: 50, yPercent: -10, rotationDeg: 0 },
  { xPercent: 94, yPercent: 6, rotationDeg: 45 },
  { xPercent: 112, yPercent: 50, rotationDeg: 90 },
  { xPercent: 94, yPercent: 94, rotationDeg: 135 },
  { xPercent: 50, yPercent: 112, rotationDeg: 180 },
  { xPercent: 6, yPercent: 94, rotationDeg: 225 },
  { xPercent: -12, yPercent: 50, rotationDeg: 270 },
  { xPercent: 6, yPercent: 6, rotationDeg: 315 },
];

const SECTOR_ASSETS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, ISectorAssetSet> = {
  1: {
    sectorSrc: '/assets/seti/sky/skySiriusA.png',
    labelSrc: '',
  },
  2: {
    sectorSrc: '/assets/seti/sky/skyBernard.png',
    labelSrc: '',
  },
  3: {
    sectorSrc: '/assets/seti/sky/skyVega.png',
    labelSrc: '',
  },
  4: {
    sectorSrc: '/assets/seti/sky/skyKepler22.png',
    labelSrc: '',
  },
  5: {
    sectorSrc: '/assets/seti/sky/skyProximaCentauri.png',
    labelSrc: '',
  },
  6: {
    sectorSrc: '/assets/seti/sky/skyBetaPictoris.png',
    labelSrc: '',
  },
  7: {
    sectorSrc: '/assets/seti/sky/skyProcryon.png',
    labelSrc: '',
  },
  8: {
    sectorSrc: '/assets/seti/sky/sky61Virginis.png',
    labelSrc: '',
  },
};

function modulo(input: number, size: number): number {
  return ((input % size) + size) % size;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function inferSlotIndexFromSectorId(sectorId: string): number {
  const numericSuffix = sectorId.match(/(\d+)$/);
  if (numericSuffix) {
    return modulo(
      Number.parseInt(numericSuffix[1], 10),
      SECTOR_SLOT_LAYOUTS.length,
    );
  }

  return modulo(hashString(sectorId), SECTOR_SLOT_LAYOUTS.length);
}

function inferAssetVariant(slotIndex: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
  return (modulo(slotIndex, 8) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export function getSectorVisualConfig(
  sectorId: string,
  overrides?: ISectorVisualOverrides,
): ISectorVisualConfig {
  const inferredSlot = inferSlotIndexFromSectorId(sectorId);
  const slotIndex = modulo(
    overrides?.slotIndex ?? inferredSlot,
    SECTOR_SLOT_LAYOUTS.length,
  );
  const layout = SECTOR_SLOT_LAYOUTS[slotIndex];
  const variant = overrides?.imageVariant ?? inferAssetVariant(slotIndex);
  const assets = SECTOR_ASSETS[variant];

  return {
    slotIndex,
    xPercent: overrides?.xPercent ?? layout.xPercent,
    yPercent: overrides?.yPercent ?? layout.yPercent,
    rotationDeg: overrides?.rotationDeg ?? layout.rotationDeg,
    sectorSrc: assets.sectorSrc,
    labelSrc: assets.labelSrc,
  };
}
