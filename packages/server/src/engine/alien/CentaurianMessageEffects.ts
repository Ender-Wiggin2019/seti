import { ETech, ETrace } from '@seti/common/types/element';
import type { IBehavior } from '../cards/Behavior.js';

export type TCentaurianDelayedMessageEffect =
  | { type: 'income' }
  | { type: 'trace'; trace: ETrace }
  | { type: 'credit-and-trace'; trace: ETrace.ANY };

interface ICentaurianMessageEffectConfig {
  immediate: IBehavior;
  delayed: TCentaurianDelayedMessageEffect;
}

const CENTAURIAN_MESSAGE_EFFECTS: Record<
  string,
  ICentaurianMessageEffectConfig
> = {
  'ET.31': {
    immediate: { launchProbe: true },
    delayed: { type: 'income' },
  },
  'ET.32': {
    immediate: { gainResources: { data: 2 } },
    delayed: { type: 'income' },
  },
  'ET.33': {
    immediate: { gainResources: { publicity: 1, credits: 1 } },
    delayed: { type: 'income' },
  },
  'ET.34': {
    immediate: { drawCards: 1 },
    delayed: { type: 'trace', trace: ETrace.RED },
  },
  'ET.35': {
    immediate: { gainResources: { data: 1 } },
    delayed: { type: 'trace', trace: ETrace.YELLOW },
  },
  'ET.36': {
    immediate: { gainResources: { publicity: 2 } },
    delayed: { type: 'trace', trace: ETrace.BLUE },
  },
  'ET.37': {
    immediate: { drawCards: 1 },
    delayed: { type: 'credit-and-trace', trace: ETrace.ANY },
  },
  'ET.38': {
    immediate: { rotateSolarSystem: true, researchTech: ETech.COMPUTER },
    delayed: { type: 'income' },
  },
  'ET.39': {
    immediate: { rotateSolarSystem: true, researchTech: ETech.SCAN },
    delayed: { type: 'income' },
  },
  'ET.40': {
    immediate: { markAnySignal: 2 },
    delayed: { type: 'income' },
  },
};

export function getCentaurianMessageImmediateBehavior(
  cardId: string,
): IBehavior {
  return CENTAURIAN_MESSAGE_EFFECTS[cardId]?.immediate ?? {};
}

export function getCentaurianMessageDelayedEffect(
  cardId: string,
): TCentaurianDelayedMessageEffect | undefined {
  return CENTAURIAN_MESSAGE_EFFECTS[cardId]?.delayed;
}
