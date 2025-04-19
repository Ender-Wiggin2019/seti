import { EEffectType } from '@/types/effect';
import { TShape } from '@/types/Icon';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 14:45:30
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-20 00:27:31
 * @Description:
 */
export enum ESector {
  RED = 'red-signal',
  YELLOW = 'yellow-signal',
  BLUE = 'blue-signal',
  BLACK = 'black-signal',
}

export enum EScanAction {
  ANY = 'any-signal',
  RED = 'red-signal',
  YELLOW = 'yellow-signal',
  BLUE = 'blue-signal',
  BLACK = 'black-signal',
  DISPLAY_CARD = 'display-card-signal',
  DISCARD_CARD = 'discard-card-signal',
}

export enum EResource {
  CREDIT = 'credit',
  ENERGY = 'energy',
  DATA = 'data',
  PUBLICITY = 'publicity',
  SCORE = 'score',
  CARD = 'draw-card', // has question mark
  CARD_ANY = 'any-card',
  MOVE = 'move',
}

export enum ETrace {
  ANY = 'any-trace',
  RED = 'red-trace',
  YELLOW = 'yellow-trace',
  BLUE = 'blue-trace',
}

export enum ESpecialAction {
  LAUNCH = 'launch-action',
  ORBIT = 'orbit-action',
  LAND = 'land-action',
  SCAN = 'scan-action',
  COMPUTER = 'computer-action',
  ORBIT_OR_LAND = 'orbit-or-land-action',
}

export enum ETech {
  ANY = 'any-tech',
  PROBE = 'probe-tech',
  SCAN = 'scan-tech',
  COMPUTER = 'computer-tech',
}

export const ESectorMap: Record<ESector, string> = {
  [ESector.RED]: 'red',
  [ESector.YELLOW]: 'yellow',
  [ESector.BLUE]: 'blue',
  [ESector.BLACK]: 'black',
};

export const EResourceMap: Record<EResource, string> = {
  [EResource.CREDIT]: 'credit',
  [EResource.ENERGY]: 'energy',
  [EResource.DATA]: 'data',
  [EResource.PUBLICITY]: 'publicity',
  [EResource.SCORE]: 'score',
  [EResource.CARD]: 'draw-card',
  [EResource.MOVE]: 'move',
  [EResource.CARD_ANY]: 'any-card',
};

// Misc Icons
export enum EMiscIcon {
  ROTATE = 'rotate',
  INCOME = 'income',
  ORBIT_COUNT = 'orbit-count', // 用于任务计数的图标
  LAND_COUNT = 'land-count',
  ORBIT_OR_LAND_COUNT = 'orbit-or-land-count',
  FULFILL_SECTOR_ANY = 'fulfill-sector-any',
  FULFILL_SECTOR_RED = 'fulfill-sector-red',
  FULFILL_SECTOR_YELLOW = 'fulfill-sector-yellow',
  FULFILL_SECTOR_BLUE = 'fulfill-sector-blue',
  FULFILL_SECTOR_BLACK = 'fulfill-sector-black',
  FULFILL_ICON = 'fulfill-icon',
  ADVANCED_15 = 'advanced-15',
  FULFILL_ADVANCED = 'fulfill-advanced',
  DANGER = 'danger',
  DRAW_ALIEN_CARD = 'draw-alien-card',
  EXOFOSSIL = 'exofossil',
  USE_EXOFOSSIL = 'use-exofossil',
  SAMPLE = 'sample',
  FULFILL_SAMPLE = 'fulfill-sample',
  CREDIT_INCOME = 'credit-income',
  ENERGY_INCOME = 'energy-income',
  CARD_INCOME = 'card-income',
}

export enum EPlanet {
  EARTH = 'earth',
  MARS = 'mars',
  JUPITER = 'jupiter',
  SATURN = 'saturn',
  MERCURY = 'mercury',
  VENUS = 'venus',
  URANUS = 'uranus',
  NEPTUNE = 'neptune',
}

export enum ECardType {
  BASE = 'base-card',
  MISSION = 'mission-card',
  END_SCORING = 'end-scoring-card',
}
export type TIcon =
  | ESector
  | EScanAction
  | EResource
  | ETech
  | ETrace
  | ESpecialAction
  | EPlanet
  | EMiscIcon
  | ECardType
  | 'move-special'
  | 'draw-card-special'
  | 'any-card-special'; // only use in description

// desc-mini: the minimum icon size in description
export type TSize =
  | 'desc-mini'
  | 'desc'
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl';

export interface IIconItem {
  type: TIcon;
  value: number;
  options?: {
    size?: TSize;
    showValue?: boolean;
    showValueInCenter?: boolean;
    text?: string; // use text when icon is none
    shape?: TShape;
    textColor?: string;
    border?: boolean;
    borderColor?: string;
  };
}

export const CardTypeEffectMap: Record<ECardType, EEffectType[]> = {
  [ECardType.BASE]: [EEffectType.BASE],
  [ECardType.MISSION]: [EEffectType.MISSION_FULL, EEffectType.MISSION_QUICK],
  [ECardType.END_SCORING]: [EEffectType.END_GAME],
};
