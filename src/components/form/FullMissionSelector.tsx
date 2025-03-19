/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 12:22:14
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-20 01:30:41
 * @Description:
 */

import React, { useState } from 'react';

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

type Props = {
  missionEffect: IMissionEffect | null;
  onChange?: (effect: IMissionEffect) => void;
};
export const FullMissionSelector = ({ missionEffect, onChange }: Props) => {
  const [idx, setIdx] = useState(0);

  if (!missionEffect) {
    missionEffect = m.FULL_MISSION([{ req: [], reward: [] }], '');
  }

  // const [currReq, setCurrReq] = useState(missionEffect?.missions[idx].req);
  // const [currReward, setCurrReward] = useState(
  //   missionEffect?.missions[idx].reward
  // );
  const [desc, setDesc] = useState(missionEffect.desc);

  const handleIndexChange = (i: number) => {
    setIdx(i);
    // setCurrReq(missionEffect?.missions[i].req);
    // setCurrReward(missionEffect?.missions[i].reward);
    console.log(
      '🎸 [test] - handleIndexChange - missionEffect?.missions[i].req:',
      missionEffect?.missions?.[i]?.req
    );
  };

  const handleAddNew = () => {
    const newItem = {
      req: [],
      reward: [],
    };
    setIdx(missionEffect?.missions?.length || 0);
    // setCurrReq(newItem.req);
    // setCurrReward(newItem.reward);
    onChange?.(
      m.FULL_MISSION([...(missionEffect?.missions || []), newItem], desc)
    );
  };

  const handleChange = (effects: Effect[], type: 'req' | 'reward') => {
    console.log('🎸 [test] - handleChange - effects:', effects);
    if (type === 'req') {
      // setCurrReq(effects as IBaseEffect[]);
      onChange?.(
        m.FULL_MISSION(
          missionEffect?.missions.map((m, i) =>
            i === idx ? { ...m, req: effects as IBaseEffect[] } : m
          ),
          desc
        )
      );
    } else {
      // setCurrReward(effects as IBaseEffect[]);
      onChange?.(
        m.FULL_MISSION(
          missionEffect?.missions.map((m, i) =>
            i === idx ? { ...m, reward: effects as IBaseEffect[] } : m
          ),
          desc
        )
      );
    }
  };

  const handleDescChange = (desc: string) => {
    setDesc(desc);
    onChange?.(m.FULL_MISSION(missionEffect?.missions, desc));
  };

  // useEffect(() => {
  //   setCurrReq(missionEffect?.missions[idx].req);
  //   setCurrReward(missionEffect?.missions[idx].reward);
  // }, [missionEffect?.missions, idx]);

  return (
    <div>
      {missionEffect?.missions.map((m, i) => (
        <div key={i} onClick={() => handleIndexChange(i)}>
          {i + 1}
        </div>
      ))}
      <div className='' onClick={handleAddNew}>
        Add
      </div>
      <EffectsGenerator
        selectedEffects={missionEffect?.missions[idx].req}
        onChange={(e) => handleChange(e, 'req')}
        type={EEffectType.MISSION_FULL}
      />
      <EffectsGenerator
        selectedEffects={missionEffect?.missions[idx].reward}
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
  );
};
