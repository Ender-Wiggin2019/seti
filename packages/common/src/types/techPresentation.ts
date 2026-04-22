import { ETech } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';

export interface ITechPresentation {
  techId: ETechId;
  category: ETech.PROBE | ETech.SCAN | ETech.COMPUTER;
  i18nKey: string;
  fallback: string;
}

export const TECH_PRESENTATION_BY_ID: Record<ETechId, ITechPresentation> = {
  [ETechId.PROBE_DOUBLE_PROBE]: {
    techId: ETechId.PROBE_DOUBLE_PROBE,
    category: ETech.PROBE,
    i18nKey: 'client.tech_row.launch.double_probe',
    fallback: 'Launch +1',
  },
  [ETechId.PROBE_ASTEROID]: {
    techId: ETechId.PROBE_ASTEROID,
    category: ETech.PROBE,
    i18nKey: 'client.tech_row.launch.asteroid',
    fallback: 'Asteroid +★',
  },
  [ETechId.PROBE_ROVER_DISCOUNT]: {
    techId: ETechId.PROBE_ROVER_DISCOUNT,
    category: ETech.PROBE,
    i18nKey: 'client.tech_row.launch.land_discount',
    fallback: 'Land −1⚡',
  },
  [ETechId.PROBE_MOON]: {
    techId: ETechId.PROBE_MOON,
    category: ETech.PROBE,
    i18nKey: 'client.tech_row.launch.moon',
    fallback: 'Moon Landing',
  },
  [ETechId.SCAN_EARTH_LOOK]: {
    techId: ETechId.SCAN_EARTH_LOOK,
    category: ETech.SCAN,
    i18nKey: 'client.tech_row.scan.earth',
    fallback: 'Earth (or adj.)',
  },
  [ETechId.SCAN_POP_SIGNAL]: {
    techId: ETechId.SCAN_POP_SIGNAL,
    category: ETech.SCAN,
    i18nKey: 'client.tech_row.scan.mercury',
    fallback: 'Mercury (−★)',
  },
  [ETechId.SCAN_HAND_SIGNAL]: {
    techId: ETechId.SCAN_HAND_SIGNAL,
    category: ETech.SCAN,
    i18nKey: 'client.tech_row.scan.discard_card',
    fallback: 'Discard Card',
  },
  [ETechId.SCAN_ENERGY_LAUNCH]: {
    techId: ETechId.SCAN_ENERGY_LAUNCH,
    category: ETech.SCAN,
    i18nKey: 'client.tech_row.scan.energy_launch',
    fallback: 'Move / Launch (⚡)',
  },
  [ETechId.COMPUTER_VP_CREDIT]: {
    techId: ETechId.COMPUTER_VP_CREDIT,
    category: ETech.COMPUTER,
    i18nKey: 'client.tech_display.types.computer',
    fallback: 'Computer',
  },
  [ETechId.COMPUTER_VP_ENERGY]: {
    techId: ETechId.COMPUTER_VP_ENERGY,
    category: ETech.COMPUTER,
    i18nKey: 'client.tech_display.types.computer',
    fallback: 'Computer',
  },
  [ETechId.COMPUTER_VP_CARD]: {
    techId: ETechId.COMPUTER_VP_CARD,
    category: ETech.COMPUTER,
    i18nKey: 'client.tech_display.types.computer',
    fallback: 'Computer',
  },
  [ETechId.COMPUTER_VP_PUBLICITY]: {
    techId: ETechId.COMPUTER_VP_PUBLICITY,
    category: ETech.COMPUTER,
    i18nKey: 'client.tech_display.types.computer',
    fallback: 'Computer',
  },
};

/**
 * Canonical text order used for labels and selectors.
 *
 * Launch: double_probe -> asteroid -> land_discount -> moon
 * Scan: earth -> card_row -> mercury -> discard_card -> energy_launch
 */
export const TECH_IDS_BY_CATEGORY_TEXT_ORDER: Readonly<
  Record<ETech.PROBE | ETech.SCAN | ETech.COMPUTER, readonly ETechId[]>
> = {
  [ETech.PROBE]: [
    ETechId.PROBE_DOUBLE_PROBE,
    ETechId.PROBE_ASTEROID,
    ETechId.PROBE_ROVER_DISCOUNT,
    ETechId.PROBE_MOON,
  ],
  [ETech.SCAN]: [
    ETechId.SCAN_EARTH_LOOK,
    ETechId.SCAN_POP_SIGNAL,
    ETechId.SCAN_HAND_SIGNAL,
    ETechId.SCAN_ENERGY_LAUNCH,
  ],
  [ETech.COMPUTER]: [
    ETechId.COMPUTER_VP_CREDIT,
    ETechId.COMPUTER_VP_ENERGY,
    ETechId.COMPUTER_VP_CARD,
    ETechId.COMPUTER_VP_PUBLICITY,
  ],
};

export function getTechPresentation(techId: ETechId): ITechPresentation {
  return TECH_PRESENTATION_BY_ID[techId];
}
