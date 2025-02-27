/*
 * @Author: Ender-Wiggin
 * @Date: 2023-10-25 22:45:44
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-29 10:58:41
 * @Description:
 */

import { CardSource } from '@/types/CardSource';

export default interface BaseCard {
  id: string;
  name: string;
  position?: { src: string; row: number; col: number };

  // upper
  freeAction?: IFreeAction[];
  sector?: ESector;
  price: number;
  income?: EResource;
  mission?: string;
  description?: string;
  flavorText?: string;

  // meta data
  source?: CardSource;
  cardType?: ECardType;
  alien?: EAlienType;
}

export interface IFreeAction {
  type: EResource;
  value: number;
}

export enum ESector {
  RED = 1,
  YELLOW,
  BLUE,
  BLACK,
}

export enum EResource {
  CREDIT = 1,
  ENERGY,
  DATA,
  PUBLICITY,
  SCORE,
  CARD,
  MOVE,
}

export const BASE_FREE_ACTIONS = [
  EResource.DATA,
  EResource.PUBLICITY,
  EResource.MOVE,
];

export const BASE_INCOMES = [
  EResource.CREDIT,
  EResource.ENERGY,
  EResource.CARD,
];

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

export enum ECardType {
  NORMAL = 1,
  ALIEN,
  PROMO,
  FAN_MADE,
}

export enum EAlienType {
  ANOMALIES = 1,
  CENTAURIANS,
  EXERTIANS,
  MASCAMITES,
  OUMUAMUA,
}

export const EAlienMap: Record<EAlienType, string> = {
  [EAlienType.ANOMALIES]: 'anomalies',
  [EAlienType.CENTAURIANS]: 'centaurians',
  [EAlienType.EXERTIANS]: 'exertians',
  [EAlienType.MASCAMITES]: 'mascamites',
  [EAlienType.OUMUAMUA]: 'oumuamua',
};

export const ALL_ALIENS = [
  EAlienType.ANOMALIES,
  EAlienType.CENTAURIANS,
  EAlienType.EXERTIANS,
  EAlienType.MASCAMITES,
  EAlienType.OUMUAMUA,
];
