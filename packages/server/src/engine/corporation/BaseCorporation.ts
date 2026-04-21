import { EResource } from '@seti/common/types/element';
import { CorporationCard } from './CorporationCard.js';

export const BaseCorporation = new CorporationCard({
  id: 'base-corporation',
  name: 'Base Corporation',
  startResources: {
    credits: 4,
    energy: 3,
    drawCards: 5,
  },
  startIncome: {
    [EResource.CREDIT]: 3,
    [EResource.ENERGY]: 2,
    [EResource.CARD]: 1,
  },
  startActions: {
    tuckIncome: 1,
  },
});
