import {
  ESectorPosition,
  ESectorTileId,
  type ISolarSystemSetupConfig,
  SECTOR_TILE_DEFINITIONS,
} from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SectorGrid } from '@/features/board/SectorGrid';
import type { IPlayerInputModel, IPublicSector } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

const testSetup: ISolarSystemSetupConfig = {
  tilePlacements: [
    {
      tileId: ESectorTileId.TILE_1,
      position: ESectorPosition.NORTH,
      sectorIds: ['sector-0', 'sector-1'],
    },
    {
      tileId: ESectorTileId.TILE_2,
      position: ESectorPosition.WEST,
      sectorIds: ['sector-2', 'sector-3'],
    },
    {
      tileId: ESectorTileId.TILE_3,
      position: ESectorPosition.EAST,
      sectorIds: ['sector-4', 'sector-5'],
    },
    {
      tileId: ESectorTileId.TILE_4,
      position: ESectorPosition.SOUTH,
      sectorIds: ['sector-6', 'sector-7'],
    },
  ],
  initialDiscAngles: [0, 0, 0],
};

function createSectors(): IPublicSector[] {
  return testSetup.tilePlacements.flatMap((placement) => {
    const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];
    return tileDef.sectors.map((sectorOnTile, idx) => ({
      sectorId: placement.sectorIds[idx],
      color: sectorOnTile.color as ESector,
      dataSlots: [null, null, null] as Array<string | null>,
      markerSlots: [] as { playerId: string; timestamp: number }[],
      completed: false,
    }));
  });
}

describe('SectorGrid', () => {
  it('renders 4 sector pairs', () => {
    render(
      <SectorGrid
        sectors={createSectors()}
        setupConfig={testSetup}
        playerColors={{}}
        pendingInput={null}
        onSelectSector={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId(/sector-pair-/)).toHaveLength(4);
  });

  it('allows selecting only valid sector options', () => {
    const onSelectSector = vi.fn();
    const pendingInput: IPlayerInputModel = {
      inputId: 'input-sector',
      type: EPlayerInputType.SECTOR,
      options: [ESector.YELLOW],
    };

    render(
      <SectorGrid
        sectors={createSectors()}
        setupConfig={testSetup}
        playerColors={{}}
        pendingInput={pendingInput}
        onSelectSector={onSelectSector}
      />,
    );

    fireEvent.click(screen.getByTestId('sector-pair-north'));
    expect(onSelectSector).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('sector-pair-east'));
    expect(onSelectSector).toHaveBeenCalledWith(ESector.YELLOW);
  });
});
