import { IBaseCard } from '@seti/common/types/BaseCard';
import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
import CardList from '@/components/cards/shared/CardList';

export const PureCardList = ({ cardList }: { cardList: IBaseCard[] }) => {
  return (
    <CardList>
      {cardList.map((ratedBaseCard: IBaseCard) => (
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
