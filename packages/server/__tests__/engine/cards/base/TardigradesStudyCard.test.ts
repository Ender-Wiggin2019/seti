import { TardigradesStudy } from '@/engine/cards/base/TardigradesStudyCard.js';

describe('TardigradesStudy', () => {
  it('loads expected card metadata', () => {
    const card = new TardigradesStudy();
    expect(card.id).toBe('96');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new TardigradesStudy();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('96');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
