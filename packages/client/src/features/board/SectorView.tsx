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
  onSelectSector: (sectorColor: IPublicSector['color']) => void;
  onSelectSectorId?: (sectorId: string) => void;
}

function getSectorIndexFromId(sectorId: string): number | null {
  const match = /(\d+)$/.exec(sectorId);
  if (!match) {
    return null;
  }

  const sectorIndex = Number(match[1]);
  return Number.isInteger(sectorIndex) ? sectorIndex : null;
}

function getFallbackSectorIndex(position: string, index: 0 | 1): number {
  if (position === 'north') return index;
  if (position === 'west') return index + 2;
  if (position === 'east') return index + 4;
  return index + 6;
}

export function SectorView({
  pair,
  playerColors,
  selectableColors,
  selectableSectorIds = new Set<string>(),
  emphasizedSectorIds = new Set<string>(),
  clickable,
  highlighted,
  onSelectSector,
  onSelectSectorId,
}: ISectorViewProps): React.JSX.Element {
  const textMode = useTextMode();
  const positionStyle = getPositionStyle(pair.placement.position);

  const starNames = pair.placement.sectors.map((s) => s.starName).join(' / ');

  return (
    <div
      data-testid={`sector-pair-${pair.placement.position}`}
      aria-label={`Sector tile ${pair.placement.tileId} (${starNames})`}
      aria-disabled={!clickable}
      className={cn(
        'absolute transition-all duration-300',
        'pointer-events-none cursor-default',
      )}
      style={{
        ...(textMode
          ? { inset: '0', width: '100%', height: '100%' }
          : positionStyle),
        transformOrigin: 'center',
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
                sectorIndex={
                  getSectorIndexFromId(sector.sectorId) ??
                  getSectorIndexFromId(pair.placement.sectorIds[index]) ??
                  getFallbackSectorIndex(
                    pair.placement.position,
                    index as 0 | 1,
                  )
                }
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
