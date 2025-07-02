/*
 * @Author: Ender-Wiggin
 * @Date: 2025-06-26 14:23:54
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-06-26 14:32:00
 * @Description:
 */
import { IconFactory } from '@/components/icons/IconFactory';

import { EResourceColorMap } from '@/constant/color';

import { EResource, IIconItem } from '@/types/element';

type Props = {
  title: string;
  color: string;
};
export const CorpTitle = ({ title, color }: Props) => {
  return (
    <div className='corp-title-container'>
      <div className='corp-title-text'>{title}</div>
      <div className='corp-title-svg'>
        <svg
          width='704'
          height='166'
          viewBox='0 0 704 166'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M4.5 165.5H655.5C670.598 165.209 676.089 161.778 678 147L703.5 0H0V165.5H4.5Z'
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
};
