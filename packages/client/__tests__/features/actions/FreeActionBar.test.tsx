import { EResource } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FreeActionBar } from '@/features/actions/FreeActionBar';
import { EFreeAction, EPhase } from '@/types/re-exports';
import {
  createMockGameState,
  createMockPlayerState,
} from '../../../test/mocks/gameState';

describe('FreeActionBar', () => {
  it('shows only move and mission by default', () => {
    render(
      <FreeActionBar
        gameState={createMockGameState()}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Move Probe (1)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Complete Mission' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Place Data' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Use Card' }),
    ).not.toBeInTheDocument();
  });

  it('expands to show remaining free actions when clicked', () => {
    render(
      <FreeActionBar
        gameState={createMockGameState()}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));

    expect(
      screen.getByRole('button', { name: 'Place Data' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Use Card' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Buy Card (3 PR)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Exchange' }),
    ).toBeInTheDocument();
  });

  it('uses availability rules for enabled state', () => {
    const gameState = createMockGameState({
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          probesInSpace: 0,
          movementPoints: 0,
          handSize: 0,
          dataPoolCount: 0,
          resources: { credit: 1, energy: 0, data: 0, publicity: 1 },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Move Probe (0)' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Complete Mission' }),
    ).toBeDisabled();
  });

  it('triggers callback with clicked action', () => {
    const onActionClick = vi.fn();

    render(
      <FreeActionBar
        gameState={createMockGameState()}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Move Probe (1)' }));

    expect(onActionClick).toHaveBeenCalledWith(EFreeAction.MOVEMENT);
  });

  it('shows spend signal token while a scan pool is active', () => {
    const onActionClick = vi.fn();
    const gameState = createMockGameState({
      phase: EPhase.IN_RESOLUTION,
      scanActionInProgress: true,
      cardRow: [{ id: 'row-1' } as never],
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          resources: {
            [EResource.CREDIT]: 10,
            [EResource.ENERGY]: 5,
            [EResource.DATA]: 0,
            [EResource.PUBLICITY]: 3,
            [EResource.SIGNAL_TOKEN]: 1,
          },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    fireEvent.click(screen.getByRole('button', { name: 'Spend Signal Token' }));

    expect(onActionClick).toHaveBeenCalledWith(EFreeAction.SPEND_SIGNAL_TOKEN);
  });
});
