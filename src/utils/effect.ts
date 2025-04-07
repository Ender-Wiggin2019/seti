/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 11:12:08
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-08 00:13:55
 * @Description:
 */
import { e } from '@/constant/effect';

import { IFreeAction } from '@/types/BaseCard';
import {
  EEffectType,
  Effect,
  IBaseEffect,
  ICustomizedEffect,
  IEndGameEffect,
  IMissionEffect,
} from '@/types/effect';
import { EResource, TIcon } from '@/types/element';

export const updateEffectArray = (
  prevEffects: Effect[],
  newEffect: Effect,
  action?: 'del'
): Effect[] => {
  // base, add value
  if (newEffect.effectType === EEffectType.BASE) {
    const existingEffectIndex = prevEffects.findIndex(
      (e) => e.effectType === EEffectType.BASE && e.type === newEffect.type
    );

    if (existingEffectIndex !== -1) {
      return prevEffects.map((e, index) =>
        index === existingEffectIndex
          ? { ...e, value: ((e as IBaseEffect).value || 1) + 1 }
          : e
      );
    }
  }

  // desc, override desc
  if (newEffect.effectType === EEffectType.CUSTOMIZED) {
    if (action === 'del') {
      return prevEffects.filter(
        (e) => (e as ICustomizedEffect)?.id !== newEffect.id
      );
    }
    const existingEffectIndex = prevEffects.findIndex(
      (e) => e.effectType === EEffectType.CUSTOMIZED && e.id === newEffect.id
    );

    if (existingEffectIndex !== -1) {
      return prevEffects.map((e, index) =>
        index === existingEffectIndex ? { ...e, desc: newEffect.desc } : e
      );
    }
  }

  return [...prevEffects, newEffect];
};

export const updateSpecialEffectArray = (
  prevEffects: Effect[],
  newEffect: IMissionEffect | IEndGameEffect,
  effectType: EEffectType
): Effect[] => {
  // base, add value
  const idx = prevEffects.findIndex((e) => e.effectType === effectType);
  if (idx < 0) {
    return [...prevEffects, newEffect];
  }

  return prevEffects.map((e, i) => (i === idx ? newEffect : e));
};

export const getEffectByIconType = (icon: TIcon) => {
  const fn = Object.values(e).find((effectFn) => {
    const effect = effectFn();
    if (effect.type === icon) {
      return true;
    }
  });

  return fn?.();
};
export const freeAction2Effect = (freeAction: IFreeAction): IBaseEffect => {
  const { type, value } = freeAction;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const effect = getEffectByIconType(type)!;
  return {
    ...effect,
    value,
    size: 'xs',
  };
};

export const freeActions2Effects = (
  freeAction: IFreeAction[]
): IBaseEffect[] => {
  return freeAction.map((a) => freeAction2Effect(a));
};

export const effects2FreeAction = (effects: Effect[]): IFreeAction[] => {
  return effects.map((e) => ({
    type: (e as IBaseEffect)?.type as EResource, // FIXME: update free action type
    value: (e as IBaseEffect)?.value || 1,
  }));
};
