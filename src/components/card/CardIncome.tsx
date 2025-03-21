/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-09 12:03:24
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-18 00:03:04
 * @Description:
 */
import { IconFactory } from '@/components/icons/IconFactory';

import { EResourceColorMap } from '@/constant/color';

import { EResource, IIconItem } from '@/types/element';

type Props = {
  income: EResource;
};
export const CardIncome = ({ income }: Props) => {
  const color = EResourceColorMap[income];
  const iconItem: IIconItem = {
    type: income,
    value: 1,
    options: {
      size: 'desc',
      shape: 'round',
      showValue: false,
    },
  };
  return (
    <div className='card-income-container'>
      <div className='card-income-icon'>
        <IconFactory iconItem={iconItem} />
      </div>
      <div className='card-income-svg'>
        <svg
          width='150'
          height='17'
          viewBox='0 0 150 17'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <rect y='13.1467' width='150' height='3.85333' fill={color} />
          <path
            d='M118.022 13.6667L130.364 1.44444C131.374 0.444439 131.879 0.0208362 132.945 0H150V17H113.422L118.022 13.6667Z'
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
};
