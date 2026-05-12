import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EPlayerInputType } from '@/types/re-exports';
import { HandView } from './HandView';

const handCards: IBaseCard[] = [
  createStoryCard('HAND.1', 'Alpha Survey'),
  createStoryCard('HAND.2', 'Beta Array'),
];

function createStoryCard(id: string, name: string): IBaseCard {
  return {
    id,
    name,
    position: {
      src: '/seti-assets/cards/cards-1.webp',
      row: 0,
      col: 0,
    },
    price: 2,
    income: EResource.CREDIT,
    effects: [],
  };
}

const meta = {
  title: 'Client/Player/HandView',
  component: HandView,
  args: {
    cards: handCards,
    handSize: handCards.length,
    pendingInput: null,
    onSubmitSelection: fn(),
    onCardInspect: fn(),
    onCardPlaySelect: fn(),
  },
} satisfies Meta<typeof HandView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextModeCardSelection: Story = {
  args: {
    pendingInput: {
      inputId: 'select-hand-card',
      type: EPlayerInputType.CARD,
      cards: handCards,
      minSelections: 1,
      maxSelections: 2,
    },
  },
  parameters: {
    textMode: true,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('text-card-HAND.1')).toHaveTextContent(
      'Alpha Survey',
    );
    await userEvent.click(canvas.getByTestId('hand-card-HAND.1'));
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await expect(args.onSubmitSelection).toHaveBeenCalledWith(['HAND.1']);
  },
};

export const ImageModeInspect: Story = {
  parameters: {
    textMode: false,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByTestId('text-card-HAND.1'),
    ).not.toBeInTheDocument();
    await expect(canvas.getByText('HAND.1')).toBeVisible();
    await userEvent.click(canvas.getByTestId('hand-card-HAND.1'));
    await expect(args.onCardInspect).toHaveBeenCalledWith(handCards[0]);
  },
};
