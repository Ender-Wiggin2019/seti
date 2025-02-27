/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-26 00:02:25
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-27 12:32:41
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

import { fetchCardRatings } from '@/services/card';
import { getBaseCardModel } from '@/utils/getBaseCardModel';

import { useBaseCardData } from './useBaseCardData';

import BaseCardType, { EAlienType, EResource, ESector } from '@/types/BaseCard';
import { CardSource } from '@/types/CardSource';
import { IBaseCard } from '@/types/IBaseCard';
import { IRating } from '@/types/IRating';
import { SortOrder } from '@/types/Order';

interface BaseCardListProps {
  selectedSectors?: ESector[];
  selectedFreeActions?: EResource[];
  selectedCardSources?: CardSource[];
  selectedIncomes?: EResource[];
  selectedAliens?: EAlienType[];
  textFilter?: string;
  sortOrder?: SortOrder;
  credit?: number[];
  onCardCountChange: ({ base, alien }: { base: number; alien: number }) => void;
  maxNum?: number;
  // ... any other filters
}

// const cards: BaseCardType[] = [...generateCards(7, 10, '/images/cards/cards-1.webp'), ...generateCards(7, 10, '/images/cards/cards-2.webp')];

const filterCards = (
  cards: BaseCardType[],
  selectedSectors: ESector[] = [],
  selectedFreeActions: EResource[] = [],
  selectedIncomes: EResource[] = [],
  selectedAliens: EAlienType[] = [],
  selectedCardSources: CardSource[] = [],
  textFilter = '',
  credit: number[] = [0],
  maxNum?: number
) => {
  let res = cards;

  // Filter by text
  const lowercaseFilter = textFilter.toLowerCase();
  if (lowercaseFilter) {
    res = res.filter(
      (card) =>
        card.id.toLowerCase().includes(lowercaseFilter) ||
        card.name.toLowerCase().includes(lowercaseFilter) ||
        card.description?.toLowerCase().includes(lowercaseFilter)
    );
  }

  // Filter by card sources
  if (selectedFreeActions && selectedFreeActions.length > 0) {
    res = res.filter(
      (card) =>
        card.freeAction &&
        card.freeAction.some((action) =>
          selectedFreeActions.includes(action.type)
        )
    );
  }

  // Filter by sectors
  if (selectedSectors && selectedSectors.length > 0) {
    res = res.filter(
      (card) => card.sector && selectedSectors.includes(card.sector)
    );
  }

  // Filter by card sources
  if (selectedIncomes && selectedIncomes.length > 0) {
    res = res.filter(
      (card) => card.income && selectedIncomes.includes(card.income)
    );
  }

  // Filter by card sources
  if (selectedAliens.length === 0) {
    res = res.filter((card) => !card.alien);
  }

  // Filter by card sources
  if (selectedAliens.length > 0 && selectedAliens.length < 5) {
    res = res.filter(
      (card) => card.alien && selectedAliens.includes(card.alien)
    );
  }

  // Filter by credit
  res = res.filter(
    (card) =>
      credit.length === 0 || credit.includes(5) || credit.includes(card.price)
  );

  return {
    originalCount: res.filter((c) => !c.alien).length,
    alienCount: res.filter((c) => c.alien).length,
    limitedCount: res.length,
    cards: res,
  };
};

export const BaseCardList: React.FC<BaseCardListProps> = ({
  selectedSectors,
  selectedFreeActions,
  selectedCardSources = [],
  selectedIncomes = [],
  selectedAliens = [],
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
  const {
    originalCount,
    alienCount,
    cards: filteredCards,
  } = filterCards(
    cardsData,
    selectedSectors,
    selectedFreeActions,
    selectedIncomes,
    selectedAliens,
    selectedCardSources,
    textFilter,
    credit,
    maxNum
  );

  const combineDataWithRatings = (
    cards: BaseCardType[],
    ratings: IRating[]
  ): IBaseCard[] => {
    return cards.map((baseCard) => {
      const rating = ratings.find((r) => r.cardid === baseCard.id);
      return {
        id: baseCard.id,
        card: baseCard,
        model: getBaseCardModel(baseCard),
        rating: rating ? rating._avg.rating : null,
        ratingCount: rating ? rating._count : null,
      };
    });
  };

  const initialBaseCards: IBaseCard[] = useMemo(() => {
    return filteredCards.map((baseCard) => ({
      id: baseCard.id,
      card: baseCard,
      model: getBaseCardModel(baseCard),
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
    onCardCountChange({ base: originalCount, alien: alienCount });
  }, [originalCount, onCardCountChange]);

  switch (sortOrder) {
    case SortOrder.ID_ASC:
      ratedBaseCards.sort((a, b) => {
        const aIsNumeric = /^\d+$/.test(a.id);
        const bIsNumeric = /^\d+$/.test(b.id);

        // 如果一个是数字，一个不是数字，数字的排在前面
        if (aIsNumeric && !bIsNumeric) return -1;
        if (!aIsNumeric && bIsNumeric) return 1;

        // 如果都是数字或者都是非数字，比较数字部分
        return Number(a.id) - Number(b.id);
      });
      break;
    case SortOrder.ID_DESC:
      ratedBaseCards.sort((a, b) => {
        const aIsNumeric = /^\d+$/.test(a.id);
        const bIsNumeric = /^\d+$/.test(b.id);

        // 如果一个是数字，一个不是数字，数字的排在前面
        if (aIsNumeric && !bIsNumeric) return -1;
        if (!aIsNumeric && bIsNumeric) return 1;

        // 如果都是数字或者都是非数字，比较数字部分
        return Number(b.id) - Number(a.id);
      });
      break;
    // case SortOrder.DIFF_ASC:
    //   ratedBaseCards.sort(
    //     (a, b) =>
    //       a.model.diffWithSpecialEnclosure - b.model.diffWithSpecialEnclosure
    //   );
    //   break;
    // case SortOrder.DIFF_DESC:
    //   ratedBaseCards.sort(
    //     (a, b) =>
    //       b.model.diffWithSpecialEnclosure - a.model.diffWithSpecialEnclosure
    //   );
    //   break;
    // case SortOrder.RATING_DESC:
    // ratedBaseCards.sort((a, b) => {
    //   if ((b.rating ?? -1) !== (a.rating ?? -1)) {
    //     return (b.rating ?? -1) - (a.rating ?? -1);
    //   } else {
    //     return (b.ratingCount ?? -1) - (a.ratingCount ?? -1);
    //   }
    // });
    // break;
  }

  return (
    <CardList>
      {ratedBaseCards.map((ratedBaseCard: IBaseCard) => (
        <div
          key={ratedBaseCard.id}
          className='scale-100 sm:mb-1 sm:scale-100 md:mb-4 md:scale-100'
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
