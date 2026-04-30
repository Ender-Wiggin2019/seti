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
});
