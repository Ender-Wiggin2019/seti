import { describe, expect, it } from 'vitest';
import { EStarName } from '@/constant/sectorSetup';
import {
  createPreludeSetupCandidates,
  PRELUDE_CARDS_BY_ID,
  preludeCards,
} from '@/data/preludeCards';
import { EPlanet, EResource, ETrace } from '@/types/element';

describe('preludeCards', () => {
  it('defines unique Quick Start cards with setup metadata', () => {
    expect(preludeCards).toHaveLength(21);
    expect(new Set(preludeCards.map((card) => card.id)).size).toBe(21);
    expect(Object.keys(PRELUDE_CARDS_BY_ID)).toHaveLength(21);
    expect(preludeCards.every((card) => Array.isArray(card.setupMarks))).toBe(
      true,
    );
  });

  it('maps setup marks without parsing display text', () => {
    expect(PRELUDE_CARDS_BY_ID['SR.1'].setupMarks).toEqual([
      { kind: 'trace', trace: ETrace.YELLOW, alienIndex: 1 },
    ]);
    expect(PRELUDE_CARDS_BY_ID['SR.3'].setupMarks).toEqual([
      { kind: 'signal', starName: EStarName.BARNARDS_STAR, count: 2 },
    ]);
    expect(PRELUDE_CARDS_BY_ID['SR.11'].setupMarks).toEqual([
      { kind: 'orbiter', planet: EPlanet.SATURN },
    ]);
    expect(PRELUDE_CARDS_BY_ID['SR.18'].setupMarks).toEqual([]);
  });

  it('keeps income metadata for income Quick Start cards', () => {
    expect(PRELUDE_CARDS_BY_ID['SR.15'].income).toBe(EResource.CARD);
    expect(PRELUDE_CARDS_BY_ID['SR.16'].income).toBe(EResource.DATA);
  });

  it('creates setup choice candidates for every Quick Start card', () => {
    expect(createPreludeSetupCandidates()).toEqual(
      preludeCards.map((card) => ({
        id: card.id,
        label: `Quick Start Card ${card.id}`,
        permission: { canChoose: true },
      })),
    );
  });
});
