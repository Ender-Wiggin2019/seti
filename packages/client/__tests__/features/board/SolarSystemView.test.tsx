import {
  createDefaultSetupConfig,
  SECTOR_STAR_CONFIGS,
  SECTOR_TILE_DEFINITIONS,
} from '@seti/common/constant/sectorSetup';
import { EAlienIcon, ESector } from '@seti/common/types/element';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps, ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SolarSystemView } from '@/features/board/SolarSystemView';
import { getWheelSlotLabelBoardPositionPercent } from '@/features/board/WheelLayer';
import { useDebugStore } from '@/stores/debugStore';
import { useGameViewStore } from '@/stores/gameViewStore';
import type {
  IPublicOumuamuaTile,
  IPublicSector,
  IPublicSolarSystem,
  IPublicSolarSystemSpaceState,
} from '@/types/re-exports';
import {
  EAlienType,
  EPlanet,
  EPlayerInputType,
  ETrace,
} from '@/types/re-exports';

const defaultSetup = createDefaultSetupConfig();

function createMockSpaceState(
  spaceId: string,
  index: number,
): IPublicSolarSystemSpaceState {
  const ringIndex = (Math.floor(index / 8) + 1) as 1 | 2 | 3 | 4;
  const sectorIndex = index % 8;
  const cellInSector = 0;

  return {
    spaceId,
    ringIndex,
    indexInRing: sectorIndex * ringIndex + cellInSector,
    sectorIndex,
    cellInSector,
    hasPublicityIcon: false,
    elementTypes: ['EMPTY'],
    elements: [{ type: 'EMPTY' }],
  };
}

function createMockSpaceStates(
  spaces: string[],
): Record<string, IPublicSolarSystemSpaceState> {
  return Object.fromEntries(
    spaces.map((spaceId, index) => [
      spaceId,
      createMockSpaceState(spaceId, index),
    ]),
  );
}

function createSectorSpaceIds(
  spaceStates: Record<string, IPublicSolarSystemSpaceState>,
): Record<number, string[]> {
  return Object.values(spaceStates).reduce<Record<number, string[]>>(
    (acc, state) => {
      acc[state.sectorIndex] = [
        ...(acc[state.sectorIndex] ?? []),
        state.spaceId,
      ];
      return acc;
    },
    {},
  );
}

function createProbeSpaceById(
  probes: IPublicSolarSystem['probes'],
): Record<string, string> {
  return Object.fromEntries(
    probes
      .filter((probe) => probe.probeId !== undefined)
      .map((probe) => [probe.probeId as string, probe.spaceId]),
  );
}

function createSolarSystemMock(): IPublicSolarSystem {
  const spaces = Array.from({ length: 32 }, (_, i) => `space-${i}`);
  const probes: IPublicSolarSystem['probes'] = [
    { playerId: 'player-1', spaceId: 'space-0' },
  ];
  const spaceStates = createMockSpaceStates(spaces);

  return {
    spaces,
    adjacency: {
      'space-0': ['space-1'],
    },
    probes,
    discs: [
      { discIndex: 0, angle: 1 },
      { discIndex: 1, angle: 2 },
      { discIndex: 2, angle: 3 },
      { discIndex: 3, angle: 0 },
    ],
    alienTokens: [],
    nextRotateRing: 2,
    spaceStates,
    planetSpaceIds: {},
    sectorSpaceIds: createSectorSpaceIds(spaceStates),
    probeSpaceById: createProbeSpaceById(probes),
  };
}

function createRotatedRingOneMock(): IPublicSolarSystem {
  const probes: IPublicSolarSystem['probes'] = [
    {
      playerId: 'player-1',
      spaceId: 'ring-1-cell-3',
      probeId: 'probe-earth',
    },
  ];
  const spaceStates: Record<string, IPublicSolarSystemSpaceState> = {
    'ring-1-cell-3': {
      spaceId: 'ring-1-cell-3',
      ringIndex: 1,
      indexInRing: 3,
      sectorIndex: 3,
      cellInSector: 0,
      hasPublicityIcon: false,
      elementTypes: ['EARTH'],
      elements: [{ type: 'EARTH' }],
    },
  };

  return {
    spaces: ['ring-1-cell-3'],
    adjacency: {
      'ring-1-cell-3': [],
    },
    probes,
    discs: [
      { discIndex: 0, angle: 5 },
      { discIndex: 1, angle: 0 },
      { discIndex: 2, angle: 0 },
    ],
    alienTokens: [],
    nextRotateRing: 1,
    spaceStates,
    planetSpaceIds: { [EPlanet.EARTH]: 'ring-1-cell-3' },
    sectorSpaceIds: createSectorSpaceIds(spaceStates),
    probeSpaceById: createProbeSpaceById(probes),
  };
}

function createExpandedOuterRingMock(
  overrides?: Partial<IPublicSolarSystem>,
): IPublicSolarSystem {
  const spaceStates: Record<string, IPublicSolarSystemSpaceState> = {
    'ring-4-cell-8': {
      spaceId: 'ring-4-cell-8',
      ringIndex: 4,
      indexInRing: 8,
      sectorIndex: 2,
      cellInSector: 0,
      hasPublicityIcon: true,
      elementTypes: ['PLANET'],
      elements: [{ type: 'PLANET', planet: EPlanet.NEPTUNE }],
    },
    'ring-4-cell-9': {
      spaceId: 'ring-4-cell-9',
      ringIndex: 4,
      indexInRing: 9,
      sectorIndex: 2,
      cellInSector: 1,
      hasPublicityIcon: false,
      elementTypes: ['EMPTY'],
      elements: [{ type: 'EMPTY' }],
    },
    'ring-4-cell-10': {
      spaceId: 'ring-4-cell-10',
      ringIndex: 4,
      indexInRing: 10,
      sectorIndex: 2,
      cellInSector: 2,
      hasPublicityIcon: false,
      elementTypes: ['ASTEROID'],
      elements: [{ type: 'ASTEROID' }],
    },
    'ring-4-cell-12': {
      spaceId: 'ring-4-cell-12',
      ringIndex: 4,
      indexInRing: 12,
      sectorIndex: 3,
      cellInSector: 0,
      hasPublicityIcon: false,
      elementTypes: ['ASTEROID'],
      elements: [{ type: 'ASTEROID' }],
    },
    'ring-4-cell-15': {
      spaceId: 'ring-4-cell-15',
      ringIndex: 4,
      indexInRing: 15,
      sectorIndex: 3,
      cellInSector: 3,
      hasPublicityIcon: false,
      elementTypes: ['EMPTY'],
      elements: [{ type: 'EMPTY' }],
    },
    'ring-4-cell-16': {
      spaceId: 'ring-4-cell-16',
      ringIndex: 4,
      indexInRing: 16,
      sectorIndex: 4,
      cellInSector: 0,
      hasPublicityIcon: false,
      elementTypes: ['EMPTY'],
      elements: [{ type: 'EMPTY' }],
    },
  };

  return {
    spaces: [
      'ring-4-cell-8',
      'ring-4-cell-9',
      'ring-4-cell-10',
      'ring-4-cell-12',
      'ring-4-cell-15',
      'ring-4-cell-16',
    ],
    adjacency: {
      'ring-4-cell-8': [],
      'ring-4-cell-9': [],
      'ring-4-cell-10': [],
      'ring-4-cell-12': [],
      'ring-4-cell-15': [],
      'ring-4-cell-16': [],
    },
    probes: [],
    discs: [
      { discIndex: 0, angle: 0 },
      { discIndex: 1, angle: 0 },
      { discIndex: 2, angle: 0 },
    ],
    alienTokens: [],
    nextRotateRing: 1,
    spaceStates,
    planetSpaceIds: { [EPlanet.NEPTUNE]: 'ring-4-cell-8' },
    sectorSpaceIds: createSectorSpaceIds(spaceStates),
    probeSpaceById: {},
    ...overrides,
  };
}

