/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 12:22:14
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-12 14:30:03
 * @Description:
 */

import React, { useState } from 'react';

import { EffectContainer } from '@/components/effect/EffectContainer';
import { DescInput } from '@/components/form/DescInput';
import { EffectSelector } from '@/components/form/EffectSelector';

import { m } from '@/constant/effect';
import { updateEffectArray } from '@/utils/effect';

import {
  EEffectType,
  Effect,
  IBaseEffect,
  IMissionEffect,
} from '@/types/effect';
import { EffectsGenerator } from '@/components/form/EffectsGenerator';

type Props = {
  missionEffect: IMissionEffect | null;
  onChange?: (effect: IMissionEffect) => void;
};
export const QuickMissionSelector = ({ missionEffect, onChange }: Props) => {
  // let missionEffect = selectedEffects.find(
  //   (e) => e.effectType === EEffectType.MISSION_QUICK
  // ) as IMissionEffect;
  if (!missionEffect) {
    missionEffect = m.QUICK_MISSION([], []);
  }
  const [req, setReq] = useState(missionEffect.missions[0].req);
  const [reward, setReward] = useState(missionEffect.missions[0].reward);

  const handleChange = (effects: Effect[], type: 'req' | 'reward') => {
    if (type === 'req') {
      setReq(effects as IBaseEffect[]);
      onChange?.(m.QUICK_MISSION(effects as IBaseEffect[], reward));
    } else {
      setReward(effects as IBaseEffect[]);
      onChange?.(m.QUICK_MISSION(req, effects as IBaseEffect[]));
    }
  };
  return (
    <div className='rounded-md border border-black flex flex-col gap-4'>
      <EffectsGenerator
        selectedEffects={req}
        onChange={(e) => handleChange(e, 'req')}
        type={EEffectType.MISSION_QUICK}
      />
      <EffectsGenerator
        selectedEffects={reward}
        onChange={(e) => handleChange(e, 'reward')}
        type={EEffectType.MISSION_QUICK}
      />
    </div>
  );
};
