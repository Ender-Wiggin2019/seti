import { CassiniProbe } from '@/engine/cards/base/CassiniProbeCard.js';

describe('CassiniProbe', () => {
  it('loads expected card metadata', () => {
    const card = new CassiniProbe();
    expect(card.id).toBe('8');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new CassiniProbe();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('8');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
