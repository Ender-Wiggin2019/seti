import {
  createDefaultSetupConfig,
  SECTOR_STAR_CONFIGS,
  SECTOR_TILE_DEFINITIONS,
  type ISolarSystemSetupConfig,
  type ISolarSystemWheelCell,
  type TSolarSystemWheels,
} from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SolarSystemView } from '@/features/board/SolarSystemView';
import { useDebugStore } from '@/stores/debugStore';
import type { IPublicSector, IPublicSolarSystem } from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';

const defaultSetup = createDefaultSetupConfig();

function createSolarSystemMock(): IPublicSolarSystem {
  return {
    spaces: Array.from({ length: 32 }, (_, i) => `space-${i}`),
    adjacency: {
      'space-0': ['space-1'],
    },
    probes: [{ playerId: 'player-1', spaceId: 'space-0' }],
    discs: [
      { discIndex: 0, angle: 1 },
      { discIndex: 1, angle: 2 },
      { discIndex: 2, angle: 3 },
      { discIndex: 3, angle: 0 },
    ],
    nextRotateRing: 2,
  };
}

function createRotatedRingOneMock(): IPublicSolarSystem {
  return {
    spaces: ['ring-1-cell-3'],
    adjacency: {
      'ring-1-cell-3': [],
    },
    probes: [],
    discs: [
      { discIndex: 0, angle: 5 },
      { discIndex: 1, angle: 0 },
      { discIndex: 2, angle: 0 },
    ],
    nextRotateRing: 1,
    spaceStates: {
      'ring-1-cell-3': {
        spaceId: 'ring-1-cell-3',
        ringIndex: 1,
        indexInRing: 3,
        hasPublicityIcon: false,
        elementTypes: ['EARTH'],
        elements: [{ type: 'EARTH' }],
      },
    },
  };
}

function createExpandedOuterRingMock(
  overrides?: Partial<IPublicSolarSystem>,
): IPublicSolarSystem {
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
    nextRotateRing: 1,
    spaceStates: {
      'ring-4-cell-8': {
        spaceId: 'ring-4-cell-8',
        ringIndex: 4,
        indexInRing: 8,
        hasPublicityIcon: true,
        elementTypes: ['PLANET'],
        elements: [{ type: 'PLANET', planet: EPlanet.NEPTUNE }],
      },
      'ring-4-cell-9': {
        spaceId: 'ring-4-cell-9',
        ringIndex: 4,
        indexInRing: 9,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
        elements: [{ type: 'EMPTY' }],
      },
      'ring-4-cell-10': {
        spaceId: 'ring-4-cell-10',
        ringIndex: 4,
        indexInRing: 10,
        cellInSector: 2,
        hasPublicityIcon: false,
        elementTypes: ['ASTEROID'],
        elements: [{ type: 'ASTEROID' }],
      },
      'ring-4-cell-12': {
        spaceId: 'ring-4-cell-12',
        ringIndex: 4,
        indexInRing: 12,
        cellInSector: 0,
        hasPublicityIcon: false,
        elementTypes: ['ASTEROID'],
        elements: [{ type: 'ASTEROID' }],
      },
      'ring-4-cell-15': {
        spaceId: 'ring-4-cell-15',
        ringIndex: 4,
        indexInRing: 15,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
        elements: [{ type: 'EMPTY' }],
      },
      'ring-4-cell-16': {
        spaceId: 'ring-4-cell-16',
        ringIndex: 4,
        indexInRing: 16,
        cellInSector: 0,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
        elements: [{ type: 'EMPTY' }],
      },
    },
    ...overrides,
  };
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

function createNullWheelCell(): ISolarSystemWheelCell {
  return {
    cell: { type: 'NULL', hasPublicityIcon: false },
    elements: [],
  };
}

function createTextModeLayerSetup(): ISolarSystemSetupConfig {
  const setup = createDefaultSetupConfig();
  const makeGrid = (wheel: keyof TSolarSystemWheels) =>
    setup.wheels[wheel].map((row) => row.map(() => createNullWheelCell()));
  const wheels = {
    1: makeGrid(1),
    2: makeGrid(2),
    3: makeGrid(3),
    4: makeGrid(4),
  } as TSolarSystemWheels;

  wheels[2][0][1] = {
    cell: { type: 'ASTEROID', hasPublicityIcon: false },
    elements: [],
  };
  wheels[4][0][1] = {
    cell: { type: 'COMET', hasPublicityIcon: true },
    elements: [],
  };
  wheels[3][0][2] = {
    cell: { type: 'EMPTY', hasPublicityIcon: false },
    elements: [],
  };

  return { ...setup, wheels };
}

describe('SolarSystemView', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDebugStore.setState({ textMode: false });
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

    expect(onMoveProbe).toHaveBeenCalledWith(['space-0', 'space-1']);
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

    fireEvent.click(screen.getByTestId('sector-pair-north'));
    expect(onRespondInput).toHaveBeenCalledWith({
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

    const earthHotspot = screen.getByTestId('solar-space-ring-1-cell-3');
    expect(parseFloat(earthHotspot.style.left)).toBeCloseTo(53.589, 3);
    expect(parseFloat(earthHotspot.style.top)).toBeCloseTo(58.664, 3);
  });

  it('projects expanded server ring cells by sector on outer rings', () => {
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

    const neptuneHotspot = screen.getByTestId('solar-space-ring-4-cell-8');
    expect(parseFloat(neptuneHotspot.style.left)).toBeCloseTo(77.388, 3);
    expect(parseFloat(neptuneHotspot.style.top)).toBeCloseTo(61.344, 3);
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
    expect(parseFloat(neptuneHotspot.style.left)).toBeCloseTo(61.344, 3);
    expect(parseFloat(neptuneHotspot.style.top)).toBeCloseTo(77.388, 3);
  });

  it('renders text mode cells from setup wheel layers and skips null cells', () => {
    useDebugStore.setState({ textMode: true });
    const layeredSetup = createTextModeLayerSetup();

    render(
      <SolarSystemView
        solarSystem={createExpandedOuterRingMock()}
        sectors={createSectorsMock()}
        setupConfig={layeredSetup}
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
    expect(asteroidAnchor).not.toBeNull();
    expect(cometAnchor).not.toBeNull();
    expect(screen.queryByText('null')).not.toBeInTheDocument();
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
    expect(asteroidAnchor?.style.left).toBe(cometAnchor?.style.left);
    expect(asteroidAnchor?.style.top).toBe(cometAnchor?.style.top);
    expect(Number(asteroidAnchor?.style.zIndex)).toBeGreaterThan(
      Number(cometAnchor?.style.zIndex),
    );
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
    expect(parseFloat(neptuneAnchor?.style.left ?? '')).toBeCloseTo(62.667, 2);
    expect(parseFloat(neptuneAnchor?.style.top ?? '')).toBeCloseTo(80.58, 2);
    expect(neptuneAnchor?.style.transform).toBe('translate(-50%, -50%)');
    expect(neptuneLabel.style.transform).toContain('rotate(157.5deg)');
    expect(neptuneLabel.style.color).toBe('rgb(2, 6, 23)');
    expect(neptuneLabel.style.borderColor).toBe('rgb(255, 255, 255)');
  });
});
