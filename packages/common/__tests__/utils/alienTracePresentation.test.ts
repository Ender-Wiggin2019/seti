import { EEffectType } from '@seti/common/types/effect';
import { EMiscIcon, EResource, ETrace } from '@seti/common/types/element';
import type {
  IPublicTraceSlot,
  TPublicSlotReward,
} from '@seti/common/types/protocol/gameState';
import {
  groupTraceSlotsByColor,
  TRACE_COLUMN_COLORS,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { describe, expect, it } from 'vitest';

function slot(slotId: string, traceColor: ETrace): IPublicTraceSlot {
  return {
    slotId,
    traceColor,
    occupants: [],
    maxOccupants: 1,
    rewards: [],
    isDiscovery: false,
  };
}

describe('alien trace presentation', () => {
  it('maps trace rewards to shared icon tokens and effects', () => {
    const rewards: TPublicSlotReward[] = [
      { type: 'VP', amount: 5 },
      { type: 'PUBLICITY', amount: 1 },
    ];

    expect(toTraceRewardPresentations(rewards)).toEqual([
      {
        kind: 'icon',
        token: '{score-5}',
        label: '5 VP',
        effect: {
          effectType: EEffectType.BASE,
          type: EResource.SCORE,
          value: 5,
        },
      },
      {
        kind: 'icon',
        token: '{publicity-1}',
        label: '1 publicity',
        effect: {
          effectType: EEffectType.BASE,
          type: EResource.PUBLICITY,
          value: 1,
        },
      },
    ]);
  });

  it('maps alien custom rewards to renderable icon data when possible', () => {
    expect(
      toTraceRewardPresentations([
        { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
      ]),
    ).toEqual([
      {
        kind: 'icon',
        token: '{draw-alien-card-1}',
        label: 'Draw alien card',
        effect: {
          effectType: EEffectType.BASE,
          type: EMiscIcon.DRAW_ALIEN_CARD,
          value: 1,
        },
      },
    ]);
  });

  it('groups trace slots into stable red, yellow, and blue columns', () => {
    const grouped = groupTraceSlotsByColor([
      slot('blue-a', ETrace.BLUE),
      slot('red-a', ETrace.RED),
      slot('red-b', ETrace.RED),
    ]);

    expect(TRACE_COLUMN_COLORS).toEqual([
      ETrace.RED,
      ETrace.YELLOW,
      ETrace.BLUE,
    ]);
    expect(grouped[ETrace.RED].map((s) => s.slotId)).toEqual([
      'red-a',
      'red-b',
    ]);
    expect(grouped[ETrace.YELLOW]).toEqual([]);
    expect(grouped[ETrace.BLUE].map((s) => s.slotId)).toEqual(['blue-a']);
  });
});
