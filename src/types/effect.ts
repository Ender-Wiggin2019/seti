/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-10 23:11:36
 * @Description:
 */

import { IIconItem, TIcon, TSize } from '@/types/element';

// effect 是逻辑层，icon是渲染层。原则上 effect 包含所有非渲染相关信息，等价于 model
export enum EEffectType {
  BASE = 1,
  MISSION_QUICK,
  MISSION_FULL, // a totally mission card
  END_GAME,
  CUSTOMIZED,
  OR, // semantic label for an alternative effect
}

export type Effect =
  | IBaseEffect
  | IMissionEffect
  | IEndGameEffect
  | ICustomizedEffect
  | IOrEffect;

export interface IBaseEffect {
  effectType: EEffectType.BASE;
  type: TIcon;
  value?: number;
  desc?: string;
  helperText?: string; // info about the icon
  size?: TSize; // 一般不会赋值，除非是 desc
}

export interface IMissionReq {
  type: TIcon;
  reqCount: number;
  desc?: string;
}

export interface IMissionItem {
  req: (IBaseEffect | ICustomizedEffect)[];
  reward: (IBaseEffect | ICustomizedEffect)[];
}

export interface ICustomizedEffect {
  effectType: EEffectType.CUSTOMIZED;
  type?: TIcon;
  desc: string;
  helperText?: string; // info about the icon
  size?: TSize; // 一般不会赋值，除非是 desc
  width?: 'half' | 'full';
}

export interface IMissionEffect {
  effectType: EEffectType.MISSION_QUICK | EEffectType.MISSION_FULL;
  missions: IMissionItem[];
  desc?: string;
}

export interface IEndGameEffect {
  effectType: EEffectType.END_GAME;
  desc: string;
  score?: number;
  per?: IBaseEffect;
  size?: TSize;
}

export interface IOrEffect {
  effectType: EEffectType.OR;
  effects: Effect[];
}

// 核心函数，用于将IEffect转换为IIconItem
export type TBaseEffectRenderFn = (effect: IBaseEffect) => IIconItem;
