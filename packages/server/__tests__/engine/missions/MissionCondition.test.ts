import { EEffectType } from '@seti/common/types/effect';
import {
  EMiscIcon,
  EResource,
  ESector,
  ESpecialAction,
} from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import type { IMissionBranchDef } from '@/engine/missions/IMission.js';
import {
  checkQuickMissionCondition,
  EMissionEventType,
  matchesFullMissionTrigger,
} from '@/engine/missions/index.js';

describe('matchesFullMissionTrigger', () => {
  it('matches CARD_PLAYED requirement with cost and resource type', () => {
    const branch: IMissionBranchDef = {
      req: [
        {
          effectType: EEffectType.BASE,
          type: EResource.CREDIT,
          value: 2,
        },
      ],
      rewards: [],
    };

    const ok = matchesFullMissionTrigger(branch, {
      type: EMissionEventType.CARD_PLAYED,
      cost: 2,
      costType: EResource.CREDIT,
    });

    expect(ok).toBe(true);
  });

  it('matches ORBIT_OR_LAND requirement on landing event', () => {
    const branch: IMissionBranchDef = {
      req: [
        { effectType: EEffectType.BASE, type: ESpecialAction.ORBIT_OR_LAND },
      ],
      rewards: [],
    };

    const ok = matchesFullMissionTrigger(branch, {
      type: EMissionEventType.PROBE_LANDED,
      planet: EPlanet.MARS,
      isMoon: false,
    });

    expect(ok).toBe(true);
  });

  it('returns false for empty requirements', () => {
    const branch: IMissionBranchDef = { req: [], rewards: [] };
    expect(
      matchesFullMissionTrigger(branch, {
        type: EMissionEventType.SCAN_PERFORMED,
      }),
    ).toBe(false);
  });
});

describe('checkQuickMissionCondition', () => {
  it('prioritizes custom checkCondition when provided', () => {
    const branch: IMissionBranchDef = {
      req: [],
      rewards: [],
      checkCondition: () => true,
    };

    const ok = checkQuickMissionCondition(
      branch,
      { id: 'p1' } as never,
      {} as never,
    );
    expect(ok).toBe(true);
  });

  it('evaluates fulfill-sector condition against game sectors', () => {
    const branch: IMissionBranchDef = {
      req: [
        {
          effectType: EEffectType.BASE,
          type: EMiscIcon.FULFILL_SECTOR_RED,
          value: 1,
        },
      ],
      rewards: [],
    };

    const ok = checkQuickMissionCondition(
      branch,
      { id: 'p1' } as never,
      {
        sectors: [
          { color: ESector.RED, sectorWinners: ['p1'] },
          { color: ESector.BLUE, sectorWinners: [] },
        ],
      } as never,
    );

    expect(ok).toBe(true);
  });
});
