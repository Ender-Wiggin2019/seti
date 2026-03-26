import { EServerCardKind } from '@/engine/cards/ICard.js';
import * as cards from '@/engine/cards/index.js';

describe('cards/index exports', () => {
  it('re-exports core factories and helpers', () => {
    expect(cards.CardRegistry).toBeDefined();
    expect(cards.loadCardData).toBeDefined();
    expect(cards.AdvancedNavigationSystem).toBeDefined();
    expect(cards.Mark).toBeDefined();
    expect(cards.EMarkSource).toBeDefined();
  });

  it('re-exports enum values', () => {
    expect(EServerCardKind.MISSION).toBe('MISSION');
  });
});
