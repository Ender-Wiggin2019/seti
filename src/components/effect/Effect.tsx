import React from 'react';

import { DescRender } from '@/components/effect/DescRender';
import { IconFactory } from '@/components/icons/IconFactory';

import { getIconItem } from '@/constant/icons';

import { EEffectType, Effect } from '@/types/effect';
import { Mission } from '@/components/effect/Mission';

interface IconProps {
  effect: Effect;
}
export const EffectFactory: React.FC<IconProps> = ({ effect }) => {
  if (effect.effectType === EEffectType.BASE) {
    return <IconFactory iconItem={getIconItem(effect)} />;
  }

  if (effect.effectType === EEffectType.CUSTOMIZED) {
    return <DescRender desc={effect.desc} size={effect.size} />;
  }

  if (effect.effectType === EEffectType.MISSION_QUICK) {
    return <Mission missions={effect.missions} />;
  }

  return null;
};
