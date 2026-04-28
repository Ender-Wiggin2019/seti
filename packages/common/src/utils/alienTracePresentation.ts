import { EEffectType, type IBaseEffect } from '@seti/common/types/effect';
import {
  EAlienIcon,
  EMiscIcon,
  EResource,
  ETrace,
  type TIcon,
} from '@seti/common/types/element';
import type {
  IPublicTraceSlot,
  TPublicSlotReward,
} from '@seti/common/types/protocol/gameState';

export type TTraceColumnColor = ETrace.RED | ETrace.YELLOW | ETrace.BLUE;

export const TRACE_COLUMN_COLORS: readonly TTraceColumnColor[] = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
];

export interface ITraceRewardIconPresentation {
  kind: 'icon';
  token: string;
  label: string;
  effect: IBaseEffect;
}

export interface ITraceRewardTextPresentation {
  kind: 'text';
  token: string;
  label: string;
  text: string;
}

export type TTraceRewardPresentation =
  | ITraceRewardIconPresentation
  | ITraceRewardTextPresentation;

const REWARD_ICON_BY_TYPE: Record<
  Exclude<TPublicSlotReward['type'], 'CUSTOM' | 'VP'>,
  TIcon
> = {
  PUBLICITY: EResource.PUBLICITY,
  CREDIT: EResource.CREDIT,
  ENERGY: EResource.ENERGY,
  DATA: EResource.DATA,
  CARD: EResource.CARD,
};

const CUSTOM_REWARD_PRESENTATION: Record<
  string,
  { icon: TIcon; label: string; amount?: number }
> = {
  DRAW_ALIEN_CARD: {
    icon: EMiscIcon.DRAW_ALIEN_CARD,
    label: 'Draw alien card',
  },
  GAIN_EXOFOSSIL: {
    icon: EAlienIcon.EXOFOSSIL,
    label: 'Gain exofossil',
  },
};

export function getTraceColumnColor(
  traceColor: ETrace,
): TTraceColumnColor | null {
  return isTraceColumnColor(traceColor) ? traceColor : null;
}

export function groupTraceSlotsByColor<TSlot extends IPublicTraceSlot>(
  slots: readonly TSlot[],
): Record<TTraceColumnColor, TSlot[]> {
  const grouped = createEmptyTraceColumnRecord<TSlot>();
  for (const slot of slots) {
    const columnColor = getTraceColumnColor(slot.traceColor);
    if (!columnColor) continue;
    grouped[columnColor].push(slot);
  }
  return grouped;
}

export function toTraceRewardPresentations(
  rewards: readonly TPublicSlotReward[],
): TTraceRewardPresentation[] {
  return rewards.map((reward) => toTraceRewardPresentation(reward));
}

export function toTraceRewardPresentation(
  reward: TPublicSlotReward,
): TTraceRewardPresentation {
  if (reward.type === 'VP') {
    return createIconPresentation(
      EResource.SCORE,
      reward.amount,
      `${reward.amount} VP`,
    );
  }

  if (reward.type === 'CUSTOM') {
    const custom = CUSTOM_REWARD_PRESENTATION[reward.effectId];
    if (!custom) {
      return {
        kind: 'text',
        token: `{${reward.effectId}}`,
        label: reward.effectId,
        text: reward.effectId,
      };
    }
    const amount = custom.amount ?? 1;
    return createIconPresentation(custom.icon, amount, custom.label);
  }

  return createIconPresentation(
    REWARD_ICON_BY_TYPE[reward.type],
    reward.amount,
    `${reward.amount} ${reward.type.toLowerCase()}`,
  );
}

function createIconPresentation(
  type: TIcon,
  value: number,
  label: string,
): ITraceRewardIconPresentation {
  return {
    kind: 'icon',
    token: `{${type}-${value}}`,
    label,
    effect: {
      effectType: EEffectType.BASE,
      type,
      value,
    },
  };
}

function createEmptyTraceColumnRecord<TSlot>(): Record<
  TTraceColumnColor,
  TSlot[]
> {
  return {
    [ETrace.RED]: [],
    [ETrace.YELLOW]: [],
    [ETrace.BLUE]: [],
  };
}

function isTraceColumnColor(
  traceColor: ETrace,
): traceColor is TTraceColumnColor {
  return TRACE_COLUMN_COLORS.includes(traceColor as TTraceColumnColor);
}
