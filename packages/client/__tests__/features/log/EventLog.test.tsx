import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('renders action names as readable labels without backend event tokens', () => {
    render(
      <EventLog
        events={[
          {
            type: EGameEventType.ACTION,
            level: 'info',
            playerId: 'p1',
            action: 'SCAN',
          } as never,
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    expect(screen.getByText('Ada used Scan')).toBeInTheDocument();
    expect(screen.queryByText('ACTION')).not.toBeInTheDocument();
    expect(screen.queryByText('SCAN')).not.toBeInTheDocument();
  });

  it('renders card id details as a card-name trigger that opens details', () => {
    render(
      <EventLog
        events={[
          {
            type: EGameEventType.ACTION,
            level: 'info',
            playerId: 'p1',
            action: 'PLAY_CARD',
            details: {
              cardId: '42',
              cardName: 'SETI Institute',
            },
          } as never,
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'SETI Institute' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByText('SETI Institute'),
    ).toBeInTheDocument();
  });

  it('does not expand compact log when clicking a card reference', () => {
    render(
      <EventLog
        compact
        events={[
          {
            type: EGameEventType.ACTION,
            level: 'info',
            playerId: 'p1',
            action: 'PLAY_CARD',
            details: {
              cardId: '42',
              cardName: 'SETI Institute',
            },
          } as never,
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'SETI Institute' }));

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog')).toHaveTextContent('42');
    expect(screen.queryByText('Event Log')).not.toBeInTheDocument();
  });

  it('opens compact log dialog with a tall scroll area', () => {
    render(
      <EventLog
        compact
        events={[{ type: EGameEventType.ROUND_END, round: 2 }]}
        players={[]}
      />,
    );

    fireEvent.click(screen.getByTestId('event-log-compact'));

    const eventLog = within(screen.getByRole('dialog')).getByTestId(
      'event-log',
    );
    expect(eventLog.querySelector('.max-h-\\[68vh\\]')).toBeInTheDocument();
  });

  it('prioritizes user-facing entries in the compact log', () => {
    render(
      <EventLog
        compact
        events={[
          {
            type: EGameEventType.ACTION,
            level: 'info',
            playerId: 'p1',
            action: 'MILESTONE_CHECK',
          } as never,
          {
            type: EGameEventType.ACTION,
            level: 'debug',
            playerId: 'p1',
            action: 'ACTION_REWARD',
          } as never,
          {
            type: EGameEventType.ACTION,
            level: 'info',
            playerId: 'p1',
            action: 'PASS',
          } as never,
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    const compactLog = screen.getByTestId('event-log-compact');
    expect(compactLog).toHaveTextContent('Ada used Pass');
    expect(compactLog).not.toHaveTextContent('Milestone Check');
    expect(compactLog).not.toHaveTextContent('Action Reward');

    fireEvent.click(compactLog);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Ada used Pass');
    expect(dialog).toHaveTextContent('Milestone Check');
    expect(dialog).toHaveTextContent('Action Reward');
  });

  it('keeps newest-first logs scrolled to the top', () => {
    const { rerender } = render(
      <EventLog
        events={[
          { type: EGameEventType.ROUND_END, round: 3 },
          { type: EGameEventType.ROUND_END, round: 2 },
        ]}
        players={[]}
      />,
    );

    const scrollArea = screen
      .getByTestId('event-log')
      .querySelector('.overflow-auto') as HTMLDivElement;
    scrollArea.scrollTop = 120;

    rerender(
      <EventLog
        events={[
          { type: EGameEventType.ROUND_END, round: 4 },
          { type: EGameEventType.ROUND_END, round: 3 },
          { type: EGameEventType.ROUND_END, round: 2 },
        ]}
        players={[]}
      />,
    );

    expect(scrollArea.scrollTop).toBe(0);
  });

  it('prettifies score source tokens', () => {
    render(
      <EventLog
        events={[
          {
            type: EGameEventType.SCORE_CHANGE,
            playerId: 'p1',
            delta: 2,
            source: 'MISSION_REWARD',
          },
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    expect(screen.getByText('Ada +2 VP (Mission Reward)')).toBeInTheDocument();
    expect(screen.queryByText('MISSION_REWARD')).not.toBeInTheDocument();
  });
});
