import type { IPlayerInputModel, IPublicSector } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { SectorView } from './SectorView';

interface ISectorGridProps {
  sectors: IPublicSector[];
  playerColors: Record<string, string>;
  pendingInput: IPlayerInputModel | null;
  onSelectSector: (sectorColor: IPublicSector['color']) => void;
}

function sectorPosition(index: number): { xPercent: number; yPercent: number } {
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
  const radius = 45;
  return {
    xPercent: 50 + Math.cos(angle) * radius,
    yPercent: 50 + Math.sin(angle) * radius,
  };
}

export function SectorGrid({
  sectors,
  playerColors,
  pendingInput,
  onSelectSector,
}: ISectorGridProps): React.JSX.Element {
  const isSectorInput = pendingInput?.type === EPlayerInputType.SECTOR;
  const options =
    isSectorInput && 'options' in pendingInput
      ? new Set(pendingInput.options)
      : new Set<IPublicSector['color']>();

  return (
    <div className='absolute inset-0 z-50' aria-label='Sector ring'>
      {sectors.slice(0, 8).map((sector, index) => {
        const pos = sectorPosition(index);
        const clickable = isSectorInput && options.has(sector.color);

        return (
          <SectorView
            key={sector.sectorId}
            sector={sector}
            playerColors={playerColors}
            xPercent={pos.xPercent}
            yPercent={pos.yPercent}
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
