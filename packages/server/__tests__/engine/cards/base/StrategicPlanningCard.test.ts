import { StrategicPlanning } from '@/engine/cards/base/StrategicPlanningCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('StrategicPlanning', () => {
  it('loads expected card id and kind', () => {
    const card = new StrategicPlanning();

    expect(card.id).toBe('106');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });
});
