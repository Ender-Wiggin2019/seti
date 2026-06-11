import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventLog } from '@/features/log';
import { EGameEventType } from '@/types/re-exports';
import { playerEventBase, systemEventBase } from '../../helpers/gameEvents';
import { createMockPlayerState } from '../../../test/mocks/gameState';

describe('EventLog', () => {
  it('renders event list with entries', () => {
    render(
      <EventLog
        events={[
          {
            ...systemEventBase(),
            type: EGameEventType.ROUND_END,
            round: 2,
          },
          {
            ...systemEventBase(),
            type: EGameEventType.DISC_ROTATED,
            ring: 2,
            steps: 1,
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
            ...playerEventBase('p1'),
            type: EGameEventType.ACTION,
            level: 'info',
            action: 'SCAN',
          },
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    // Player names are now wrapped in tinted spans, so the rendered
    // line is split across nodes — match on the row's combined
    // textContent instead of a single text node. Each main action
    // has a dedicated narrative (e.g. SCAN → "Ada scanned") instead
    // of the older generic "Ada used Scan" mold.
    expect(
      screen.getByTestId('event-log').textContent?.includes('Ada scanned'),
    ).toBe(true);
    expect(screen.queryByText('ACTION')).not.toBeInTheDocument();
    expect(screen.queryByText('SCAN')).not.toBeInTheDocument();
  });

  it('renders card id details as a card-name trigger that opens details', () => {
    render(
      <EventLog
        events={[
          {
            ...playerEventBase('p1'),
            type: EGameEventType.ACTION,
            level: 'info',
            action: 'PLAY_CARD',
            details: {
              cardId: '42',
              cardName: 'SETI Institute',
            },
          },
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    // Card refs now show "<localized name> (#NN)". Find the button
    // by its testid so we don't depend on the exact label format.
    fireEvent.click(screen.getByTestId('event-card-ref-42'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog').textContent).toContain('#42');
  });

  it('does not expand compact log when clicking a card reference', () => {
    render(
      <EventLog
        compact
        events={[
          {
            ...playerEventBase('p1'),
            type: EGameEventType.ACTION,
            level: 'info',
            action: 'PLAY_CARD',
            details: {
              cardId: '42',
              cardName: 'SETI Institute',
            },
          },
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    fireEvent.click(screen.getByTestId('event-card-ref-42'));

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog').textContent).toContain('#42');
    expect(screen.queryByText('Event Log')).not.toBeInTheDocument();
  });

  it('opens compact log dialog with a tall scroll area', () => {
    render(
      <EventLog
        compact
        events={[
          { ...systemEventBase(), type: EGameEventType.ROUND_END, round: 2 },
        ]}
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
            ...playerEventBase('p1'),
            type: EGameEventType.ACTION,
            level: 'info',
            action: 'MILESTONE_CHECK',
          },
          {
            ...playerEventBase('p1', { level: 'debug' }),
            type: EGameEventType.ACTION,
            level: 'debug',
            action: 'ACTION_REWARD',
          },
          {
            ...playerEventBase('p1'),
            type: EGameEventType.ACTION,
            level: 'info',
            action: 'PASS',
          },
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    const compactLog = screen.getByTestId('event-log-compact');
    // Compact log surfaces user-facing main actions; internal
    // milestone-check / action-reward bookkeeping events are
    // filtered out (compact mode skips internal action names + any
    // debug-level event).
    expect(compactLog).toHaveTextContent('Ada passed');
    expect(compactLog).not.toHaveTextContent('milestone check');
    expect(compactLog).not.toHaveTextContent('action reward');

    fireEvent.click(compactLog);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Ada passed');
    // Internal events use their narrative templates now (e.g.
    // "Ada — milestone check", "Ada received action reward")
    // instead of the old "Ada used Milestone Check" mold.
    expect(dialog.textContent ?? '').toMatch(/milestone check/i);
    expect(dialog.textContent ?? '').toMatch(/action reward/i);
  });

  it('keeps newest-first logs scrolled to the top', () => {
    const { rerender } = render(
      <EventLog
        events={[
          { ...systemEventBase(), type: EGameEventType.ROUND_END, round: 3 },
          { ...systemEventBase(), type: EGameEventType.ROUND_END, round: 2 },
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
          { ...systemEventBase(), type: EGameEventType.ROUND_END, round: 4 },
          { ...systemEventBase(), type: EGameEventType.ROUND_END, round: 3 },
          { ...systemEventBase(), type: EGameEventType.ROUND_END, round: 2 },
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
            ...playerEventBase('p1'),
            type: EGameEventType.SCORE_CHANGED,
            before: 8,
            after: 10,
            source: 'MISSION_REWARD',
          },
        ]}
        players={[createMockPlayerState({ playerId: 'p1', playerName: 'Ada' })]}
      />,
    );

    expect(
      screen
        .getByTestId('event-log')
        .textContent?.includes('Ada +2 VP (Mission Reward)'),
    ).toBe(true);
    expect(screen.queryByText('MISSION_REWARD')).not.toBeInTheDocument();
  });
});
