import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayerDashboard } from '@/features/player';
import { EFreeAction } from '@/types/re-exports';
import { createMockPlayerState } from '../../../test/mocks/gameState';

describe('PlayerDashboard', () => {
  it('renders all core sections', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState()}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    expect(screen.getByTestId('resource-bar')).toBeInTheDocument();
    expect(screen.getByTestId('income-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('data-pool-view')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Tech Slots')).toBeInTheDocument();
  });

  it('sends PLACE_DATA free action when a slot is clicked', () => {
    const onFreeAction = vi.fn();

    render(
      <PlayerDashboard
        player={createMockPlayerState({
          computer: {
            topSlots: [null, null, null],
            bottomSlots: [null, null, null],
          },
          dataPoolCount: 3,
        })}
        pendingInput={null}
        onFreeAction={onFreeAction}
      />,
    );

    fireEvent.click(screen.getByTestId('computer-slot-0'));

    expect(onFreeAction).toHaveBeenCalledWith({
      type: EFreeAction.PLACE_DATA,
      slotIndex: 0,
    });
  });
});
