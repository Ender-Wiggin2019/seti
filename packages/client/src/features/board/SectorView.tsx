import { cn } from '@/lib/cn';
import type { IPublicSector } from '@/types/re-exports';
import { getPositionStyle, type ISectorPairConfig } from './sectorVisualConfig';

interface ISectorViewProps {
  pair: ISectorPairConfig;
  playerColors: Record<string, string>;
  selectableColors: Set<IPublicSector['color']>;
  selectableSectorIds?: Set<string>;
  emphasizedSectorIds?: Set<string>;
  clickable: boolean;
  highlighted: boolean;
  onClick: () => void;
  onSelectSector: (sectorColor: IPublicSector['color']) => void;
  onSelectSectorId?: (sectorId: string) => void;
}

function counterRotateTransform(position: string): string | undefined {
  if (position === 'south') return 'translate(-50%, 0) rotate(180deg)';
  if (position === 'west') return 'translate(-50%, 0) rotate(90deg)';
  if (position === 'east') return 'translate(-50%, 0) rotate(-90deg)';
  return 'translate(-50%, 0)';
}

export function SectorView({
  pair,
  playerColors,
  selectableColors,
  selectableSectorIds = new Set<string>(),
  emphasizedSectorIds = new Set<string>(),
  clickable,
  highlighted,
  onClick,
  onSelectSector,
  onSelectSectorId,
}: ISectorViewProps): React.JSX.Element {
  const positionStyle = getPositionStyle(pair.placement.position);

  const totalData = pair.sectors.reduce(
    (sum, s) => sum + s.signals.filter((sig) => sig.type === 'data').length,
    0,
  );
  const totalSlots = pair.sectors.reduce(
    (sum, s) => sum + s.dataSlotCapacity,
    0,
  );

  const allPlayerSignals = pair.sectors.flatMap((s) =>
    s.signals.filter(
      (sig): sig is { type: 'player'; playerId: string } =>
        sig.type === 'player' && sig.playerId !== undefined,
    ),
  );
  const isCompleted =
    pair.sectors.length > 0 && pair.sectors.every((s) => s.completed);

  const starNames = pair.placement.sectors.map((s) => s.starName).join(' / ');

  return (
    <div
      data-testid={`sector-pair-${pair.placement.position}`}
      aria-label={`Sector tile ${pair.placement.tileId} (${starNames})`}
      aria-disabled={!clickable}
      role='button'
      tabIndex={clickable ? 0 : -1}
      className={cn(
        'absolute transition-all duration-300',
        clickable
          ? 'pointer-events-auto cursor-pointer'
          : 'pointer-events-none cursor-default',
      )}
      style={{
        ...positionStyle,
        transformOrigin: 'center',
      }}
      onClick={() => {
        if (!clickable) {
          return;
        }
        onClick();
      }}
      onKeyDown={(event) => {
        if (!clickable) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className='relative h-full w-full'>
        <img
          src={pair.placement.imageSrc}
          alt=''
          aria-hidden
          className='h-full w-full object-contain object-top transition-all duration-300'
          draggable={false}
        />

        <div
          className='absolute bottom-[8%] left-1/2 flex items-center gap-1'
          style={{ transform: counterRotateTransform(pair.placement.position) }}
        >
          <span className='rounded bg-surface-950/70 px-1.5 py-0.5 font-mono text-[9px] text-text-100'>
            {totalData}/{totalSlots}
          </span>

          {allPlayerSignals.length > 0 && (
            <span className='flex items-center gap-0.5 rounded bg-surface-950/70 px-1.5 py-0.5'>
              {allPlayerSignals.slice(0, 4).map((sig, idx) => (
                <span
                  key={`marker-${sig.playerId}-${idx}`}
                  className='inline-block h-2 w-2 rounded-full'
                  style={{
                    backgroundColor: playerColors[sig.playerId] ?? '#888',
                  }}
                />
              ))}
              {allPlayerSignals.length > 4 && (
                <span className='font-mono text-[8px] text-text-200'>
                  +{allPlayerSignals.length - 4}
                </span>
              )}
            </span>
          )}

          {isCompleted && (
            <span className='rounded bg-accent-500/85 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-surface-950'>
              done
            </span>
          )}
        </div>

        <div className='pointer-events-none absolute inset-0'>
          {pair.sectors.map((sector, index) => {
            const remainingData = sector.signals.filter(
              (sig) => sig.type === 'data',
            ).length;
            const canPickByColor = selectableColors.has(sector.color);
            const canPickBySectorId = selectableSectorIds.has(sector.sectorId);
            const isSelectable = canPickByColor || canPickBySectorId;
            const isEmphasized = emphasizedSectorIds.has(sector.sectorId);
            const isSectorHighlighted = isSelectable || isEmphasized;
            const xPos = index === 0 ? '30%' : '70%';

            return (
              <div
                key={`${pair.placement.position}-${sector.sectorId}`}
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
                      `translate(var(--sector-sig-x-${index}, 0px), var(--sector-sig-y-${index}, 0px))`,
                      `rotate(var(--sector-sig-rot-${index}, 0deg))`,
                    ].join(' '),
                    transformOrigin: 'center',
                  }}
                >
                  {sector.signals.map((sig, slotIndex) => (
                    <span
                      key={`${sector.sectorId}-sig-${slotIndex}`}
                      className='inline-block rounded-full border'
                      style={{
                        width: 'var(--sector-data-size, 6px)',
                        height: 'var(--sector-data-size, 6px)',
                        ...(sig.type === 'data'
                          ? {
                              borderColor: 'rgba(103, 232, 249, 0.8)',
                              backgroundColor: 'rgba(165, 243, 252, 0.9)',
                            }
                          : {
                              backgroundColor:
                                (sig.playerId && playerColors[sig.playerId]) ??
                                '#888',
                              borderColor:
                                (sig.playerId && playerColors[sig.playerId]) ??
                                '#888',
                            }),
                      }}
                    />
                  ))}
                </div>

                {/* Label */}
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
                  data-testid={`sector-node-${pair.placement.position}-${index}`}
                  className={cn(
                    'pointer-events-auto absolute rounded-full border-2 transition-colors',
                    isSelectable
                      ? 'cursor-pointer border-accent-400 bg-accent-500/25 hover:bg-accent-500/45'
                      : 'cursor-default border-surface-500/40 bg-surface-800/30',
                    isEmphasized &&
                      'border-amber-300/90 bg-amber-500/20 shadow-[0_0_0_2px_rgba(251,191,36,0.55)]',
                  )}
                  style={{
                    width: 'var(--sector-circle-size, 24px)',
                    height: 'var(--sector-circle-size, 24px)',
                    left: '50%',
                    top: '50%',
                    transform: [
                      'translate(-50%, -50%)',
                      `translate(var(--sector-circle-x-${index}, 0px), var(--sector-circle-y-${index}, 0px))`,
                    ].join(' '),
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!isSelectable) {
                      return;
                    }
                    if (canPickBySectorId && onSelectSectorId) {
                      onSelectSectorId(sector.sectorId);
                      return;
                    }
                    onSelectSector(sector.color);
                  }}
                  disabled={!isSelectable}
                  aria-label={`Mark ${sector.color} (${sector.sectorId}) sector`}
                />

                {isSectorHighlighted && (
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute rounded-full border',
                      isEmphasized
                        ? 'border-amber-300/90 bg-amber-500/18 shadow-[0_0_14px_rgba(251,191,36,0.55)]'
                        : 'border-accent-300/80 bg-accent-500/14 shadow-[0_0_12px_rgba(34,197,94,0.35)]',
                    )}
                    style={{
                      width: 'var(--sector-circle-size, 24px)',
                      height: 'var(--sector-circle-size, 24px)',
                      left: '50%',
                      top: '50%',
                      transform: [
                        'translate(-50%, -50%) scale(1.9)',
                        `translate(var(--sector-circle-x-${index}, 0px), var(--sector-circle-y-${index}, 0px))`,
                      ].join(' '),
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
