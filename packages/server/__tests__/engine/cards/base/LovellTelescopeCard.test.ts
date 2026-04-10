import { LovellTelescope } from '@/engine/cards/base/LovellTelescopeCard.js';

describe('LovellTelescope', () => {
  it('loads expected card metadata', () => {
    const card = new LovellTelescope();
    expect(card.id).toBe('51');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new LovellTelescope();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('51');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
