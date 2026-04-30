import { SelectCardFromCardRowEffect } from '@/engine/effects/cardRow/SelectCardFromCardRowEffect.js';

describe('SelectCardFromCardRowEffect', () => {
  it('canExecute depends on cardRow size', () => {
    expect(
      SelectCardFromCardRowEffect.canExecute(
        {} as never,
        { cardRow: [] } as never,
      ),
    ).toBe(false);
    expect(
      SelectCardFromCardRowEffect.canExecute(
        {} as never,
        { cardRow: ['c1'] } as never,
      ),
    ).toBe(true);
  });
});
