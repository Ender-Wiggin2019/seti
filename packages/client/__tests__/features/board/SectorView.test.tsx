import {
  ESectorPosition,
  ESectorTileId,
  EStarName,
} from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SectorView } from '@/features/board/SectorView';
import type { ISectorPairConfig } from '@/features/board/sectorVisualConfig';
import type { IPublicSector } from '@/types/re-exports';

function createPair(): ISectorPairConfig {
  const sectors: IPublicSector[] = [
    {
      sectorId: 'sector-0',
      color: ESector.BLUE,
      dataSlots: ['data-1', null, null],
      markerSlots: [{ playerId: 'player-1', timestamp: 1 }],
      completed: false,
    },
    {
      sectorId: 'sector-1',
      color: ESector.BLACK,
      dataSlots: [null, null, null],
      markerSlots: [],
      completed: false,
    },
  ];

  return {
    placement: {
      tileId: ESectorTileId.TILE_1,
      position: ESectorPosition.NORTH,
      sectorIds: ['sector-0', 'sector-1'] as [string, string],
      imageSrc: '/assets/seti/sectors/sector1.png',
      sectors: [
        { starName: EStarName.PROCYON, color: ESector.BLUE },
        { starName: EStarName.VEGA, color: ESector.BLACK },
      ],
    },
    sectors,
  };
}

describe('SectorView', () => {
  it('renders sector pair', () => {
    render(
      <SectorView
        pair={createPair()}
        playerColors={{ 'player-1': 'red' }}
        clickable={false}
        highlighted={false}
        onClick={vi.fn()}
      />,
    );

    const button = screen.getByTestId('sector-pair-north');
    expect(button).toBeDisabled();
  });

  it('is clickable when enabled', () => {
    const onClick = vi.fn();
    render(
      <SectorView
        pair={createPair()}
        playerColors={{ 'player-1': 'red' }}
        clickable
        highlighted
        onClick={onClick}
      />,
    );

    const button = screen.getByTestId('sector-pair-north');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
