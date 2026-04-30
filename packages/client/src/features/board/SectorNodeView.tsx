import type React from 'react';
import { cn } from '@/lib/cn';
import type { IPublicSector } from '@/types/re-exports';
import {
  DEFAULT_SECTOR_DATA_SIZE_PX,
  SectorSignalList,
} from './SectorSignalList';

const DEFAULT_SECTOR_SIGNAL_STYLE = {
  0: { sigX: -3, sigY: 10, sigRot: -24, circleX: 0, circleY: -38 },
  1: { sigX: -19, sigY: -1, sigRot: 21, circleX: 8, circleY: -33 },
  dataSize: DEFAULT_SECTOR_DATA_SIZE_PX,
  circleSize: 24,
} as const;
const TEXT_MODE_SECTOR_RADIUS_PERCENT = 42;

interface ISectorNodeViewProps {
  sector: IPublicSector;
  index: 0 | 1;
  sectorIndex: number;
  position: string;
  sectorName: string;
  playerColors: Record<string, string>;
  textMode: boolean;
  isSelectable: boolean;
  isEmphasized: boolean;
  canPickBySectorId: boolean;
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
  sectorName,
  playerColors,
  textMode,
  isSelectable,
  isEmphasized,
  canPickBySectorId,
  onSelectSector,
  onSelectSectorId,
}: ISectorNodeViewProps): React.JSX.Element {
  const style = DEFAULT_SECTOR_SIGNAL_STYLE[index];
  const remainingData = sector.signals.filter(
    (sig) => sig.type === 'data',
  ).length;
  // Keep debug/legacy snapshots renderable if they predate `dataCapability`.
  const dataCapability = sector.dataCapability ?? sector.dataSlotCapacity;
  const bonusesAreSame = sameBonus(
    sector.firstWinnerBonus ?? [],
    sector.otherWinnerBonus ?? [],
  );
  const xPos = index === 0 ? '30%' : '70%';
  function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
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

          <button
            type='button'
            data-testid={`sector-node-${position}-${index}`}
            className={cn(
              'pointer-events-auto absolute inset-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/80',
              isSelectable
                ? 'cursor-pointer bg-accent-500/0 hover:bg-accent-500/10'
                : 'cursor-default',
            )}
            onClick={handleClick}
            disabled={!isSelectable}
            aria-label={`Mark ${sector.color} (${sector.sectorId}) sector`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      key={`${position}-${sector.sectorId}`}
      className='absolute'
      style={{
        left: xPos,
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className='flex items-center gap-[2px]'
        style={{
          transform: [
            `translate(var(--sector-sig-x-${index}, ${style.sigX}px), var(--sector-sig-y-${index}, ${style.sigY}px))`,
            `rotate(var(--sector-sig-rot-${index}, ${style.sigRot}deg))`,
          ].join(' '),
          transformOrigin: 'center',
        }}
      >
        <SectorSignalList
          signals={sector.signals}
          capacity={sector.signals.length}
          playerColors={playerColors}
          textMode={false}
        />
      </div>

      <div className='mt-0.5 flex items-center justify-center gap-1'>
        <span className='font-mono text-[9px] uppercase tracking-wide text-text-100'>
          {sector.color}
        </span>
        <span className='font-mono text-[8px] text-text-300'>
          {remainingData}/{sector.dataSlotCapacity}
        </span>
      </div>

      <button
        type='button'
        data-testid={`sector-node-${position}-${index}`}
        className={cn(
          'pointer-events-auto absolute rounded-full border-2 transition-colors',
          isSelectable
            ? 'cursor-pointer border-accent-400 bg-accent-500/25 hover:bg-accent-500/45'
            : 'cursor-default border-surface-500/40 bg-surface-800/30',
          isEmphasized &&
            'border-amber-300/90 bg-amber-500/20 shadow-[0_0_0_2px_rgba(251,191,36,0.55)]',
        )}
        style={{
          width: `var(--sector-circle-size, ${DEFAULT_SECTOR_SIGNAL_STYLE.circleSize}px)`,
          height: `var(--sector-circle-size, ${DEFAULT_SECTOR_SIGNAL_STYLE.circleSize}px)`,
          left: '50%',
          top: '50%',
          transform: [
            'translate(-50%, -50%)',
            `translate(var(--sector-circle-x-${index}, ${style.circleX}px), var(--sector-circle-y-${index}, ${style.circleY}px))`,
          ].join(' '),
        }}
        onClick={handleClick}
        disabled={!isSelectable}
        aria-label={`Mark ${sector.color} (${sector.sectorId}) sector`}
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
