/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-05 23:45:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-08 01:30:05
 * @Description:
 */
import React from 'react';

import { cn } from '@/lib/utils';

import { EffectFactory } from '@/components/effect/Effect';

import {
  extractDesc,
  getDescIconSize,
  getDescTextSize,
  renderNode2Effect,
} from '@/utils/desc';

import { TSize } from '@/types/element';

interface IconProps {
  desc: string;
  size?: TSize;
  width?: 'full' | 'half';
}

export const DescRender: React.FC<IconProps> = ({ desc, size, width }) => {
  const descArray = extractDesc(desc);
  // desc 会降一个尺寸
  const descIconSize = getDescIconSize(descArray, size);
  const descTextSize = getDescTextSize(descIconSize);
  // const descIconSize: TSize = size || 'xs';

  return (
    <div className='desc-container flex flex-row flex-wrap justify-center items-center'>
      {descArray.map((renderNode, index) => {
        const res = renderNode2Effect(renderNode);
        if (typeof res === 'string') {
          // TODO: use rich text
          return (
            <span
              className={cn(
                `inline-block text-desc-${descTextSize} text-center`,
                { 'max-w-24': width === 'half' },
                { 'max-w-32': width !== 'half' }
              )}
              key={index}
            >
              {res}
              {/* <Markdown components={{
                br: () => <br />,
              }}>
              {res}
              </Markdown> */}
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
