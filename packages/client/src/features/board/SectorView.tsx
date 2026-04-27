import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type { IPublicSector } from '@/types/re-exports';
import { SectorNodeView } from './SectorNodeView';
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
  const textMode = useTextMode();
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
        {!textMode && (
          <img
            src={pair.placement.imageSrc}
            alt=''
            aria-hidden
            className='h-full w-full object-contain object-top transition-all duration-300'
            draggable={false}
          />
        )}

        {!textMode && (
          <div
            className='absolute bottom-[8%] left-1/2 flex items-center gap-1'
            style={{
              transform: counterRotateTransform(pair.placement.position),
            }}
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
        )}

        <div className='pointer-events-none absolute inset-0'>
          {pair.sectors.map((sector, index) => {
            const canPickByColor = selectableColors.has(sector.color);
            const canPickBySectorId = selectableSectorIds.has(sector.sectorId);
            const isSelectable = canPickByColor || canPickBySectorId;
            const isEmphasized = emphasizedSectorIds.has(sector.sectorId);
            const configuredSector = pair.placement.sectors[index];
            const sectorName =
              sector.name ?? configuredSector?.starName ?? sector.sectorId;

            return (
              <SectorNodeView
                key={`${pair.placement.position}-${sector.sectorId}`}
                sector={sector}
                index={index as 0 | 1}
                position={pair.placement.position}
                sectorName={String(sectorName)}
                playerColors={playerColors}
                textMode={textMode}
                isSelectable={isSelectable}
                isEmphasized={isEmphasized}
                canPickBySectorId={canPickBySectorId}
                onSelectSector={onSelectSector}
                onSelectSectorId={onSelectSectorId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
