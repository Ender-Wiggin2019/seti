import { GreenBankTelescope } from '@/engine/cards/base/GreenBankTelescopeCard.js';

describe('GreenBankTelescope', () => {
  it('loads expected card metadata', () => {
    const card = new GreenBankTelescope();
    expect(card.id).toBe('105');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new GreenBankTelescope();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('105');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
