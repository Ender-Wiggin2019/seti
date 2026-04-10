import { WesterborkTelescope } from '@/engine/cards/base/WesterborkTelescopeCard.js';

describe('WesterborkTelescope', () => {
  it('loads expected card metadata', () => {
    const card = new WesterborkTelescope();
    expect(card.id).toBe('103');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new WesterborkTelescope();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('103');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
