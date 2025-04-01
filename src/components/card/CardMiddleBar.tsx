/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-09 12:03:24
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-02 00:56:01
 * @Description:
 */
import { useTranslation } from 'next-i18next';

import { CardPrice } from '@/components/card/CardPrice';
import { CardTitle } from '@/components/card/CardTitle';

import { IBaseCard } from '@/types/BaseCard';
import { EResource } from '@/types/element';

type Props = {
  card: IBaseCard;
};
export const CardMiddleBar = ({ card }: Props) => {
  const { t } = useTranslation('seti');
  const priceType = card?.priceType || EResource.CREDIT;
  const color = card?.special?.titleColor || '#3E403B';
  return (
    <div className='card-middle'>
      <CardTitle color={color} title={t(card.name)} />
      <CardPrice type={priceType} price={card.price} />
    </div>
  );
};
