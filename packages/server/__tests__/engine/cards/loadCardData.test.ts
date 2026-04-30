import {
  hasCardData,
  loadAllCardData,
  loadCardData,
} from '@/engine/cards/loadCardData.js';

describe('loadCardData', () => {
  it('loads known card by id', () => {
    const card = loadCardData('55');
    expect(card.id).toBe('55');
  });

  it('throws for unknown card id', () => {
    expect(() => loadCardData('__missing_card__')).toThrow();
  });

  it('exposes existence check and full list', () => {
    expect(hasCardData('55')).toBe(true);
    expect(hasCardData('__missing_card__')).toBe(false);
    expect(loadAllCardData().length).toBeGreaterThan(0);
  });
});
