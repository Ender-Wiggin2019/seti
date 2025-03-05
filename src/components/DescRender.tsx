/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-05 23:45:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-06 00:45:58
 * @Description:
 */
import React from 'react';

import { EffectFactory } from '@/components/Effect';

import { extractDesc, renderNode2Effect } from '@/utils/desc';

interface IconProps {
  desc: string;
}

export const DescRender: React.FC<IconProps> = ({ desc }) => {
  const descArray = extractDesc(desc);
  return (
    <div className='flex flex-row flex-wrap justify-center items-center'>
      {descArray.map((renderNode, index) => {
        const res = renderNode2Effect(renderNode);
        if (typeof res === 'string') {
          // TODO: use rich text
          return (
            <span className='text-center' key={index}>
              {res}
            </span>
          );
        }

        return (
          // <div key={index} className=''>
          <EffectFactory key={index} effect={res} />
          // </div>
        );
      })}
    </div>
  );
};
