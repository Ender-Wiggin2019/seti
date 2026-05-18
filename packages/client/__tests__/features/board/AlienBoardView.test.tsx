import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { EAlienIcon } from '@seti/common/types/element';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { AlienBoardView } from '@/features/board/AlienBoardView';
import i18n from '@/i18n';
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
  beforeEach(async () => {
    await i18n.changeLanguage('en');
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
          {
            slotId: 'energy-and-alien-card',
            rewards: [
              { type: 'ENERGY', amount: 1 },
              { type: 'CUSTOM', effectId: 'CENTAURIANS_DRAW_ALIEN_CARD' },
            ],
            dataCost: 0,
            claimedByPlayerId: null,
          },
          {
            slotId: 'any-trace',
            rewards: [{ type: 'CUSTOM', effectId: 'CENTAURIANS_ANY_TRACE' }],
            dataCost: 0,
            claimedByPlayerId: null,
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
    expect(
      within(
        screen.getByTestId('alien-0-centaurians-reward-energy-and-alien-card'),
      ).getByTestId('trace-reward-icon-energy-1'),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId('alien-0-centaurians-reward-energy-and-alien-card'),
      ).getByTestId('trace-reward-icon-draw-alien-card-1'),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId('alien-0-centaurians-reward-any-trace'),
      ).getByTestId('trace-reward-icon-any-trace-1'),
    ).toBeInTheDocument();
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
          [EPlanet.JUPITER]: 2,
          [EPlanet.SATURN]: 1,
        },
        publicSamples: ['mascamites-vp-7'],
        capsules: [
          {
            capsuleId: 'cap-1',
            ownerId: 'p1',
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
      screen.getByTestId('alien-0-mascamites-capsule-cap-1'),
    ).not.toHaveTextContent('mascamites-credit-2');
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

  it('renders localized Glyphids board state with DescRender glyph icons', async () => {
    await i18n.changeLanguage('zh-CN');
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.GLYPHIDS,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: {
        faceUpCardId: 'SA.ET.1',
        drawPileSize: 9,
        discardPileSize: 0,
      },
      board: {
        type: 'glyphids',
        glyphTokenBankSize: 33,
        glyphRows: { p1: [[EAlienIcon.GLYPH_RED, EAlienIcon.GLYPH_BLUE]] },
        boardTokens: [
          { position: 0, glyph: EAlienIcon.GLYPH_YELLOW },
          { position: 3, glyph: EAlienIcon.GLYPH_PURPLE },
        ],
        translationRows: [
          {
            rowId: 'glyphids-translation-level-1',
            level: 1,
            glyphs: [EAlienIcon.GLYPH_GREEN, null, null, null],
            side: 1,
          },
        ],
        traceSlots: [slot('alien-0-glyphids-red-0', ETrace.RED)],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{ p1: '#f00' }} />);

    expect(screen.getByTestId('alien-0-glyphids-board')).toBeInTheDocument();
    expect(screen.getAllByText('字形族')).toHaveLength(2);
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent(
      '外星牌库',
    );
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent(
      '牌库 9',
    );
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent(
      '弃牌 0',
    );
    expect(screen.getByTestId('alien-0-glyphids-bank')).toHaveTextContent(
      '库存 33',
    );
    expect(screen.getByText('玩家行')).toBeInTheDocument();
    expect(screen.getByText('板块标记')).toBeInTheDocument();
    expect(screen.getByText('翻译')).toBeInTheDocument();
    expect(screen.getByText('面 1')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-glyphids-row-p1-0')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('alien-0-glyphids-row-p1-0')).getByTestId(
        'seti-desc-glyph-red-1',
      ),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByTestId(
          'alien-0-glyphids-translation-glyphids-translation-level-1',
        ),
      ).getByTestId('seti-desc-glyph-green-1'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('alien-0-glyphids-board-token-0')).getByTestId(
        'seti-desc-glyph-yellow-1',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-glyphids-trace-column-red-trace'),
    ).toBeInTheDocument();
  });

  it('renders localized Amoeba board state with DescRender organelle icons', async () => {
    await i18n.changeLanguage('zh-CN');
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.AMOEBA,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: {
        faceUpCardId: 'SA.ET.11',
        drawPileSize: 9,
        discardPileSize: 0,
      },
      board: {
        type: 'amoeba',
        organelles: [
          {
            tokenId: 'amoeba-organelle-0',
            color: EAlienIcon.ORGANELLE_RED,
            position: 8,
          },
          {
            tokenId: 'amoeba-organelle-1',
            color: EAlienIcon.ORGANELLE_YELLOW,
            position: 4,
          },
        ],
        traceSlots: [slot('alien-0-amoeba-red-0', ETrace.RED)],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    expect(screen.getByTestId('alien-0-amoeba-board')).toBeInTheDocument();
    expect(screen.getByText('变形虫细胞器')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-amoeba-cell-8')).toHaveAttribute(
      'data-trace-color',
      ETrace.BLUE,
    );
    expect(screen.getByTestId('alien-0-amoeba-cell-4')).toHaveAttribute(
      'data-trace-color',
      ETrace.YELLOW,
    );
    expect(screen.getByTestId('alien-0-amoeba-cell-2')).toHaveAttribute(
      'data-trace-color',
      ETrace.RED,
    );
    expect(
      within(screen.getByTestId('alien-0-amoeba-organelle-8')).getByTestId(
        'seti-desc-organelle-red-1',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('alien-0-amoeba-organelle-4')).getByTestId(
        'seti-desc-organelle-yellow-1',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-amoeba-trace-column-red-trace'),
    ).toBeInTheDocument();
  });

  it('renders localized Arkhos exploration, security, access, and trace state', async () => {
    await i18n.changeLanguage('zh-CN');
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ARKHOS,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: {
        faceUpCardId: null,
        drawPileSize: 0,
        discardPileSize: 0,
      },
      board: {
        type: 'arkhos',
        explorationDeckSize: 5,
        explorationReserveSize: 4,
        explorationDiscardSize: 0,
        securityCardsByPlayer: {
          p1: [
            {
              cardId: 'AIcard01',
              traceColor: ETrace.RED,
              zone: 'front',
            },
            {
              cardId: 'AIcard05',
              traceColor: ETrace.YELLOW,
              zone: 'hand',
            },
            {
              cardId: 'AIcard09',
              traceColor: ETrace.BLUE,
              zone: 'used',
            },
          ],
        },
        accessByPlayer: {
          p1: {
            breachedCount: 2,
            accessLevel: 2,
          },
        },
        resolvedExplorationRewards: [
          {
            playerId: 'p1',
            cardId: 'ARKHOS.EXPLORATION.2',
            size: 'major',
            effectId: 'ARKHOS_EXPLORATION_02_MAJOR_UNMAPPED',
          },
        ],
        traceSlots: [slot('alien-0-arkhos-level-0-0-red-trace', ETrace.RED)],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{ p1: '#f00' }} />);

    expect(screen.getByTestId('alien-0-arkhos-board')).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-arkhos-exploration-counts'),
    ).toHaveTextContent('牌库 5 / 储备 4 / 弃牌 0');
    expect(screen.getByText('安保')).toBeInTheDocument();
    expect(screen.getByText('访问')).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-arkhos-security-p1'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-arkhos-security-card-AIcard01'),
    ).toHaveTextContent('正面');
    expect(screen.getByTestId('alien-0-arkhos-access-p1')).toHaveTextContent(
      '等级 2 / 2',
    );
    expect(
      screen.getByTestId('alien-0-arkhos-trace-column-red-trace'),
    ).toBeInTheDocument();
    expect(screen.getByText('已揭示奖励')).toBeInTheDocument();
    expect(screen.getByTestId('alien-0-arkhos-reward-0')).toHaveAttribute(
      'title',
      'ARKHOS_EXPLORATION_02_MAJOR_UNMAPPED',
    );
    expect(
      screen.getByRole('img', {
        name: 'p1 的 Arkhos 探索 ARKHOS.EXPLORATION.2 大奖励',
      }),
    ).toHaveAttribute(
      'src',
      '/assets/seti/aliens/arkhos/exploration/AI_02.jpg',
    );
  });

  it('keeps one-to-one local assets for Arkhos exploration reward tiles', () => {
    for (let index = 1; index <= 9; index += 1) {
      const assetNumber = index.toString().padStart(2, '0');
      const src = `/assets/seti/aliens/arkhos/exploration/AI_${assetNumber}.jpg`;
      expect(existsSync(resolvePublicAsset(src)), src).toBe(true);
    }
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
          moonOccupants: [],
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

function resolvePublicAsset(src: string): string {
  const root = existsSync(join(process.cwd(), 'packages/client/public'))
    ? join(process.cwd(), 'packages/client/public')
    : join(process.cwd(), 'public');
  return join(root, src.replace(/^\//, ''));
}
