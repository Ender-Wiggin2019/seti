import { PLANET_MISSION_CONFIG } from '@seti/common/constant/boardLayout';
import { EResource, ETrace } from '@seti/common/types/element';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import { useDebugStore } from '@/stores/debugStore';
import type { IPublicPlanetaryBoard } from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';

function createPlanetaryBoardMock(): IPublicPlanetaryBoard {
  return {
    configs: {
      [EPlanet.MARS]: {
        ...PLANET_MISSION_CONFIG[EPlanet.MARS],
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

  it('renders all planet cards', () => {
    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{ 'player-1': 'red', 'player-2': 'blue' }}
      />,
    );

    expect(screen.getAllByTestId(/^planet-card-/)).toHaveLength(7);
  });

  it('renders orbit and landing tokens from player colors', () => {
    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{ 'player-1': 'red', 'player-2': 'blue' }}
      />,
    );

    const marsCard = screen.getByTestId(`planet-card-${EPlanet.MARS}`);
    expect(marsCard).toHaveTextContent('Mars');
    expect(screen.getByLabelText('token-player-1')).toBeInTheDocument();
    expect(screen.getByLabelText('token-player-2')).toBeInTheDocument();
  });

  it('highlights selectable planets for select-planet input', () => {
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

  it('uses neutral moon availability copy instead of open state', () => {
    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{}}
      />,
    );

    const marsCard = screen.getByTestId(`planet-card-${EPlanet.MARS}`);
    const moonCount = PLANET_MISSION_CONFIG[EPlanet.MARS].moonSlots;
    expect(marsCard).toHaveTextContent(`Moons ${moonCount}: unoccupied`);
    expect(marsCard).not.toHaveTextContent(`Moons ${moonCount}: open`);
  });

  it('renders planet reward text from projected board config', () => {
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

  it('shows text-mode planet labels without relying on the board image', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{}}
      />,
    );

    expect(screen.getByTestId('planetary-board-text-mode')).toBeInTheDocument();
    expect(screen.getByText('mars')).toBeInTheDocument();
    expect(
      screen.getByText(
        'O: 1 signal @ planet sector + 1 any card + 1 tuck + first 3 VP',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('L: 6 VP + 1 yellow trace + first data 2 / 1'),
    ).toBeInTheDocument();
  });
});
