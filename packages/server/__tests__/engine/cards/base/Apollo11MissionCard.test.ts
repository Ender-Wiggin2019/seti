import { Apollo11Mission } from '@/engine/cards/base/Apollo11MissionCard.js';

describe('Apollo11Mission', () => {
  it('loads expected card metadata', () => {
    const card = new Apollo11Mission();
    expect(card.id).toBe('97');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new Apollo11Mission();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('97');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
