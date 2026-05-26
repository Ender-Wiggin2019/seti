import { ESectorTileId } from '@seti/common/constant/sectorSetup';
import type React from 'react';
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import { cn } from '@/lib/cn';
import type { IPublicSector } from '@/types/re-exports';
import {
  DEFAULT_SECTOR_DATA_SIZE_PX,
  SectorSignalList,
} from './SectorSignalList';

const DEFAULT_SECTOR_SIGNAL_STYLE = {
  // Default fallback. Real per-tile/per-half offsets live in
  // `PER_TILE_SIGNAL_LAYOUT` below — those are the ones that line the
  // dot arc up with each printed slot oval.
  0: { sigX: 10, sigY: 14, sigRot: 0, circleX: 0, circleY: -38 },
  1: { sigX: -10, sigY: 14, sigRot: 0, circleX: 8, circleY: -33 },
  dataSize: DEFAULT_SECTOR_DATA_SIZE_PX,
  circleSize: 24,
} as const;

interface ISectorSignalLayout {
  /** Pixel nudge of the arc wrapper from the sector half's centre. */
  sigX: number;
  sigY: number;
  /** Local rotation applied to the dot arc. */
  sigRot: number;
  /**
   * Polar-arc layout for the dots. Adjacent dots are placed tangent
   * (touching, no gap) along an arc of radius `arcRadiusPx`, with each
   * dot a `dotDiameterPx` circle. Total arc span scales with slot
   * count, so a 6-data sector spans wider than a 4-data sector but
   * every pair of neighbouring dots still touches.
   */
  arcRadiusPx: number;
  dotDiameterPx: number;
}

// Per-(tileId, half-index) printed-slot anchor. The data slot is part of
// each tile's printed art, so its position is fixed relative to the tile
// — independent of which cardinal the tile gets randomized to. Tile half
// 0 is the inner sector of the tile, half 1 is the outer.
const _SHARED_TILE_LAYOUT: Readonly<{
  0: ISectorSignalLayout;
  1: ISectorSignalLayout;
}> = {
  0: {
    sigX: 2,
    sigY: 2,
    sigRot: -23,
    arcRadiusPx: 300,
    dotDiameterPx: 20.5,
  },
  1: {
    sigX: -14,
    sigY: -3,
    sigRot: 21,
    arcRadiusPx: 300,
    dotDiameterPx: 20.5,
  },
};

// Per-tile overrides. Each tile has its own copy of the layout so its
// data-slot anchors can be tuned independently. Defaults are the same
// as `SHARED_TILE_LAYOUT`; tweak each tile to match its printed slot.
//
//   TILE_1: Procyon (blue)        + Vega (black)
//   TILE_2: Sirius A (blue)       + Barnard's Star (red)
//   TILE_3: Kepler 22 (yellow)    + Proxima Centauri (red)
//   TILE_4: 61 Virginis (yellow)  + Beta Pictoris (black)
//
// Half 0 = inner sector of the tile (the one printed on its left when
// the tile is unrotated); half 1 = outer (right when unrotated).
const PER_TILE_SIGNAL_LAYOUT: Record<
  ESectorTileId,
  Readonly<{ 0: ISectorSignalLayout; 1: ISectorSignalLayout }>
> = {
  [ESectorTileId.TILE_1]: {
    0: { sigX: 2, sigY: 3, sigRot: -23, arcRadiusPx: 300, dotDiameterPx: 22.8 },
    1: {
      sigX: -15.6,
      sigY: -3,
      sigRot: 21,
      arcRadiusPx: 300,
      dotDiameterPx: 22.8,
    },
  },
  [ESectorTileId.TILE_2]: {
    0: {
      sigX: 1,
      sigY: 0.5,
      sigRot: -23,
      arcRadiusPx: 300,
      dotDiameterPx: 22.8,
    },
    1: {
      sigX: -17,
      sigY: -6.5,
      sigRot: 20,
      arcRadiusPx: 300,
      dotDiameterPx: 22.8,
    },
  },
  [ESectorTileId.TILE_3]: {
    0: { sigX: 1, sigY: 2, sigRot: -23, arcRadiusPx: 300, dotDiameterPx: 22.8 },
    1: {
      sigX: -18,
      sigY: -6,
      sigRot: 20,
      arcRadiusPx: 300,
      dotDiameterPx: 22.8,
    },
  },
  [ESectorTileId.TILE_4]: {
    0: {
      sigX: -1,
      sigY: 1.7,
      sigRot: -23,
      arcRadiusPx: 300,
      dotDiameterPx: 22.8,
    },
    1: {
      sigX: -19,
      sigY: -5,
      sigRot: 20,
      arcRadiusPx: 300,
      dotDiameterPx: 22.8,
    },
  },
};

