import { EOrganizationId } from '@seti/common/types/organization';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('renders selected Space Agency organization cards', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          organizationIds: [EOrganizationId.ORBITAL_DYNAMICS],
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    expect(screen.getByTestId('player-organizations')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `organization-card-${EOrganizationId.ORBITAL_DYNAMICS}`,
      ),
    ).toHaveTextContent('Orbital Dynamics');
    expect(screen.getByAltText('Orbital Dynamics')).toHaveAttribute(
      'src',
      '/assets/seti/corporations/Orbital Dynamics.jpg',
    );
  });

  it('hides Quick Start cards until the played cards dialog opens', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          organizationIds: [EOrganizationId.ORBITAL_DYNAMICS],
          quickStartCardIds: ['SR.1', 'SR.3'],
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    expect(
      screen.queryByTestId('quick-start-card-preview-SR.1'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('show-all-played-cards'));

    expect(
      screen.getByTestId('quick-start-card-preview-SR.1'),
    ).toHaveTextContent('SR.1');
    expect(
      screen.getByTestId('quick-start-card-preview-SR.3'),
    ).toHaveTextContent('SR.3');
  });
});
