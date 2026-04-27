import {
  ESectorPosition,
  ESectorTileId,
  EStarName,
  SECTOR_STAR_CONFIGS,
} from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SectorView } from '@/features/board/SectorView';
import type { ISectorPairConfig } from '@/features/board/sectorVisualConfig';
import { useDebugStore } from '@/stores/debugStore';
import type { IPublicSector } from '@/types/re-exports';

function createPair(): ISectorPairConfig {
  const sectors: IPublicSector[] = [
    {
      sectorId: 'sector-0',
      name: EStarName.PROCYON,
      color: ESector.BLUE,
      signals: [
        { type: 'data' },
        { type: 'player', playerId: 'player-1' },
        { type: 'player', playerId: 'player-1' },
      ],
      dataCapability: 3,
      dataSlotCapacity: 3,
      firstWinnerBonus: SECTOR_STAR_CONFIGS[EStarName.PROCYON].firstWinBonus,
      otherWinnerBonus: SECTOR_STAR_CONFIGS[EStarName.PROCYON].repeatWinBonus,
      sectorWinners: [],
      completed: false,
    },
    {
      sectorId: 'sector-1',
      name: EStarName.VEGA,
      color: ESector.BLACK,
      signals: [{ type: 'data' }, { type: 'data' }, { type: 'data' }],
      dataCapability: 3,
      dataSlotCapacity: 3,
      firstWinnerBonus: SECTOR_STAR_CONFIGS[EStarName.VEGA].firstWinBonus,
      otherWinnerBonus: SECTOR_STAR_CONFIGS[EStarName.VEGA].repeatWinBonus,
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
  beforeEach(() => {
    useDebugStore.setState({ textMode: false });
  });

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

  it('renders text-mode sector component with data and winner areas', () => {
    useDebugStore.setState({ textMode: true });

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

    expect(screen.getByText('procyon')).toBeInTheDocument();
    expect(screen.getByText('blue-signal')).toBeInTheDocument();
    expect(screen.getAllByText('1st').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2+').length).toBeGreaterThan(0);
    expect(screen.getByText('red-trace+2VP')).toBeInTheDocument();
    expect(screen.queryByText('Color')).not.toBeInTheDocument();
  });
});
