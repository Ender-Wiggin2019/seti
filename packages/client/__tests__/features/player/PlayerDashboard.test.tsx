import { EOrganizationId } from '@seti/common/types/organization';
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

  it('renders selected Space Agency organization badges', () => {
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
        `organization-badge-${EOrganizationId.ORBITAL_DYNAMICS}`,
      ),
    ).toHaveTextContent('Orbital Dynamics');
    expect(screen.getByAltText('Orbital Dynamics')).toHaveAttribute(
      'src',
      '/assets/seti/corporations/Orbital Dynamics.jpg',
    );
  });

  it('renders selected Quick Start card thumbnails', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          quickStartCardIds: ['SR.1', 'SR.3'],
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    expect(screen.getByTestId('player-quick-start-cards')).toBeInTheDocument();
    expect(
      screen.getByTestId('quick-start-card-thumbnail-SR.1'),
    ).toHaveTextContent('SR.1');
    expect(
      screen.getByTestId('quick-start-card-thumbnail-SR.3'),
    ).toHaveTextContent('SR.3');
  });
});
