/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-06 14:44:17
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-09 01:31:03
 * @Description:
 */
import { useTranslation } from 'next-i18next';
import React from 'react';

import { DescRender } from '@/components/effect/DescRender';
import { EffectFactory } from '@/components/effect/Effect';

import { IMissionEffect } from '@/types/effect';

interface missionProps {
  effect: IMissionEffect;
}

export const Mission: React.FC<missionProps> = ({ effect }) => {
  const { missions, desc } = effect;
  const { t } = useTranslation('seti');
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
  } else {
    return (
      <div className='card-mission-container'>
        {desc && <DescRender desc={t(desc)} />}
        {missions.map((mission, index) => {
          const reqEffects = Array.isArray(mission.req)
            ? mission.req
            : [mission.req];

          const rewardEffects = Array.isArray(mission.reward)
            ? mission.reward
            : [mission.reward];

          return (
            <div key={index} className='card-mission-item-container'>
              <div className='card-mission-req'>
                {reqEffects.map((reqEffect, index) => {
                  return (
                    <EffectFactory
                      key={index}
                      effect={{ ...reqEffect, size: 'xxs' }}
                    />
                  );
                })}
              </div>
              <div className='card-mission-reward'>
                {rewardEffects.map((reqEffect, index) => {
                  return (
                    <EffectFactory
                      key={index}
                      effect={{ ...reqEffect, size: 'xxs' }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        {/*
        <div className='card-mission-req'>111</div>
        <div className='card-mission-reward'>111</div> */}
      </div>
    );
  }
};
