import React from 'react';

import { AnimalModelCard } from '@/components/cards/base_cards/models/AnimalModelCard';
import {
  PopHover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/PopHover';

import { BaseCard } from './BaseCard';

import { IBaseCard } from '@/types/IBaseCard';

interface RatedBaseCardProps {
  cardData: IBaseCard;
  showLink: boolean;
}

export const RatedBaseCard: React.FC<RatedBaseCardProps> = ({
  cardData,
  showLink,
}) => {
  const { animalCard, model, rating, ratingCount } = cardData;

  return (
    <>
      <PopHover>
        <PopoverTrigger>
          <BaseCard card={animalCard} />
        </PopoverTrigger>
        <PopoverContent className='z-20 -mt-56 w-48 bg-zinc-50/95 p-2 md:-mt-64 md:w-52'>
          <AnimalModelCard
            id={animalCard.id}
            model={model}
            showLink={showLink}
            rating={rating}
            ratingCount={ratingCount}
          />
        </PopoverContent>
      </PopHover>
    </>
  );
};
