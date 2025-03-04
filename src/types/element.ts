/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 14:45:30
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 00:12:56
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
  CARD_ANY = 'card-any',
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
  [EResource.CARD_ANY]: 'card-any',
};

// Misc Icons
export enum EMiscIcon {
  ROTATE = 'rotate',
  INCOME = 'income',
  ORBIT_COUNT = 'orbit-count', // 用于任务计数的图标
  LAND_COUNT = 'land-count',
  ORBIT_OR_LAND_COUNT = 'orbit-or-land-count',
}

export type TIcon =
  | ESector
  | EScanAction
  | EResource
  | ETech
  | ETrace
  | ESpecialAction
  | EMiscIcon;

export interface IIconItem {
  type: TIcon;
  value: number;
  options?: {
    showValue?: boolean;
    text?: string; // use text when icon is none
    diamondShape?: boolean;
    textColor?: string;
    border?: boolean;
    borderColor?: string;
  };
}
