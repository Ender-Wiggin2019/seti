import { ETrace } from '@seti/common/types/element';

/**
 * Centaurian message cards have a delayed "green" effect that
 * resolves once the player reaches the +15 milestone tile they
 * placed when sending the message. This lookup surfaces a
 * "→ pink trace" hint next to each pending token in the
 * messages panel.
 *
 * The shape is data-only — no behaviour.
 */
export type TCentaurianDelayedMessageEffect =
  | { type: 'income' }
  | { type: 'trace'; trace: ETrace }
  | { type: 'credit-and-trace'; trace: ETrace.ANY };

const CENTAURIAN_DELAYED_EFFECTS: Record<
  string,
  TCentaurianDelayedMessageEffect
> = {
  'ET.31': { type: 'income' },
  'ET.32': { type: 'income' },
  'ET.33': { type: 'income' },
  'ET.34': { type: 'trace', trace: ETrace.PINK },
  'ET.35': { type: 'trace', trace: ETrace.YELLOW },
  'ET.36': { type: 'trace', trace: ETrace.BLUE },
  'ET.37': { type: 'credit-and-trace', trace: ETrace.ANY },
  'ET.38': { type: 'income' },
  'ET.39': { type: 'income' },
  'ET.40': { type: 'income' },
};

export function getCentaurianMessageDelayedEffect(
  cardId: string,
): TCentaurianDelayedMessageEffect | undefined {
  return CENTAURIAN_DELAYED_EFFECTS[cardId];
}
