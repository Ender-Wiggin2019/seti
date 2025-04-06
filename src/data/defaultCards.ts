import { IBaseCard } from '@/types/BaseCard';
import { EResource, ESector } from '@/types/element';

export const DEFAULT_BASE_CARD: IBaseCard = {
  id: 'Fan.1',
  name: '',
  position: { src: '/images/cards/cards-1.webp', row: 0, col: 0 },
  image: '',
  freeAction: [],
  effects: [],
  income: EResource.CREDIT,
  sector: ESector.RED,
  price: 0,
  priceType: EResource.CREDIT,
  flavorText: '',
  special: {
    fanMade: true,
    enableEffectRender: true,
    titleColor: '#3E403B',
    titleHeight: 95,
  },
};
