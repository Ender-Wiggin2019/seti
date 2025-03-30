/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-09 12:03:24
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-31 01:33:33
 * @Description:
 */
import { IconFactory } from '@/components/icons/IconFactory';

import { EResourceColorMap } from '@/constant/color';

import { EResource, IIconItem } from '@/types/element';

type Props = {
  type: EResource;
  price: number;
};
export const CardPrice = ({ type, price }: Props) => {
  const color = EResourceColorMap[type];
  const iconItem: IIconItem = {
    type: type,
    value: 1,
    options: {
      size: 'xs',
      shape: 'diamond',
      showValue: false,
    },
  };
  return (
    <div className='card-price-container'>
      <div className='card-render-credit'>{price}</div>
      <div className='card-price-icon'>
        <IconFactory iconItem={iconItem} />
      </div>
      <div className='card-price-svg'>
        <svg
          width='37'
          height='30'
          viewBox='0 0 37 30'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M1 5.10007H0.6V5.50007V22.0001V22.4001H1H14.3343L20.2172 28.2829L20.2401 28.3059L20.2665 28.3248C20.8117 28.7169 21.3012 28.964 21.8154 28.958C22.3357 28.952 22.7855 28.6884 23.2517 28.311L23.268 28.2978L23.2828 28.2829L35.2828 16.2829L35.2829 16.283L35.2897 16.2759C35.5728 15.9786 35.8338 15.6469 35.8433 15.2503C35.8532 14.8381 35.5928 14.5075 35.2782 14.2126L22.7828 1.71723L22.7716 1.70598L22.7595 1.69566C22.4563 1.43723 22.1331 1.22359 21.7529 1.22094C21.3692 1.21826 21.0439 1.43059 20.7368 1.69883L20.7267 1.7077L20.7172 1.71723L17.3343 5.10007H1Z'
            fill={color}
            stroke='white'
            stroke-width='0.8'
          />
        </svg>
      </div>
    </div>
  );
};
