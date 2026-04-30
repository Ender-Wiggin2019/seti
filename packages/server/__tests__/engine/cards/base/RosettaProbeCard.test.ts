import { RosettaProbe } from '@/engine/cards/base/RosettaProbeCard.js';

describe('RosettaProbe', () => {
  it('loads expected card metadata', () => {
    const card = new RosettaProbe();
    expect(card.id).toBe('104');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new RosettaProbe();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('104');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
