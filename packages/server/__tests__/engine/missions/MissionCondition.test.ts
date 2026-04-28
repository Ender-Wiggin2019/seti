import { EEffectType } from '@seti/common/types/effect';
import {
  EMiscIcon,
  EResource,
  ESector,
  ESpecialAction,
} from '@seti/common/types/element';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { OumuamuaAlienBoard } from '@/engine/alien/AlienBoard.js';
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

  it('supports oumuamua exofossil requirement custom desc', () => {
    const branch: IMissionBranchDef = {
      req: [
        {
          effectType: EEffectType.CUSTOMIZED,
          id: 'et-23-req',
          desc: 'desc.et-23-req',
        },
      ],
      rewards: [],
    };

    expect(
      checkQuickMissionCondition(
        branch,
        { exofossils: 2 } as never,
        {} as never,
      ),
    ).toBe(false);
    expect(
      checkQuickMissionCondition(
        branch,
        { exofossils: 3 } as never,
        {} as never,
      ),
    ).toBe(true);
  });

  it('parses oumuamua in planet mission descriptions', () => {
    const branch: IMissionBranchDef = {
      req: [
        {
          effectType: EEffectType.BASE,
          type: EMiscIcon.LAND_COUNT,
          value: 1,
          desc: 'Land on Oumuamua',
        },
      ],
      rewards: [],
    };

    const ok = checkQuickMissionCondition(
      branch,
      { id: 'p1' } as never,
      {
        planetaryBoard: {
          planets: new Map([
            [
              EPlanet.OUMUAMUA,
              {
                orbitSlots: [],
                landingSlots: [{ playerId: 'p1' }],
                moonOccupant: null,
              },
            ],
          ]),
        },
      } as never,
    );

    expect(ok).toBe(true);
  });

  it('supports desc.et-21-req: marked paid oumuamua trace', () => {
    const branch: IMissionBranchDef = {
      req: [
        {
          effectType: EEffectType.CUSTOMIZED,
          id: 'et-21-req',
          desc: 'desc.et-21-req',
        },
      ],
      rewards: [],
    };

    const ok = checkQuickMissionCondition(
      branch,
      { id: 'p1' } as never,
      {
        alienState: {
          getBoardByType: () => ({
            slots: [
              {
                slotId: 'alien-0-oumuamua-trace|red-trace|1|4',
                occupants: [{ source: { playerId: 'p1' } }],
              },
            ],
          }),
        },
      } as never,
    );

    expect(ok).toBe(true);
  });

  it('supports desc.et-22-req and desc.et-27-req custom quick conditions', () => {
    const et22: IMissionBranchDef = {
      req: [
        {
          effectType: EEffectType.CUSTOMIZED,
          id: 'et-22-req',
          desc: 'desc.et-22-req',
        },
      ],
      rewards: [],
    };
    const et27: IMissionBranchDef = {
      req: [
        {
          effectType: EEffectType.CUSTOMIZED,
          id: 'et-27-req',
          desc: 'desc.et-27-req',
        },
      ],
      rewards: [],
    };

    const game = {
      planetaryBoard: {
        planets: new Map([
          [
            EPlanet.OUMUAMUA,
            {
              landingSlots: [{ playerId: 'p1' }],
              orbitSlots: [],
              moonOccupant: null,
            },
          ],
        ]),
      },
      alienState: {
        getBoardByType: () =>
          new OumuamuaAlienBoard({
            alienType: EAlienType.OUMUAMUA,
            alienIndex: 0,
            oumuamuaTile: {
              spaceId: 'ring-3-cell-0',
              sectorId: 's0',
              dataRemaining: 2,
              markerPlayerIds: ['p1'],
            },
          }),
      },
    };

    expect(
      checkQuickMissionCondition(et22, { id: 'p1' } as never, game as never),
    ).toBe(true);
    expect(
      checkQuickMissionCondition(et27, { id: 'p1' } as never, game as never),
    ).toBe(true);
  });
});
