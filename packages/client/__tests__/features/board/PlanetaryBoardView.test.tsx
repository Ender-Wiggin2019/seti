import { PLANETARY_BOARD_CONFIG } from '@seti/common/constant/boardLayout';
import { EResource, ETrace } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import { useDebugStore } from '@/stores/debugStore';
import type { IPublicPlanetaryBoard } from '@/types/re-exports';
import { EMainAction, EPlanet, EPlayerInputType } from '@/types/re-exports';
import { createMockGameState } from '../../../test/mocks/gameState';

function createPlanetaryBoardMock(): IPublicPlanetaryBoard {
  return {
    configs: {
      [EPlanet.MARS]: {
        ...PLANETARY_BOARD_CONFIG[EPlanet.MARS],
        orbit: {
          rewards: [
            { type: 'signal', target: 'planet-sector', amount: 1 },
            { type: 'card', source: 'any', amount: 1 },
            { type: 'tuck', amount: 1 },
          ],
          firstRewards: [
            { type: 'resource', resource: EResource.SCORE, amount: 3 },
          ],
        },
        land: {
          rewards: [
            { type: 'resource', resource: EResource.SCORE, amount: 6 },
            { type: 'trace', trace: ETrace.YELLOW, amount: 1 },
          ],
          firstData: [2, 1],
          moonRewards: [
            [
              { type: 'resource', resource: EResource.SCORE, amount: 8 },
              { type: 'tuck', amount: 2 },
            ],
          ],
        },
      },
    },
    planets: {
      [EPlanet.MARS]: {
        orbitSlots: [{ playerId: 'player-1' }],
        landingSlots: [{ playerId: 'player-2' }],
        firstOrbitClaimed: true,
        firstLandDataBonusTaken: [true, false],
        moonOccupants: [],
      },
    },
  };
}

function createMoonLandingState(): {
  gameState: ReturnType<typeof createMockGameState>;
  planetaryBoard: IPublicPlanetaryBoard;
} {
  const planetaryBoard = createPlanetaryBoardMock();
  planetaryBoard.planets[EPlanet.JUPITER] = {
    orbitSlots: [],
    landingSlots: [],
    firstOrbitClaimed: false,
    firstLandDataBonusTaken: [false],
    moonOccupants: [],
  };

  const baseState = createMockGameState();
  const gameState = createMockGameState({
    players: [
      {
        ...baseState.players[0],
        techs: [ETechId.PROBE_MOON],
      },
      baseState.players[1],
    ],
    planetaryBoard,
    solarSystem: {
      ...baseState.solarSystem,
      planetSpaceIds: {
        ...baseState.solarSystem.planetSpaceIds,
        [EPlanet.JUPITER]: 'jupiter-space',
      },
      probes: [{ playerId: 'player-1', spaceId: 'jupiter-space' }],
    },
  });

  return { gameState, planetaryBoard };
}

