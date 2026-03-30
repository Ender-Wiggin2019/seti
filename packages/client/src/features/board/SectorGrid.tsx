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
  onSelectSectorId?: (sectorId: string) => void;
}

export function SectorGrid({
  sectors,
  setupConfig,
  playerColors,
  pendingInput,
  onSelectSector,
  onSelectSectorId,
}: ISectorGridProps): React.JSX.Element {
  const isSectorInput = pendingInput?.type === EPlayerInputType.SECTOR;
  const colorOptions =
    isSectorInput && 'options' in pendingInput
      ? new Set(pendingInput.options)
      : new Set<IPublicSector['color']>();
  const sectorIdOptions =
    pendingInput?.type === EPlayerInputType.OPTION
      ? new Set(pendingInput.options.map((option) => option.id))
      : new Set<string>();
  const emphasizedSectorIdOptions = new Set(
    (
      pendingInput as
        | ({ debugSectorHighlights?: string[] } & IPlayerInputModel)
        | null
    )?.debugSectorHighlights ?? [],
  );

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
          (c) => isSectorInput && colorOptions.has(c),
        );
        const selectableSectorIds = pair.sectors
          .map((s) => s.sectorId)
          .filter((sectorId) => sectorIdOptions.has(sectorId));
        const emphasizedSectorIds = pair.sectors
          .map((s) => s.sectorId)
          .filter((sectorId) => emphasizedSectorIdOptions.has(sectorId));
        const clickable =
          selectableColors.length > 0 || selectableSectorIds.length > 0;
        const firstSelectable = selectableColors[0];
        const firstSelectableSectorId = selectableSectorIds[0];

        return (
          <SectorView
            key={pair.placement.position}
            pair={pair}
            playerColors={playerColors}
            selectableColors={new Set(selectableColors)}
            selectableSectorIds={new Set(selectableSectorIds)}
            emphasizedSectorIds={new Set(emphasizedSectorIds)}
            clickable={clickable}
            highlighted={clickable}
            onSelectSector={onSelectSector}
            onSelectSectorId={onSelectSectorId}
            onClick={() => {
              if (
                selectableSectorIds.length === 1 &&
                firstSelectableSectorId != null &&
                onSelectSectorId
              ) {
                onSelectSectorId(firstSelectableSectorId);
                return;
              }

              if (
                selectableSectorIds.length === 0 &&
                selectableColors.length === 1 &&
                firstSelectable != null
              ) {
                onSelectSector(firstSelectable);
              }
            }}
          />
        );
      })}
    </div>
  );
}
