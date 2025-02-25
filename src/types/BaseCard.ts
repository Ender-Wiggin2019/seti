/*
 * @Author: Ender-Wiggin
 * @Date: 2023-10-25 22:45:44
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 02:20:00
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
}

export interface IFreeAction {
  type: EResource;
  value: number;
}

export enum ESector {
  RED,
  YELLOW,
  BLUE,
  BLACK,
}

export enum EResource {
  CREDIT,
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
  NORMAL,
  ALIEN,
  PROMO,
  FAN_MADE,
}
