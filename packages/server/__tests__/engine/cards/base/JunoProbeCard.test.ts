import { JunoProbe } from '@/engine/cards/base/JunoProbeCard.js';

describe('JunoProbe', () => {
  it('loads expected card metadata', () => {
    const card = new JunoProbe();
    expect(card.id).toBe('6');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new JunoProbe();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('6');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
