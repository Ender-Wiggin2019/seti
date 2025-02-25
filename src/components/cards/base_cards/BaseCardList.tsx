/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 00:02:25
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 02:19:17
 * @Description:
 */
/*
 * @Author: Ender-Wiggin
 * @Date: 2024-06-27 23:56:37
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 01:20:42
 * @Description:
 */
// import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo } from 'react';

import { RatedBaseCard } from '@/components/cards/base_cards/RatedBaseCard';
import CardList from '@/components/cards/shared/CardList';

import { fetchCardRatings } from '@/utils/fetch';
import { getBaseCardModel } from '@/utils/getBaseCardModel';

import { useBaseCardData } from './useBaseCardData';

import BaseCardType, { EResource, ESector } from '@/types/BaseCard';
import { CardSource } from '@/types/CardSource';
import { IBaseCard } from '@/types/IBaseCard';
import { IRating } from '@/types/IRating';
import { SortOrder } from '@/types/Order';

interface BaseCardListProps {
  selectedSectors?: ESector[];
  selectedFreeActions?: EResource[];
  selectedCardSources?: CardSource[];
  textFilter?: string;
  sortOrder?: SortOrder;
  credit?: number[];
  onCardCountChange: (count: number) => void;
  maxNum?: number;
  // ... any other filters
}

// const cards: BaseCardType[] = [...generateCards(7, 10, '/images/cards/cards-1.webp'), ...generateCards(7, 10, '/images/cards/cards-2.webp')];

const filterCards = (
  cards: BaseCardType[],
  selectedSectors: ESector[] = [],
  selectedFreeActions: EResource[] = [],
  selectedCardSources: CardSource[] = [],
  textFilter = '',
  credit: number[] = [0],
  maxNum?: number
) => {
  const lowercaseFilter = textFilter.toLowerCase();

  let res = cards;
  if (selectedFreeActions && selectedFreeActions.length > 0) {
    // FIXME: 注意这里先[0]
    res = res.filter(
      (card) =>
        card.freeAction &&
        selectedFreeActions.includes(card.freeAction[0]?.type)
    );
  }

  if (selectedSectors && selectedSectors.length > 0) {
    // FIXME: 注意这里先[0]
    res = res.filter(
      (card) => card.sector && selectedSectors.includes(card.sector)
    );
  }

  res = res.filter(
    (card) =>
      credit.length === 0 ||
      credit.includes(0) ||
      credit.includes(1) ||
      credit.includes(2) ||
      credit.includes(card.price)
  );
  return {
    originalCount: res.length,
    limitedCount: res.length,
    cards: res,
  };
};

export const BaseCardList: React.FC<BaseCardListProps> = ({
  selectedSectors,
  selectedFreeActions,
  selectedCardSources = [],
  textFilter,
  onCardCountChange,
  sortOrder = SortOrder.ID_ASC,
  credit = [0],
  maxNum,
}) => {
  // const { user } = useUser();
  // const userId = user?.id ?? '';
  const shouldFetchRatings = true;
  const {
    data: cardRatings,
    // isLoading,
    // isError,
    // error,
  } = useQuery(['cardRatings'], fetchCardRatings, {
    enabled: shouldFetchRatings,
    // staleTime: 60 * 1000,
  });

  // const {
  //   data: userCardRatings,
  // } = useQuery(['userCardRatings', userId], fetchUserCardRatings, {
  //   enabled: shouldFetchRatings,
  // });

  const cardsData = useBaseCardData();
  // const cardsData = cards;
  const { originalCount, cards: filteredCards } = filterCards(
    cardsData,
    selectedSectors,
    selectedFreeActions,
    selectedCardSources,
    textFilter,
    credit,
    maxNum
  );

  const combineDataWithRatings = (
    cards: BaseCardType[],
    ratings: IRating[]
  ): IBaseCard[] => {
    return cards.map((animal) => {
      const rating = ratings.find((r) => r.cardid === animal.id);
      return {
        id: animal.id,
        animalCard: animal,
        model: getBaseCardModel(animal),
        rating: rating ? rating._avg.rating : null,
        ratingCount: rating ? rating._count : null,
      };
    });
  };

  const initialBaseCards: IBaseCard[] = useMemo(() => {
    return filteredCards.map((animal) => ({
      id: animal.id,
      animalCard: animal,
      model: getBaseCardModel(animal),
      rating: null,
      ratingCount: null,
    }));
  }, [filteredCards]);

  const ratedBaseCards: IBaseCard[] = useMemo(() => {
    if (!cardRatings) {
      return initialBaseCards;
    }
    return combineDataWithRatings(filteredCards, cardRatings);
  }, [filteredCards, cardRatings, initialBaseCards]);

  useEffect(() => {
    onCardCountChange(originalCount);
  }, [originalCount, onCardCountChange]);

  switch (sortOrder) {
    case SortOrder.ID_ASC:
      ratedBaseCards.sort((a, b) => a.id.localeCompare(b.id));
      break;
    case SortOrder.ID_DESC:
      ratedBaseCards.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case SortOrder.DIFF_ASC:
      ratedBaseCards.sort(
        (a, b) =>
          a.model.diffWithSpecialEnclosure - b.model.diffWithSpecialEnclosure
      );
      break;
    case SortOrder.DIFF_DESC:
      ratedBaseCards.sort(
        (a, b) =>
          b.model.diffWithSpecialEnclosure - a.model.diffWithSpecialEnclosure
      );
      break;
    case SortOrder.RATING_DESC:
      ratedBaseCards.sort((a, b) => {
        if ((b.rating ?? -1) !== (a.rating ?? -1)) {
          return (b.rating ?? -1) - (a.rating ?? -1);
        } else {
          return (b.ratingCount ?? -1) - (a.ratingCount ?? -1);
        }
      });
      break;
  }

  return (
    <CardList>
      {ratedBaseCards.map((ratedBaseCard: IBaseCard) => (
        <div
          key={ratedBaseCard.id}
          className='-mb-12 scale-75 sm:mb-1 sm:scale-90 md:mb-4 md:scale-100'
        >
          <RatedBaseCard
            key={ratedBaseCard.id}
            cardData={ratedBaseCard}
            showLink={true}
          />
        </div>
      ))}
    </CardList>
  );
};
