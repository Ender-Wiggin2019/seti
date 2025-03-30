/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-09 12:03:24
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-31 01:49:46
 * @Description:
 */

type Props = {
  color?: string;
  title: string;
};
export const CardTitle = ({ color = '#3E403B', title }: Props) => {
  return (
    <div className='card-title-container'>
      <div className='card-render-title'>{title}</div>
      <div className='card-title-svg'>
        <svg
          width='117'
          height='12'
          viewBox='0 0 117 12'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M0 0L11.5 11.5C11.6667 11.6667 12.2 12 13 12H117V0H0Z'
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
};
