import { ETech } from '@seti/common/types/element';
import type { IBehavior } from '../cards/Behavior.js';

// Re-export the delayed-effect lookup for server callers. Keeps the
// existing import path stable while the data lives in common (where
// the client's messages panel can also reach it).
export {
  getCentaurianMessageDelayedEffect,
  type TCentaurianDelayedMessageEffect,
} from '@seti/common/utils/centaurianMessageDelayedEffects';

const CENTAURIAN_IMMEDIATE_BEHAVIORS: Record<string, IBehavior> = {
  'ET.31': { launchProbe: true },
  'ET.32': { gainResources: { data: 2 } },
  'ET.33': { gainResources: { publicity: 1, credits: 1 } },
  'ET.34': { drawCards: 1 },
  'ET.35': { gainResources: { data: 1 } },
  'ET.36': { gainResources: { publicity: 2 } },
  'ET.37': { drawCards: 1 },
  'ET.38': { rotateSolarSystem: true, researchTech: ETech.COMPUTER },
  'ET.39': { rotateSolarSystem: true, researchTech: ETech.SCAN },
  'ET.40': { markAnySignal: 2 },
};

export function getCentaurianMessageImmediateBehavior(
  cardId: string,
): IBehavior {
  return CENTAURIAN_IMMEDIATE_BEHAVIORS[cardId] ?? {};
}
