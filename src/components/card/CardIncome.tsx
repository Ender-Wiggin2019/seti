import { EResourceColorMap } from '@/constant/color';
import { EResource } from '@/types/element';

type Props = {
  income: EResource;
};
export const CardIncome = ({ income }: Props) => {
  const color = EResourceColorMap[income];
  return (
    <div className='card-income-container'>
      <div className='card-income-svg'>
        <svg
          width='150'
          height='78'
          viewBox='0 0 150 78'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <rect y='61' width='150' height='17' fill={color} />
          <path
            d='M392 61.5L447 6.50002C451.5 2 453.749 0.0937857 458.5 2.28882e-05H534.5V76.5H371.5L392 61.5Z'
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
};
