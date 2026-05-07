import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
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
      'min-[420px]:grid-cols-2',
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
    expect(rewardCircle).toHaveClass('rounded-full');
    expect(rewardCircle).toHaveClass('min-h-24', 'w-12');
    expect(rewardCircle).toHaveStyle({ borderColor: '#e93e27' });
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
    expect(
      within(rewardCircle).getByTestId('seti-desc-draw-alien-card-1'),
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
      within(redColumn).getByTestId('trace-slot-reward-slot-2-circle'),
    ).toHaveClass('h-12', 'w-12', 'rounded-full');
    expect(
      screen.getByTestId('alien-0-generic-board-column-red-trace-slots'),
    ).toHaveClass('flex-col-reverse');
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

    expect(hiddenBoard).toHaveClass('bg-black/60');
    expect(hiddenBoard).toHaveClass('min-h-[360px]');
    expect(hiddenBoard).toHaveAttribute('aria-label', 'Alien Board');
    expect(hiddenBoard.compareDocumentPosition(discoveryZone)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(discoveryZone.compareDocumentPosition(overflowZone)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(
      screen.queryByTestId('alien-0-hidden-board-column-red-trace'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('alien-0-hidden-board-column-yellow-trace'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('alien-0-hidden-board-column-blue-trace'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-discovery-column-red-trace'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-discovery-column-red-trace-slots'),
    ).toHaveClass('flex-col-reverse');
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
    expect(screen.getByTestId('alien-0-anomaly-trace-grid')).toHaveClass(
      'grid-cols-3',
    );
    expect(screen.getByTestId('alien-0-anomaly-trace-grid')).not.toHaveClass(
      'sm:grid-cols-3',
    );
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
    const redRewards = screen.getByTestId(
      'alien-0-anomaly-column-red-trace-rewards',
    );
    expect(redRewards).toHaveClass('flex-col-reverse');
    expect(within(redRewards).queryByText('1')).not.toBeInTheDocument();
    expect(
      within(redRewards).getByTestId(
        'alien-0-anomaly-column-red-trace-reward-0',
      ),
    ).toHaveClass('h-10', 'w-10', 'rounded-full');
    expect(
      within(redRewards).getByTestId(
        'alien-0-anomaly-column-red-trace-reward-0',
      ),
    ).toHaveStyle({ borderColor: '#e93e27' });
    expect(
      within(redRewards).getByTestId('trace-reward-icon-score-5'),
    ).toHaveClass('h-5', 'w-5');
    expect(
      within(redRewards).getByTestId(
        'alien-0-anomaly-column-red-trace-reward-4',
      ),
    ).toHaveClass('min-h-20', 'w-10', 'rounded-full');
    expect(
      within(redRewards).getByTestId(
        'alien-0-anomaly-column-red-trace-reward-4',
      ),
    ).not.toHaveClass('h-10');
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

  it('renders Centaurians message milestones as public board state', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.CENTAURIANS,
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
      cardZone: { faceUpCardId: 'ET.31', drawPileSize: 6, discardPileSize: 1 },
      board: {
        type: 'centaurians',
        messageMilestones: [
          {
            playerId: 'p1',
            threshold: 27,
            sourceCardId: null,
            resolved: false,
          },
          {
            playerId: 'p2',
            threshold: 34,
            sourceCardId: 'ET.31',
            resolved: false,
          },
        ],
        pendingMessagesByPlayer: { p1: [], p2: ['ET.31'] },
        rewardSlots: [
          {
            slotId: 'score-8',
            rewards: [{ type: 'VP', amount: 8 }],
            dataCost: 0,
            claimedByPlayerId: 'p1',
          },
        ],
        traceSlots: [],
      },
    };

    render(
      <AlienBoardView
        aliens={[alien]}
        playerColors={{ p1: '#f00', p2: '#00f' }}
      />,
    );

    expect(screen.getByTestId('alien-0-centaurians-board')).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-centaurians-message-p1'),
    ).toHaveTextContent('27 VP');
    expect(
      screen.getByTestId('alien-0-centaurians-message-p2'),
    ).toHaveTextContent('34 VP');
    expect(
      screen.getByTestId('alien-0-centaurians-reward-score-8'),
    ).toHaveTextContent('p1');
  });

  it('renders Exertians hidden cards, milestones, and trace slots without card ids', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.EXERTIANS,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: { faceUpCardId: null, drawPileSize: 0, discardPileSize: 0 },
      board: {
        type: 'exertians',
        faceDownCards: [
          { ownerId: 'p1', revealed: false, source: 'discovery' },
          { ownerId: 'p1', revealed: false, source: 'milestone-20' },
          { ownerId: 'p2', revealed: false, source: 'milestone-40' },
        ],
        milestones: [
          { threshold: 24, claimedByPlayerIds: ['p1'], creditCost: 0 },
          { threshold: 44, claimedByPlayerIds: [], creditCost: 1 },
        ],
        traceSlots: [
          slot('alien-0-exertians-blue-1', ETrace.BLUE, {
            rewards: [{ type: 'VP', amount: 3 }],
          }),
        ],
      },
    };

    render(
      <AlienBoardView
        aliens={[alien]}
        playerColors={{ p1: '#f00', p2: '#00f' }}
      />,
    );

    expect(screen.getByTestId('alien-0-exertians-board')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-exertians-hidden-p1')).toHaveTextContent(
      '2',
    );
    expect(screen.getByTestId('alien-0-exertians-hidden-p2')).toHaveTextContent(
      '1',
    );
    expect(
      screen.getByTestId('alien-0-exertians-milestone-0'),
    ).toHaveTextContent('24 VP');
    expect(
      screen.getByTestId('alien-0-exertians-milestone-1'),
    ).toHaveTextContent('Cost 1C / 0 claimed');
    expect(
      screen.getByTestId('alien-0-exertians-trace-column-blue-trace'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-exertians-board')).not.toHaveTextContent(
      'ET.',
    );
  });

  it('renders Mascamites sample pools, capsules, delivered samples, and blue slots', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.MASCAMITES,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: { faceUpCardId: 'ET.1', drawPileSize: 5, discardPileSize: 1 },
      board: {
        type: 'mascamites',
        samplePools: {
          [EPlanet.JUPITER]: ['mascamites-credit-2', 'mascamites-energy-2'],
          [EPlanet.SATURN]: ['mascamites-card-2'],
        },
        publicSamples: ['mascamites-vp-7'],
        capsules: [
          {
            capsuleId: 'cap-1',
            ownerId: 'p1',
            sampleTokenId: 'mascamites-credit-2',
            sourcePlanet: EPlanet.JUPITER,
            spaceId: 'ring-2-cell-4',
            missionCardId: 'ET.1',
          },
        ],
        deliveredSamples: [
          {
            sampleTokenId: 'mascamites-vp-7',
            deliveredBy: 'p2',
            deliveredAtRound: 3,
            slotId: 'alien-0-mascamites-sample-blue-0',
          },
        ],
        traceSlots: [
          slot('alien-0-mascamites-sample-blue-0', ETrace.BLUE, {
            rewards: [{ type: 'VP', amount: 7 }],
          }),
        ],
      },
    };

    render(
      <AlienBoardView
        aliens={[alien]}
        playerColors={{ p1: '#f00', p2: '#00f' }}
      />,
    );

    expect(screen.getByTestId('alien-0-mascamites-board')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-mascamites-jupiter')).toHaveTextContent(
      '2 samples',
    );
    expect(screen.getByTestId('alien-0-mascamites-saturn')).toHaveTextContent(
      '1 sample',
    );
    expect(screen.getByTestId('alien-0-mascamites-public')).toHaveTextContent(
      'mascamites-vp-7',
    );
    expect(
      screen.getByTestId('alien-0-mascamites-capsule-cap-1'),
    ).toHaveTextContent('ET.1');
    expect(
      screen.getByTestId('alien-0-mascamites-delivered-0'),
    ).toHaveTextContent('Round 3');
    expect(
      screen.getByTestId('alien-0-mascamites-trace-column-blue-trace'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent(
      'Deck 5',
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
