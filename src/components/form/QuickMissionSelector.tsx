/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 12:22:14
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-22 12:41:36
 * @Description:
 */

import React, { useState } from 'react';

import { EffectsGenerator } from '@/components/form/EffectsGenerator';

import { m } from '@/constant/effect';

import {
  EEffectType,
  Effect,
  IBaseEffect,
  IMissionEffect,
} from '@/types/effect';
import { useTranslation } from 'next-i18next';

type Props = {
  missionEffect: IMissionEffect | null;
  onChange?: (effect: IMissionEffect) => void;
};
export const QuickMissionSelector = ({ missionEffect, onChange }: Props) => {
  const { t } = useTranslation('common');

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
    <div className='items-start justify-start space-x-2 rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 flex flex-col 2'>
      <div className='text-lg text-white font-semibold'>{t('Condition')}</div>
      <EffectsGenerator
        selectedEffects={req}
        onChange={(e) => handleChange(e, 'req')}
        type={EEffectType.MISSION_QUICK}
      />
      <div className='text-lg text-white font-semibold'>{t('Reward')}</div>
      <EffectsGenerator
        selectedEffects={reward}
        onChange={(e) => handleChange(e, 'reward')}
        type={EEffectType.MISSION_QUICK}
      />
    </div>
  );
};
