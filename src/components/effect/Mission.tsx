/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-06 14:44:17
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-07 00:16:20
 * @Description:
 */
import React from 'react';

import { EffectFactory } from '@/components/effect/Effect';

import { IMissionItem } from '@/types/effect';

interface missionProps {
  missions: IMissionItem[];
}

export const Mission: React.FC<missionProps> = ({ missions }) => {
  // const descArray = extractDesc(desc);
  if (missions.length === 1) {
    const quickMission = missions[0];
    const reqEffects = Array.isArray(quickMission.req)
      ? quickMission.req
      : [quickMission.req];

    const rewardEffects = Array.isArray(quickMission.reward)
      ? quickMission.reward
      : [quickMission.reward];
    return (
      <div className='card-quick-mission-container flex flex-1 flex-row flex-wrap justify-center items-center'>
        <div className='req-container flex justify-center items-center'>
          {reqEffects.map((reqEffect, index) => {
            return (
              <EffectFactory
                key={index}
                effect={{ ...reqEffect, size: 'xxs' }}
              />
            );
          })}
        </div>
        <div className='reward-container flex justify-center items-center flex-1 gap-1'>
          {rewardEffects.map((rewardEffect, index) => {
            return (
              <EffectFactory
                key={index}
                effect={{ ...rewardEffect, size: 'xxs' }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
