import type { ISolarSystemSetupConfig } from '@seti/common/constant/sectorSetup';
import { useMemo } from 'react';
import type { IPlayerInputModel, IPublicSector } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { SectorView } from './SectorView';
import { buildSectorPairs } from './sectorVisualConfig';

interface ISectorGridProps {
  sectors: IPublicSector[];
  setupConfig: ISolarSystemSetupConfig;
  playerColors: Record<string, string>;
  pendingInput: IPlayerInputModel | null;
  onSelectSector: (sectorColor: IPublicSector['color']) => void;
}

export function SectorGrid({
  sectors,
  setupConfig,
  playerColors,
  pendingInput,
  onSelectSector,
}: ISectorGridProps): React.JSX.Element {
  const isSectorInput = pendingInput?.type === EPlayerInputType.SECTOR;
  const options =
    isSectorInput && 'options' in pendingInput
      ? new Set(pendingInput.options)
      : new Set<IPublicSector['color']>();

  const sectorPairs = useMemo(
    () => buildSectorPairs(setupConfig, sectors),
    [setupConfig, sectors],
  );

  return (
    <div
      className='absolute inset-0 z-250 pointer-events-none'
      aria-label='Sector ring'
    >
      {sectorPairs.map((pair) => {
        const colors = pair.sectors.map((s) => s.color);
        const selectableColors = colors.filter(
          (c) => isSectorInput && options.has(c),
        );
        const clickable = selectableColors.length > 0;
        const firstSelectable = selectableColors[0];

        return (
          <SectorView
            key={pair.placement.position}
            pair={pair}
            playerColors={playerColors}
            selectableColors={new Set(selectableColors)}
            clickable={clickable}
            highlighted={clickable}
            onSelectSector={onSelectSector}
            onClick={() => {
              if (selectableColors.length === 1 && firstSelectable != null) {
                onSelectSector(firstSelectable);
              }
            }}
          />
        );
      })}
    </div>
  );
}
