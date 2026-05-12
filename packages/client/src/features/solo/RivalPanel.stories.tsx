import { ETechId } from '@seti/common/types/tech';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import type { IPublicRivalState } from '@/types/re-exports';
import { RivalPanel } from './RivalPanel';

const rivalState: IPublicRivalState = {
  rivalPlayerId: 'rival:storybook',
  difficulty: 4,
  progress: 15,
  progressSlot: 3,
  boardConfigId: 'rival-board-3',
  computer: {
    filledSlots: [true, false, true, false, false, false],
    dataPool: 2,
    slotRewards: [
      null,
      { type: 'PUBLICITY', amount: 1 },
      null,
      { type: 'CUSTOM', effectId: 'RIVAL_PROGRESS_4' },
      null,
      null,
    ],
  },
  actionDeck: {
    drawPileSize: 3,
    discardPileSize: 1,
    advancedReserveSize: 4,
    removedCardIds: [],
    currentCardId: 'S.4',
  },
  revealedObjectiveIds: ['SOLO.2', 'SOLO.5'],
  completedObjectiveIds: ['SOLO.1'],
  objectiveTaskMarkers: {
    'SOLO.5': [0],
  },
  techIds: [
    ETechId.PROBE_DOUBLE_PROBE,
    ETechId.SCAN_EARTH_LOOK,
    ETechId.COMPUTER_VP_CARD,
  ],
};

const meta = {
  title: 'Client/Solo/RivalPanel',
  component: RivalPanel,
  args: {
    rival: rivalState,
  },
} satisfies Meta<typeof RivalPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ImageModeRivalPanel: Story = {
  parameters: {
    textMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('rival-board-image-mode')).toHaveAttribute(
      'data-reference-layout',
      'automa-board',
    );
    await expect(
      canvas.getByTestId('rival-action-card-image-S.4'),
    ).toHaveAttribute('src', '/assets/seti/solo/action-cards/S.4.jpg');
    await expect(
      canvas.queryByTestId('rival-action-card-text-S.4'),
    ).not.toBeInTheDocument();
  },
};

export const TextModeRivalPanel: Story = {
  parameters: {
    textMode: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByTestId('rival-board-image-mode'),
    ).not.toBeInTheDocument();
    await expect(canvas.getByTestId('rival-progress-cycle')).toHaveAttribute(
      'data-mode',
      'text',
    );
    await expect(
      canvas.getByTestId('rival-action-card-text-S.4'),
    ).toHaveTextContent(/Research tech/i);
    await expect(
      canvas.getByTestId('rival-objective-text-card-SOLO.5'),
    ).toHaveTextContent('1/2');
  },
};
