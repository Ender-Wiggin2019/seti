import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventEntry } from '@/features/log';
import i18n from '@/i18n';
import { EGameEventType } from '@/types/re-exports';

describe('EventEntry', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

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

    expect(screen.getByText(/Ada used Scan/)).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.queryByText('ACTION')).not.toBeInTheDocument();
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

  it('renders Arkhos structured action events with reward details', () => {
    const { rerender } = render(
      <EventEntry
        event={{
          type: EGameEventType.ACTION,
          playerId: 'p1',
          action: 'ARKHOS_EXPLORATION_REWARD_REVEALED',
          details: {
            cardId: 'ARKHOS.EXPLORATION.2',
            size: 'major',
          },
        }}
        playerNames={{ p1: 'Ada' }}
        index={3}
      />,
    );

    expect(
      screen.getByText(/Ada revealed major Arkhos exploration/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/ARKHOS\.EXPLORATION\.2/)).toBeInTheDocument();

    rerender(
      <EventEntry
        event={{
          type: EGameEventType.ACTION,
          playerId: 'p1',
          action: 'ARKHOS_SECURITY_CARD_USED',
          details: {
            cardId: 'AIcard01',
            rewardSize: 'minor',
          },
        }}
        playerNames={{ p1: 'Ada' }}
        index={4}
      />,
    );

    expect(
      screen.getByText(/Ada used AIcard01 for a minor Arkhos reward/i),
    ).toBeInTheDocument();

    rerender(
      <EventEntry
        event={{
          type: EGameEventType.ACTION,
          playerId: 'p1',
          action: 'ARKHOS_SECURITY_BREACHED',
          details: {
            cardId: 'AIcard05',
            traceColor: 'yellow-trace',
            accessLevel: 2,
          },
        }}
        playerNames={{ p1: 'Ada' }}
        index={5}
      />,
    );

    expect(
      screen.getByText(
        /Ada breached yellow Arkhos security AIcard05 \(access 2\)/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders Arkhos structured action events from common locale keys', async () => {
    await i18n.changeLanguage('zh-CN');

    render(
      <EventEntry
        event={{
          type: EGameEventType.ACTION,
          playerId: 'p1',
          action: 'ARKHOS_EXPLORATION_REWARD_REVEALED',
          details: {
            cardId: 'ARKHOS.EXPLORATION.2',
            size: 'major',
          },
        }}
        playerNames={{ p1: 'Ada' }}
        index={6}
      />,
    );

    expect(
      screen.getByText('Ada 揭示 大 Arkhos 探索 ARKHOS.EXPLORATION.2'),
    ).toBeInTheDocument();
  });
});
