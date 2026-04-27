import { render, screen } from '@testing-library/react';
import { AlienBoardView } from '@/features/board/AlienBoardView';
import type { IPublicAlienState, IPublicTraceSlot } from '@/types/re-exports';
import { EAlienType, ETrace } from '@/types/re-exports';

function slot(
  slotId: string,
  traceColor: ETrace,
  overrides: Partial<IPublicTraceSlot> = {},
): IPublicTraceSlot {
  return {
    slotId,
    traceColor,
    occupants: [],
    maxOccupants: 1,
    rewards: [],
    isDiscovery: false,
    ...overrides,
  };
}

describe('AlienBoardView', () => {
  it('renders all public alien reward labels', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ANOMALIES,
      discovered: true,
      slots: [
        {
          slotId: 'reward-slot',
          traceColor: ETrace.RED,
          occupants: [],
          maxOccupants: -1,
          rewards: [
            { type: 'VP', amount: 4 },
            { type: 'PUBLICITY', amount: 2 },
            { type: 'CREDIT', amount: 1 },
            { type: 'ENERGY', amount: 1 },
            { type: 'DATA', amount: 1 },
            { type: 'CARD', amount: 1 },
            { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
          ],
          isDiscovery: false,
        },
      ],
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    expect(
      screen.getByText('4VP, 2PR, 1CR, 1EN, 1DATA, 1CARD, DRAW_ALIEN_CARD'),
    ).toBeInTheDocument();
  });

  it('keeps an undiscovered alien to discovery zones and overflow only', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: null,
      discovered: false,
      slots: [
        slot('alien-0-discovery-red-trace', ETrace.RED, {
          isDiscovery: true,
        }),
        slot('alien-0-discovery-yellow-trace', ETrace.YELLOW, {
          isDiscovery: true,
        }),
        slot('alien-0-discovery-blue-trace', ETrace.BLUE, {
          isDiscovery: true,
        }),
        slot('alien-0-overflow', ETrace.ANY, { maxOccupants: -1 }),
      ],
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    expect(screen.getByTestId('alien-0-discovery-zone')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-overflow-zone')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-hidden-board')).toBeInTheDocument();
    expect(
      screen.queryByTestId('alien-0-anomalies-board'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('alien-0-deck-panel')).not.toBeInTheDocument();
  });

  it('renders discovered Anomalies as three board columns, tokens, and deck panel', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ANOMALIES,
      discovered: true,
      faceUpAlienCardId: 'ET.11',
      alienDeckSize: 7,
      alienDiscardSize: 2,
      slots: [
        slot('alien-0-discovery-red-trace', ETrace.RED, {
          isDiscovery: true,
        }),
        slot('alien-0-discovery-yellow-trace', ETrace.YELLOW, {
          isDiscovery: true,
        }),
        slot('alien-0-discovery-blue-trace', ETrace.BLUE, {
          isDiscovery: true,
        }),
        slot('alien-0-overflow', ETrace.ANY, { maxOccupants: -1 }),
        slot('alien-0-anomaly-column|red-trace', ETrace.RED, {
          maxOccupants: -1,
          occupants: [{ source: { playerId: 'p1' }, traceColor: ETrace.RED }],
        }),
        slot('alien-0-anomaly-column|yellow-trace', ETrace.YELLOW, {
          maxOccupants: -1,
        }),
        slot('alien-0-anomaly-column|blue-trace', ETrace.BLUE, {
          maxOccupants: -1,
        }),
        slot('alien-0-anomaly-token|0|red-trace', ETrace.RED, {
          maxOccupants: 0,
          rewards: [{ type: 'VP', amount: 4 }],
        }),
        slot('alien-0-anomaly-token|3|yellow-trace', ETrace.YELLOW, {
          maxOccupants: 0,
          rewards: [{ type: 'CARD', amount: 1 }],
        }),
        slot('alien-0-anomaly-token|5|blue-trace', ETrace.BLUE, {
          maxOccupants: 0,
          rewards: [{ type: 'DATA', amount: 1 }],
        }),
      ],
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{ p1: '#f00' }} />);

    expect(screen.getByTestId('alien-0-discovery-zone')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-overflow-zone')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-anomalies-board')).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-anomaly-column-red-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-anomaly-column-yellow-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-anomaly-column-blue-trace'),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId(/^alien-0-anomaly-token-/)).toHaveLength(3);
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent(
      'Deck 7',
    );
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent(
      'Discard 2',
    );
    expect(screen.getByTestId('seti-card-ET.11')).toBeInTheDocument();
  });
});
