export enum ESector {
  RED = 'red-signal',
  YELLOW = 'yellow-signal',
  BLUE = 'blue-signal',
  BLACK = 'black-signal',
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
  ORBIT = 'orbit',
  LAND = 'land',
  SCAN = 'scan',
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
  | EResource
  | ETech
  | ELight
  | ESpecialAction
  | 'none';

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
