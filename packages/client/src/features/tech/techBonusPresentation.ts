import { ETechBonusType, type ITechBonusToken } from '@seti/common/types/tech';

export interface ITechBonusPresentation {
  src?: string;
  label: string;
  shortLabel: string;
  /**
   * i18n key (under namespace `common`) for the localized label.
   * The `label` field is the English fallback used as `defaultValue`.
   */
  labelKey?: string;
}

const TECH_BONUS_META: Partial<Record<ETechBonusType, ITechBonusPresentation>> =
  {
    [ETechBonusType.ENERGY]: {
      src: '/assets/seti/tech/bonuses/tech1.png',
      label: 'Energy bonus',
      labelKey: 'client.tech_bonus.energy',
      shortLabel: '+E',
    },
    [ETechBonusType.DATA]: {
      src: '/assets/seti/tech/bonuses/data.png',
      label: 'Data bonus',
      labelKey: 'client.tech_bonus.data',
      shortLabel: '+D',
    },
    [ETechBonusType.PUBLICITY]: {
      src: '/assets/seti/tech/bonuses/tech3.png',
      label: 'Publicity bonus',
      labelKey: 'client.tech_bonus.publicity',
      shortLabel: '+P',
    },
    [ETechBonusType.CARD]: {
      src: '/assets/seti/tech/bonuses/tech4.png',
      label: 'Card bonus',
      labelKey: 'client.tech_bonus.card',
      shortLabel: '+C',
    },
    [ETechBonusType.VP_3]: {
      src: '/assets/seti/tech/bonuses/tech6.png',
      label: '3 VP bonus',
      labelKey: 'client.tech_bonus.vp_3',
      shortLabel: '+3',
    },
    [ETechBonusType.LAUNCH_IGNORE_LIMIT]: {
      src: '/assets/seti/tech/bonuses/launch.png',
      label: 'Launch action bonus',
      labelKey: 'client.tech_bonus.launch',
      shortLabel: 'L',
    },
    [ETechBonusType.DATA_2]: {
      src: '/assets/seti/tech/bonuses/data.png',
      label: '2 data bonus',
      labelKey: 'client.tech_bonus.data_2',
      shortLabel: '+2D',
    },
    [ETechBonusType.CREDIT]: {
      label: 'Credit bonus',
      labelKey: 'client.tech_bonus.credit',
      shortLabel: '+$',
    },
    [ETechBonusType.VP_2]: {
      label: '2 VP bonus',
      labelKey: 'client.tech_bonus.vp_2',
      shortLabel: '+2',
    },
  };

export function getTechBonusPresentation(
  bonus: ITechBonusToken,
): ITechBonusPresentation {
  return (
    TECH_BONUS_META[bonus.type] ?? {
      label: `${bonus.type} bonus`,
      labelKey: 'client.tech_bonus.generic',
      shortLabel: bonus.type,
    }
  );
}
