/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-06 14:44:17
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-07 00:16:20
 * @Description:
 */
import React from 'react';

import { EffectFactory } from '@/components/effect/Effect';

import { extractDesc, renderNode2Effect } from '@/utils/desc';
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
        <div className='border flex justify-center items-center flex-1'>
          {reqEffects.map((reqEffect, index) => {
            return (
              <EffectFactory
                key={index}
                effect={{ ...reqEffect, size: 'xxs' }}
              />
            );
          })}
        </div>
        <div className='border flex justify-center items-center flex-1 gap-1'>
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
  // return (
  //   <div className='flex flex-row flex-wrap justify-center items-center'>
  //     {descArray.map((renderNode, index) => {
  //       const res = renderNode2Effect(renderNode);
  //       if (typeof res === 'string') {
  //         // TODO: use rich text
  //         return (
  //           <span className='text-center' key={index}>
  //             {res}
  //           </span>
  //         );
  //       }

  //       return (
  //         // <div key={index} className=''>
  //         <EffectFactory key={index} effect={res} />
  //         // </div>
  //       );
  //     })}
  //   </div>
  // );
};
