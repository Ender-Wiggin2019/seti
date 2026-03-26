import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SectorView } from '@/features/board/SectorView';
import type { IPublicSector } from '@/types/re-exports';

function createSector(overrides?: Partial<IPublicSector>): IPublicSector {
  return {
    sectorId: 'sector-0',
    color: 'red-signal',
    dataSlots: ['data-1', null, null],
    markerSlots: [{ playerId: 'player-1', timestamp: 1 }],
    completed: false,
    ...overrides,
  };
}

describe('SectorView', () => {
  it('renders data slot fill state', () => {
    render(
      <SectorView
        sector={createSector({ dataSlots: ['a', null, 'b'] })}
        playerColors={{ 'player-1': 'red' }}
        xPercent={50}
        yPercent={50}
        clickable={false}
        highlighted={false}
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByTestId('sector-chip-sector-0');
    expect(button).toHaveAttribute('title', 'red | data 2/3');
    expect(button).toBeDisabled();
  });

  it('is clickable when enabled', () => {
    const onClick = vi.fn();
    render(
      <SectorView
        sector={createSector()}
        playerColors={{ 'player-1': 'red' }}
        xPercent={50}
        yPercent={50}
        clickable
        highlighted
        onClick={onClick}
      />,
    );

    const button = screen.getByTestId('sector-chip-sector-0');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
