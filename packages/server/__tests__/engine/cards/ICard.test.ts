import { EServerCardKind } from '@/engine/cards/ICard.js';

describe('ICard exports', () => {
  it('exposes runtime card-kind enum', () => {
    expect(EServerCardKind.IMMEDIATE).toBe('IMMEDIATE');
    expect(EServerCardKind.MISSION).toBe('MISSION');
    expect(EServerCardKind.END_GAME).toBe('END_GAME');
    expect(EServerCardKind.ALIEN).toBe('ALIEN');
  });
});
