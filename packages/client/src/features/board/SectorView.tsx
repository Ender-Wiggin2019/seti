import { cn } from '@/lib/cn';
import { getPositionStyle, type ISectorPairConfig } from './sectorVisualConfig';

interface ISectorViewProps {
  pair: ISectorPairConfig;
  playerColors: Record<string, string>;
  clickable: boolean;
  highlighted: boolean;
  onClick: () => void;
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
  clickable,
  highlighted,
  onClick,
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
    <button
      type='button'
      data-testid={`sector-pair-${pair.placement.position}`}
      aria-label={`Sector tile ${pair.placement.tileId} (${starNames})`}
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
      onClick={onClick}
      disabled={!clickable}
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
      </div>
    </button>
  );
}
