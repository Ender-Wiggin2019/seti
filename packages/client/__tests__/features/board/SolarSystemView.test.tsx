import { ESector } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SolarSystemView } from '@/features/board/SolarSystemView';
import type { IPublicSolarSystem } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

function createSolarSystemMock(): IPublicSolarSystem {
  return {
    spaces: Array.from({ length: 32 }, (_, i) => `space-${i}`),
    adjacency: {
      'space-0': ['space-1'],
    },
    probes: [{ playerId: 'player-1', spaceId: 'space-0' }],
    discs: [
      { discIndex: 0, angle: 1 },
      { discIndex: 1, angle: 2 },
      { discIndex: 2, angle: 3 },
      { discIndex: 3, angle: 0 },
    ],
  };
}

function createSectorsMock() {
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
  return colors.map((color, i) => ({
    sectorId: `sector-${i}`,
    color,
    dataSlots: [null, null, null],
    markerSlots: [],
    completed: false,
  }));
}

describe('SolarSystemView', () => {
  it('renders all 32 space hotspots', () => {
    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const allSpaces = screen.getAllByRole('button', { name: /Space space-/ });
    expect(allSpaces).toHaveLength(32);
  });

  it('sends movement action after selecting own probe and clicking reachable space', () => {
    const onMoveProbe = vi.fn();

    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        onMoveProbe={onMoveProbe}
        onRespondInput={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('solar-space-space-0'));
    fireEvent.click(screen.getByTestId('solar-space-space-1'));

    expect(onMoveProbe).toHaveBeenCalledWith('space-0', 'space-1');
  });

  it('responds to sector input on outer-ring sector click', () => {
    const onRespondInput = vi.fn();
    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        pendingInput={{
          inputId: 'select-sector',
          type: EPlayerInputType.SECTOR,
          options: [ESector.RED],
        }}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        onMoveProbe={vi.fn()}
        onRespondInput={onRespondInput}
      />,
    );

    fireEvent.click(screen.getByTestId('sector-chip-sector-0'));
    expect(onRespondInput).toHaveBeenCalledWith({
      type: EPlayerInputType.SECTOR,
      sector: ESector.RED,
    });
  });
});
