/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-09 12:03:24
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-06 17:08:43
 * @Description:
 */

type Props = {
  color?: string;
  title: string;
  size?: string;
};
export const CardTitle = ({ color = '#3E403B', title, size }: Props) => {
  const cls =
    size === 'xs' ? 'card-render-title smaller-text' : 'card-render-title';
  return (
    <div className='card-title-container'>
      <div className={cls}>{title}</div>
      <div className='card-title-svg'>
        <svg
          width='118'
          height='12'
          viewBox='0 0 118 12'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M0 0L11.5 11.5C11.6667 11.6667 12.2 12 13 12H118V0H0Z'
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
};
