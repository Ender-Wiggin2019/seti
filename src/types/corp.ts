import { Effect } from '@/types/effect';

export interface ICorp {
  name: string;
  author: string;
  faq: string[];
  startResources: Effect[];
  income: Effect[];
  freeAction?: Effect[];
  effects?: Effect[];
  description?: string;
  flavorText?: string;
  freeActionUnitValue?: number;
  effectTriggerTimes: number;
  effectUnitValue: number;
  modifyValue?: number;
  modifyReason?: string;
  color?: ICorpColor;
}

export interface ICorpColor {
  background: string;
  title: string;
}

export interface IModel {
  initResources: number;
  effectTotalValue: number;
  freeActionValue?: number;
  incomeValue: number;
  totalValue: number;
  effectTriggerTimes: number;
  effectUnitValue: number;
  modifyValue?: number;
}
