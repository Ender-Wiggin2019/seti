/*
 * @Author: Ender-Wiggin
 * @Date: 2023-10-25 22:45:44
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-25 01:10:50
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
  price?: number;
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
}

export enum ECardType {
  NORMAL,
  ALIEN,
  PROMO,
  FAN_MADE,
}
