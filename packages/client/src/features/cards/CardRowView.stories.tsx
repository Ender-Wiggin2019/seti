import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CardRowView } from './CardRowView';

const rowCards: IBaseCard[] = [
  createStoryCard('ROW.1', 'Survey Relay'),
  createStoryCard('ROW.2', 'Deep Array'),
  createStoryCard('ROW.3', 'Signal Cache'),
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
  title: 'Client/Cards/CardRowView',
  component: CardRowView,
  args: {
    cards: rowCards,
    mode: 'buy',
    selectedCardId: null,
    onCardClick: fn(),
    onCardInspect: fn(),
  },
} satisfies Meta<typeof CardRowView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextModeBuyRow: Story = {
  parameters: {
    textMode: true,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('text-card-ROW.1')).toHaveTextContent(
      'Survey Relay',
    );
    await userEvent.click(canvas.getByTestId('card-row-ROW.1'));
    await expect(args.onCardClick).toHaveBeenCalledWith(rowCards[0]);
  },
};

export const ImageModeSelectedRow: Story = {
  args: {
    mode: 'discard',
    selectedCardId: 'ROW.2',
  },
  parameters: {
    textMode: false,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByTestId('text-card-ROW.2'),
    ).not.toBeInTheDocument();
    await expect(canvas.getByText('ROW.2')).toBeVisible();
    await expect(canvas.getByTestId('card-row-ROW.2')).toHaveClass('ring-1');
    await userEvent.dblClick(canvas.getByTestId('card-row-ROW.2'));
    await expect(args.onCardInspect).toHaveBeenCalledWith(rowCards[1]);
  },
};
