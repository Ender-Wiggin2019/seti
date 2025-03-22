/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 12:22:14
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-22 12:50:10
 * @Description:
 */

import { isEqual } from 'lodash';
import React, { useState } from 'react';

import { cn } from '@/lib/utils';

import { EffectsGenerator } from '@/components/form/EffectsGenerator';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Textarea } from '@/components/ui/textarea';

import { m } from '@/constant/effect';

import {
  EEffectType,
  Effect,
  IBaseEffect,
  IMissionEffect,
} from '@/types/effect';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';

type Props = {
  missionEffect: IMissionEffect | null;
  onChange?: (effect: IMissionEffect) => void;
};
export const FullMissionSelector = ({
  missionEffect: _missionEffect,
  onChange,
}: Props) => {
  const { t } = useTranslation('common');

  const [idx, setIdx] = useState(0);

  const missionEffect = _missionEffect
    ? _missionEffect
    : m.FULL_MISSION([{ req: [], reward: [] }], '');
  const [desc, setDesc] = useState(missionEffect.desc);

  const handleIndexChange = (i: number) => {
    setIdx(i);
  };

  const handleAddNew = () => {
    const newItem = {
      req: [],
      reward: [],
    };
    onChange?.(
      m.FULL_MISSION([...(missionEffect?.missions || []), newItem], desc)
    );
  };

  const handleChange = (effects: Effect[], type: 'req' | 'reward') => {
    if (type === 'req') {
      // setCurrReq(effects as IBaseEffect[]);
      const newMission = m.FULL_MISSION(
        missionEffect.missions.map((mission, i) =>
          i === idx ? { ...mission, req: effects as IBaseEffect[] } : mission
        ),
        desc
      );
      if (!isEqual(missionEffect, newMission)) {
        onChange?.(newMission);
      }
    } else {
      // setCurrReward(effects as IBaseEffect[]);
      const newMission = m.FULL_MISSION(
        missionEffect.missions.map((mission, i) =>
          i === idx ? { ...mission, reward: effects as IBaseEffect[] } : mission
        ),
        desc
      );
      if (!isEqual(missionEffect, newMission)) {
        onChange?.(newMission);
      }
    }
  };

  const handleDescChange = (desc: string) => {
    setDesc(desc);
    onChange?.(m.FULL_MISSION(missionEffect?.missions, desc));
  };

  const req = missionEffect?.missions?.[idx].req;
  const reward = missionEffect?.missions?.[idx].reward;

  return (
    <div className='space-y-2'>
      <div className='flex gap-2 items-center'>
        {missionEffect?.missions.map((m, i) => (
          <div
            key={i}
            onClick={() => handleIndexChange(i)}
            className={cn(
              'rounded-full border border-zinc-300 bg-zinc-800/90 w-8 h-8 flex justify-center items-center',
              { 'bg-primary': i === idx }
            )}
          >
            {i + 1}
          </div>
        ))}
        <Button variant='highlight' className='ml-2' onClick={handleAddNew}>
          Add
        </Button>
      </div>
      <div className='items-start justify-start space-x-2 rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 flex flex-col gap-2'>
        <div className='text-lg text-white font-semibold'>{t('Condition')}</div>
        <EffectsGenerator
          selectedEffects={req}
          onChange={(e) => handleChange(e, 'req')}
          type={EEffectType.MISSION_FULL}
        />
        <div className='text-lg text-white font-semibold'>{t('Reward')}</div>

        <EffectsGenerator
          selectedEffects={reward}
          onChange={(e) => handleChange(e, 'reward')}
          type={EEffectType.MISSION_FULL}
        />
        <AccordionV2 title='Mission Description'>
          <Textarea
            value={desc}
            className='w-64'
            onChange={(e) => handleDescChange(e.target.value)}
          />
        </AccordionV2>
      </div>
    </div>
  );
};
