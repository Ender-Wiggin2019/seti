/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-07 23:02:36
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-25 18:57:29
 * @Description:
 */
import { IBaseCard } from '@/types/BaseCard';
import { EEffectType, Effect } from '@/types/effect';

export const filterText = (
  _text: string,
  cards: IBaseCard[],
  t: (text: string) => string,
) => {
  const text = _text.toLowerCase().trim();
  if (!text) return cards;
  return cards.filter(
    (card) =>
      card.id.toLowerCase().includes(text) ||
      t(card.name).toLowerCase().includes(text) ||
      card.description?.toLowerCase().includes(text) ||
      t(card.flavorText || '')
        ?.toLowerCase()
        .includes(text) ||
      effectsHasText(card.effects, text, t),
  );
};
const effectsHasText = (
  effects: Effect[] | undefined,
  text: string,
  t: (text: string) => string,
) => {
  if (!effects) return false;
  // const effectsStr = JSON.stringify(serializeEffects(effects, t)).toLowerCase();
  const effectsStr = effects2String(effects, t).toLowerCase();
  if (effectsStr.includes(text)) {
    return true;
  }
  return false;
};

const serializeEffects = (
  effects: Effect | Effect[],
  t: (text: string) => string,
) => {
  if (Array.isArray(effects)) {
    return effects.map((effect) => serializeEffect(effect, t));
  } else {
    return [serializeEffect(effects, t)];
  }
};

const serializeEffect = (effect: Effect, t: (text: string) => string) => {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  const effectObj: any = {};
  if (
    effect.effectType === EEffectType.BASE ||
    effect.effectType === EEffectType.CUSTOMIZED
  ) {
    effectObj.type = effect.type || '';
    effectObj.helperText = t(effect?.helperText || '');
    effectObj.desc = t(effect?.desc || '');
  } else if (
    effect.effectType === EEffectType.MISSION_QUICK ||
    effect.effectType === EEffectType.MISSION_FULL
  ) {
    effectObj.mission = effect.missions.map((mission) => {
      return {
        req: serializeEffects(mission.req, t),
        reward: serializeEffects(mission.reward, t),
      };
    });
    effectObj.desc = t(effect.desc || '');
  } else if (effect.effectType === EEffectType.OR) {
    effectObj.effects = serializeEffects(effect.effects, t);
  }
  return effectObj;
};

const effects2String = (
  effects: Effect | Effect[],
  t: (text: string) => string,
): string => {
  if (Array.isArray(effects)) {
    const arr = effects.map((effect) => effect2String(effect, t));
    return arr.join(' ');
  } else {
    return effect2String(effects, t);
  }
};

const effect2String = (effect: Effect, t: (text: string) => string): string => {
  let effectArray = [];
  if (
    effect.effectType === EEffectType.BASE ||
    effect.effectType === EEffectType.CUSTOMIZED
  ) {
    effectArray.push(effect.type || '');
    effectArray.push(t(effect?.helperText || ''));
    effectArray.push(t(effect?.desc || ''));
  } else if (
    effect.effectType === EEffectType.MISSION_QUICK ||
    effect.effectType === EEffectType.MISSION_FULL
  ) {
    effect.missions.forEach((mission) => {
      effectArray.push(effects2String(mission.req, t));
      effectArray.push(effects2String(mission.reward, t));
    });
    effectArray.push(t(effect.desc || ''));
  } else if (effect.effectType === EEffectType.OR) {
    effectArray.push(effects2String(effect.effects, t));
  }
  return effectArray.join(' ');
};