describe('PlanetaryBoardView', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDebugStore.setState({ textMode: false });
  });

  it('keeps image mode focused on the board image and board tokens', () => {
    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{ 'player-1': 'red', 'player-2': 'blue' }}
      />,
    );

    expect(
      screen.getByTestId('planetary-board-image-mode'),
    ).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^planet-card-/)).toHaveLength(0);
    expect(screen.queryByText('Orbit reward')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('planet-board-token-player-1'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('planet-board-token-player-2'),
    ).toBeInTheDocument();
  });

  it('renders text-mode planet cards from projected board state', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{ 'player-1': 'red', 'player-2': 'blue' }}
      />,
    );

    expect(
      screen.queryByTestId('planetary-board-text-mode'),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/^planet-card-/)).toHaveLength(7);
    const marsCard = screen.getByTestId(`planet-card-${EPlanet.MARS}`);
    expect(marsCard).toHaveTextContent('Mars');
    expect(screen.getByLabelText('token-player-1')).toBeInTheDocument();
    expect(screen.getByLabelText('token-player-2')).toBeInTheDocument();
  });

  it('keeps image-mode planet hotspots clickable with the server input payload', () => {
    const onRespondInput = vi.fn();

    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={{
          inputId: 'input-1',
          type: EPlayerInputType.PLANET,
          options: [EPlanet.MARS],
        }}
        playerColors={{}}
        onRespondInput={onRespondInput}
      />,
    );

    const marsTarget = screen.getByTestId(`planet-target-${EPlanet.MARS}`);
    expect(marsTarget.className).toContain('ring-1');

    fireEvent.click(marsTarget);

    expect(onRespondInput).toHaveBeenCalledWith({
      inputId: 'input-1',
      type: EPlayerInputType.PLANET,
      planet: EPlanet.MARS,
    });
  });

  it('uses neutral moon availability copy instead of open state', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{}}
      />,
    );

    const marsCard = screen.getByTestId(`planet-card-${EPlanet.MARS}`);
    const moonCount = PLANETARY_BOARD_CONFIG[EPlanet.MARS].moonSlots;
    expect(marsCard).toHaveTextContent(`Moons ${moonCount}: unoccupied`);
    expect(marsCard).not.toHaveTextContent(`Moons ${moonCount}: open`);
  });

  it('renders planet rewards through DescRender icons from projected board config', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{}}
      />,
    );

    const marsCard = screen.getByTestId(`planet-card-${EPlanet.MARS}`);
    expect(marsCard).toHaveTextContent('Orbit reward');
    expect(marsCard).toHaveTextContent('Land reward');
    expect(
      within(marsCard).getByTestId(`planet-reward-icons-${EPlanet.MARS}-orbit`),
    ).toHaveAttribute(
      'aria-label',
      '1 signal @ planet sector + 1 any card + 1 tuck',
    );
    expect(
      within(marsCard).getByTestId(
        'seti-desc-any-signal-1 @ planet + any-card-1 + income-1',
      ),
    ).toBeInTheDocument();
    expect(
      within(marsCard).getByTestId('seti-desc-score-6 + yellow-trace-1'),
    ).toBeInTheDocument();
    expect(
      within(marsCard).getByTestId('seti-desc-data-2 / data-1'),
    ).toBeInTheDocument();
  });

  it('renders text-mode moon land rewards and moon occupants', () => {
    useDebugStore.setState({ textMode: true });
    const planetaryBoard = createPlanetaryBoardMock();
    planetaryBoard.planets[EPlanet.JUPITER] = {
      orbitSlots: [],
      landingSlots: [],
      firstOrbitClaimed: false,
      firstLandDataBonusTaken: [false],
      moonOccupants: [
        { playerId: 'player-1', moonId: 'jupiter-ganymede' },
        { playerId: 'player-2', moonId: 'jupiter-europa' },
      ],
    };

    render(
      <PlanetaryBoardView
        planetaryBoard={planetaryBoard}
        pendingInput={null}
        playerColors={{ 'player-1': 'red', 'player-2': 'blue' }}
      />,
    );

    const jupiterCard = screen.getByTestId(`planet-card-${EPlanet.JUPITER}`);
    const ganymede = within(jupiterCard).getByTestId(
      `moon-block-${EPlanet.JUPITER}-jupiter-ganymede`,
    );
    expect(ganymede).toHaveTextContent('Ganymede');
    expect(
      within(ganymede).getByTestId('seti-desc-score-12 + publicity-5'),
    ).toBeInTheDocument();
    expect(
      within(jupiterCard).getByTestId('seti-desc-score-7 + yellow-trace-2'),
    ).toBeInTheDocument();
    expect(
      within(jupiterCard).getByTestId('seti-desc-score-10 + energy-4'),
    ).toBeInTheDocument();
    expect(
      within(jupiterCard).getByTestId('seti-desc-score-13 + data-4'),
    ).toBeInTheDocument();
    expect(
      within(jupiterCard).getByLabelText('token-player-1'),
    ).toBeInTheDocument();
    expect(
      within(jupiterCard).getByLabelText('token-player-2'),
    ).toBeInTheDocument();
  });

  it('clicks image-mode moon hotspots with the selected moon id payload', () => {
    const { gameState, planetaryBoard } = createMoonLandingState();
    const onSelectMainActionPlanet = vi.fn();

    render(
      <PlanetaryBoardView
        planetaryBoard={planetaryBoard}
        gameState={gameState}
        myPlayerId='player-1'
        pendingInput={null}
        playerColors={{}}
        mainActionPlanetMode={EMainAction.LAND}
        onSelectMainActionPlanet={onSelectMainActionPlanet}
      />,
    );

    fireEvent.click(
      screen.getByTestId(
        `planet-target-${EPlanet.JUPITER}-moon-jupiter-callisto`,
      ),
    );

    expect(onSelectMainActionPlanet).toHaveBeenCalledWith(EPlanet.JUPITER, {
      isMoon: true,
      moonId: 'jupiter-callisto',
    });
  });

  it('clicks a planet land target when the player already has a lander there', () => {
    const planetaryBoard = createPlanetaryBoardMock();
    const marsState = planetaryBoard.planets[EPlanet.MARS];
    planetaryBoard.planets[EPlanet.MARS] = {
      orbitSlots: marsState?.orbitSlots ?? [],
      landingSlots: [{ playerId: 'player-1' }],
      firstOrbitClaimed: marsState?.firstOrbitClaimed ?? false,
      firstLandDataBonusTaken: marsState?.firstLandDataBonusTaken ?? [],
      moonOccupants: [],
    };
    const baseState = createMockGameState();
    const gameState = createMockGameState({
      players: baseState.players,
      planetaryBoard,
      solarSystem: {
        ...baseState.solarSystem,
        planetSpaceIds: {
          ...baseState.solarSystem.planetSpaceIds,
          [EPlanet.MARS]: 'mars-space',
        },
        probes: [{ playerId: 'player-1', spaceId: 'mars-space' }],
      },
    });
    const onSelectMainActionPlanet = vi.fn();

    render(
      <PlanetaryBoardView
        planetaryBoard={planetaryBoard}
        gameState={gameState}
        myPlayerId='player-1'
        pendingInput={null}
        playerColors={{}}
        mainActionPlanetMode={EMainAction.LAND}
        onSelectMainActionPlanet={onSelectMainActionPlanet}
      />,
    );

    fireEvent.click(screen.getByTestId(`planet-target-${EPlanet.MARS}`));

    expect(onSelectMainActionPlanet).toHaveBeenCalledWith(
      EPlanet.MARS,
      undefined,
    );
  });

  it('clicks a discounted planet land target with rover tech and two energy', () => {
    const planetaryBoard = createPlanetaryBoardMock();
    planetaryBoard.planets[EPlanet.MERCURY] = {
      orbitSlots: [],
      landingSlots: [],
      firstOrbitClaimed: false,
      firstLandDataBonusTaken: [false],
      moonOccupants: [],
    };
    const baseState = createMockGameState();
    const gameState = createMockGameState({
      players: [
        {
          ...baseState.players[0],
          techs: [ETechId.PROBE_ROVER_DISCOUNT],
          resources: {
            ...baseState.players[0].resources,
            [EResource.ENERGY]: 2,
          },
        },
        baseState.players[1],
      ],
      planetaryBoard,
      solarSystem: {
        ...baseState.solarSystem,
        planetSpaceIds: {
          ...baseState.solarSystem.planetSpaceIds,
          [EPlanet.MERCURY]: 'mercury-space',
        },
        probes: [{ playerId: 'player-1', spaceId: 'mercury-space' }],
      },
    });
    const onSelectMainActionPlanet = vi.fn();

    render(
      <PlanetaryBoardView
        planetaryBoard={planetaryBoard}
        gameState={gameState}
        myPlayerId='player-1'
        pendingInput={null}
        playerColors={{}}
        mainActionPlanetMode={EMainAction.LAND}
        onSelectMainActionPlanet={onSelectMainActionPlanet}
      />,
    );

    fireEvent.click(screen.getByTestId(`planet-target-${EPlanet.MERCURY}`));

    expect(onSelectMainActionPlanet).toHaveBeenCalledWith(
      EPlanet.MERCURY,
      undefined,
    );
  });

  it('clicks text-mode moon blocks with the selected moon id payload', () => {
    useDebugStore.setState({ textMode: true });
    const { gameState, planetaryBoard } = createMoonLandingState();
    const onSelectMainActionPlanet = vi.fn();

    render(
      <PlanetaryBoardView
        planetaryBoard={planetaryBoard}
        gameState={gameState}
        myPlayerId='player-1'
        pendingInput={null}
        playerColors={{}}
        mainActionPlanetMode={EMainAction.LAND}
        onSelectMainActionPlanet={onSelectMainActionPlanet}
      />,
    );

    fireEvent.click(
      screen.getByTestId(`moon-block-${EPlanet.JUPITER}-jupiter-io`),
    );

    expect(onSelectMainActionPlanet).toHaveBeenCalledWith(EPlanet.JUPITER, {
      isMoon: true,
      moonId: 'jupiter-io',
    });
  });

  it('highlights selectable text-mode planet cards', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={{
          inputId: 'input-1',
          type: EPlayerInputType.PLANET,
          options: [EPlanet.MARS],
        }}
        playerColors={{}}
      />,
    );

    expect(
      screen.getByTestId(`planet-card-${EPlanet.MARS}`).className,
    ).toContain('ring-1');
  });
});
