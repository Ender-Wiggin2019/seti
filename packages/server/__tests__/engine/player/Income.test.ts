import { EResource } from '@seti/common/types/element';
import { Income } from '@/engine/player/Income.js';

describe('Income', () => {
  it('validates constructor resource bundles', () => {
    expect(() => new Income({ [EResource.CREDIT]: -1 })).toThrow();
    expect(() => new Income({}, { [EResource.ENERGY]: -1 })).toThrow();
  });

  it('computes round payout from full resource bundle', () => {
    const income = new Income({
      [EResource.CREDIT]: 2,
      [EResource.ENERGY]: 1,
      [EResource.PUBLICITY]: 1,
      [EResource.DATA]: 2,
      [EResource.CARD]: 1,
      [EResource.MOVE]: 3,
    });

    expect(income.computeRoundPayout()).toEqual({
      [EResource.CREDIT]: 2,
      [EResource.ENERGY]: 1,
      [EResource.DATA]: 2,
      [EResource.PUBLICITY]: 1,
      [EResource.SCORE]: 0,
      [EResource.CARD]: 1,
      [EResource.CARD_ANY]: 0,
      [EResource.MOVE]: 3,
    });
  });

  it('accumulates tucked card income by resource type', () => {
    const income = new Income({
      [EResource.CREDIT]: 1,
      [EResource.ENERGY]: 2,
      [EResource.MOVE]: 1,
    });

    income.addTuckedIncome(EResource.CREDIT);
    income.addTuckedIncome(EResource.CREDIT);
    income.addTuckedIncome(EResource.ENERGY);
    income.addTuckedIncome(EResource.MOVE);

    expect(income.tuckedCardIncome[EResource.CREDIT]).toBe(2);
    expect(income.tuckedCardIncome[EResource.ENERGY]).toBe(1);
    expect(income.tuckedCardIncome[EResource.MOVE]).toBe(1);
    expect(income.computeRoundPayout()[EResource.CREDIT]).toBe(3);
    expect(income.computeRoundPayout()[EResource.ENERGY]).toBe(3);
    expect(income.computeRoundPayout()[EResource.MOVE]).toBe(2);
  });

  it('supports seeded tucked card income in constructor', () => {
    const income = new Income(
      { [EResource.CREDIT]: 1, [EResource.SCORE]: 2 },
      { [EResource.CREDIT]: 2, [EResource.SCORE]: 3, [EResource.CARD]: 1 },
    );

    expect(income.baseIncome[EResource.CREDIT]).toBe(1);
    expect(income.baseIncome[EResource.SCORE]).toBe(2);
    expect(income.tuckedCardIncome[EResource.CREDIT]).toBe(2);
    expect(income.tuckedCardIncome[EResource.SCORE]).toBe(3);
    expect(income.tuckedCardIncome[EResource.CARD]).toBe(1);
    expect(income.computeRoundPayout()[EResource.CREDIT]).toBe(3);
    expect(income.computeRoundPayout()[EResource.SCORE]).toBe(5);
    expect(income.computeRoundPayout()[EResource.CARD]).toBe(1);
  });

  it('rejects unknown tucked income resource at runtime', () => {
    const income = new Income();
    expect(() => income.addTuckedIncome('gold' as never)).toThrow();
  });
});
