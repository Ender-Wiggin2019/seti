import { ExtremophilesStudy } from '@/engine/cards/base/ExtremophilesStudyCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('ExtremophilesStudy', () => {
  it('loads expected card id and kind', () => {
    const card = new ExtremophilesStudy();

    expect(card.id).toBe('75');
    expect(card.kind).toBe(EServerCardKind.IMMEDIATE);
  });
});
