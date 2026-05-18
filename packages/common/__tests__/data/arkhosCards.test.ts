import {
  ARKHOS_EXPLORATION_CARDS,
  ARKHOS_SECURITY_CARDS,
} from '@seti/common/data/arkhosCards';
import { ETrace } from '@seti/common/types/element';
import { describe, expect, it } from 'vitest';

describe('arkhosCards', () => {
  it('defines the nine exploration cards with opaque unmapped reward ids', () => {
    expect(ARKHOS_EXPLORATION_CARDS).toHaveLength(9);
    expect(ARKHOS_EXPLORATION_CARDS.map((card) => card.cardId)).toEqual(
      Array.from(
        { length: 9 },
        (_, index) => `ARKHOS.EXPLORATION.${index + 1}`,
      ),
    );
    for (const [index, card] of ARKHOS_EXPLORATION_CARDS.entries()) {
      const effectNumber = (index + 1).toString().padStart(2, '0');
      expect(card.minorEffectId).toBe(
        `ARKHOS_EXPLORATION_${effectNumber}_MINOR_UNMAPPED`,
      );
      expect(card.majorEffectId).toBe(
        `ARKHOS_EXPLORATION_${effectNumber}_MAJOR_UNMAPPED`,
      );
      expect(card.majorEffectId).not.toBe(card.minorEffectId);
    }
  });

  it('defines twelve security cards split into four cards per trace color', () => {
    expect(ARKHOS_SECURITY_CARDS).toHaveLength(12);
    expect(ARKHOS_SECURITY_CARDS.map((card) => card.cardId)).toEqual(
      Array.from({ length: 12 }, (_, index) => {
        const id = index + 1;
        return `AIcard${id.toString().padStart(2, '0')}`;
      }),
    );
    expect(
      ARKHOS_SECURITY_CARDS.filter((card) => card.traceColor === ETrace.RED),
    ).toHaveLength(4);
    expect(
      ARKHOS_SECURITY_CARDS.filter((card) => card.traceColor === ETrace.YELLOW),
    ).toHaveLength(4);
    expect(
      ARKHOS_SECURITY_CARDS.filter((card) => card.traceColor === ETrace.BLUE),
    ).toHaveLength(4);
    for (const card of ARKHOS_SECURITY_CARDS) {
      expect(card.creditCost).toBe(2);
      expect(card.questCondition).toBe(`useLife${card.traceColor}`);
      expect(card.minorEffectId).not.toContain('UNKNOWN');
      expect(card.majorEffectId).not.toContain('UNKNOWN');
    }
  });
});
