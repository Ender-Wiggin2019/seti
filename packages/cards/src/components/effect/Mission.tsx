/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-06 14:44:17
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-20 23:52:02
 * @Description:
 */

import { EEffectType, IMissionEffect } from '@seti/common/types/effect';
import { calculateSize } from '@seti/common/utils/desc';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useCardRenderContext } from '../CardContext';
import { DescRender } from './DescRender';
import { EffectFactory } from './Effect';

interface missionProps {
  effect: IMissionEffect;
}

/**
 * Circular player-color token overlaid on a claimed mission branch.
 * Visual language mirrors SlotOccupantOverlay on alien boards so
 * mission claims and trace claims read the same way at a glance.
 */
function ClaimToken({ color }: { color: string }): React.JSX.Element {
  return (
    <span
      aria-hidden
      className='pointer-events-none absolute right-1 top-1 z-10 inline-block h-3 w-3 rounded-full border border-black/60 shadow-[0_0_3px_rgba(0,0,0,0.7)]'
      style={{ backgroundColor: color }}
    />
  );
}

export const Mission: React.FC<missionProps> = ({ effect }) => {
  const { missions, desc, rewardSize } = effect;
  const { t } = useTranslation('seti');
  const cardContext = useCardRenderContext();
  const branchClaims = (() => {
    const id = cardContext?.cardId;
    if (!id) return undefined;
    return cardContext?.branchClaimsByCardId?.[id];
  })();
  const ownerColor = cardContext?.ownerPlayerColor ?? '#cbd5e1';
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
    const isClaimed = branchClaims?.[0] === true;
    return (
      <div
        className={cn(
          'card-quick-mission-container relative flex flex-1 flex-row flex-wrap justify-center items-center',
          {
            'card-quick-mission-container-large-reward': rewardSize === 'large',
          },
        )}
      >
        {isClaimed ? <ClaimToken color={ownerColor} /> : null}
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
            { 'reward-container-large': rewardSize === 'large' },
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

              const isClaimed = branchClaims?.[index] === true;
              return (
                <div
                  key={index}
                  className='card-mission-item-container relative'
                >
                  {isClaimed ? <ClaimToken color={ownerColor} /> : null}
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
