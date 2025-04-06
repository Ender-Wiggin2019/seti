import { useTranslation } from 'next-i18next';
import React, { useCallback, useEffect } from 'react';

import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
import CardList from '@/components/cards/shared/CardList';

import { filterCardsByIcons } from '@/utils/card';
import { filterText } from '@/utils/filter';

import { useBaseCardData } from './useBaseCardData';

import { EAlienType, IBaseCard } from '@/types/BaseCard';
import { CardSource } from '@/types/CardSource';
import { EResource, ESector, TIcon } from '@/types/element';
import { SortOrder } from '@/types/Order';
import { sortCards } from '@/utils/sort';

interface BaseCardListProps {
  selectedSectors?: ESector[];
  selectedFreeActions?: EResource[];
  selectedCardSources?: CardSource[];
  selectedIncomes?: EResource[];
  selectedAliens?: EAlienType[];
  advancedIcons?: TIcon[];
  textFilter?: string;
  sortOrder?: SortOrder;
  credit?: number[];
  onCardCountChange: ({ base, alien }: { base: number; alien: number }) => void;
  maxNum?: number;
  // ... any other filters
}

// const cards: IBaseCard[] = [...generateCards(7, 10, '/images/cards/cards-1.webp'), ...generateCards(7, 10, '/images/cards/cards-2.webp')];

export const BaseCardList: React.FC<BaseCardListProps> = ({
  selectedSectors,
  selectedFreeActions,
  selectedCardSources = [],
  selectedIncomes = [],
  selectedAliens = [],
  advancedIcons = [],
  textFilter,
  onCardCountChange,
  sortOrder = SortOrder.ID_ASC,
  credit = [0],
  maxNum,
}) => {
  const cardsData = useBaseCardData();
  const { t } = useTranslation('seti');

  // const cardsData = cards;
  const filterCards = useCallback(
    (
      cards: IBaseCard[],
      selectedSectors: ESector[] = [],
      selectedFreeActions: EResource[] = [],
      selectedIncomes: EResource[] = [],
      selectedAliens: EAlienType[] = [],
      advancedIcons: TIcon[] = [],
      selectedCardSources: CardSource[] = [],
      textFilter = '',
      credit: number[] = [0],
      maxNum?: number
    ) => {
      let res = cards;

      // Filter by text
      const lowercaseFilter = textFilter.toLowerCase();
      if (lowercaseFilter) {
        res = filterText(lowercaseFilter, res, t);
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

      // Filter by advanced icons
      // TODO: just a demo yet
      if (advancedIcons.length > 0) {
        res = filterCardsByIcons(res, advancedIcons);
      }

      // Filter by credit
      res = res.filter(
        (card) =>
          credit.length === 0 ||
          credit.includes(5) ||
          credit.includes(card.price)
      );

      return {
        originalCount: res.filter((c) => !c.alien).length,
        alienCount: res.filter((c) => c.alien).length,
        limitedCount: res.length,
        cards: res,
      };
    },
    [t]
  );

  let {
    originalCount,
    alienCount,
    cards: filteredCards,
  } = filterCards(
    cardsData,
    selectedSectors,
    selectedFreeActions,
    selectedIncomes,
    selectedAliens,
    advancedIcons,
    selectedCardSources,
    textFilter,
    credit,
    maxNum
  );

  useEffect(() => {
    onCardCountChange({ base: originalCount, alien: alienCount });
  }, [originalCount, alienCount, onCardCountChange]);

  switch (sortOrder) {
    case SortOrder.ID_ASC:
      filteredCards = sortCards(filteredCards);
      break;
    case SortOrder.ID_DESC:
      filteredCards = sortCards(filteredCards, false);
      break;
  }

  return (
    <CardList>
      {filteredCards.map((ratedBaseCard: IBaseCard) => (
        <div
          key={ratedBaseCard.id}
          className='scale-100 sm:mb-1 sm:scale-100 md:mb-4 md:h-64'
        >
          <div className='scale-100 md:scale-125 md:translate-y-8'>
            <PreviewBaseCard
              key={ratedBaseCard.id}
              card={ratedBaseCard}
              showLink={true}
            />
          </div>
        </div>
      ))}
    </CardList>
  );
};
