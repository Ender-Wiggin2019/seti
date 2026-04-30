import { VeneraProbe } from '@/engine/cards/base/VeneraProbeCard.js';

describe('VeneraProbe', () => {
  it('loads expected card metadata', () => {
    const card = new VeneraProbe();
    expect(card.id).toBe('5');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new VeneraProbe();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('5');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
