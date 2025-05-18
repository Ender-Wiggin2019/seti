/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-05 23:45:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-18 20:33:46
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
import { IRenderNode } from '@/types/Icon';

interface IconProps {
  desc: string;
  size?: TSize;
  smartSize?: boolean;
  width?: 'full' | 'half';
}

export const DescRender: React.FC<IconProps> = ({
  desc,
  size,
  smartSize,
  width,
}) => {
  const descArray = extractDesc(desc);

  const descIconSize = getDescIconSize(descArray, size, smartSize);
  const descTextSize = getDescTextSize(descIconSize);

  return (
    <div
      className={cn('desc-container flex flex-col', {
        'max-w-24': width === 'half',
      })}
    >
      {descArray.map((renderNodeLine: IRenderNode[], lineIndex) => {
        return (
          <div
            key={lineIndex}
            className={cn(
              'w-full flex flex-row flex-wrap justify-center items-center',
              { 'justify-start': width === 'half' }
            )}
          >
            {renderNodeLine.map((renderNode, index) => {
              const res = renderNode2Effect(renderNode);
              if (typeof res === 'string') {
                // TODO: use rich text
                return (
                  <span
                    className={cn(
                      `inline-block text-desc-${descTextSize} text-center`,
                      { 'text-start': width === 'half' }
                      // { 'max-w-32': width !== 'half' }
                    )}
                    key={String(lineIndex) + index}
                  >
                    {res}
                  </span>
                );
              }

              return (
                <div key={index} className='px-[2px]'>
                  <EffectFactory
                    key={index}
                    effect={{ ...res, size: renderNode?.size || descIconSize }}
                  />
                </div>
              );
            })}
            {/* {lineIndex !== descArray.length - 1 && <div className="w-1/2"></div>} */}
          </div>
        );
      })}
    </div>
  );
};
