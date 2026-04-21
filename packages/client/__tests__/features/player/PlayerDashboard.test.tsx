import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerDashboard } from '@/features/player';
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
    expect(screen.getByText('Tech Slots')).toBeInTheDocument();
  });
});