function renderSolarSystemView(
  props: Partial<ComponentProps<typeof SolarSystemView>> & {
    solarSystem?: IPublicSolarSystem;
    oumuamuaTile?: IPublicOumuamuaTile | null;
  } = {},
): ReturnType<typeof render> {
  const SolarSystemViewWithOumuamua = SolarSystemView as ComponentType<
    ComponentProps<typeof SolarSystemView> & {
      oumuamuaTile?: IPublicOumuamuaTile | null;
    }
  >;

  return render(
    <SolarSystemViewWithOumuamua
      solarSystem={props.solarSystem ?? createSolarSystemMock()}
      sectors={props.sectors ?? createSectorsMock()}
      setupConfig={props.setupConfig ?? defaultSetup}
      pendingInput={props.pendingInput ?? null}
      playerColors={props.playerColors ?? { 'player-1': 'red' }}
      myPlayerId={props.myPlayerId ?? 'player-1'}
      movementPoints={props.movementPoints ?? 1}
      moveModeActive={props.moveModeActive}
      onMoveProbe={props.onMoveProbe ?? vi.fn()}
      onRespondInput={props.onRespondInput ?? vi.fn()}
      showSpaceConfigDebug={props.showSpaceConfigDebug}
      allowMoveAnyProbe={props.allowMoveAnyProbe}
      oumuamuaTile={props.oumuamuaTile}
      textModeOverride={props.textModeOverride}
    />,
  );
}

function createSectorsMock(): IPublicSector[] {
  return defaultSetup.tilePlacements.flatMap((placement) => {
    const colors: ESector[] =
      placement.tileId === 1
        ? [ESector.BLUE, ESector.BLACK]
        : placement.tileId === 2
          ? [ESector.BLUE, ESector.RED]
          : placement.tileId === 3
            ? [ESector.YELLOW, ESector.RED]
            : [ESector.YELLOW, ESector.BLACK];

    const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];

    return placement.sectorIds.map(
      (id, idx): IPublicSector => ({
        sectorId: id,
        name: tileDef.sectors[idx].starName,
        color: colors[idx] as ESector,
        signals: [
          { type: 'data' as const },
          { type: 'data' as const },
          { type: 'data' as const },
        ],
        dataCapability: 3,
        dataSlotCapacity: 3,
        firstWinnerBonus:
          SECTOR_STAR_CONFIGS[tileDef.sectors[idx].starName].firstWinBonus,
        otherWinnerBonus:
          SECTOR_STAR_CONFIGS[tileDef.sectors[idx].starName].repeatWinBonus,
        sectorWinners: [] as string[],
        completed: false,
      }),
    );
  });
}

function getStylePolarAngle(element: HTMLElement): number {
  const x = parseFloat(element.style.left) - 50;
  const y = 50 - parseFloat(element.style.top);
  const angle = (Math.atan2(x, y) * 180) / Math.PI;
  return ((angle % 360) + 360) % 360;
}

function getStyleRadius(element: HTMLElement): number {
  const x = parseFloat(element.style.left) - 50;
  const y = 50 - parseFloat(element.style.top);
  return Math.hypot(x, y);
}

