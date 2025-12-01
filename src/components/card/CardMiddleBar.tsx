/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-09 12:03:24
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-06 17:07:26
 * @Description:
 */
import { useTranslation } from 'next-i18next';

import { CardPrice } from '@/components/card/CardPrice';
import { CardTitle } from '@/components/card/CardTitle';
import { IBaseCard } from '@/types/BaseCard';
import { EResource } from '@/types/element';
import { getCardMiddleColor } from '@/utils/color';

type Props = {
  card: IBaseCard;
};
export const CardMiddleBar = ({ card }: Props) => {
  const { t } = useTranslation('seti');
  const priceType = card?.priceType || EResource.CREDIT;

  const color = getCardMiddleColor(card);
  return (
    <div className='card-middle'>
      <CardTitle
        color={color}
        title={t(card.name)}
        size={card.special?.titleSize}
      />
      <CardPrice type={priceType} price={card.price} />
    </div>
  );
};
