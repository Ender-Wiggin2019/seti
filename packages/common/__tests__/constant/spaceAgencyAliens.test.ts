import {
  ARKHOS_EXPLORATION_CARDS,
  SPACE_AGENCY_BLOCKED_ALIEN_REWARD_PAYLOADS,
} from '@seti/common/constant/spaceAgencyAliens';
import { EAlienType } from '@seti/common/types/BaseCard';
import { describe, expect, it } from 'vitest';

describe('spaceAgencyAliens', () => {
  it('keeps source-blocked alien reward payloads explicit', () => {
    expect(SPACE_AGENCY_BLOCKED_ALIEN_REWARD_PAYLOADS).toEqual([
      {
        id: 'glyphids-translated-rewards',
        alien: EAlienType.GLYPHIDS,
        blockedReason: 'missing-structured-payload-source',
        requiredSource: 'frontend-reference dataSheet.alphabetTable',
      },
      {
        id: 'amoeba-organelle-rewards',
        alien: EAlienType.AMOEBA,
        blockedReason: 'missing-structured-payload-source',
        requiredSource: 'Amoeba organelle reward payload table',
      },
      {
        id: 'arkhos-exploration-rewards',
        alien: EAlienType.ARKHOS,
        blockedReason: 'missing-structured-payload-source',
        requiredSource: 'Arkhos effectSmall/effectBig payload table',
      },
    ]);

    for (const card of ARKHOS_EXPLORATION_CARDS) {
      expect(card.minorEffectId).toMatch(/_UNMAPPED$/);
      expect(card.majorEffectId).toMatch(/_UNMAPPED$/);
    }
  });
});
