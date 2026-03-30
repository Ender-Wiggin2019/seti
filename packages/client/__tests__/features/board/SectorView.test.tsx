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
      signals: [
        { type: 'data' },
        { type: 'player', playerId: 'player-1' },
        { type: 'player', playerId: 'player-1' },
      ],
      dataSlotCapacity: 3,
      sectorWinners: [],
      completed: false,
    },
    {
      sectorId: 'sector-1',
      color: ESector.BLACK,
      signals: [{ type: 'data' }, { type: 'data' }, { type: 'data' }],
      dataSlotCapacity: 3,
      sectorWinners: [],
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
        selectableColors={new Set()}
        clickable={false}
        highlighted={false}
        onClick={vi.fn()}
        onSelectSector={vi.fn()}
      />,
    );

    const button = screen.getByTestId('sector-pair-north');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('is clickable when enabled', () => {
    const onClick = vi.fn();
    render(
      <SectorView
        pair={createPair()}
        playerColors={{ 'player-1': 'red' }}
        selectableColors={new Set([ESector.BLUE])}
        clickable
        highlighted
        onClick={onClick}
        onSelectSector={vi.fn()}
      />,
    );

    const button = screen.getByTestId('sector-pair-north');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports selecting a specific sector node', () => {
    const onSelectSector = vi.fn();
    render(
      <SectorView
        pair={createPair()}
        playerColors={{ 'player-1': 'red' }}
        selectableColors={new Set([ESector.BLACK])}
        clickable
        highlighted
        onClick={vi.fn()}
        onSelectSector={onSelectSector}
      />,
    );

    fireEvent.click(screen.getByTestId('sector-node-north-1'));
    expect(onSelectSector).toHaveBeenCalledWith(ESector.BLACK);
  });
});
