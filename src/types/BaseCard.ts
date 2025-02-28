/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 09:48:41
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 14:47:07
 * @Description:
 */
/*
 * @Author: Ender-Wiggin
 * @Date: 2023-10-25 22:45:44
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 14:24:53
 * @Description:
 */

import { CardSource } from '@/types/CardSource';
import { ESector, EResource, IIconItem } from '@/types/element';

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
  effect?: IIconItem[];
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
