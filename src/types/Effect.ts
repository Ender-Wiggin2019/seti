/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-03 16:57:05
 * @Description:
 */

import { IIconItem, TIcon } from '@/types/element';

// effect 是逻辑层，icon是渲染层。原则上 effect 包含所有非渲染相关信息，等价于 model
export enum EEffectType {
  BASE = 1,
  MISSION,
  CUSTOMIZED,
}

export type Effect = IBaseEffect | IMissionEffect | ICustomizedEffect;

export interface IBaseEffect {
  effectType: EEffectType.BASE;
  type: TIcon;
  value?: number;
  desc?: string;
}

export interface IMissionReq {
  type: TIcon;
  reqCount: number;
}

export interface ICustomizedEffect {
  effectType: EEffectType.CUSTOMIZED;
  type?: TIcon;
  desc: string;
}
export interface IMissionEffect {
  effectType: EEffectType.MISSION;
  req: IMissionReq;
  reward: IBaseEffect[];
}

// 核心函数，用于将IEffect转换为IIconItem
export type TBaseEffectRenderFn = (effect: IBaseEffect) => IIconItem;
