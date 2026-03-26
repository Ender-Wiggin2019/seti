import { ESector } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SectorGrid } from '@/features/board/SectorGrid';
import type { IPlayerInputModel, IPublicSector } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

function createSectors(): IPublicSector[] {
  const colors: ESector[] = [
    ESector.RED,
    ESector.YELLOW,
    ESector.BLUE,
    ESector.BLACK,
    ESector.RED,
    ESector.YELLOW,
    ESector.BLUE,
    ESector.BLACK,
  ];
  return colors.map((color, index) => ({
    sectorId: `sector-${index}`,
    color,
    dataSlots: [null, null, null],
    markerSlots: [],
    completed: false,
  }));
}

describe('SectorGrid', () => {
  it('renders 8 sectors', () => {
    render(
      <SectorGrid
        sectors={createSectors()}
        playerColors={{}}
        pendingInput={null}
        onSelectSector={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId(/sector-chip-sector-/)).toHaveLength(8);
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
        playerColors={{}}
        pendingInput={pendingInput}
        onSelectSector={onSelectSector}
      />,
    );

    fireEvent.click(screen.getByTestId('sector-chip-sector-0'));
    expect(onSelectSector).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('sector-chip-sector-1'));
    expect(onSelectSector).toHaveBeenCalledWith(ESector.YELLOW);
  });
});
