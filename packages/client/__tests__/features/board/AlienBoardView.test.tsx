import { fireEvent, render, screen, within } from '@testing-library/react';
import { AlienBoardView } from '@/features/board/AlienBoardView';
import { useDebugStore } from '@/stores/debugStore';
import type {
  IPublicAlienState,
  IPublicPlanetaryBoard,
  IPublicTraceSlot,
} from '@/types/re-exports';
import { EAlienType, EPlanet, ETrace } from '@/types/re-exports';

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
  beforeEach(() => {
    useDebugStore.setState({ textMode: false });
  });

  it('lays out the two alien boards side by side on desktop', () => {
    const aliens: IPublicAlienState[] = [0, 1].map((alienIndex) => ({
      alienIndex,
      alienType: null,
      discovered: false,
      discovery: {
        zones: [],
        overflowZones: [],
      },
      cardZone: null,
      board: null,
    }));

    render(<AlienBoardView aliens={aliens} playerColors={{}} />);

    expect(screen.getByTestId('alien-board-grid')).toHaveClass(
      'sm:grid-cols-2',
    );
    expect(screen.getByTestId('alien-0-card')).toHaveClass('min-w-0');
    expect(screen.getByTestId('alien-1-card')).toHaveClass('min-w-0');
  });

  it('renders all public alien reward labels', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.DUMMY,
      discovered: true,
      discovery: {
        zones: [],
        overflowZones: [
          slot('alien-0-overflow-red-trace', ETrace.RED, {
            maxOccupants: -1,
          }),
          slot('alien-0-overflow-yellow-trace', ETrace.YELLOW, {
            maxOccupants: -1,
          }),
          slot('alien-0-overflow-blue-trace', ETrace.BLUE, {
            maxOccupants: -1,
          }),
        ],
      },
      cardZone: { faceUpCardId: null, drawPileSize: 0, discardPileSize: 0 },
      board: {
        type: 'generic',
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
          slot('reward-slot-2', ETrace.RED),
          slot('reward-slot-3', ETrace.RED),
        ],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    const rewardCircle = screen.getByTestId('trace-slot-reward-slot-circle');
    expect(
      within(rewardCircle).getByTestId('trace-reward-icon-score-4'),
    ).toBeInTheDocument();
    expect(
      within(rewardCircle).getByTestId('trace-reward-icon-publicity-2'),
    ).toBeInTheDocument();
    expect(
      within(rewardCircle).getByTestId('trace-reward-icon-credit-1'),
    ).toBeInTheDocument();
    expect(
      within(rewardCircle).getByTestId('trace-reward-icon-energy-1'),
    ).toBeInTheDocument();
    expect(
      within(rewardCircle).getByTestId('trace-reward-icon-data-1'),
    ).toBeInTheDocument();
    expect(
      within(rewardCircle).getByTestId('trace-reward-icon-draw-card-1'),
    ).toBeInTheDocument();
    expect(
      within(rewardCircle).getByTestId('trace-reward-icon-draw-alien-card-1'),
    ).toBeInTheDocument();
    const redColumn = screen.getByTestId(
      'alien-0-generic-board-column-red-trace',
    );
    expect(
      within(redColumn).getByTestId('trace-slot-reward-slot-circle'),
    ).toBeInTheDocument();
    expect(
      within(redColumn).getByTestId('trace-slot-reward-slot-2-circle'),
    ).toBeInTheDocument();
    expect(
      within(redColumn).getByTestId('trace-slot-reward-slot-3-circle'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-generic-board-column-red-trace-slots'),
    ).toHaveClass('flex-col');
    expect(
      screen.queryByTestId('alien-0-generic-board-row-red-trace'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-generic-board-column-yellow-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-generic-board-column-blue-trace'),
    ).toBeInTheDocument();
  });

  it('keeps an undiscovered alien to discovery zones and overflow only', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: null,
      discovered: false,
      discovery: {
        zones: [
          slot('alien-0-discovery-red-trace', ETrace.RED, {
            isDiscovery: true,
          }),
          slot('alien-0-discovery-yellow-trace', ETrace.YELLOW, {
            isDiscovery: true,
          }),
          slot('alien-0-discovery-blue-trace', ETrace.BLUE, {
            isDiscovery: true,
          }),
        ],
        overflowZones: [
          slot('alien-0-overflow-red-trace', ETrace.RED, {
            maxOccupants: -1,
          }),
          slot('alien-0-overflow-yellow-trace', ETrace.YELLOW, {
            maxOccupants: -1,
          }),
          slot('alien-0-overflow-blue-trace', ETrace.BLUE, {
            maxOccupants: -1,
          }),
        ],
      },
      cardZone: null,
      board: null,
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    const card = screen.getByTestId('alien-0-card');
    const hiddenBoard = within(card).getByTestId('alien-0-hidden-board');
    const discoveryZone = within(card).getByTestId('alien-0-discovery-zone');
    const overflowZone = within(card).getByTestId('alien-0-overflow-zone');

    expect(hiddenBoard.compareDocumentPosition(discoveryZone)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(discoveryZone.compareDocumentPosition(overflowZone)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(
      screen.getByTestId('alien-0-hidden-board-column-red-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-hidden-board-column-yellow-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-hidden-board-column-blue-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-discovery-column-red-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-discovery-column-red-trace-slots'),
    ).toHaveClass('flex-col');
    expect(
      screen.getByTestId('alien-0-discovery-column-yellow-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-discovery-column-blue-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-overflow-column-red-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-overflow-column-yellow-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-overflow-column-blue-trace'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('alien-0-discovery-row-red-trace'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('alien-0-anomalies-board'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('alien-0-deck-panel')).not.toBeInTheDocument();
  });

  it('renders discovered Anomalies as three board columns and deck panel', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ANOMALIES,
      discovered: true,
      discovery: {
        zones: [
          slot('alien-0-discovery-red-trace', ETrace.RED, {
            isDiscovery: true,
          }),
          slot('alien-0-discovery-yellow-trace', ETrace.YELLOW, {
            isDiscovery: true,
          }),
          slot('alien-0-discovery-blue-trace', ETrace.BLUE, {
            isDiscovery: true,
          }),
        ],
        overflowZones: [
          slot('alien-0-overflow-red-trace', ETrace.RED, {
            maxOccupants: -1,
          }),
          slot('alien-0-overflow-yellow-trace', ETrace.YELLOW, {
            maxOccupants: -1,
          }),
          slot('alien-0-overflow-blue-trace', ETrace.BLUE, {
            maxOccupants: -1,
          }),
        ],
      },
      cardZone: { faceUpCardId: 'ET.11', drawPileSize: 7, discardPileSize: 2 },
      board: {
        type: 'anomalies',
        traceBoard: {
          columns: {
            [ETrace.RED]: slot('alien-0-anomaly-column|red-trace', ETrace.RED, {
              maxOccupants: -1,
              occupants: [
                { source: { playerId: 'p1' }, traceColor: ETrace.RED },
              ],
            }),
            [ETrace.YELLOW]: slot(
              'alien-0-anomaly-column|yellow-trace',
              ETrace.YELLOW,
              { maxOccupants: -1 },
            ),
            [ETrace.BLUE]: slot(
              'alien-0-anomaly-column|blue-trace',
              ETrace.BLUE,
              { maxOccupants: -1 },
            ),
          },
        },
      },
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
    expect(screen.queryByTestId(/^alien-0-anomaly-token-/)).toBeNull();
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent(
      'Deck 7',
    );
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent(
      'Discard 2',
    );
    expect(screen.getByTestId('seti-card-ET.11')).toBeInTheDocument();
  });

  it('opens the shared card preview when clicking the alien deck face-up card', () => {
    const onCardInspect = vi.fn();
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ANOMALIES,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: { faceUpCardId: 'ET.11', drawPileSize: 7, discardPileSize: 2 },
      board: {
        type: 'anomalies',
        traceBoard: {
          columns: {
            [ETrace.RED]: slot('red', ETrace.RED),
            [ETrace.YELLOW]: slot('yellow', ETrace.YELLOW),
            [ETrace.BLUE]: slot('blue', ETrace.BLUE),
          },
        },
      },
    };

    const props = { aliens: [alien], playerColors: {}, onCardInspect };
    render(<AlienBoardView {...props} />);

    const faceUpCard = screen.getByTestId('alien-0-deck-face-up-card');
    expect(faceUpCard).toHaveClass('overflow-hidden');

    fireEvent.click(faceUpCard);

    expect(onCardInspect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ET.11' }),
    );
  });

  it('renders discovered Oumuamua as a landing area with planet orbit and land details', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.OUMUAMUA,
      discovered: true,
      discovery: {
        zones: [],
        overflowZones: [
          slot('alien-0-overflow-red-trace', ETrace.RED, {
            maxOccupants: -1,
          }),
          slot('alien-0-overflow-yellow-trace', ETrace.YELLOW, {
            maxOccupants: -1,
          }),
          slot('alien-0-overflow-blue-trace', ETrace.BLUE, {
            maxOccupants: -1,
          }),
        ],
      },
      cardZone: { faceUpCardId: null, drawPileSize: 4, discardPileSize: 1 },
      board: {
        type: 'oumuamua',
        tile: {
          spaceId: 'ring-3-cell-5',
          sectorId: 'sector-2',
          dataRemaining: 2,
          markerPlayerIds: ['p1'],
        },
        traceSlots: [],
      },
    };
    const planetaryBoard: IPublicPlanetaryBoard = {
      configs: {},
      planets: {
        [EPlanet.OUMUAMUA]: {
          orbitSlots: [{ playerId: 'p2' }],
          landingSlots: [{ playerId: 'p1' }],
          firstOrbitClaimed: true,
          firstLandDataBonusTaken: [true, false, false],
          moonOccupant: null,
        },
      },
    };

    const props = {
      aliens: [alien],
      playerColors: { p1: '#f00', p2: '#00f' },
      planetaryBoard,
    };
    render(<AlienBoardView {...props} />);

    expect(
      screen.getByTestId('alien-0-oumuamua-landing-area'),
    ).toHaveTextContent('Oumuamua Landing Area');
    expect(
      screen.queryByTestId('alien-0-oumuamua-data-box'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-oumuamua-orbit-token-p2-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-oumuamua-landing-token-p1-0'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-oumuamua-first-land-data-1'),
    ).toHaveClass('border-surface-600');
    expect(screen.getByTestId('alien-0-oumuamua-cell')).toHaveTextContent(
      'Orbit reward',
    );
    expect(screen.getByTestId('alien-0-oumuamua-cell')).toHaveTextContent(
      'Land reward',
    );
    expect(
      screen.queryByTestId('oumuamua-tile-marker-p1-0'),
    ).not.toBeInTheDocument();
  });

  it('keeps text-mode Oumuamua focused on its landing cell details', () => {
    useDebugStore.setState({ textMode: true });
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.OUMUAMUA,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'oumuamua',
        tile: {
          spaceId: 'ring-3-cell-5',
          sectorId: 'sector-2',
          dataRemaining: 2,
          markerPlayerIds: [],
        },
        traceSlots: [],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    const cell = screen.getByTestId('alien-0-oumuamua-cell');

    expect(
      screen.queryByTestId('alien-0-oumuamua-data-box'),
    ).not.toBeInTheDocument();
    expect(cell).toHaveTextContent('O: 10 VP');
    expect(cell).toHaveTextContent('L: 9 VP');
  });
});
