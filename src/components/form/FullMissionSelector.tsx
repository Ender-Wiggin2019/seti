/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-12 12:22:14
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-12 15:23:33
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
  IMissionItem,
} from '@/types/effect';
import { EffectsGenerator } from '@/components/form/EffectsGenerator';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  missionEffect: IMissionEffect | null;
  onChange?: (effect: IMissionEffect) => void;
};
export const FullMissionSelector = ({ missionEffect, onChange }: Props) => {
  const [idx, setIdx] = useState(0);
  // let missionEffect = selectedEffects.find(
  //   (e) => e.effectType === EEffectType.MISSION_QUICK
  // ) as IMissionEffect;
  if (!missionEffect) {
    missionEffect = m.FULL_MISSION([{ req: [], reward: [] }], '');
  }
  const [missionItems, setMissionItems] = useState<IMissionItem[]>(
    missionEffect.missions
  );
  const [currReq, setCurrReq] = useState(missionItems[idx].req);
  const [currReward, setCurrReward] = useState(missionItems[idx].reward);

  const [desc, setDesc] = useState(missionEffect.desc);
  const handleIndexChange = (i: number) => {
    setIdx(i);
    setCurrReq(missionItems[i].req);
    setCurrReward(missionItems[i].reward);
  };

  const handleAddNew = () => {
    setMissionItems([
      ...missionItems,
      {
        req: [],
        reward: [],
      },
    ]);
    setIdx(missionItems.length);
    onChange?.(
      m.FULL_MISSION(
        [
          ...missionEffect.missions,
          {
            req: [],
            reward: [],
          },
        ],
        desc
      )
    );
  };
  const handleChange = (effects: Effect[], type: 'req' | 'reward') => {
    if (type === 'req') {
      setCurrReq(effects as IBaseEffect[]);
      onChange?.(
        m.FULL_MISSION(
          missionItems.map((m, i) =>
            i === idx ? { ...m, req: effects as IBaseEffect[] } : m
          ),
          desc
        )
      );
    } else {
      setCurrReward(effects as IBaseEffect[]);
      onChange?.(
        m.FULL_MISSION(
          missionItems.map((m, i) =>
            i === idx ? { ...m, reward: effects as IBaseEffect[] } : m
          ),
          desc
        )
      );
    }
  };

  const handleDescChange = (desc: string) => {
    setDesc(desc);
    onChange?.(m.FULL_MISSION(missionItems, desc));
  };
  return (
    <div>
      {missionItems.map((m, i) => (
        <div key={i} onClick={() => handleIndexChange(i)}>
          {i + 1}
        </div>
      ))}
      <div className='' onClick={handleAddNew}>
        Add
      </div>
      <EffectsGenerator
        selectedEffects={currReq}
        onChange={(e) => handleChange(e, 'req')}
        type={EEffectType.MISSION_QUICK}
      />
      <EffectsGenerator
        selectedEffects={currReward}
        onChange={(e) => handleChange(e, 'reward')}
        type={EEffectType.MISSION_QUICK}
      />
      <Textarea
        value={desc}
        className='w-64'
        onChange={(e) => handleDescChange(e.target.value)}
      />
    </div>
  );
};
