import { GmrtTelescope } from '@/engine/cards/base/GmrtTelescopeCard.js';

describe('GmrtTelescope', () => {
  it('loads expected card metadata', () => {
    const card = new GmrtTelescope();
    expect(card.id).toBe('66');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new GmrtTelescope();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('66');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
