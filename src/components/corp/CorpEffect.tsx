/*
 * @Author: Ender-Wiggin
 * @Date: 2025-06-26 14:34:37
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-02 11:23:13
 * @Description:
 */
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-06-26 14:23:54
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-06-26 14:25:18
 * @Description:
 */
import { EffectContainer } from '@/components/effect/EffectContainer';

import { Effect } from '@/types/effect';

type Props = {
  color: string;
  effects: Effect[];
};
export const CorpEffect = ({ color, effects }: Props) => {
  return (
    <div className='corp-effect-container'>
      <div className='flex justify-center items-center'>
        <EffectContainer effects={effects} />
      </div>
      <div className='corp-effect-svg'>
        <svg
          width='251'
          height='108'
          viewBox='0 0 251 108'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M250.5 0H94.4998C86.794 0.0659242 83.1852 1.16022 77.9998 5L4.99985 78C1.27767 81.2781 -0.136114 82.6861 -0.000152864 83.5V103C0.311224 106.12 1.17824 107.22 4.49985 107.5H250.5V0Z'
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
};
