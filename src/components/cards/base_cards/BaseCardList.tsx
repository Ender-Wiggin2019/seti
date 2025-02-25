/*
 * @Author: Ender-Wiggin
 * @Date: 2024-06-27 23:56:37
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-25 01:30:05
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

import { CardSource } from '@/types/CardSource';
import { IBaseCard } from '@/types/IBaseCard';
import { IRating } from '@/types/IRating';
import { SortOrder } from '@/types/Order';
import { OtherTag, Tag } from '@/types/Tags';
import generateCards from '@/utils/generateCards';
import BaseCardType from '@/types/BaseCard';

interface BaseCardListProps {
  selectedTags?: Tag[];
  selectedRequirements?: Tag[];
  selectedCardSources?: CardSource[];
  textFilter?: string;
  sortOrder?: SortOrder;
  size?: number[];
  onCardCountChange: (count: number) => void;
  maxNum?: number;
  // ... any other filters
}

const cards: BaseCardType[] = [...generateCards(7, 10, '/images/cards/cards-1.webp'), ...generateCards(7, 10, '/images/cards/cards-2.webp')];

const filterAnimals = (
  animals: BaseCardType[],
  selectedTags: Tag[] = [],
  selectedRequirements: Tag[] = [],
  selectedCardSources: CardSource[] = [],
  textFilter = '',
  size: number[] = [0],
  maxNum?: number
) => {
  const lowercaseFilter = textFilter.toLowerCase();

  const res = animals;

  return {
    originalCount: res.length,
    limitedCount: res.length,
    cards: res,
  };
};

export const BaseCardList: React.FC<BaseCardListProps> = ({
  selectedTags,
  selectedRequirements,
  selectedCardSources = [],
  textFilter,
  onCardCountChange,
  sortOrder = SortOrder.ID_ASC,
  size = [0],
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

  // const animalsData = useBaseCardData();
  const animalsData = cards;
  const { originalCount, cards: filteredAnimals } = filterAnimals(
    animalsData,
    selectedTags,
    selectedRequirements,
    selectedCardSources,
    textFilter,
    size,
    maxNum
  );

  const combineDataWithRatings = (
    animals: BaseCardType[],
    ratings: IRating[]
  ): IBaseCard[] => {
    return animals.map((animal) => {
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
    return filteredAnimals.map((animal) => ({
      id: animal.id,
      animalCard: animal,
      model: getBaseCardModel(animal),
      rating: null,
      ratingCount: null,
    }));
  }, [filteredAnimals]);

  const ratedBaseCards: IBaseCard[] = useMemo(() => {
    if (!cardRatings) {
      return initialBaseCards;
    }
    return combineDataWithRatings(filteredAnimals, cardRatings);
  }, [filteredAnimals, cardRatings, initialBaseCards]);

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