function getSectorSignalLayout(
  tileId: ESectorTileId | undefined,
  index: 0 | 1,
): ISectorSignalLayout {
  if (tileId !== undefined && PER_TILE_SIGNAL_LAYOUT[tileId]) {
    return PER_TILE_SIGNAL_LAYOUT[tileId][index];
  }
  return {
    ...DEFAULT_SECTOR_SIGNAL_STYLE[index],
    arcRadiusPx: 220,
    dotDiameterPx: 16,
  };
}

const TEXT_MODE_SECTOR_RADIUS_PERCENT = 42;

interface ISectorNodeViewProps {
  sector: IPublicSector;
  index: 0 | 1;
  sectorIndex: number;
  position: string;
  /**
   * The printed sector tile this node belongs to. The data-slot anchor
   * is part of each tile's art and stays fixed regardless of where the
   * tile is randomly placed on the board, so layout tunes by tileId.
   */
  tileId?: ESectorTileId;
  sectorName: string;
  playerColors: Record<string, string>;
  textMode: boolean;
  isSelectable: boolean;
  isEmphasized: boolean;
  canPickBySectorId: boolean;
  /**
   * Solar-board zoom factor (1 = design baseline). All px-based values
   * in `ISectorSignalLayout` are multiplied by this so the data slot
   * scales proportionally as the user zooms in/out.
   */
  boardScale?: number;
  onSelectSector: (sectorColor: IPublicSector['color']) => void;
  onSelectSectorId?: (sectorId: string) => void;
}

function formatSectorName(name: string): string {
  return name.replaceAll('-', ' ');
}

