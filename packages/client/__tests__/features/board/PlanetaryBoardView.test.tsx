import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import type { IPublicPlanetaryBoard } from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';

function createPlanetaryBoardMock(): IPublicPlanetaryBoard {
  return {
    planets: {
      [EPlanet.MARS]: {
        orbitSlots: [{ playerId: 'player-1' }],
        landingSlots: [{ playerId: 'player-2' }],
        firstOrbitClaimed: true,
        firstLandDataBonusTaken: [true, false],
        moonOccupant: null,
        moonUnlocked: true,
      },
    },
  };
}

describe('PlanetaryBoardView', () => {
  it('renders all planet cards', () => {
    render(
      <PlanetaryBoardView
        planetaryBoard={createPlanetaryBoardMock()}
        pendingInput={null}
        playerColors={{ 'player-1': 'red', 'player-2': 'blue' }}
      />,
    );

    expect(screen.getAllByTestId(/^planet-card-/)).toHaveLength(8);
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
});
