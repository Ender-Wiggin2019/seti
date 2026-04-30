import { SpaceLaunchSystem } from '@/engine/cards/base/SpaceLaunchSystemCard.js';

describe('SpaceLaunchSystem', () => {
  it('loads expected card metadata', () => {
    const card = new SpaceLaunchSystem();
    expect(card.id).toBe('31');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new SpaceLaunchSystem();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('31');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
