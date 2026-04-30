import { RomanSpaceTelescope } from '@/engine/cards/base/RomanSpaceTelescopeCard.js';

describe('RomanSpaceTelescope', () => {
  it('loads expected card metadata', () => {
    const card = new RomanSpaceTelescope();
    expect(card.id).toBe('111');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new RomanSpaceTelescope();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('111');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
