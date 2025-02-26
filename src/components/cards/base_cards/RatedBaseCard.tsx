/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 14:47:37
 * @Description:
 */
import React from 'react';

import { HoverCard } from '@/components/cards/base_cards/HoverCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const { card, model, rating, ratingCount } = cardData;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <BaseCard card={card} />
          </TooltipTrigger>
          <TooltipContent className='bg-zinc-50/95 p-2'>
            <HoverCard
              id={card.id}
              showLink={showLink}
              rating={rating}
              ratingCount={ratingCount}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
};
