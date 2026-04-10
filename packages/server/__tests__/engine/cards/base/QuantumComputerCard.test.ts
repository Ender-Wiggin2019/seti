import { QuantumComputer } from '@/engine/cards/base/QuantumComputerCard.js';

describe('QuantumComputer', () => {
  it('loads expected card metadata', () => {
    const card = new QuantumComputer();
    expect(card.id).toBe('61');
    expect(card.name.length).toBeGreaterThan(0);
  });

  it('builds mission definition from card data', () => {
    const card = new QuantumComputer();
    const mission = card.getMissionDef();
    expect(mission.cardId).toBe('61');
    expect(mission.branches.length).toBeGreaterThan(0);
  });
});
