/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-06 14:44:17
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-20 23:52:02
 * @Description:
 */
import { useTranslation } from 'next-i18next';
import React from 'react';

import { cn } from '@/lib/utils';

import { DescRender } from '@/components/effect/DescRender';
import { EffectFactory } from '@/components/effect/Effect';

import { calculateSize } from '@/utils/desc';

import { EEffectType, IMissionEffect } from '@/types/effect';

interface missionProps {
  effect: IMissionEffect;
}

export const Mission: React.FC<missionProps> = ({ effect }) => {
  const { missions, desc, rewardSize } = effect;
  const { t } = useTranslation('seti');
  // const descArray = extractDesc(desc);
  if (
    missions.length === 1 &&
    effect.effectType === EEffectType.MISSION_QUICK
  ) {
    const quickMission = missions[0];
    const reqEffects = Array.isArray(quickMission.req)
      ? quickMission.req
      : [quickMission.req];

    const rewardEffects = Array.isArray(quickMission.reward)
      ? quickMission.reward
      : [quickMission.reward];
    return (
      <div
        className={cn(
          'card-quick-mission-container flex flex-1 flex-row flex-wrap justify-center items-center',
          {
            'card-quick-mission-container-large-reward': rewardSize === 'large',
          }
        )}
      >
        <div
          className={cn('req-container flex justify-center items-center', {
            'req-container-large': rewardSize === 'large',
          })}
        >
          {reqEffects.map((reqEffect, index) => {
            return (
              <EffectFactory
                key={index}
                effect={{ ...reqEffect, size: reqEffect.size || 'xxs' }}
              />
            );
          })}
        </div>
        <div
          className={cn(
            'reward-container flex justify-center items-center flex-1 gap-2',
            { 'gap-[2px]': rewardEffects.length >= 3 },
            { 'reward-container-large': rewardSize === 'large' }
          )}
        >
          {rewardEffects.map((rewardEffect, index) => {
            return (
              <EffectFactory
                key={index}
                effect={{ ...rewardEffect, size: rewardEffect.size || 'xxs' }}
              />
            );
          })}
        </div>
      </div>
    );
  } else {
    const isDescLengthTooLong = desc && calculateSize(t(desc)) > 20;
    const outerContainerCls = isDescLengthTooLong
      ? 'card-mission-container -mt-4'
      : 'card-mission-container mt-[10px]';
    const innerContainerCls = isDescLengthTooLong
      ? 'card-full-mission-container-vertical'
      : 'card-full-mission-container';
    return (
      <div className={outerContainerCls}>
        <div className={innerContainerCls}>
          {desc && <DescRender desc={t(desc)} smartSize />}
          <div className='card-full-missions'>
            {missions.map((mission, index) => {
              const reqEffects = mission.req
                ? Array.isArray(mission.req)
                  ? mission.req
                  : [mission.req]
                : [];

              const rewardEffects = Array.isArray(mission.reward)
                ? mission.reward
                : [mission.reward];

              return (
                <div key={index} className='card-mission-item-container'>
                  {reqEffects.length > 0 && (
                    <div className='card-mission-req'>
                      {reqEffects.map((reqEffect, index) => {
                        return (
                          <EffectFactory
                            key={index}
                            effect={{ ...reqEffect, size: 'desc' }}
                          />
                        );
                      })}
                    </div>
                  )}
                  <div
                    className={cn('card-mission-reward', {
                      'mt-1': reqEffects.length === 0,
                    })}
                  >
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
          </div>
        </div>
      </div>
    );
  }
};
