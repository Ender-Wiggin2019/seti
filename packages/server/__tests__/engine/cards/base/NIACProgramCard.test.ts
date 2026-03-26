import { NIACProgram } from '@/engine/cards/base/NIACProgramCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('NIACProgram', () => {
  it('loads expected card id and kind', () => {
    const card = new NIACProgram();

    expect(card.id).toBe('89');
    expect(card.kind).toBe(EServerCardKind.MISSION);
  });
});
