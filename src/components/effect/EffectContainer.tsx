/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-06 15:22:44
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-06 19:02:08
 * @Description:
 */
import React from 'react';

import { DescRender } from '@/components/effect/DescRender';
import { IconFactory } from '@/components/icons/IconFactory';

import { getIconItem } from '@/constant/icons';

import { EEffectType, Effect } from '@/types/effect';
import { Mission } from '@/components/effect/Mission';
import { EffectFactory } from '@/components/effect/Effect';

interface Props {
  effects: Effect[];
}
export const EffectContainer: React.FC<Props> = ({ effects }) => {
  const fullWidthEffectTypes = [
    EEffectType.END_GAME,
    EEffectType.MISSION_FULL,
    EEffectType.MISSION_QUICK,
  ];
  const fullWidthEffects = effects.filter((effect) =>
    fullWidthEffectTypes.includes(effect.effectType)
  );
  const normalEffects = effects.filter(
    (effect) => !fullWidthEffectTypes.includes(effect.effectType)
  );
  return (
    <div className='card-effects-container border border-red-300'>
      <div className='card-effects border'>
        {normalEffects.map((effect, index) => (
          <EffectFactory key={index} effect={effect} />
        ))}
      </div>
      {fullWidthEffects.map((effect, index) => (
        <div key={index} className='card-effects'>
          <EffectFactory key={index} effect={effect} />
        </div>
      ))}
    </div>
  );
};
