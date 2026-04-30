import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventLog } from '@/features/log';
import { EGameEventType } from '@/types/re-exports';
import { createMockPlayerState } from '../../../test/mocks/gameState';

describe('EventLog', () => {
  it('renders event list with entries', () => {
    render(
      <EventLog
        events={[
          {
            type: EGameEventType.ROUND_END,
            round: 2,
          },
          {
            type: EGameEventType.ROTATION,
            discIndex: 1,
          },
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    expect(screen.getByTestId('event-log')).toBeInTheDocument();
    expect(screen.getAllByTestId(/event-entry-/)).toHaveLength(2);
  });

  it('renders empty state when no events', () => {
    render(<EventLog events={[]} players={[]} />);

    expect(screen.getByText('No events yet.')).toBeInTheDocument();
  });
});
