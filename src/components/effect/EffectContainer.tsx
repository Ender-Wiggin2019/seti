/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-06 15:22:44
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-21 01:50:30
 * @Description:
 */
import React from 'react';

import { cn } from '@/lib/utils';

import { EffectFactory } from '@/components/effect/Effect';

import { EEffectType, Effect } from '@/types/effect';

interface Props {
  effects: Effect[];
  className?: string;
}
export const EffectContainer: React.FC<Props> = ({ effects, className }) => {
  console.log('🎸 [test] - effectswww:', effects);
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
    <div className={cn('card-effects-container', className)}>
      <div className='card-effects'>
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
