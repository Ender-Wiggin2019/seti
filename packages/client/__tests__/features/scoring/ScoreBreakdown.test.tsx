import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreBreakdown } from '@/features/scoring';

describe('ScoreBreakdown', () => {
  it('renders score rows and totals', () => {
    render(
      <ScoreBreakdown
        rows={[
          {
            playerId: 'p1',
            playerName: 'Ada',
            base: 20,
            cards: 4,
            tech: 3,
            milestone: 2,
            gold: 1,
            alien: 0,
            total: 30,
          },
          {
            playerId: 'p2',
            playerName: 'Lin',
            total: 27,
          },
        ]}
      />,
    );

    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Lin')).toBeInTheDocument();
    expect(screen.getByText('30 👑')).toBeInTheDocument();
  });
});
