/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 12:00:04
 * @Description:
 */
import React, { useState } from 'react';

import { HoverCard } from '@/components/cards/base_cards/HoverCard';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  // NOTE: rating and ratingCount are not used yet
  const { card, model, rating, ratingCount } = cardData;
  const [open, setOpen] = useState(false);
  return (
    <div className='w-fit'>
      <Popover open={open}>
        <PopoverTrigger asChild>
          <div className='w-fit' onClick={() => setOpen((prev) => !prev)}>
            <BaseCard card={card} />
          </div>
        </PopoverTrigger>
        <PopoverContent className='w-32 -mt-40 bg-zinc-50/95 p-2'>
          <HoverCard
            card={cardData.card}
            showLink={showLink}
            rating={null}
            ratingCount={null}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
