import { BarnardsStarObservation } from '@/engine/cards/base/BarnardsStarObservationCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('BarnardsStarObservation', () => {
  it('loads expected card id and kind', () => {
    const card = new BarnardsStarObservation();

    expect(card.id).toBe('38');
    expect(card.kind).toBe(EServerCardKind.END_GAME);
  });
});
