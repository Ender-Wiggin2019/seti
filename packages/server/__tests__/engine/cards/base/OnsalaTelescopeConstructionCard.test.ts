import { OnsalaTelescopeConstruction } from '@/engine/cards/base/OnsalaTelescopeConstructionCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('OnsalaTelescopeConstruction', () => {
  it('loads expected card id and kind', () => {
    const card = new OnsalaTelescopeConstruction();

    expect(card.id).toBe('62');
    expect(card.kind).toBe(EServerCardKind.END_GAME);
  });
});
