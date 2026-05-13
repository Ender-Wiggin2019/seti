import { PLANETARY_BOARD_CONFIG } from '@seti/common/constant/boardLayout';
import { EResource, ETrace } from '@seti/common/types/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { IPublicPlanetaryBoard } from '@/types/re-exports';
import { EPlanet, EPlayerInputType } from '@/types/re-exports';
import { PlanetaryBoardView } from './PlanetaryBoardView';

const planetaryBoard: IPublicPlanetaryBoard = {
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

const meta = {
  title: 'Client/Board/PlanetaryBoardView',
  component: PlanetaryBoardView,
  args: {
    planetaryBoard,
    pendingInput: {
      inputId: 'select-planet-story',
      type: EPlayerInputType.PLANET,
      options: [EPlanet.MARS],
    },
    playerColors: {
      'player-1': '#ef4444',
      'player-2': '#3b82f6',
    },
    onRespondInput: fn(),
  },
} satisfies Meta<typeof PlanetaryBoardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextModePlanetSummary: Story = {
  parameters: {
    textMode: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByTestId('planetary-board-text-cards'),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByTestId('planetary-board-text-mode'),
    ).not.toBeInTheDocument();
    const marsCard = within(canvas.getByTestId(`planet-card-${EPlanet.MARS}`));
    await expect(
      marsCard.getByText('1 signal @ planet sector + 1 any card + 1 tuck'),
    ).toBeVisible();
    await expect(marsCard.getByText('First land data:')).toBeVisible();
    await expect(marsCard.getByText('2 / 1')).toBeVisible();
  },
};

export const ImageModePlanetInput: Story = {
  parameters: {
    textMode: false,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByTestId('planetary-board-text-mode'),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByTestId('planetary-board-image-mode'),
    ).toBeInTheDocument();
    await expect(canvas.queryAllByTestId(/^planet-card-/)).toHaveLength(0);
    await userEvent.click(canvas.getByTestId(`planet-target-${EPlanet.MARS}`));
    await expect(args.onRespondInput).toHaveBeenCalledWith({
      inputId: 'select-planet-story',
      type: EPlayerInputType.PLANET,
      planet: EPlanet.MARS,
    });
  },
};
