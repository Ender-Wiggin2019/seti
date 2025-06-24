import { ICorp, IModel } from '@/types/corp';
import { EEffectType, Effect, IBaseEffect } from '@/types/effect';
import {
  EMiscIcon,
  EResource,
  EScanAction,
  ESpecialAction,
  ETech,
  TIcon,
} from '@/types/element';

const EFFECT_VALUE_MAP: Record<TIcon, number> = {
  [EScanAction.RED]: 1,
  [EScanAction.YELLOW]: 1,
  [EScanAction.BLUE]: 1,
  [EScanAction.BLACK]: 1,
  [EScanAction.ANY]: 1,
  [EScanAction.DISPLAY_CARD]: 1,
  [EScanAction.DISCARD_CARD]: 0.5,
  [EResource.CREDIT]: 1,
  [EResource.ENERGY]: 1,
  [EResource.DATA]: 0.5,
  [EResource.PUBLICITY]: 0.5,
  [EResource.SCORE]: 0.2,
  [EResource.CARD]: 0.75,
  [EResource.CARD_ANY]: 1,
  [EResource.MOVE]: 0.7,
  [ETech.ANY]: 3,
  [ETech.PROBE]: 3,
  [ETech.SCAN]: 3,
  [ETech.COMPUTER]: 3,
  [ESpecialAction.LAUNCH]: 2,
  [ESpecialAction.ORBIT]: 2,
  [ESpecialAction.LAND]: 2,
  [ESpecialAction.SCAN]: 3,
  [ESpecialAction.COMPUTER]: 1,
  // [EMiscIcon.INCOME]: 3.5, //
} as Record<TIcon, number>;

export const getValueFromEffect = (effect: Effect) => {
  if (effect.effectType !== EEffectType.BASE) {
    return 0;
  }
  return (EFFECT_VALUE_MAP[effect.type as TIcon] || 0) * (effect.value || 1);
};

export const getValuesFromEffects = (effects: Effect[]) => {
  return effects.reduce((acc, effect) => {
    return acc + getValueFromEffect(effect);
  }, 0);
};

export const getModel = (corp: ICorp, round: number): IModel => {
  const {
    startResources,
    income,
    effectTriggerTimes,
    effectUnitValue,
    modifyValue,
    freeActionUnitValue,
  } = corp;
  const initIncome = startResources?.find(
    (effect) =>
      effect.effectType === EEffectType.BASE && effect.type === EMiscIcon.INCOME
  ) as IBaseEffect;
  const initIncomeValue = initIncome?.value || 0;
  const initResources =
    getValuesFromEffects(startResources) + initIncomeValue * 0.5;
  const incomeValue =
    (getValuesFromEffects(income || []) + initIncomeValue) * (round - 1);
  const freeActionValue = (freeActionUnitValue || 0) * round;
  const effectTotalValue = effectTriggerTimes * effectUnitValue;
  return {
    initResources,
    effectTriggerTimes,
    effectUnitValue,
    modifyValue,
    effectTotalValue,
    incomeValue,
    freeActionValue,
    totalValue:
      initResources +
      incomeValue +
      freeActionValue +
      effectTotalValue +
      (modifyValue || 0),
  };
};
