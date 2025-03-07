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
    return <DescRender desc={t(effect.desc)} size={effect.size} />;
  }

  if (effect.effectType === EEffectType.MISSION_QUICK) {
    return <Mission missions={effect.missions} />;
  }

  return null;
};
