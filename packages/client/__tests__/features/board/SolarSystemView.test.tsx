import {
  createDefaultSetupConfig,
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

function createExpandedOuterRingMock(): IPublicSolarSystem {
  return {
    spaces: ['ring-4-cell-8', 'ring-4-cell-9', 'ring-4-cell-15'],
    adjacency: {
      'ring-4-cell-8': [],
      'ring-4-cell-9': [],
      'ring-4-cell-15': [],
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
      'ring-4-cell-15': {
        spaceId: 'ring-4-cell-15',
        ringIndex: 4,
        indexInRing: 15,
        hasPublicityIcon: false,
        elementTypes: ['EMPTY'],
        elements: [{ type: 'EMPTY' }],
      },
    },
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

    return placement.sectorIds.map(
      (id, idx): IPublicSector => ({
        sectorId: id,
        color: colors[idx] as ESector,
        signals: [
          { type: 'data' as const },
          { type: 'data' as const },
          { type: 'data' as const },
        ],
        dataSlotCapacity: 3,
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
    expect(screen.queryByText('null')).not.toBeInTheDocument();
    expect(asteroid.style.left).toBe(comet.style.left);
    expect(asteroid.style.top).toBe(comet.style.top);
    expect(Number(asteroid.style.zIndex)).toBeGreaterThan(
      Number(comet.style.zIndex),
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
    expect(parseFloat(neptuneLabel.style.left)).toBeCloseTo(67.69, 2);
    expect(parseFloat(neptuneLabel.style.top)).toBeCloseTo(92.702, 2);
  });
});
