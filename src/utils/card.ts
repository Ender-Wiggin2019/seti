/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-29 11:57:13
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-20 00:30:51
 * @Description:
 */

import { alienCards } from '@/data/alienCards';
import baseCards from '@/data/baseCards';

import { sortCards } from '@/utils/sort';

import { IBaseCard } from '@/types/BaseCard';
import { EEffectType, Effect } from '@/types/effect';
import {
  CardTypeEffectMap,
  ECardType,
  EScanAction,
  ETech,
  ETrace,
  TIcon,
} from '@/types/element';

export const getAllCardIds = () => {
  return [...baseCards, ...alienCards].map((card) => card.id);
};

export const getCardById = (id: string) => {
  return [...baseCards, ...alienCards].find((card) => card.id === id);
};

export const getCardsById = (ids: string[], sort?: boolean) => {
  const res = [...baseCards, ...alienCards].filter((card) =>
    ids.includes(card.id)
  );
  return sort ? sortCards(res) : res;
};

// NOTE: a special function to filter cards by front end icons
// It will have some hard code logic for display
export const filterCardsByIcons = (cards: IBaseCard[], icons: TIcon[]) => {
  const res: IBaseCard[] = [];
  for (const card of cards) {
    if (!card.effects) continue;

    if (isEffectsIncludeIcons(card.effects, icons)) {
      res.push(card);
    }
  }

  return res;
};

export const filterCardsByEffectTypes = (
  cards: IBaseCard[],
  effectTypes: EEffectType[]
) => {
  const res: IBaseCard[] = [];
  for (const card of cards) {
    if (!card.effects) continue;

    if (effectTypes.some((type) => isEffectsHasType(card.effects, type))) {
      res.push(card);
    }
  }
  console.log('🎸 [test] - filterCardsByEffectTypes - res:', res);

  return res;
};

/**
 * check if the effects include the icons
 * @param effects
 * @param icons
 * @returns
 */
export const isEffectsIncludeIcons = (
  effects: Effect[],
  icons: TIcon[]
): boolean => {
  for (const effect of effects) {
    if (effect.effectType === EEffectType.OR) {
      return isEffectsIncludeIcons(effect.effects, icons);
    }
    if (
      effect.effectType === EEffectType.BASE ||
      effect.effectType === EEffectType.CUSTOMIZED
    ) {
      if (!effect.type) continue;

      const isAnyTrace = [
        ETrace.ANY,
        ETrace.BLUE,
        ETrace.RED,
        ETrace.YELLOW,
      ].includes(effect.type as ETrace);

      const isAnyTech = [
        ETech.ANY,
        ETech.COMPUTER,
        ETech.PROBE,
        ETech.SCAN,
      ].includes(effect.type as ETech);

      const isAnyScan = [
        EScanAction.ANY,
        EScanAction.BLACK,
        EScanAction.BLUE,
        EScanAction.DISCARD_CARD,
        EScanAction.DISPLAY_CARD,
        EScanAction.RED,
        EScanAction.YELLOW,
      ].includes(effect.type as EScanAction);

      if (isAnyTrace && icons.includes(ETrace.ANY)) {
        return true;
      }

      if (isAnyScan && icons.includes(EScanAction.ANY)) {
        return true;
      }

      if (isAnyTech && icons.includes(ETech.ANY)) {
        return true;
      }

      if (icons.includes(effect.type as TIcon)) {
        return true;
      }
    }
  }

  return false;
};

export const isEffectsHasType = (
  effects: Effect[],
  type: EEffectType
): boolean => {
  for (const effect of effects) {
    if (effect.effectType === EEffectType.OR) {
      return isEffectsHasType(effect.effects, type);
    }
    if (effect.effectType === type) return true;
  }

  return false;
};

export const filterCardsByCardTypes = (
  cards: IBaseCard[],
  cardTypes: ECardType[]
) => {
  const effectTypes = cardTypes.reduce((prev: EEffectType[], curr) => {
    return [...prev, ...CardTypeEffectMap[curr]];
  }, []);

  return filterCardsByEffectTypes(cards, effectTypes);
};
