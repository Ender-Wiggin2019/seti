import type { IPlayerInputModel, IPublicSector } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { SectorView } from './SectorView';
import {
  getSectorVisualConfig,
  type ISectorVisualOverrides,
} from './sectorVisualConfig';

interface ISectorGridProps {
  sectors: IPublicSector[];
  playerColors: Record<string, string>;
  pendingInput: IPlayerInputModel | null;
  onSelectSector: (sectorColor: IPublicSector['color']) => void;
  sectorVisualById?: Record<string, ISectorVisualOverrides>;
}

export function SectorGrid({
  sectors,
  playerColors,
  pendingInput,
  onSelectSector,
  sectorVisualById,
}: ISectorGridProps): React.JSX.Element {
  const isSectorInput = pendingInput?.type === EPlayerInputType.SECTOR;
  const options =
    isSectorInput && 'options' in pendingInput
      ? new Set(pendingInput.options)
      : new Set<IPublicSector['color']>();

  return (
    <div
      className='game-situation seti-sector-grid absolute inset-0 z-50'
      aria-label='Sector ring'
    >
      {sectors.slice(0, 8).map((sector) => {
        const visual = getSectorVisualConfig(
          sector.sectorId,
          sectorVisualById?.[sector.sectorId],
        );
        const clickable = isSectorInput && options.has(sector.color);

        return (
          <SectorView
            key={sector.sectorId}
            sector={sector}
            playerColors={playerColors}
            slotIndex={visual.slotIndex}
            sectorImageSrc={visual.sectorSrc}
            clickable={clickable}
            highlighted={clickable}
            onClick={() => {
              if (clickable) {
                onSelectSector(sector.color);
              }
            }}
          />
        );
      })}
    </div>
  );
}
