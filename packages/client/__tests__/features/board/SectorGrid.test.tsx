import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SectorGrid } from '@/features/board/SectorGrid';
import type { IPlayerInputModel, IPublicSector } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

function createSectors(): IPublicSector[] {
  const colors = [
    'red-signal',
    'yellow-signal',
    'blue-signal',
    'black-signal',
    'red-signal',
    'yellow-signal',
    'blue-signal',
    'black-signal',
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
      options: ['yellow-signal'],
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
    expect(onSelectSector).toHaveBeenCalledWith('yellow-signal');
  });
});
