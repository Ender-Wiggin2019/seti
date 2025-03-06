/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-05 23:45:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-06 15:47:25
 * @Description:
 */
import React from 'react';

import { EffectFactory } from '@/components/effect/Effect';

import { extractDesc, renderNode2Effect } from '@/utils/desc';
import { TSize } from '@/types/element';

interface IconProps {
  desc: string;
  size?: TSize;
}

export const DescRender: React.FC<IconProps> = ({ desc, size }) => {
  const descArray = extractDesc(desc);
  // const descIconSize: TSize = !size ? 'xxs' : size === 'xxs' ? 'desc' : 'xxs';
  const descIconSize: TSize = size || 'xxs';

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
          <EffectFactory key={index} effect={{ ...res, size: descIconSize }} />
          // </div>
        );
      })}
    </div>
  );
};
