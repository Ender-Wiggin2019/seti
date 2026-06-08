import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { EAlienIcon } from '@seti/common/types/element';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { AlienBoardView } from '@/features/board/AlienBoardView';
import i18n from '@/i18n';
import { useDebugStore } from '@/stores/debugStore';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicAlienState,
  IPublicPlanetaryBoard,
  IPublicTraceSlot,
} from '@/types/re-exports';
import {
  EAlienType,
  EMainAction,
  EPlanet,
  EPlayerInputType,
  ETrace,
} from '@/types/re-exports';

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

/**
 * Build the 5 per-tier anomaly column slots for a given color (4 single-cap
 * tiers + 1 overflow at the top), bottom→top.
 */
function buildAnomalyColumnSlots(
  color: ETrace.PINK | ETrace.YELLOW | ETrace.BLUE,
  options: {
    tier1Occupants?: IPublicTraceSlot['occupants'];
    overflowOccupants?: IPublicTraceSlot['occupants'];
  } = {},
): IPublicTraceSlot[] {
  return [1, 2, 3, 4, 5].map((tier) =>
    slot(`alien-0-anomaly-column|${color}|${tier}`, color, {
      maxOccupants: tier === 5 ? -1 : 1,
      occupants:
        tier === 1
          ? (options.tier1Occupants ?? [])
          : tier === 5
            ? (options.overflowOccupants ?? [])
            : [],
    }),
  );
}

