import { MessengerProbe } from '@/engine/cards/base/MessengerProbeCard.js';

describe('MessengerProbe', () => {
  it('loads expected card metadata', () => {
    const card = new MessengerProbe();
    expect(card.id).toBe('7');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new MessengerProbe();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('7');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
