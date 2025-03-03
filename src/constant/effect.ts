/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-03 22:59:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 01:29:18
 * @Description:
 */
import { EEffectType, IBaseEffect } from '@/types/effect';
import { EMiscIcon, ESpecialAction } from '@/types/element';

const ORBIT_COUNT = (): IBaseEffect => {
  return {
    effectType: EEffectType.BASE,
    type: EMiscIcon.ORBIT_COUNT,
    value: 1,
    desc: 'desc.orbit_count',
  };
};

const LAND_COUNT = (): IBaseEffect => {
  return {
    effectType: EEffectType.BASE,
    type: EMiscIcon.LAND_COUNT,
    value: 1,
    desc: 'desc.land_count',
  };
};

const ORBIT_OR_LAND_COUNT = (): IBaseEffect => {
  return {
    effectType: EEffectType.BASE,
    type: EMiscIcon.ORBIT_OR_LAND_COUNT,
    value: 1,
    desc: 'desc.orbit_or_land_count',
  };
};

const ORBIT = (): IBaseEffect => {
  return {
    effectType: EEffectType.BASE,
    type: ESpecialAction.ORBIT,
    value: 1,
    desc: 'desc.orbit',
  };
};

const LAND = (): IBaseEffect => {
  return {
    effectType: EEffectType.BASE,
    type: ESpecialAction.LAND,
    value: 1,
    desc: 'desc.land',
  };
};

const LAUNCH = (): IBaseEffect => {
  return {
    effectType: EEffectType.BASE,
    type: ESpecialAction.LAUNCH,
    value: 1,
    desc: 'desc.launch',
  };
};

const SCAN = (): IBaseEffect => {
  return {
    effectType: EEffectType.BASE,
    type: ESpecialAction.SCAN,
    value: 1,
    desc: 'desc.scan',
  };
};

const COMPUTER = () => {
  return {
    effectType: EEffectType.BASE,
    type: ESpecialAction.COMPUTER,
    value: 1,
    desc: 'desc.computer',
  };
};

export const e = {
  ORBIT,
  LAND,
  LAUNCH,
  SCAN,
  COMPUTER,

  ORBIT_COUNT,
  LAND_COUNT,
  ORBIT_OR_LAND_COUNT,
};
