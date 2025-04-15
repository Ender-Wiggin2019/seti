/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-07 23:02:36
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-16 00:25:29
 * @Description:
 */
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
          <DescRender desc={t(effect.desc)} size={effect.size} smartSize />
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
        smartSize
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
        <DescRender
          desc={t(effect.desc)}
          size={effect.size || 'xs'}
          smartSize
        />
      </div>
    );
  }

  return null;
};
