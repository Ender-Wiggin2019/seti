import { TridentProbe } from '@/engine/cards/base/TridentProbeCard.js';

describe('TridentProbe', () => {
  it('loads expected card metadata', () => {
    const card = new TridentProbe();
    expect(card.id).toBe('60');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new TridentProbe();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('60');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
