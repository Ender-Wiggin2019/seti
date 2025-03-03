import { EEffectType, IBaseEffect } from '@/types/effect';
import { ESpecialAction } from '@/types/element';

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
    type: ESpecialAction.ORBIT,
    value: 1,
    desc: 'desc.launch',
  };
};

const SCAN = () => {
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
