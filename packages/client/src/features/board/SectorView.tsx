import { cn } from '@/lib/cn';
import type { IPublicSector } from '@/types/re-exports';
import { getPositionStyle, type ISectorPairConfig } from './sectorVisualConfig';

interface ISectorViewProps {
  pair: ISectorPairConfig;
  playerColors: Record<string, string>;
  selectableColors: Set<IPublicSector['color']>;
  clickable: boolean;
  highlighted: boolean;
  onClick: () => void;
  onSelectSector: (sectorColor: IPublicSector['color']) => void;
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
  clickable,
  highlighted,
  onClick,
  onSelectSector,
}: ISectorViewProps): React.JSX.Element {
  const positionStyle = getPositionStyle(pair.placement.position);

  const totalData = pair.sectors.reduce(
    (sum, s) => sum + s.dataSlots.filter((d) => d !== null).length,
    0,
  );
  const totalDataSlots = pair.sectors.reduce(
    (sum, s) => sum + s.dataSlots.length,
    0,
  );

  const allMarkers = pair.sectors.flatMap((s) => s.markerSlots);
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
        highlighted && 'animate-pulse',
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
          className={cn(
            'h-full w-full object-contain object-top transition-all duration-300',
            highlighted && 'brightness-125',
          )}
          draggable={false}
        />

        {highlighted && (
          <div
            className='absolute inset-0 rounded bg-accent-500/15'
            aria-hidden
          />
        )}

        <div
          className='absolute bottom-[8%] left-1/2 flex items-center gap-1'
          style={{ transform: counterRotateTransform(pair.placement.position) }}
        >
          <span className='rounded bg-surface-950/70 px-1.5 py-0.5 font-mono text-[9px] text-text-100'>
            {totalData}/{totalDataSlots}
          </span>

          {allMarkers.length > 0 && (
            <span className='flex items-center gap-0.5 rounded bg-surface-950/70 px-1.5 py-0.5'>
              {allMarkers.slice(0, 4).map((marker, idx) => (
                <span
                  key={`marker-${marker.playerId}-${idx}`}
                  className='inline-block h-2 w-2 rounded-full'
                  style={{
                    backgroundColor: playerColors[marker.playerId] ?? '#888',
                  }}
                />
              ))}
              {allMarkers.length > 4 && (
                <span className='font-mono text-[8px] text-text-200'>
                  +{allMarkers.length - 4}
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
            const remainingData = sector.dataSlots.filter(
              (d) => d !== null,
            ).length;
            const isSelectable = selectableColors.has(sector.color);
            const xPos = index === 0 ? '30%' : '70%';

            return (
              <button
                key={`${pair.placement.position}-${sector.sectorId}`}
                type='button'
                data-testid={`sector-node-${pair.placement.position}-${index}`}
                className={cn(
                  'pointer-events-auto absolute -translate-x-1/2 rounded-md border px-1 py-0.5 text-left transition-colors',
                  isSelectable
                    ? 'cursor-pointer border-accent-500/80 bg-accent-500/15 hover:bg-accent-500/25'
                    : 'cursor-default border-surface-700/70 bg-surface-950/65 opacity-85',
                )}
                style={{
                  left: xPos,
                  top: '56%',
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isSelectable) {
                    return;
                  }
                  onSelectSector(sector.color);
                }}
                disabled={!isSelectable}
                aria-label={`Sector ${sector.color}`}
              >
                <div className='flex items-center gap-1'>
                  <span className='font-mono text-[9px] uppercase tracking-wide text-text-100'>
                    {sector.color}
                  </span>
                  <span className='font-mono text-[8px] text-text-300'>
                    {remainingData}/{sector.dataSlots.length}
                  </span>
                </div>

                <div className='mt-0.5 flex items-center gap-0.5'>
                  {sector.dataSlots.map((token, slotIndex) => (
                    <span
                      key={`${sector.sectorId}-data-${slotIndex}`}
                      className={cn(
                        'inline-block h-1.5 w-1.5 rounded-full border',
                        token
                          ? 'border-cyan-300/80 bg-cyan-200/90'
                          : 'border-surface-500/60 bg-transparent',
                      )}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
