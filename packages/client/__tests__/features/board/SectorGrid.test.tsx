import {
  createDefaultSolarSystemWheels,
  ESectorPosition,
  ESectorTileId,
  type ISolarSystemSetupConfig,
  SECTOR_STAR_CONFIGS,
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
  wheels: createDefaultSolarSystemWheels(),
};

function createSectors(): IPublicSector[] {
  return testSetup.tilePlacements.flatMap((placement) => {
    const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];
    return tileDef.sectors.map((sectorOnTile, idx) => ({
      sectorId: placement.sectorIds[idx],
      name: sectorOnTile.starName,
      color: sectorOnTile.color as ESector,
      signals: [
        { type: 'data' as const },
        { type: 'data' as const },
        { type: 'data' as const },
      ],
      dataCapability: 3,
      dataSlotCapacity: 3,
      firstWinnerBonus:
        SECTOR_STAR_CONFIGS[sectorOnTile.starName].firstWinBonus,
      otherWinnerBonus:
        SECTOR_STAR_CONFIGS[sectorOnTile.starName].repeatWinBonus,
      sectorWinners: [] as string[],
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

  it('allows selecting only valid sector nodes', () => {
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

    fireEvent.click(screen.getByTestId('sector-node-north-0'));
    expect(onSelectSector).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('sector-node-east-0'));
    expect(onSelectSector).toHaveBeenCalledWith(ESector.YELLOW);
  });

  it('allows choosing exact sector node when multiple options are valid', () => {
    const onSelectSector = vi.fn();
    const pendingInput: IPlayerInputModel = {
      inputId: 'input-sector-multi',
      type: EPlayerInputType.SECTOR,
      options: [ESector.BLUE, ESector.BLACK],
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

    fireEvent.click(screen.getByTestId('sector-node-north-1'));
    expect(onSelectSector).toHaveBeenCalledWith(ESector.BLACK);
  });
});