function normalizeRotationDeg(rotationDeg: number): number {
  const normalized = ((rotationDeg % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
}

function getTextModeSectorPosition(sectorIndex: number): {
  xPercent: number;
  yPercent: number;
  rotationDeg: number;
} {
  const normalizedSectorIndex = ((sectorIndex % 8) + 8) % 8;
  const rotationDeg = (normalizedSectorIndex + 0.5) * 45;
  const theta = (rotationDeg * Math.PI) / 180;

  return {
    xPercent: 50 + Math.sin(theta) * TEXT_MODE_SECTOR_RADIUS_PERCENT,
    yPercent: 50 - Math.cos(theta) * TEXT_MODE_SECTOR_RADIUS_PERCENT,
    rotationDeg: normalizeRotationDeg(rotationDeg),
  };
}

function formatBonus(bonus: IPublicSector['firstWinnerBonus']): string {
  if (bonus.length === 0) {
    return '-';
  }

  return bonus
    .map((item) => {
      if (item.type === 'vp') {
        return `${item.amount}VP`;
      }
      return `${item.trace}`;
    })
    .join('+');
}

function sameBonus(
  left: IPublicSector['firstWinnerBonus'],
  right: IPublicSector['otherWinnerBonus'],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function WinnerBonus({
  label,
  bonus,
  merged = false,
}: {
  label: string;
  bonus: IPublicSector['firstWinnerBonus'];
  merged?: boolean;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center rounded-full border border-surface-500/80 bg-surface-950/90 text-[7px] uppercase leading-none text-text-100 shadow-[0_1px_4px_rgba(0,0,0,0.45)]',
        merged ? 'col-span-2 min-w-[82px]' : 'min-w-[48px]',
      )}
    >
      <span
        className={cn(
          'grid h-[15px] place-items-center rounded-full border border-cyan-200/80 bg-cyan-200 text-[7px] font-bold text-surface-950',
          merged ? 'w-[28px]' : 'w-[15px]',
        )}
      >
        {label}
      </span>
      <span className='min-w-0 flex-1 truncate px-1 text-center'>
        {formatBonus(bonus)}
      </span>
    </div>
  );
}

export function SectorNodeView({
  sector,
  index,
  sectorIndex,
  position,
  tileId,
  sectorName,
  playerColors,
  textMode,
  isSelectable,
  isEmphasized,
  canPickBySectorId,
  boardScale = 1,
  onSelectSector,
  onSelectSectorId,
}: ISectorNodeViewProps): React.JSX.Element {
  const style = DEFAULT_SECTOR_SIGNAL_STYLE[index];
  const baseLayout = getSectorSignalLayout(tileId, index);
  // Multiply every px-based knob by the current board zoom so the data
  // slot stays aligned with the printed art at any zoom level. sigRot
  // is angular, leave it alone.
  const layout = {
    ...baseLayout,
    sigX: baseLayout.sigX * boardScale,
    sigY: baseLayout.sigY * boardScale,
    arcRadiusPx: baseLayout.arcRadiusPx * boardScale,
    dotDiameterPx: baseLayout.dotDiameterPx * boardScale,
  };
  const remainingData = sector.signals.filter(
    (sig) => sig.type === 'data',
  ).length;
  const dataCapability = sector.dataCapability;
  const bonusesAreSame = sameBonus(
    sector.firstWinnerBonus ?? [],
    sector.otherWinnerBonus ?? [],
  );
  const xPos = index === 0 ? '30%' : '70%';
  function handleClick(): void {
    if (!isSelectable) {
      return;
    }
    if (canPickBySectorId && onSelectSectorId) {
      onSelectSectorId(sector.sectorId);
      return;
    }
    onSelectSector(sector.color);
  }

  if (textMode) {
    const textPosition = getTextModeSectorPosition(sectorIndex);

    return (
      <div
        key={`${position}-${sector.sectorId}`}
        className='absolute'
        style={{
          left: `${textPosition.xPercent}%`,
          top: `${textPosition.yPercent}%`,
          transform: [
            'translate(-50%, -50%)',
            `rotate(${textPosition.rotationDeg}deg)`,
          ].join(' '),
          transformOrigin: 'center',
        }}
      >
        <div
          className={cn(
            'relative flex h-[96px] w-[122px] flex-col items-center justify-center gap-1 border border-cyan-100/70 bg-surface-950/95 px-2 py-1.5 font-mono text-text-100 shadow-[0_0_0_1px_rgba(8,13,25,0.9),0_8px_18px_rgba(0,0,0,0.5)]',
            isEmphasized &&
              'border-amber-300/90 shadow-[0_0_0_2px_rgba(251,191,36,0.45),0_8px_18px_rgba(0,0,0,0.5)]',
          )}
          style={{
            clipPath:
              index === 0
                ? 'polygon(4% 8%, 100% 0, 94% 100%, 0 92%)'
                : 'polygon(0 0, 96% 8%, 100% 92%, 6% 100%)',
          }}
        >
          <div className='w-full text-center uppercase leading-tight'>
            <div className='truncate text-[8px] font-bold text-text-100'>
              {formatSectorName(sectorName)}
            </div>
            <div className='mt-0.5 flex items-center justify-center gap-1 text-[7px] text-text-300'>
              <span>{sector.color}</span>
              <span>
                {remainingData}/{dataCapability}
              </span>
              {sector.sectorWinners.length > 0 ? (
                <span>W{sector.sectorWinners.length}</span>
              ) : null}
            </div>
          </div>

          <div className='grid w-full grid-cols-2 gap-1'>
            {bonusesAreSame ? (
              <WinnerBonus
                label='WIN'
                bonus={sector.firstWinnerBonus ?? []}
                merged
              />
            ) : (
              <>
                <WinnerBonus
                  label='1st'
                  bonus={sector.firstWinnerBonus ?? []}
                />
                <WinnerBonus label='2+' bonus={sector.otherWinnerBonus ?? []} />
              </>
            )}
          </div>

          <div className='flex max-w-full items-center gap-[2px] rounded-full border border-white/75 bg-surface-900/90 px-1 py-0.5'>
            <SectorSignalList
              signals={sector.signals}
              capacity={dataCapability}
              playerColors={playerColors}
              textMode
            />
          </div>

          <HotspotButton
            sceneId='sector-board'
            hotspotId={`${position}-${sector.sectorId}`}
            variant='text'
            baseWidth={122}
            baseHeight={96}
            x={61}
            y={48}
            width={122}
            height={96}
            shape='rect'
            testId={`sector-node-${position}-${index}`}
            debugLabel={`${formatSectorName(sectorName)} ${sector.color}`}
            className={cn(
              'pointer-events-auto transition-colors focus-visible:ring-accent-400/80',
              isSelectable ? 'hover:bg-accent-500/10' : 'cursor-default',
            )}
            onClick={handleClick}
            disabled={!isSelectable}
            ariaLabel={`Mark ${sector.color} (${sector.sectorId}) sector`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      key={`${position}-${sector.sectorId}`}
      className='absolute h-[44px] w-[120px]'
      style={{
        left: xPos,
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className='absolute h-[44px] w-[120px]'
        style={{
          left: '50%',
          top: '50%',
          transform: [
            'translate(-50%, -50%)',
            `translate(var(--sector-sig-x-${index}, ${layout.sigX}px), var(--sector-sig-y-${index}, ${layout.sigY}px))`,
            `rotate(var(--sector-sig-rot-${index}, ${layout.sigRot}deg))`,
          ].join(' '),
          transformOrigin: 'center',
        }}
      >
        <SectorSignalList
          signals={sector.signals}
          capacity={dataCapability}
          playerColors={playerColors}
          textMode={false}
          slotTestIdPrefix={`sector-node-${position}-${index}-slot`}
          hotspotSceneId='sector-board'
          hotspotIdPrefix={`${position}-${sector.sectorId}-slot`}
          hotspotDebugLabelPrefix={`${formatSectorName(sectorName)} ${sector.color} signal`}
          arc={{
            radiusPx: layout.arcRadiusPx,
            dotDiameterPx: layout.dotDiameterPx,
          }}
        />
      </div>

      <HotspotButton
        sceneId='sector-board'
        hotspotId={`${position}-${sector.sectorId}`}
        variant='image'
        baseWidth={120}
        baseHeight={44}
        x={60 + style.circleX}
        y={22 + style.circleY}
        width={DEFAULT_SECTOR_SIGNAL_STYLE.circleSize}
        height={DEFAULT_SECTOR_SIGNAL_STYLE.circleSize}
        testId={`sector-node-${position}-${index}`}
        debugLabel={`${formatSectorName(sectorName)} ${sector.color}`}
        className={cn(
          'pointer-events-auto border-2 transition-colors',
          isSelectable
            ? 'border-accent-400 hover:bg-accent-500/45'
            : 'cursor-default border-surface-500/40 bg-surface-800/30',
          isEmphasized &&
            'border-amber-300/90 bg-amber-500/20 shadow-[0_0_0_2px_rgba(251,191,36,0.55)]',
        )}
        onClick={handleClick}
        disabled={!isSelectable}
        ariaLabel={`Mark ${sector.color} (${sector.sectorId}) sector`}
      />

      {(isSelectable || isEmphasized) && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute rounded-full border',
            isEmphasized
              ? 'border-amber-300/90 bg-amber-500/18 shadow-[0_0_14px_rgba(251,191,36,0.55)]'
              : 'border-accent-300/80 bg-accent-500/14 shadow-[0_0_12px_rgba(34,197,94,0.35)]',
          )}
          style={{
            width: `var(--sector-circle-size, ${DEFAULT_SECTOR_SIGNAL_STYLE.circleSize}px)`,
            height: `var(--sector-circle-size, ${DEFAULT_SECTOR_SIGNAL_STYLE.circleSize}px)`,
            left: '50%',
            top: '50%',
            transform: [
              'translate(-50%, -50%) scale(1.9)',
              `translate(var(--sector-circle-x-${index}, ${style.circleX}px), var(--sector-circle-y-${index}, ${style.circleY}px))`,
            ].join(' '),
          }}
        />
      )}
    </div>
  );
}
