import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EEffectType } from '@seti/common/types/effect';
import { EResource, ESector } from '@seti/common/types/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { CardRender } from './CardRender';

const complexCard: IBaseCard = {
  id: 'C.42',
  name: 'Signal Analysis',
  position: {
    src: '/seti-assets/cards/cards-1.webp',
    row: 0,
    col: 0,
  },
  price: 4,
  priceType: EResource.CREDIT,
  freeAction: [{ type: EResource.DATA, value: 1 }],
  sector: ESector.RED,
  income: EResource.ENERGY,
  effects: [
    {
      effectType: EEffectType.BASE,
      type: EResource.CREDIT,
      value: 2,
      desc: 'gain credits',
    },
    {
      effectType: EEffectType.MISSION_FULL,
      desc: 'complete a signal study',
      missions: [
        {
          req: [
            {
              effectType: EEffectType.BASE,
              type: EResource.DATA,
              value: 1,
            },
          ],
          reward: [
            {
              effectType: EEffectType.BASE,
              type: EResource.SCORE,
              value: 3,
            },
          ],
        },
        {
          req: [
            {
              effectType: EEffectType.CUSTOMIZED,
              id: 'scan-sector',
              desc: 'scan any sector',
            },
          ],
          reward: [
            {
              effectType: EEffectType.BASE,
              type: EResource.CARD_ANY,
              value: 1,
            },
          ],
        },
      ],
    },
  ],
};

const meta = {
  title: 'Client/Cards/CardRender',
  component: CardRender,
  args: {
    card: complexCard,
  },
} satisfies Meta<typeof CardRender>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextModeComplexCard: Story = {
  parameters: {
    textMode: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByTestId('text-card-C.42');

    await expect(card).toHaveStyle({ width: '150px', height: '209px' });
    await expect(card).toHaveTextContent('Signal Analysis');
    await expect(
      canvas.getByTestId('text-card-free-action-C.42'),
    ).toHaveTextContent('Free Action: 1 data');
    await expect(canvas.getByTestId('text-card-sector-C.42')).toHaveTextContent(
      'Sector: red-signal',
    );
    await expect(card).toHaveTextContent('2 credit (gain credits)');
    await expect(card).toHaveTextContent('1 data -> 3 score');
    await expect(card).toHaveTextContent('scan any sector -> 1 any-card');
  },
};

export const ImageModeCard: Story = {
  parameters: {
    textMode: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByTestId('text-card-C.42'),
    ).not.toBeInTheDocument();
    await expect(canvas.getByTestId('card-render-C.42')).toBeInTheDocument();
    await expect(canvas.getByText('C.42')).toBeVisible();
    await expect(canvasElement.querySelector('.card-wrapper')).not.toBeNull();
  },
};
