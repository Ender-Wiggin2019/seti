import BaseCard from '@/types/BaseCard';
import { EEffectType, Effect } from '@/types/effect';

export const filterText = (
  _text: string,
  cards: BaseCard[],
  t: (text: string) => string
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
      effectsHasText(card.effects, text, t)
  );
};
const effectsHasText = (
  effects: Effect[] | undefined,
  text: string,
  t: (text: string) => string
) => {
  if (!effects) return false;
  const effectsStr = JSON.stringify(serializeEffects(effects, t));
  if (effectsStr.includes(text)) {
    return true;
  }
  return false;
};

const serializeEffects = (
  effects: Effect | Effect[],
  t: (text: string) => string
) => {
  if (Array.isArray(effects)) {
    return effects.map((effect) => serializeEffect(effect, t));
  } else {
    return [serializeEffect(effects, t)];
  }
};

const serializeEffect = (effect: Effect, t: (text: string) => string) => {
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
  } else if (effect.effectType === EEffectType.OR) {
    effectObj.effects = serializeEffects(effect.effects, t);
  }
  return effectObj;
};
