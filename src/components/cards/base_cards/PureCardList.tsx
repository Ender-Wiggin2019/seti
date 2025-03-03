import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
import CardList from '@/components/cards/shared/CardList';

import BaseCard from '@/types/BaseCard';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 23:38:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-01 23:39:32
 * @Description:
 */
export const PureCardList = ({ cardList }: { cardList: BaseCard[] }) => {
  return (
    <CardList>
      {cardList.map((ratedBaseCard: BaseCard) => (
        <div
          key={ratedBaseCard.id}
          className='scale-100 sm:mb-1 sm:scale-100 md:mb-4 md:scale-100'
        >
          <PreviewBaseCard
            key={ratedBaseCard.id}
            card={ratedBaseCard}
            showLink={true}
          />
        </div>
      ))}
    </CardList>
  );
};