function getTranslateXOffsetPx(transform: string): number {
  if (transform.startsWith('translate(-50%')) {
    return 0;
  }

  const plusMatch = /translate\(calc\(-50% \+ (-?[\d.]+)px\)/.exec(transform);
  if (plusMatch) {
    return Number(plusMatch[1]);
  }

  const minusMatch = /translate\(calc\(-50% - ([\d.]+)px\)/.exec(transform);
  if (minusMatch) {
    return -Number(minusMatch[1]);
  }

  throw new Error(`Could not parse translate X offset: ${transform}`);
}

describe('SolarSystemView', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDebugStore.setState({
      textMode: false,
      hotspotDebug: false,
      hotspotOverrides: {},
      hotspotDraftOverrides: {},
    });
    useGameViewStore.setState({
      activeTab: 'board',
      zoom: 0.9,
      hoveredPieceId: null,
    });
  });

  it('renders Mascamites sample stacks separately from capsules and probes', () => {
    const solarSystem = {
      ...createSolarSystemMock(),
      probes: [
        { playerId: 'player-1', spaceId: 'space-0', probeId: 'probe-1' },
      ],
      movablePieces: [
        {
          pieceId: 'probe-1',
          pieceType: 'probe',
          playerId: 'player-1',
          spaceId: 'space-0',
          movementTarget: { type: 'probe', id: 'probe-1' },
        },
        {
          pieceId: 'capsule-1',
          pieceType: 'mascamites-capsule',
          playerId: 'player-1',
          spaceId: 'space-0',
          movementTarget: { type: 'mascamites-capsule', id: 'capsule-1' },
          sampleTokenId: 'mascamites-credit-2',
        },
      ],
      sampleStacks: [
        {
          stackId: 'mascamites-sample-stack-jupiter',
          sourcePlanet: EPlanet.JUPITER,
          spaceId: 'space-0',
          count: 3,
        },
      ],
      probeSpaceById: { probe: 'space-0' },
    } as IPublicSolarSystem;

    renderSolarSystemView({ solarSystem });

    const sampleStack = screen.getByTestId(
      'solar-sample-stack-mascamites-sample-stack-jupiter',
    );
    expect(sampleStack).toHaveTextContent('3');
    expect(
      within(sampleStack).getByTestId('seti-desc-sample'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('solar-capsule-capsule-1')).toBeInTheDocument();
    expect(screen.getByTestId('solar-probe-probe-1')).toBeInTheDocument();
  });

  it('renders all 32 space hotspots', () => {
    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const allSpaces = screen.getAllByRole('button', { name: /Space space-/ });
    expect(allSpaces).toHaveLength(32);
  });

  it('exposes solar spaces through the shared hotspot debug layer', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const space = screen.getByTestId('solar-space-space-0');
    expect(space).toHaveAttribute('data-hotspot-scene', 'solar-system');
    expect(space).toHaveAttribute('data-hotspot-id', 'space-0');
    expect(space).toHaveAttribute('data-hotspot-variant', 'image');
    fireEvent.mouseEnter(space);
    expect(screen.getByText('space-0')).toBeInTheDocument();
  });

  it('uses a separate hotspot variant for text-mode solar spaces', () => {
    useDebugStore.getState().setHotspotDebug(true);
    useDebugStore.setState({
      textMode: true,
      hotspotOverrides: {
        'solar-system:image': {
          'space-0': { x: 0, y: 0, width: 80, height: 80 },
        },
      },
    });

    renderSolarSystemView();

    const space = screen.getByTestId('solar-space-space-0');
    expect(space).toHaveAttribute('data-hotspot-scene', 'solar-system');
    expect(space).toHaveAttribute('data-hotspot-id', 'space-0');
    expect(space).toHaveAttribute('data-hotspot-variant', 'text');
    expect(space).not.toHaveStyle({ left: '0%', top: '0%' });
  });

  it('uses the calibrated solar space position for probes on that space', () => {
    const spaceId = 'ring-1-cell-0';
    const solarSystem = createSolarSystemMock();
    const spaceState = createMockSpaceState(spaceId, 0);
    useDebugStore.setState({
      hotspotOverrides: {
        'solar-system:image': {
          [spaceId]: { x: 120, y: 88, width: 32, height: 32 },
        },
      },
    });

    renderSolarSystemView({
      solarSystem: {
        ...solarSystem,
        spaces: [spaceId],
        probes: [{ playerId: 'player-1', spaceId }],
        adjacency: {},
        spaceStates: { [spaceId]: spaceState },
        sectorSpaceIds: createSectorSpaceIds({ [spaceId]: spaceState }),
        probeSpaceById: {},
      },
    });

    const space = screen.getByTestId(`solar-space-${spaceId}`);
    const probe = screen.getByTestId('solar-probe-player-1-0');
    expect(space).toHaveAttribute('data-hotspot-id', spaceId);
    expect(probe).toHaveAttribute('data-hotspot-id', spaceId);
    expect(probe).toHaveStyle({
      left: '15.789474%',
      top: '11.578947%',
    });
  });

  it('groups same-player probes on one solar space with a count', () => {
    const solarSystem = createSolarSystemMock();
    const probes: IPublicSolarSystem['probes'] = [
      { playerId: 'player-1', spaceId: 'space-0', probeId: 'probe-1' },
      { playerId: 'player-1', spaceId: 'space-0', probeId: 'probe-2' },
      { playerId: 'player-1', spaceId: 'space-0', probeId: 'probe-3' },
      { playerId: 'player-2', spaceId: 'space-0', probeId: 'probe-4' },
      { playerId: 'player-2', spaceId: 'space-0', probeId: 'probe-5' },
    ];

    renderSolarSystemView({
      solarSystem: {
        ...solarSystem,
        probes,
        probeSpaceById: createProbeSpaceById(probes),
      },
      playerColors: { 'player-1': 'red', 'player-2': 'purple' },
    });

    const playerOneStack = screen.getByTestId('solar-probe-probe-1');
    expect(within(playerOneStack).getByText('3')).toBeInTheDocument();
    expect(screen.queryByTestId('solar-probe-probe-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solar-probe-probe-3')).not.toBeInTheDocument();

    const playerTwoStack = screen.getByTestId('solar-probe-probe-4');
    expect(within(playerTwoStack).getByText('2')).toBeInTheDocument();
    expect(screen.queryByTestId('solar-probe-probe-5')).not.toBeInTheDocument();
  });

  it('allows a local text-mode override without changing the global debug store', () => {
    renderSolarSystemView({
      solarSystem: createRotatedRingOneMock(),
      textModeOverride: true,
    });

    expect(
      screen.getByTestId('solar-text-cell-state:ring-1-cell-3'),
    ).toHaveTextContent('earth');
    expect(useDebugStore.getState().textMode).toBe(false);
  });

  it('keeps sector tiles in image mode when the solar view overrides global text mode off', () => {
    useDebugStore.setState({ textMode: true });

    const { container } = renderSolarSystemView({
      textModeOverride: false,
    });

    expect(
      container.querySelector('img[src="/assets/seti/sectors/sector1.png"]'),
    ).not.toBeNull();
    expect(screen.queryByText('procyon')).not.toBeInTheDocument();
  });

  it('defaults the solar board smaller and exposes zoom controls', () => {
    renderSolarSystemView();

    const panel = screen.getByTestId('solar-board-panel');
    const frame = screen.getByTestId('solar-board-frame');
    expect(panel).toHaveStyle({ width: '708px' });
    expect(frame).toHaveStyle({ width: '684px' });
    expect(panel.style.maxWidth).toBe('');
    expect(frame.style.maxWidth).toBe('');
    expect(screen.getByTestId('solar-board-zoom-value')).toHaveTextContent(
      '90%',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Zoom solar board in' }),
    );
    expect(panel).toHaveStyle({ width: '754px' });
    expect(frame).toHaveStyle({ width: '730px' });
    expect(screen.getByTestId('solar-board-zoom-value')).toHaveTextContent(
      '96%',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Zoom solar board out' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Zoom solar board out' }),
    );
    expect(panel).toHaveStyle({ width: '662px' });
    expect(frame).toHaveStyle({ width: '638px' });
    expect(screen.getByTestId('solar-board-zoom-value')).toHaveTextContent(
      '84%',
    );
  });

  it('uses the same zoom controls in text mode', () => {
    useDebugStore.setState({ textMode: true });

    renderSolarSystemView();

    expect(screen.getByTestId('solar-board-panel')).toHaveStyle({
      width: '708px',
    });
    expect(screen.getByTestId('solar-board-frame')).toHaveStyle({
      width: '684px',
    });
    expect(
      screen.getByRole('button', { name: 'Zoom solar board out' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Zoom solar board in' }),
    ).toBeEnabled();
  });

  it('renders anomaly tokens with their printed art on the solar system board', () => {
    render(
      <SolarSystemView
        solarSystem={{
          ...createSolarSystemMock(),
          alienTokens: [
            {
              tokenId: 'alien-0-anomaly-token|3|red-trace',
              alienType: EAlienType.ANOMALIES,
              sectorIndex: 3,
              traceColor: ETrace.PINK,
              rewards: [{ type: 'CREDIT', amount: 1 }],
            },
          ],
        }}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const token = screen.getByTestId(
      `solar-alien-token-${EAlienType.ANOMALIES}-3-${ETrace.PINK}`,
    );
    expect(token).toBeInTheDocument();
    // Pink + CREDIT should render from the shared sprite, not request the
    // individual pink-credit PNG.
    expect(token.querySelector('img')).toBeNull();
    const sprite = screen.getByTestId('solar-anomaly-token-sprite-pink-credit');
    expect(sprite).toHaveStyle({
      backgroundImage:
        'url(/assets/seti/aliens/anomalies/tokens/tokens-sprite.png)',
      backgroundPosition: '-528px 0px',
      backgroundSize: '1584px 159px',
    });
  });

  it('falls back to the pill UI when an anomaly token has no matching printed art', () => {
    render(
      <SolarSystemView
        solarSystem={{
          ...createSolarSystemMock(),
          alienTokens: [
            {
              tokenId: 'alien-0-anomaly-token|3|red-trace',
              alienType: EAlienType.ANOMALIES,
              sectorIndex: 3,
              traceColor: ETrace.PINK,
              // PUBLICITY isn't a printed pink combo — fallback path
              rewards: [{ type: 'PUBLICITY', amount: 1 }],
            },
          ],
        }}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const token = screen.getByTestId(
      `solar-alien-token-${EAlienType.ANOMALIES}-3-${ETrace.PINK}`,
    );
    expect(token).toHaveClass('rounded-full');
    expect(
      within(token).getByTestId('solar-alien-token-trace-color-left'),
    ).toHaveStyle({ backgroundColor: '#d63384' });
  });

  it('renders Glyphids sector tokens separately from Anomalies tokens', () => {
    renderSolarSystemView({
      solarSystem: {
        ...createSolarSystemMock(),
        glyphidsSectorTokens: [
          {
            tokenId: 'glyphids-token|sector|sector-2',
            alienType: EAlienType.GLYPHIDS,
            glyph: EAlienIcon.GLYPH_GREEN,
            sectorId: 'sector-2',
            sectorIndex: 2,
          },
        ],
      },
    });

    expect(
      screen.getByTestId(
        'solar-glyphids-sector-token-glyphids-token|sector|sector-2',
      ),
    ).toBeInTheDocument();
  });

  it('exposes image-mode board tokens through the shared anchor debug layer', () => {
    useDebugStore.getState().setHotspotDebug(true);
    renderSolarSystemView({
      solarSystem: {
        ...createSolarSystemMock(),
        alienTokens: [
          {
            tokenId: 'alien-0-anomaly-token|3|red-trace',
            alienType: EAlienType.ANOMALIES,
            sectorIndex: 3,
            traceColor: ETrace.PINK,
            rewards: [{ type: 'PUBLICITY', amount: 1 }],
          },
        ],
        glyphidsSectorTokens: [
          {
            tokenId: 'glyphids-token|sector|sector-2',
            alienType: EAlienType.GLYPHIDS,
            glyph: EAlienIcon.GLYPH_GREEN,
            sectorId: 'sector-2',
            sectorIndex: 2,
          },
        ],
      },
    });

    const probe = screen.getByTestId('solar-probe-player-1-0');
    expect(probe).toHaveAttribute('data-hotspot-scene', 'solar-system');
    expect(probe).toHaveAttribute('data-hotspot-id', 'space-0');
    expect(probe).toHaveAttribute('data-hotspot-role', 'anchor');

    const sun = screen.getByTestId('solar-sun');
    expect(sun).toHaveAttribute('data-hotspot-scene', 'solar-system');
    expect(sun).toHaveAttribute('data-hotspot-id', 'sun');
    fireEvent.mouseEnter(sun);
    expect(screen.getByText('solar sun')).toBeInTheDocument();

    const alienToken = screen.getByTestId(
      `solar-alien-token-${EAlienType.ANOMALIES}-3-${ETrace.PINK}`,
    );
    expect(alienToken).toHaveAttribute('data-hotspot-scene', 'solar-system');
    expect(alienToken).toHaveAttribute(
      'data-hotspot-id',
      'alien-token-alien-0-anomaly-token|3|red-trace',
    );

    const glyphidsToken = screen.getByTestId(
      'solar-glyphids-sector-token-glyphids-token|sector|sector-2',
    );
    expect(glyphidsToken).toHaveAttribute(
      'data-hotspot-id',
      'glyphids-sector-token-glyphids-token|sector|sector-2',
    );

    fireEvent.mouseEnter(probe);
    expect(screen.getByText('probe player-1-0')).toBeInTheDocument();
    fireEvent.mouseEnter(alienToken);
    expect(
      screen.getByText('solar alien token alien-0-anomaly-token|3|red-trace'),
    ).toBeInTheDocument();
    fireEvent.mouseEnter(glyphidsToken);
    expect(
      screen.getByText(
        'solar glyphids sector token glyphids-token|sector|sector-2',
      ),
    ).toBeInTheDocument();
  });

  it('anchors the Oumuamua sector data list at its solar-system cell', () => {
    const solarSystem = createExpandedOuterRingMock();
    const tile: IPublicOumuamuaTile = {
      spaceId: 'ring-4-cell-8',
      sectorId: 'sector-1',
      dataRemaining: 2,
      markerPlayerIds: ['player-1'],
    };

    renderSolarSystemView({
      solarSystem,
      playerColors: { 'player-1': '#f00' },
      oumuamuaTile: tile,
    });

    const anchor = screen.getByTestId('solar-oumuamua-sector-ring-4-cell-8');
    const targetCell = screen.getByTestId('solar-space-ring-4-cell-8');
    const planetArt = screen.getByTestId('solar-oumuamua-planet-ring-4-cell-8');
    const dataList = screen.getByTestId('solar-oumuamua-data-list');
    const slots = screen.getAllByTestId(/^solar-oumuamua-data-slot-/);

    expect(parseFloat(anchor.style.left)).toBeCloseTo(
      parseFloat(targetCell.style.left),
      5,
    );
    expect(parseFloat(anchor.style.top)).toBeCloseTo(
      parseFloat(targetCell.style.top),
      5,
    );
    expect(anchor).toHaveAttribute('data-hotspot-scene', 'solar-system');
    expect(anchor).toHaveAttribute(
      'data-hotspot-id',
      'oumuamua-sector-data-ring-4-cell-8',
    );
    expect(planetArt).toHaveAttribute('data-hotspot-scene', 'solar-system');
    expect(planetArt).toHaveAttribute(
      'data-hotspot-id',
      'oumuamua-planet-ring-4-cell-8',
    );
    // The arc layout positions each dot via absolute children of the
    // data-list wrapper, so the wrapper itself sits at the tile and a
    // `translate(...) rotate(...)` carries it to the calibrated offset.
    expect(dataList.style.transform).toContain('translate(');
    expect(slots).toHaveLength(3);
    expect(dataList).toHaveAttribute('data-sector-id', 'sector-1');
    expect(screen.getByTestId('solar-oumuamua-data-slot-0')).toHaveAttribute(
      'data-signal-type',
      'player',
    );
    expect(screen.getByTestId('solar-oumuamua-data-slot-0')).toHaveAttribute(
      'data-player-id',
      'player-1',
    );
    expect(screen.getByTestId('solar-oumuamua-data-slot-1')).toHaveAttribute(
      'data-signal-type',
      'data',
    );
    expect(screen.getByTestId('solar-oumuamua-data-slot-2')).toHaveAttribute(
      'data-signal-type',
      'data',
    );
  });

  it('aligns the text-mode Oumuamua cell with its sector data list', () => {
    useDebugStore.setState({ textMode: true });
    const tile: IPublicOumuamuaTile = {
      spaceId: 'ring-3-cell-15',
      sectorId: 'sector-5',
      dataRemaining: 2,
      markerPlayerIds: ['player-1'],
    };
    const spaceStates: Record<string, IPublicSolarSystemSpaceState> = {
      'ring-3-cell-15': {
        spaceId: 'ring-3-cell-15',
        ringIndex: 3,
        indexInRing: 15,
        sectorIndex: 5,
        cellInSector: 0,
        hasPublicityIcon: true,
        elementTypes: ['PLANET'],
        elements: [{ type: 'PLANET', planet: EPlanet.OUMUAMUA }],
      },
    };

    renderSolarSystemView({
      solarSystem: {
        spaces: ['ring-3-cell-15'],
        adjacency: { 'ring-3-cell-15': [] },
        probes: [],
        discs: [
          { discIndex: 0, angle: 0 },
          { discIndex: 1, angle: 0 },
          { discIndex: 2, angle: 0 },
        ],
        alienTokens: [],
        nextRotateRing: 1,
        spaceStates,
        planetSpaceIds: { [EPlanet.OUMUAMUA]: 'ring-3-cell-15' },
        sectorSpaceIds: createSectorSpaceIds(spaceStates),
        probeSpaceById: {},
      },
      playerColors: { 'player-1': '#f00' },
      oumuamuaTile: tile,
    });

    const cell = screen.getByTestId('solar-text-cell-state:ring-3-cell-15');
    const hotspot = screen.getByTestId('solar-space-ring-3-cell-15');
    const dataAnchor = screen.getByTestId(
      'solar-oumuamua-sector-ring-3-cell-15',
    );
    const dataListX = getTranslateXOffsetPx(dataAnchor.style.transform);

    expect(getTranslateXOffsetPx(cell.style.transform)).toBeCloseTo(
      dataListX,
      3,
    );
    expect(getTranslateXOffsetPx(hotspot.style.transform)).toBeCloseTo(
      dataListX,
      3,
    );
  });

  it('sends movement action after selecting own probe and clicking reachable space', () => {
    const onMoveProbe = vi.fn();

    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={onMoveProbe}
        onRespondInput={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('solar-space-space-0'));
    fireEvent.click(screen.getByTestId('solar-space-space-1'));

    expect(onMoveProbe.mock.calls[0]?.[0]).toEqual(['space-0', 'space-1']);
    expect(onMoveProbe.mock.calls[0]?.[1]).toEqual({
      type: 'probe',
      id: 'player-1-0',
    });
  });

  it('highlights only 1-hop neighbors even when movement budget exceeds the hop count', () => {
    // 3-space chain: space-0 -> space-1 -> space-2. With movementPoints=3,
    // the picker used to highlight every reachable cell within budget
    // (both space-1 AND space-2). Now only the direct neighbor (space-1)
    // should light up — the player must commit one hop, then re-pick.
    const chainMock: IPublicSolarSystem = {
      ...createSolarSystemMock(),
      adjacency: {
        'space-0': ['space-1'],
        'space-1': ['space-0', 'space-2'],
        'space-2': ['space-1'],
      },
    };
    const onMoveProbe = vi.fn();

    render(
      <SolarSystemView
        solarSystem={chainMock}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={3}
        moveModeActive
        onMoveProbe={onMoveProbe}
        onRespondInput={vi.fn()}
      />,
    );

    expect(
      screen
        .getByTestId('solar-space-space-1')
        .querySelector('[data-reachable-indicator="true"]'),
    ).toBeInTheDocument();
    expect(
      screen
        .getByTestId('solar-space-space-2')
        .querySelector('[data-reachable-indicator="true"]'),
    ).not.toBeInTheDocument();
  });

  it('highlights and submits reachable cells when move mode is active', () => {
    const onMoveProbe = vi.fn();

    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        moveModeActive
        onMoveProbe={onMoveProbe}
        onRespondInput={vi.fn()}
      />,
    );

    const reachableSpace = screen.getByTestId('solar-space-space-1');
    expect(
      reachableSpace.querySelector('[data-reachable-indicator="true"]'),
    ).toBeInTheDocument();

    fireEvent.click(reachableSpace);

    expect(onMoveProbe.mock.calls[0]?.[0]).toEqual(['space-0', 'space-1']);
    expect(onMoveProbe.mock.calls[0]?.[1]).toEqual({
      type: 'probe',
      id: 'player-1-0',
    });
  });

  it('does not draw move-source affordance when movement mode has no movement points', () => {
    renderSolarSystemView({
      movementPoints: 0,
      moveModeActive: true,
    });

    expect(
      screen.getByTestId('solar-space-space-0').querySelector('span'),
    ).not.toBeInTheDocument();
  });

  it('moves one probe from a same-player stack by default', () => {
    const onMoveProbe = vi.fn();
    const probes: IPublicSolarSystem['probes'] = [
      { playerId: 'player-1', spaceId: 'space-0', probeId: 'probe-1' },
      { playerId: 'player-1', spaceId: 'space-0', probeId: 'probe-2' },
    ];

    renderSolarSystemView({
      solarSystem: {
        ...createSolarSystemMock(),
        probes,
        probeSpaceById: createProbeSpaceById(probes),
      },
      movementPoints: 1,
      moveModeActive: true,
      onMoveProbe,
    });

    fireEvent.click(screen.getByTestId('solar-space-space-1'));

    expect(onMoveProbe).toHaveBeenCalledWith(['space-0', 'space-1'], {
      type: 'probe',
      id: 'probe-1',
    });
  });

  it('keeps move selection hotspots above text-mode solar cell labels', () => {
    useDebugStore.setState({ textMode: true });
    renderSolarSystemView({ moveModeActive: true });

    const reachableHotspot = screen.getByTestId('solar-space-space-1');
    const textLabelZIndexes = screen
      .getAllByTestId(/^solar-text-cell-/)
      .map((label) => Number(label.style.zIndex));

    expect(Number(reachableHotspot.style.zIndex)).toBeGreaterThan(
      Math.max(...textLabelZIndexes),
    );
  });

  it('sends probe movement target when the server provides movable pieces', () => {
    const onMoveProbe = vi.fn();

    renderSolarSystemView({
      solarSystem: {
        ...createSolarSystemMock(),
        probes: [
          {
            playerId: 'player-1',
            spaceId: 'space-0',
            probeId: 'probe-1',
          },
        ],
        movablePieces: [
          {
            pieceId: 'probe-1',
            pieceType: 'probe',
            playerId: 'player-1',
            spaceId: 'space-0',
            movementTarget: {
              type: 'probe',
              id: 'probe-1',
            },
          },
        ],
      },
      movementPoints: 1,
      moveModeActive: true,
      onMoveProbe,
    });

    fireEvent.click(screen.getByTestId('solar-space-space-1'));

    expect(onMoveProbe).toHaveBeenCalledWith(['space-0', 'space-1'], {
      type: 'probe',
      id: 'probe-1',
    });
  });

  it('sends movement target when moving a Mascamites capsule', () => {
    const onMoveProbe = vi.fn();

    renderSolarSystemView({
      solarSystem: {
        ...createSolarSystemMock(),
        probes: [],
        movablePieces: [
          {
            pieceId: 'capsule-1',
            pieceType: 'mascamites-capsule',
            playerId: 'player-1',
            spaceId: 'space-0',
            movementTarget: {
              type: 'mascamites-capsule',
              id: 'capsule-1',
            },
          },
        ],
      },
      movementPoints: 1,
      moveModeActive: true,
      onMoveProbe,
    });

    expect(screen.getByTestId('solar-capsule-capsule-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('solar-space-space-1'));

    expect(onMoveProbe).toHaveBeenCalledWith(['space-0', 'space-1'], {
      type: 'mascamites-capsule',
      id: 'capsule-1',
    });
  });

  it('responds to Orbital Dynamics move input from a legal map target', () => {
    const onMoveProbe = vi.fn();
    const onRespondInput = vi.fn();

    renderSolarSystemView({
      solarSystem: {
        ...createSolarSystemMock(),
        probes: [
          {
            playerId: 'player-1',
            spaceId: 'space-0',
            probeId: 'probe-1',
          },
        ],
        movablePieces: [
          {
            pieceId: 'probe-1',
            pieceType: 'probe',
            playerId: 'player-1',
            spaceId: 'space-0',
            movementTarget: {
              type: 'probe',
              id: 'probe-1',
            },
          },
        ],
      },
      movementPoints: 0,
      pendingInput: {
        inputId: 'orbital-dynamics-move',
        type: EPlayerInputType.OPTION,
        title: 'Choose an Orbital Dynamics move',
        options: [
          { id: 'probe-1:space-1', label: 'probe-1 to space-1' },
          { id: 'done', label: 'Done' },
        ],
      },
      onMoveProbe,
      onRespondInput,
    });

    expect(
      screen
        .getByTestId('solar-space-space-1')
        .querySelector('[data-reachable-indicator="true"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('solar-space-space-1'));

    expect(onRespondInput).toHaveBeenCalledWith({
      inputId: 'orbital-dynamics-move',
      type: EPlayerInputType.OPTION,
      optionId: 'probe-1:space-1',
    });
    expect(onMoveProbe).not.toHaveBeenCalled();
  });

  it('ignores illegal map targets during Orbital Dynamics move input', () => {
    const onRespondInput = vi.fn();

    renderSolarSystemView({
      solarSystem: {
        ...createSolarSystemMock(),
        adjacency: {
          'space-0': ['space-1'],
          'space-1': ['space-0'],
          'space-2': [],
        },
        probes: [
          {
            playerId: 'player-1',
            spaceId: 'space-0',
            probeId: 'probe-1',
          },
        ],
        movablePieces: [
          {
            pieceId: 'probe-1',
            pieceType: 'probe',
            playerId: 'player-1',
            spaceId: 'space-0',
            movementTarget: {
              type: 'probe',
              id: 'probe-1',
            },
          },
        ],
      },
      pendingInput: {
        inputId: 'orbital-dynamics-move',
        type: EPlayerInputType.OPTION,
        title: 'Choose an Orbital Dynamics move',
        options: [{ id: 'probe-1:space-1', label: 'probe-1 to space-1' }],
      },
      onRespondInput,
    });

    fireEvent.click(screen.getByTestId('solar-space-space-2'));

    expect(onRespondInput).not.toHaveBeenCalled();
  });

  it('does not fall back to normal movement while Orbital Dynamics input is pending', () => {
    const onMoveProbe = vi.fn();

    renderSolarSystemView({
      movementPoints: 1,
      pendingInput: {
        inputId: 'orbital-dynamics-move',
        type: EPlayerInputType.OPTION,
        title: 'Choose an Orbital Dynamics move',
        options: [{ id: 'done', label: 'Done' }],
      },
      onMoveProbe,
    });

    fireEvent.click(screen.getByTestId('solar-space-space-0'));
    fireEvent.click(screen.getByTestId('solar-space-space-1'));

    expect(onMoveProbe).not.toHaveBeenCalled();
  });

  it('responds to sector input on sector pair click', () => {
    const onRespondInput = vi.fn();
    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={{
          inputId: 'select-sector',
          type: EPlayerInputType.SECTOR,
          options: [ESector.BLUE],
        }}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={onRespondInput}
      />,
    );

    fireEvent.click(screen.getByTestId('sector-node-north-0'));
    expect(onRespondInput).toHaveBeenCalledWith({
      inputId: 'select-sector',
      type: EPlayerInputType.SECTOR,
      sector: ESector.BLUE,
    });
  });

  it('renders next rotate indicator from server state', () => {
    render(
      <SolarSystemView
        solarSystem={createSolarSystemMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    expect(screen.getByText('Next Rotate:')).toBeInTheDocument();
    const image = screen.getByAltText('Next rotate ring');
    expect(image).toHaveAttribute(
      'src',
      '/assets/seti/tech/bonuses/techRotation2.png',
    );
  });

  it('trusts state-backed space indexes as current board positions', () => {
    render(
      <SolarSystemView
        solarSystem={createRotatedRingOneMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    expect(screen.getByTestId('wheel-layer-ring-1').style.transform).toContain(
      'rotate(-225deg)',
    );

    const expected = getWheelSlotLabelBoardPositionPercent(1, 3);
    const earthHotspot = screen.getByTestId('solar-space-ring-1-cell-3');
    expect(parseFloat(earthHotspot.style.left)).toBeCloseTo(
      expected.xPercent,
      3,
    );
    expect(parseFloat(earthHotspot.style.top)).toBeCloseTo(
      expected.yPercent,
      3,
    );
  });

  it('aligns text-mode Earth label, launched probe, and Earth sector from state-backed positions', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <SolarSystemView
        solarSystem={createRotatedRingOneMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const earthHotspot = screen.getByTestId('solar-space-ring-1-cell-3');
    const earthLabel = screen.getByText('earth').parentElement;
    const launchedProbe = screen.getByTestId('solar-probe-probe-earth');
    const earthSector = screen.getByTestId('sector-node-south-0').parentElement
      ?.parentElement as HTMLElement | null;

    if (!earthLabel || !earthSector) {
      throw new Error('Expected Earth label and sector panel to render');
    }

    expect(getStylePolarAngle(earthLabel)).toBeCloseTo(
      getStylePolarAngle(earthHotspot),
      1,
    );
    expect(getStylePolarAngle(launchedProbe)).toBeCloseTo(
      getStylePolarAngle(earthHotspot),
      1,
    );
    expect(getStylePolarAngle(earthSector)).toBeCloseTo(
      getStylePolarAngle(earthHotspot),
      1,
    );
  });

  it('projects expanded server ring cells at the debug wheel slot origin on outer rings', () => {
    render(
      <SolarSystemView
        solarSystem={createExpandedOuterRingMock()}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    // Each ring-N sector resolves to the same visual slot origin as
    // `/debug/solar` wheel labels. ring-4-cell-8 = sector 2 cell 0.
    const expected = getWheelSlotLabelBoardPositionPercent(4, 2);
    const neptuneHotspot = screen.getByTestId('solar-space-ring-4-cell-8');
    expect(parseFloat(neptuneHotspot.style.left)).toBeCloseTo(
      expected.xPercent,
      3,
    );
    expect(parseFloat(neptuneHotspot.style.top)).toBeCloseTo(
      expected.yPercent,
      3,
    );
  });

  it('hides intra-sector cells in text mode (only cell-0 of each sector is a hotspot)', () => {
    useDebugStore.setState({ textMode: true });
    const spaceStates: Record<string, IPublicSolarSystemSpaceState> = {
      'ring-3-cell-15': {
        spaceId: 'ring-3-cell-15',
        ringIndex: 3,
        indexInRing: 15,
        sectorIndex: 5,
        cellInSector: 0,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
        elements: [{ type: 'EMPTY' }],
      },
      'ring-3-cell-16': {
        spaceId: 'ring-3-cell-16',
        ringIndex: 3,
        indexInRing: 16,
        sectorIndex: 5,
        cellInSector: 1,
        hasPublicityIcon: false,
        elementTypes: ['ASTEROID'],
        elements: [{ type: 'ASTEROID' }],
      },
      'ring-3-cell-17': {
        spaceId: 'ring-3-cell-17',
        ringIndex: 3,
        indexInRing: 17,
        sectorIndex: 5,
        cellInSector: 2,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
        elements: [{ type: 'EMPTY' }],
      },
    };

    render(
      <SolarSystemView
        solarSystem={{
          spaces: ['ring-3-cell-15', 'ring-3-cell-16', 'ring-3-cell-17'],
          adjacency: {
            'ring-3-cell-15': [],
            'ring-3-cell-16': [],
            'ring-3-cell-17': [],
          },
          probes: [],
          discs: [
            { discIndex: 0, angle: 0 },
            { discIndex: 1, angle: 0 },
            { discIndex: 2, angle: 0 },
          ],
          alienTokens: [],
          nextRotateRing: 1,
          spaceStates,
          planetSpaceIds: {},
          sectorSpaceIds: createSectorSpaceIds(spaceStates),
          probeSpaceById: {},
        }}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    // Only the sector-anchor cell (cellInSector === 0) is rendered as
    // a clickable hotspot. The other cells in the same sector
    // (cell-16, cell-17 here) are visual scaffolding — no hotspot.
    const sectorAnchor = screen.getByTestId('solar-space-ring-3-cell-15');
    expect(screen.queryByTestId('solar-space-ring-3-cell-16')).toBeNull();
    expect(screen.queryByTestId('solar-space-ring-3-cell-17')).toBeNull();

    // Sector-5 cell-0 sits at the centre of the sector wedge: angle =
    // (5 + 0.5) × 45 = 247.5° from disc origin.
    const sectorWrapper = screen.getByTestId('sector-node-west-0').parentElement
      ?.parentElement as HTMLElement | null;
    if (!sectorWrapper) {
      throw new Error('Expected sector wrapper to render');
    }
    expect(getStylePolarAngle(sectorAnchor)).toBeCloseTo(247.5, 1);
    expect(getStylePolarAngle(sectorWrapper)).toBeCloseTo(
      getStylePolarAngle(sectorAnchor),
      1,
    );
  });

  it('uses the same visual slot origin as solar debug wheel labels', () => {
    render(
      <SolarSystemView
        solarSystem={{
          ...createExpandedOuterRingMock(),
          spaces: ['ring-4-cell-12'],
          adjacency: { 'ring-4-cell-12': [] },
          spaceStates: {
            'ring-4-cell-12': {
              spaceId: 'ring-4-cell-12',
              ringIndex: 4,
              indexInRing: 12,
              sectorIndex: 3,
              cellInSector: 0,
              hasPublicityIcon: true,
              elementTypes: ['NULL', 'PLANET'],
              elements: [
                { type: 'NULL' },
                { type: 'PLANET', planet: EPlanet.NEPTUNE },
              ],
            },
          },
        }}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const neptuneHotspot = screen.getByTestId('solar-space-ring-4-cell-12');
    const expected = getWheelSlotLabelBoardPositionPercent(4, 3);
    expect(parseFloat(neptuneHotspot.style.left)).toBeCloseTo(
      expected.xPercent,
      3,
    );
    expect(parseFloat(neptuneHotspot.style.top)).toBeCloseTo(
      expected.yPercent,
      3,
    );
  });

  it('renders text mode cells from public space states and skips null cells', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <SolarSystemView
        solarSystem={{
          ...createSolarSystemMock(),
          spaces: [
            'state-asteroid',
            'state-comet',
            'state-empty',
            'state-null',
            'state-hidden-comet',
          ],
          adjacency: {
            'state-asteroid': [],
            'state-comet': [],
            'state-empty': [],
            'state-null': [],
            'state-hidden-comet': [],
          },
          probes: [],
          discs: [
            { discIndex: 0, angle: 0 },
            { discIndex: 1, angle: 0 },
            { discIndex: 2, angle: 0 },
            { discIndex: 3, angle: 0 },
          ],
          spaceStates: {
            'state-asteroid': {
              spaceId: 'state-asteroid',
              ringIndex: 2,
              indexInRing: 2,
              sectorIndex: 1,
              cellInSector: 0,
              hasPublicityIcon: false,
              elementTypes: ['ASTEROID'],
              elements: [{ type: 'ASTEROID' }],
            },
            'state-comet': {
              spaceId: 'state-comet',
              ringIndex: 4,
              indexInRing: 4,
              sectorIndex: 1,
              cellInSector: 0,
              hasPublicityIcon: true,
              elementTypes: ['COMET'],
              elements: [{ type: 'COMET' }],
            },
            'state-empty': {
              spaceId: 'state-empty',
              ringIndex: 3,
              indexInRing: 6,
              sectorIndex: 2,
              cellInSector: 0,
              hasPublicityIcon: false,
              elementTypes: ['EMPTY'],
              elements: [{ type: 'EMPTY' }],
            },
            'state-null': {
              spaceId: 'state-null',
              ringIndex: 4,
              indexInRing: 8,
              sectorIndex: 2,
              cellInSector: 0,
              hasPublicityIcon: false,
              elementTypes: ['NULL'],
              elements: [{ type: 'NULL' }],
            },
            'state-hidden-comet': {
              spaceId: 'state-hidden-comet',
              ringIndex: 4,
              indexInRing: 5,
              sectorIndex: 1,
              cellInSector: 1,
              hasPublicityIcon: true,
              elementTypes: ['COMET'],
              elements: [{ type: 'COMET' }],
            },
          },
        }}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const asteroid = screen.getByText('asteroid');
    const comet = screen.getByText('comet');
    const asteroidAnchor = asteroid.parentElement;
    const cometAnchor = comet.parentElement;
    const emptyCell = screen.getByTestId('solar-text-cell-state:state-empty')
      .firstElementChild as HTMLElement | null;
    expect(asteroidAnchor).not.toBeNull();
    expect(cometAnchor).not.toBeNull();
    expect(asteroid.className).toContain('w-[38px]');
    expect(asteroid.className).toContain('text-[7px]');
    expect(emptyCell).not.toBeNull();
    expect(emptyCell?.style.backgroundColor).toBe('rgba(2, 6, 23, 0.96)');
    expect(screen.queryByText('null')).not.toBeInTheDocument();
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('solar-text-cell-state:state-hidden-comet'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('solar-text-cell-state:state-comet'),
    ).toBeInTheDocument();
    expect(asteroidAnchor?.style.left).not.toBe(cometAnchor?.style.left);
    expect(asteroidAnchor?.style.top).not.toBe(cometAnchor?.style.top);
    const matchingHotspot = screen.getByTestId('solar-space-state-asteroid');
    expect(parseFloat(asteroidAnchor?.style.left ?? '')).toBeCloseTo(
      parseFloat(matchingHotspot.style.left),
      3,
    );
    expect(parseFloat(asteroidAnchor?.style.top ?? '')).toBeCloseTo(
      parseFloat(matchingHotspot.style.top),
      3,
    );
  });

  it('does not synthesize text-mode cells when public space states are missing', () => {
    useDebugStore.setState({ textMode: true });
    const solarSystemWithoutStates = {
      ...createSolarSystemMock(),
      spaceStates: undefined,
    } as unknown as IPublicSolarSystem;

    renderSolarSystemView({
      solarSystem: solarSystemWithoutStates,
    });

    expect(screen.queryByTestId('solar-space-space-0')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId(/^solar-text-cell-/)).toHaveLength(0);
  });

  it('places text labels on the same wheel geometry as solar debug labels', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <SolarSystemView
        solarSystem={{
          ...createExpandedOuterRingMock(),
          spaces: ['ring-4-cell-12'],
          adjacency: { 'ring-4-cell-12': [] },
          spaceStates: {
            'ring-4-cell-12': {
              spaceId: 'ring-4-cell-12',
              ringIndex: 4,
              indexInRing: 12,
              sectorIndex: 3,
              cellInSector: 0,
              hasPublicityIcon: true,
              elementTypes: ['PLANET'],
              elements: [{ type: 'PLANET', planet: EPlanet.NEPTUNE }],
            },
          },
        }}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    const neptuneLabel = screen.getByText('neptune');
    const neptuneAnchor = neptuneLabel.parentElement;
    expect(neptuneAnchor).not.toBeNull();
    const expected = getWheelSlotLabelBoardPositionPercent(4, 3);
    expect(parseFloat(neptuneAnchor?.style.left ?? '')).toBeCloseTo(
      expected.xPercent,
      2,
    );
    expect(parseFloat(neptuneAnchor?.style.top ?? '')).toBeCloseTo(
      expected.yPercent,
      2,
    );
    expect(neptuneAnchor?.style.transform).toBe('translate(-50%, -50%)');
    expect(neptuneLabel.style.transform).toContain('rotate(157.5deg)');
    expect(neptuneLabel.className).toContain('bg-surface-900');
    expect(neptuneLabel.className).toContain('font-bold');
    expect(neptuneLabel.className).not.toContain('bg-white');
    expect(neptuneLabel.style.color).toBe('rgb(255, 255, 255)');
  });

  it('aligns text-mode sector panels with their solar sector spokes', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <SolarSystemView
        solarSystem={{
          ...createSolarSystemMock(),
          discs: [
            { discIndex: 0, angle: 0 },
            { discIndex: 1, angle: 0 },
            { discIndex: 2, angle: 0 },
            { discIndex: 3, angle: 0 },
          ],
        }}
        sectors={createSectorsMock()}
        setupConfig={defaultSetup}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
        movementPoints={1}
        onMoveProbe={vi.fn()}
        onRespondInput={vi.fn()}
      />,
    );

    // NORTH tile holds sector-7 (left/CCW of top) and sector-0 (right/CW
    // of top), in that visual order — so north-0 lines up with cell-7 at
    // 337.5° and north-1 lines up with cell-0 at 22.5°. Pairing each
    // cardinal tile with its straddling sectors (rather than sequential
    // pairs) is what keeps the cardinal tile under the wheel cells it
    // visually covers.
    const sector7Wrapper = screen.getByTestId('sector-node-north-0')
      .parentElement?.parentElement as HTMLElement | null;
    const sector0Wrapper = screen.getByTestId('sector-node-north-1')
      .parentElement?.parentElement as HTMLElement | null;
    const sector7Cell = screen.getByTestId('solar-space-space-7');
    const sector0Cell = screen.getByTestId('solar-space-space-0');

    if (!sector7Wrapper || !sector0Wrapper) {
      throw new Error('Expected sector wrappers to render');
    }
    expect(getStylePolarAngle(sector7Wrapper)).toBeCloseTo(
      getStylePolarAngle(sector7Cell),
      1,
    );
    expect(getStylePolarAngle(sector0Wrapper)).toBeCloseTo(
      getStylePolarAngle(sector0Cell),
      1,
    );
    expect(getStyleRadius(sector7Wrapper)).toBeGreaterThan(
      getStyleRadius(sector7Cell),
    );
    expect(getStyleRadius(sector0Wrapper)).toBeGreaterThan(
      getStyleRadius(sector0Cell),
    );
  });
});
