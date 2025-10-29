/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 09:48:41
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-10-29 01:35:46
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
import { Effect } from '@/types/effect';
import { EResource, ESector } from '@/types/element';

export interface IBaseCard {
  id: string;
  name: string;
  // use for official cards
  position?: { src: string; row: number; col: number };

  // use for diy cards
  image?: string;

  // upper
  freeAction?: IFreeAction[];
  sector?: ESector;
  price: number;
  priceType?: EResource; // new attribute for price type
  income: EResource;
  effects: Effect[];
  description?: string;
  flavorText?: string;

  // special
  special?: {
    danger?: number;
    descHelper?: string; // temporary translation for some texts
    enableEffectRender?: boolean; // temp
    fanMade?: boolean;
    titleColor?: string;
    titleHeight?: number;
    titleSize?: string;
    watermark?: boolean;
  };

  // meta data
  source?: CardSource;
  cardType?: ECardCategory;
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

export enum ECardCategory {
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
