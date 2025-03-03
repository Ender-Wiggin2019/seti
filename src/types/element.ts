/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 14:45:30
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-03 16:46:21
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
  CARD = 'draw-card',
  MOVE = 'move',
}

export enum ESpecialAction {
  LAUNCH = 'launch',
  ORBIT = 'orbit',
  LAND = 'land',
  SCAN = 'scan',
  COMPUTER = 'computer',
}

export enum ETech {
  ANY = 'tech-any',
  PROBE = 'tech-probe',
  SCAN = 'tech-scan',
  COMPUTER = 'tech-computer',
}

export enum ELight {
  ANY = 'light-any',
  RED = 'light-red',
  YELLOW = 'light-yellow',
  BLUE = 'light-blue',
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
  [EResource.CARD]: 'card',
  [EResource.MOVE]: 'move',
};

export type TIcon =
  | ESector
  | EScanAction
  | EResource
  | ETech
  | ELight
  | ESpecialAction;

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
