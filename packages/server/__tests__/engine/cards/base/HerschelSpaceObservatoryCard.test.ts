import { HerschelSpaceObservatory } from '@/engine/cards/base/HerschelSpaceObservatoryCard.js';

describe('HerschelSpaceObservatory', () => {
  it('loads expected card metadata', () => {
    const card = new HerschelSpaceObservatory();
    expect(card.id).toBe('134');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new HerschelSpaceObservatory();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('134');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
