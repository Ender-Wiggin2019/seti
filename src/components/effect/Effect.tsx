import { useTranslation } from 'next-i18next';
import React from 'react';

import { DescRender } from '@/components/effect/DescRender';
import { Mission } from '@/components/effect/Mission';
import { IconFactory } from '@/components/icons/IconFactory';

import { getIconItem } from '@/constant/icons';

import { EEffectType, Effect } from '@/types/effect';

interface IconProps {
  effect: Effect;
}
export const EffectFactory: React.FC<IconProps> = ({ effect }) => {
  const { t } = useTranslation('seti');
  if (effect.effectType === EEffectType.BASE) {
    return (
      <>
        <IconFactory iconItem={getIconItem(effect)} />
        {effect.desc && effect.desc.length > 0 && (
          <DescRender desc={t(effect.desc)} size={effect.size} />
        )}
      </>
    );
  }

  if (effect.effectType === EEffectType.CUSTOMIZED) {
    return (
      <DescRender
        desc={t(effect.desc)}
        size={effect.size}
        width={effect.width}
      />
    );
  }

  if (
    effect.effectType === EEffectType.MISSION_QUICK ||
    effect.effectType === EEffectType.MISSION_FULL
  ) {
    return <Mission effect={effect} />;
  }

  if (effect.effectType === EEffectType.END_GAME) {
    return (
      <div className='end-game-container'>
        <DescRender desc={t(effect.desc)} size={effect.size || 'xs'} />
      </div>
    );
  }

  return null;
};