describe('AlienBoardView', () => {
  const ALIEN_TRACE_SLOT_SIZE_STYLE = {
    width: '13.900161%',
    height: '7.632809%',
  };

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    useDebugStore.setState({
      textMode: false,
      hotspotDebug: false,
      hotspotOverrides: {},
      hotspotDraftOverrides: {},
    });
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
      'min-[420px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
    );
    expect(screen.getByTestId('alien-0-card')).toHaveClass('min-w-0');
    expect(screen.getByTestId('alien-1-card')).toHaveClass('min-w-0');
  });

  it('scales the whole alien board area down on larger viewports', () => {
    const aliens: IPublicAlienState[] = [
      {
        alienIndex: 0,
        alienType: null,
        discovered: false,
        discovery: {
          zones: [],
          overflowZones: [],
        },
        cardZone: null,
        board: null,
      },
    ];

    render(<AlienBoardView aliens={aliens} playerColors={{}} />);

    const section = screen.getByTestId('alien-board-section');
    expect(section).toHaveClass('w-full');
    expect(section).toHaveClass('md:w-[52%]');
    expect(section).toHaveClass('md:max-w-[52%]');
    expect(section).toHaveClass('md:self-start');
  });

  it('renders all public alien reward labels', () => {
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.DUMMY,
      discovered: true,
      discovery: {
        zones: [],
        overflowZones: [
          slot('alien-0-overflow-red-trace', ETrace.PINK, {
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
            traceColor: ETrace.PINK,
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
          slot('reward-slot-2', ETrace.PINK),
          slot('reward-slot-3', ETrace.PINK),
        ],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    const rewardCircle = screen.getByTestId('trace-slot-reward-slot-circle');
    expect(rewardCircle).toHaveClass('rounded-full');
    expect(rewardCircle).toHaveClass('aspect-[1/2]', 'w-full');
    expect(rewardCircle).toHaveStyle({ borderColor: '#d63384' });
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
    ).toHaveClass('aspect-square', 'w-full', 'rounded-full');
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
          slot('alien-0-discovery-red-trace', ETrace.PINK, {
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
          slot('alien-0-overflow-red-trace', ETrace.PINK, {
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

    // In the default (real) mode the hidden board renders the face-down
    // alien-back image. The plain black placeholder only appears in text
    // mode (covered by storybook tests).
    expect(hiddenBoard).toHaveAttribute(
      'aria-label',
      'Alien Board (face-down)',
    );
    expect(
      within(hiddenBoard).getByAltText('Face-down alien board'),
    ).toBeInTheDocument();
    expect(
      within(hiddenBoard).getByAltText('Face-down alien board'),
    ).toHaveAttribute('src', '/assets/seti/aliens/back.webp');
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
    // The text-mode renderer is the one that exposes per-column test IDs
    // (`alien-0-anomaly-column-<color>`); the real-mode art renderer paints
    // the columns directly onto the alien-board image.
    useDebugStore.setState({ textMode: true });
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ANOMALIES,
      discovered: true,
      discovery: {
        zones: [
          slot('alien-0-discovery-red-trace', ETrace.PINK, {
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
          slot('alien-0-overflow-red-trace', ETrace.PINK, {
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
            [ETrace.PINK]: buildAnomalyColumnSlots(ETrace.PINK, {
              tier1Occupants: [
                { source: { playerId: 'p1' }, traceColor: ETrace.PINK },
              ],
            }),
            [ETrace.YELLOW]: buildAnomalyColumnSlots(ETrace.YELLOW),
            [ETrace.BLUE]: buildAnomalyColumnSlots(ETrace.BLUE),
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
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent('7');
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent('2');
    expect(screen.getByTestId('text-card-ET.11')).toBeInTheDocument();
  });

  it('exposes Anomalies image trace markers through the shared anchor debug layer', () => {
    useDebugStore.getState().setHotspotDebug(true);
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ANOMALIES,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'anomalies',
        traceBoard: {
          columns: {
            [ETrace.PINK]: buildAnomalyColumnSlots(ETrace.PINK, {
              tier1Occupants: [
                { source: { playerId: 'p1' }, traceColor: ETrace.PINK },
              ],
            }),
            [ETrace.YELLOW]: buildAnomalyColumnSlots(ETrace.YELLOW),
            [ETrace.BLUE]: buildAnomalyColumnSlots(ETrace.BLUE),
          },
        },
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{ p1: '#f00' }} />);

    const marker = screen.getByTestId('alien-0-anomalies-marker-red-trace-0');
    expect(marker).toHaveAttribute('data-hotspot-scene', 'alien-board');
    expect(marker).toHaveAttribute('data-hotspot-role', 'anchor');
    expect(marker).toHaveAttribute(
      'data-hotspot-id',
      'anomalies-0-red-trace-0',
    );
    expect(
      screen.queryByText('anomalies red-trace trace 1'),
    ).not.toBeInTheDocument();

    fireEvent.mouseEnter(marker);

    expect(screen.getByText('anomalies red-trace trace 1')).toBeInTheDocument();
  });

  it('exposes printed alien trace slots as image anchors even when empty', () => {
    useDebugStore.setState({ hotspotDebug: true, showAnchorHotspots: true });
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.MASCAMITES,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'mascamites',
        samplePools: { [EPlanet.JUPITER]: 0, [EPlanet.SATURN]: 0 },
        publicSamples: [],
        capsules: [],
        deliveredSamples: [],
        traceSlots: [],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    const pinkSlot = screen.getByTestId('alien-0-mascamites-slot-red-trace-3');
    const extraBlueSlot = screen.getByTestId(
      'alien-0-mascamites-slot-blue-trace-8',
    );

    expect(pinkSlot).toHaveAttribute('data-hotspot-scene', 'alien-board');
    expect(pinkSlot).toHaveAttribute('data-hotspot-role', 'anchor');
    expect(pinkSlot).toHaveAttribute('data-hotspot-variant', 'image');
    expect(pinkSlot).toHaveAttribute(
      'data-hotspot-id',
      'mascamites-0-red-trace-slot-3',
    );
    expect(
      screen.queryByTestId('alien-0-mascamites-slot-red-trace-4'),
    ).not.toBeInTheDocument();
    expect(extraBlueSlot).toHaveAttribute(
      'data-hotspot-id',
      'mascamites-0-blue-trace-slot-8',
    );
    expect(
      screen.queryByText('mascamites blue-trace slot 9'),
    ).not.toBeInTheDocument();

    fireEvent.mouseEnter(extraBlueSlot);

    expect(
      screen.getByText('mascamites blue-trace slot 9'),
    ).toBeInTheDocument();
    expect(screen.getByText('No server trace slot')).toBeInTheDocument();
  });

  it('shows trace slot bonus details in the hover debug info', () => {
    useDebugStore.setState({ hotspotDebug: true, showAnchorHotspots: true });
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.MASCAMITES,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'mascamites',
        samplePools: { [EPlanet.JUPITER]: 0, [EPlanet.SATURN]: 0 },
        publicSamples: [],
        capsules: [],
        deliveredSamples: [],
        traceSlots: [
          slot('alien-0-mascamites-sample-blue-0', ETrace.BLUE, {
            rewards: [
              { type: 'VP', amount: 3 },
              { type: 'CARD_ANY', amount: 1 },
            ],
          }),
        ],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    const blueSlot = screen.getByTestId('alien-0-mascamites-slot-blue-trace-0');
    expect(screen.queryByText('Trace bonus: 3 VP + 1 any card')).toBeNull();

    fireEvent.mouseEnter(blueSlot);

    expect(
      screen.getByText('Trace bonus: 3 VP + 1 any card'),
    ).toBeInTheDocument();
  });

  it('uses the calibrated size for every printed alien trace slot anchor', () => {
    const anomalies: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.ANOMALIES,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'anomalies',
        traceBoard: {
          columns: {
            [ETrace.PINK]: buildAnomalyColumnSlots(ETrace.PINK),
            [ETrace.YELLOW]: buildAnomalyColumnSlots(ETrace.YELLOW),
            [ETrace.BLUE]: buildAnomalyColumnSlots(ETrace.BLUE),
          },
        },
      },
    };
    const mascamites: IPublicAlienState = {
      alienIndex: 1,
      alienType: EAlienType.MASCAMITES,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'mascamites',
        samplePools: { [EPlanet.JUPITER]: 0, [EPlanet.SATURN]: 0 },
        publicSamples: [],
        capsules: [],
        deliveredSamples: [],
        traceSlots: [],
      },
    };

    render(
      <AlienBoardView aliens={[anomalies, mascamites]} playerColors={{}} />,
    );

    expect(
      screen.getByTestId('alien-0-anomalies-slot-red-trace-0'),
    ).toHaveStyle(ALIEN_TRACE_SLOT_SIZE_STYLE);
    expect(
      screen.getByTestId('alien-1-mascamites-slot-blue-trace-8'),
    ).toHaveStyle(ALIEN_TRACE_SLOT_SIZE_STYLE);
  });

  it('makes every selectable image trace slot clickable, not only the bottom slot', () => {
    const onRespondInput = vi.fn<(response: IInputResponse) => void>();
    const traceSlots = [0, 1, 2, 3, 4].map((index) =>
      slot(`alien-0-mascamites-blue-${index}`, ETrace.BLUE),
    );
    const pendingInput: IPlayerInputModel = {
      inputId: 'place-blue-trace',
      type: EPlayerInputType.OPTION,
      title: 'Place blue trace',
      options: traceSlots.map((traceSlot, index) => ({
        id: traceSlot.slotId,
        label: `Blue slot ${index + 1}`,
      })),
    };
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.MASCAMITES,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'mascamites',
        samplePools: { [EPlanet.JUPITER]: 0, [EPlanet.SATURN]: 0 },
        publicSamples: [],
        capsules: [],
        deliveredSamples: [],
        traceSlots,
      },
    };

    render(
      <AlienBoardView
        aliens={[alien]}
        playerColors={{}}
        pendingInput={pendingInput}
        onRespondInput={onRespondInput}
      />,
    );

    const topSlot = screen.getByTestId(
      'alien-0-mascamites-hotspot-blue-trace-4',
    );
    expect(topSlot).toHaveAttribute(
      'data-hotspot-id',
      'mascamites-0-blue-trace-slot-4',
    );
    expect(topSlot).toHaveAttribute(
      'data-server-trace-slot-id',
      'alien-0-mascamites-blue-4',
    );
    expect(topSlot).toHaveAttribute('data-hotspot-role', 'interactive');

    fireEvent.click(topSlot);

    expect(onRespondInput).toHaveBeenCalledWith({
      inputId: 'place-blue-trace',
      type: EPlayerInputType.OPTION,
      optionId: 'alien-0-mascamites-blue-4',
    });
  });

  it('keeps Exertians bottom printed trace row mapped to the calibrated slot anchor', () => {
    useDebugStore.setState({ hotspotDebug: true, showAnchorHotspots: true });
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.EXERTIANS,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'exertians',
        faceDownCards: [],
        milestones: [],
        traceSlots: [
          slot('exertians-danger-3-red-trace-0', ETrace.PINK, {
            rewards: [
              { type: 'VP', amount: 9 },
              { type: 'CREDIT', amount: 1 },
            ],
          }),
        ],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    const bottomRedSlot = screen.getByTestId(
      'alien-0-exertians-slot-red-trace-0',
    );
    expect(bottomRedSlot).toHaveAttribute(
      'data-hotspot-id',
      'exertians-0-red-trace-slot-1',
    );

    fireEvent.mouseEnter(bottomRedSlot);

    expect(
      screen.getByText('Trace bonus: 9 VP + 1 credit'),
    ).toBeInTheDocument();
  });

  it.each([
    {
      alienType: EAlienType.CENTAURIANS,
      board: {
        type: 'centaurians' as const,
        messageMilestones: [],
        pendingMessagesByPlayer: {},
        rewardSlots: [],
        traceSlots: [
          slot('alien-0-centaurians-red-0', ETrace.PINK, {
            occupants: [
              { source: { playerId: 'p1' }, traceColor: ETrace.PINK },
            ],
          }),
        ],
      },
      testId: 'alien-0-centaurians-marker-red-trace-0-0',
      hotspotId: 'centaurians-0-red-trace-0-0',
      label: 'centaurians red-trace trace 1',
    },
    {
      alienType: EAlienType.EXERTIANS,
      board: {
        type: 'exertians' as const,
        faceDownCards: [],
        milestones: [],
        traceSlots: [
          slot('alien-0-exertians-red-0', ETrace.PINK, {
            occupants: [
              { source: { playerId: 'p1' }, traceColor: ETrace.PINK },
            ],
          }),
        ],
      },
      testId: 'alien-0-exertians-marker-red-trace-0-0',
      hotspotId: 'exertians-0-red-trace-0-0',
      label: 'exertians red-trace trace 1',
    },
    {
      alienType: EAlienType.MASCAMITES,
      board: {
        type: 'mascamites' as const,
        samplePools: { [EPlanet.JUPITER]: 0, [EPlanet.SATURN]: 0 },
        publicSamples: [],
        capsules: [],
        deliveredSamples: [],
        traceSlots: [
          slot('alien-0-mascamites-red-0', ETrace.PINK, {
            occupants: [
              { source: { playerId: 'p1' }, traceColor: ETrace.PINK },
            ],
          }),
        ],
      },
      testId: 'alien-0-mascamites-marker-red-trace-0-0',
      hotspotId: 'mascamites-0-red-trace-0-0',
      label: 'mascamites red-trace trace 1',
    },
    {
      alienType: EAlienType.OUMUAMUA,
      board: {
        type: 'oumuamua' as const,
        tile: {
          spaceId: 'ring-3-cell-5',
          sectorId: 'sector-2',
          dataRemaining: 2,
          markerPlayerIds: [],
        },
        traceSlots: [
          slot('alien-0-oumuamua-red-0', ETrace.PINK, {
            occupants: [
              { source: { playerId: 'p1' }, traceColor: ETrace.PINK },
            ],
          }),
        ],
      },
      testId: 'alien-0-oumuamua-marker-red-trace-0-0',
      hotspotId: 'oumuamua-0-red-trace-0-0',
      label: 'oumuamua red-trace trace 1',
    },
  ])(
    'exposes $board.type image trace markers through the shared anchor debug layer',
    ({ alienType, board, testId, hotspotId, label }) => {
      useDebugStore.getState().setHotspotDebug(true);
      const alien: IPublicAlienState = {
        alienIndex: 0,
        alienType,
        discovered: true,
        discovery: { zones: [], overflowZones: [] },
        cardZone: null,
        board,
      };

      render(<AlienBoardView aliens={[alien]} playerColors={{ p1: '#f00' }} />);

      const marker = screen.getByTestId(testId);
      expect(marker).toHaveAttribute('data-hotspot-scene', 'alien-board');
      expect(marker).toHaveAttribute('data-hotspot-role', 'anchor');
      expect(marker).toHaveAttribute('data-hotspot-id', hotspotId);
      expect(screen.queryByText(label)).not.toBeInTheDocument();

      fireEvent.mouseEnter(marker);

      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );

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
            [ETrace.PINK]: buildAnomalyColumnSlots(ETrace.PINK),
            [ETrace.YELLOW]: buildAnomalyColumnSlots(ETrace.YELLOW),
            [ETrace.BLUE]: buildAnomalyColumnSlots(ETrace.BLUE),
          },
        },
      },
    };

    const props = { aliens: [alien], playerColors: {}, onCardInspect };
    useDebugStore.getState().setHotspotDebug(true);
    render(<AlienBoardView {...props} />);

    const faceUpCard = screen.getByTestId('alien-0-deck-face-up-card');
    expect(faceUpCard).toHaveClass('overflow-hidden');
    expect(faceUpCard).toHaveAttribute('data-hotspot-scene', 'alien-board');
    expect(faceUpCard).toHaveAttribute(
      'data-hotspot-id',
      'deck-0-face-up-card',
    );
    expect(screen.queryByText('Alien card ET.11')).not.toBeInTheDocument();

    fireEvent.mouseEnter(faceUpCard);

    expect(screen.getByText('Alien card ET.11')).toBeInTheDocument();

    fireEvent.click(faceUpCard);

    expect(onCardInspect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ET.11' }),
    );
  });

  it('renders Centaurians message milestones as public board state', () => {
    useDebugStore.setState({ textMode: true });
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.CENTAURIANS,
      discovered: true,
      discovery: {
        zones: [
          slot('alien-0-discovery-red-trace', ETrace.PINK, {
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
          slot('alien-0-overflow-red-trace', ETrace.PINK, {
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

    const gameState = {
      players: [
        { playerId: 'p1', playerName: 'Alice', score: 12 },
        { playerId: 'p2', playerName: 'Bob', score: 20 },
      ],
    } as unknown as Parameters<typeof AlienBoardView>[0]['gameState'];

    render(
      <AlienBoardView
        aliens={[alien]}
        playerColors={{ p1: '#f00', p2: '#00f' }}
        gameState={gameState}
        myPlayerId='p1'
      />,
    );

    expect(screen.getByTestId('alien-0-centaurians-board')).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-centaurians-messages-rail-p1'),
    ).toHaveTextContent('27 VP');
    expect(
      screen.getByTestId('alien-0-centaurians-messages-rail-p2'),
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
    useDebugStore.setState({ textMode: true });
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
    useDebugStore.setState({ textMode: true });
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
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent('5');
  });

  it('renders localized Glyphids board state with DescRender glyph icons', async () => {
    useDebugStore.setState({ textMode: true });
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
        placedTokens: [],
        translationRows: [
          {
            rowId: 'glyphids-translation-level-1',
            level: 1,
            glyphs: [EAlienIcon.GLYPH_GREEN, null, null, null],
            side: 1,
          },
        ],
        traceSlots: [slot('alien-0-glyphids-red-0', ETrace.PINK)],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{ p1: '#f00' }} />);

    expect(screen.getByTestId('alien-0-glyphids-board')).toBeInTheDocument();
    // The alien name now appears in three places: the alien-card title, the
    // deck-rail label, and the glyphids board section.
    expect(screen.getAllByText('字形族')).toHaveLength(3);
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent('9');
    expect(screen.getByTestId('alien-0-deck-panel')).toHaveTextContent('0');
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
        traceSlots: [slot('alien-0-amoeba-red-0', ETrace.PINK)],
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
      ETrace.PINK,
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
              traceColor: ETrace.PINK,
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
        traceSlots: [slot('alien-0-arkhos-level-0-0-red-trace', ETrace.PINK)],
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

  it('keeps alien back and board art assets in webp format', () => {
    const assets = [
      '/assets/seti/aliens/back.webp',
      '/assets/seti/aliens/amoeba/board.webp',
      '/assets/seti/aliens/anomalies/board.webp',
      '/assets/seti/aliens/arkhos/board.webp',
      '/assets/seti/aliens/centaurians/board.webp',
      '/assets/seti/aliens/exertians/board.webp',
      '/assets/seti/aliens/glyphids/board.webp',
      '/assets/seti/aliens/mascamites/board.webp',
      '/assets/seti/aliens/oumuamua/board.webp',
    ];

    for (const src of assets) {
      expect(src.endsWith('.webp'), src).toBe(true);
      expect(existsSync(resolvePublicAsset(src)), src).toBe(true);
    }
  });

  it('renders discovered Oumuamua as a landing area with planet orbit and land details', () => {
    useDebugStore.setState({ textMode: true });
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.OUMUAMUA,
      discovered: true,
      discovery: {
        zones: [],
        overflowZones: [
          slot('alien-0-overflow-red-trace', ETrace.PINK, {
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

  it('exposes Oumuamua planet targets through the shared hotspot debug layer', () => {
    useDebugStore.setState({ hotspotDebug: true, showAnchorHotspots: true });
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

    render(
      <AlienBoardView
        aliens={[alien]}
        playerColors={{}}
        planetActionMode={EMainAction.ORBIT}
      />,
    );

    const target = screen.getByTestId('planet-target-oumuamua');
    expect(target).toHaveAttribute('data-hotspot-scene', 'alien-board');
    expect(target).toHaveAttribute('data-hotspot-id', 'oumuamua-0-orbit-area');
    expect(screen.queryByText('Oumuamua orbit')).not.toBeInTheDocument();

    fireEvent.mouseEnter(target);

    expect(screen.getByText('Oumuamua orbit')).toBeInTheDocument();
    expect(
      screen.getByTestId('alien-0-oumuamua-anchor-orbit-area'),
    ).toHaveAttribute('data-hotspot-id', 'oumuamua-0-orbit-area');
    expect(
      screen.getByTestId('alien-0-oumuamua-anchor-land-area'),
    ).toHaveAttribute('data-hotspot-id', 'oumuamua-0-land-area');
    expect(
      screen.getByTestId('alien-0-oumuamua-anchor-first-land-data-3'),
    ).toHaveAttribute('data-hotspot-id', 'oumuamua-0-first-land-data-3');
  });

  it('exposes Centaurians top message slots as image anchors', () => {
    useDebugStore.setState({ hotspotDebug: true, showAnchorHotspots: true });
    const alien: IPublicAlienState = {
      alienIndex: 0,
      alienType: EAlienType.CENTAURIANS,
      discovered: true,
      discovery: { zones: [], overflowZones: [] },
      cardZone: null,
      board: {
        type: 'centaurians',
        messageMilestones: [],
        pendingMessagesByPlayer: {},
        rewardSlots: [],
        traceSlots: [],
      },
    };

    render(<AlienBoardView aliens={[alien]} playerColors={{}} />);

    for (const slotId of [
      'any-trace',
      'energy-and-alien-card',
      'publicity-3',
      'score-8',
    ]) {
      expect(
        screen.getByTestId(`alien-0-centaurians-message-anchor-${slotId}`),
      ).toHaveAttribute('data-hotspot-id', `centaurians-0-message-${slotId}`);
    }
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
