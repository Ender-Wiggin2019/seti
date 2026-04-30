import { SpaceShuttle } from '@/engine/cards/base/SpaceShuttleCard.js';

describe('SpaceShuttle', () => {
  it('loads expected card metadata', () => {
    const card = new SpaceShuttle();
    expect(card.id).toBe('132');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new SpaceShuttle();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('132');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
