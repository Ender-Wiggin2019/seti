import { ETechBonusType, type ITechBonusToken } from '@seti/common/types/tech';

export interface ITechBonusPresentation {
  src?: string;
  label: string;
  shortLabel: string;
}

const TECH_BONUS_META: Partial<Record<ETechBonusType, ITechBonusPresentation>> =
  {
    [ETechBonusType.ENERGY]: {
      src: '/assets/seti/tech/bonuses/tech1.png',
      label: 'Energy bonus',
      shortLabel: '+E',
    },
    [ETechBonusType.DATA]: {
      src: '/assets/seti/tech/bonuses/data.png',
      label: 'Data bonus',
      shortLabel: '+D',
    },
    [ETechBonusType.PUBLICITY]: {
      src: '/assets/seti/tech/bonuses/tech3.png',
      label: 'Publicity bonus',
      shortLabel: '+P',
    },
    [ETechBonusType.CARD]: {
      src: '/assets/seti/tech/bonuses/tech4.png',
      label: 'Card bonus',
      shortLabel: '+C',
    },
    [ETechBonusType.VP_3]: {
      src: '/assets/seti/tech/bonuses/tech6.png',
      label: '3 VP bonus',
      shortLabel: '+3',
    },
    [ETechBonusType.LAUNCH_IGNORE_LIMIT]: {
      src: '/assets/seti/tech/bonuses/launch.png',
      label: 'Launch action bonus',
      shortLabel: 'L',
    },
    [ETechBonusType.DATA_2]: {
      src: '/assets/seti/tech/bonuses/data.png',
      label: '2 data bonus',
      shortLabel: '+2D',
    },
    [ETechBonusType.CREDIT]: {
      label: 'Credit bonus',
      shortLabel: '+$',
    },
    [ETechBonusType.VP_2]: {
      label: '2 VP bonus',
      shortLabel: '+2',
    },
  };

export function getTechBonusPresentation(
  bonus: ITechBonusToken,
): ITechBonusPresentation {
  return (
    TECH_BONUS_META[bonus.type] ?? {
      label: `${bonus.type} bonus`,
      shortLabel: bonus.type,
    }
  );
}
