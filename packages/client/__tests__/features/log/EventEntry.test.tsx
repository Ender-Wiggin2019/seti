import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventEntry } from '@/features/log';
import { EGameEventType } from '@/types/re-exports';

describe('EventEntry', () => {
  it('renders action event description', () => {
    render(
      <EventEntry
        event={{
          type: EGameEventType.ACTION,
          playerId: 'p1',
          action: { type: 'SCAN' as never },
        }}
        playerNames={{ p1: 'Ada' }}
        index={0}
      />,
    );

    expect(screen.getByText(/Ada used SCAN/)).toBeInTheDocument();
    expect(screen.getByText('ACTION')).toBeInTheDocument();
  });

  it('renders score change event', () => {
    render(
      <EventEntry
        event={{
          type: EGameEventType.SCORE_CHANGE,
          playerId: 'p2',
          delta: 3,
          source: 'mission',
        }}
        playerNames={{ p2: 'Lin' }}
        index={1}
      />,
    );

    expect(screen.getByText(/Lin \+3 VP/)).toBeInTheDocument();
  });

  it('renders rival action events with card text and the shared rival card hover preview', () => {
    render(
      <EventEntry
        event={{
          type: EGameEventType.ACTION,
          playerId: 'rival:solo',
          action: 'RIVAL_ACTION',
          details: {
            cardId: 'S.4',
            actionKind: 'research-tech',
          },
        }}
        playerNames={{ 'rival:solo': 'Rival Institution' }}
        index={2}
      />,
    );

    expect(
      screen.getByText(/Rival Institution revealed S\.4/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Research tech/i)).toBeInTheDocument();
    expect(screen.getByTestId('rival-card-hover-S.4')).toBeInTheDocument();
    expect(
      screen.getByTestId('rival-action-card-render-S.4'),
    ).toBeInTheDocument();
  });
});
