import { PLANETARY_BOARD_CONFIG } from '@seti/common/constant/boardLayout';
import { EResource, ETrace } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import { useDebugStore } from '@/stores/debugStore';
import type { IPublicPlanetaryBoard } from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';

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
        },
      },
    },
    planets: {
      [EPlanet.MARS]: {
        orbitSlots: [{ playerId: 'player-1' }],
        landingSlots: [{ playerId: 'player-2' }],
        firstOrbitClaimed: true,
        firstLandDataBonusTaken: [true, false],
        moonOccupant: null,
      },
    },
  };
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

  it('renders planet reward text from projected board config', () => {
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
    expect(marsCard).toHaveTextContent('1 signal @ planet sector');
    expect(marsCard).toHaveTextContent('1 any card');
    expect(marsCard).toHaveTextContent('1 tuck');
    expect(marsCard).toHaveTextContent('Land reward');
    expect(marsCard).toHaveTextContent('6 VP');
    expect(marsCard).toHaveTextContent('1 yellow trace');
    expect(marsCard).toHaveTextContent('First land data: 2 / 1');
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
