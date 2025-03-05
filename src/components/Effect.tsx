import React from 'react';

import { DescRender } from '@/components/DescRender';
import { IconFactory } from '@/components/icons/IconFactory';

import { getIconItem } from '@/constant/icons';

import { EEffectType, Effect } from '@/types/effect';

interface IconProps {
  effect: Effect;
}
export const EffectFactory: React.FC<IconProps> = ({ effect }) => {
  if (effect.effectType === EEffectType.BASE) {
    return (
      // <div className=''>
      <IconFactory iconItem={getIconItem(effect)} />
      // </div>
    );
  }

  if (effect.effectType === EEffectType.CUSTOMIZED) {
    return <DescRender desc={effect.desc} />;
  }

  return null;
};
