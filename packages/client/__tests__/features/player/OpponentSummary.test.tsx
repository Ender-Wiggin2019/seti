import { EOrganizationId } from '@seti/common/types/organization';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OpponentSummary } from '@/features/player';
import { createMockPlayerState } from '../../../test/mocks/gameState';

describe('OpponentSummary', () => {
  it('shows compact opponent headers', () => {
    render(
      <OpponentSummary
        opponents={[
          createMockPlayerState({
            playerId: 'p2',
            playerName: 'Pilot Lin',
            handSize: 4,
          }),
        ]}
      />,
    );

    expect(screen.getByText('Pilot Lin')).toBeInTheDocument();
    expect(screen.getByText(/VP/)).toBeInTheDocument();
  });

  it('expands to show public details', () => {
    render(
      <OpponentSummary
        opponents={[
          createMockPlayerState({
            playerId: 'p3',
            playerName: 'Rhea',
            handSize: 6,
          }),
        ]}
      />,
    );

    expect(screen.getByText(/Hand: 6/)).toBeInTheDocument();
    expect(screen.getByText(/Tech:/)).toBeInTheDocument();
  });

  it('renders public opponent organization badges', () => {
    render(
      <OpponentSummary
        opponents={[
          createMockPlayerState({
            playerId: 'p2',
            playerName: 'Pilot Lin',
            organizationIds: [EOrganizationId.FENWICK_RESEARCH_CENTER],
          }),
        ]}
      />,
    );

    expect(screen.getByTestId('opponent-organizations-p2')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `organization-badge-${EOrganizationId.FENWICK_RESEARCH_CENTER}`,
      ),
    ).toHaveTextContent('Fenwick Research Center');
    expect(screen.getByAltText('NovaTek Industries')).toHaveAttribute(
      'src',
      '/assets/seti/corporations/Fenwick Research Center.jpg',
    );
  });
});
