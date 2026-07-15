import {
  EXERTIANS_TRACE_SLOT_DEFS,
  MASCAMITES_FIXED_TRACE_SLOT_DEFS,
} from '@seti/common/constant/alienBoardConfig';
import { ETrace } from '@seti/common/types/element';
import { describe, expect, it } from 'vitest';

describe('alien board trace configuration', () => {
  it('defines Exertians trace rewards as shared common data', () => {
    expect(EXERTIANS_TRACE_SLOT_DEFS[ETrace.PINK]).toHaveLength(5);
    expect(EXERTIANS_TRACE_SLOT_DEFS[ETrace.YELLOW]).toHaveLength(5);
    expect(EXERTIANS_TRACE_SLOT_DEFS[ETrace.BLUE]).toHaveLength(5);
    expect(EXERTIANS_TRACE_SLOT_DEFS[ETrace.PINK][0]).toEqual({
      danger: 3,
      rewards: [
        { type: 'VP', amount: 9 },
        { type: 'CREDIT', amount: 1 },
      ],
    });
  });

  it('defines Mascamites fixed trace rewards as shared common data', () => {
    expect(
      MASCAMITES_FIXED_TRACE_SLOT_DEFS.filter(
        (slot) => slot.traceColor === ETrace.PINK,
      ),
    ).toHaveLength(4);
    expect(
      MASCAMITES_FIXED_TRACE_SLOT_DEFS.filter(
        (slot) => slot.traceColor === ETrace.YELLOW,
      ),
    ).toHaveLength(4);
    expect(
      MASCAMITES_FIXED_TRACE_SLOT_DEFS.filter(
        (slot) => slot.traceColor === ETrace.BLUE,
      ),
    ).toHaveLength(2);
    expect(MASCAMITES_FIXED_TRACE_SLOT_DEFS[0].rewards).toEqual([
      { type: 'VP', amount: 5 },
      { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
    ]);
  });
});
