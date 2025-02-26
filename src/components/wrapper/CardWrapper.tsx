/*
 * @Author: Ender-Wiggin
 * @Date: 2024-07-07 17:11:51
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-25 01:39:10
 * @Description:
 */
import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { BaseCard } from '@/components/cards/base_cards/BaseCard';

import { getCardById } from '@/utils/GetCardById';

import {
  isBaseCard,
  isEndGameCard,
  isProjectCard,
  isSponsorCard,
} from '@/types/Card';

interface CardWrapperProps {
  id: string;
  canSelect: boolean;
  disable: boolean;
  index?: number;
  onSelect?: (id: string, add: boolean) => void;
  initSelect?: boolean;
  preview?: boolean;
  // children: React.ReactNode;
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  id,
  canSelect,
  disable,
  index,
  initSelect,
  preview,
  // children,
  onSelect,
}) => {
  const [selected, setSelected] = useState(initSelect || false);

  useEffect(() => {
    setSelected(initSelect || false);
  }, [initSelect]);

  const handleSelect = () => {
    if ((!canSelect || disable) && !selected) return;
    setSelected(!selected);
    if (onSelect) {
      onSelect(id, !selected);
    }
  };
  const cardData = getCardById(id);
  if (!cardData) {
    return null;
  }

  const Card = isBaseCard(cardData) ? <BaseCard card={cardData} /> : null;
  return (
    <div
      className={cn('player-board-hand w-min cursor-pointer', {
        'rounded-sm ring-4 ring-primary-500 ring-offset-2': selected,
        preview: preview,

        'cursor-auto': !canSelect,
        'cursor-not-allowed grayscale': disable && !selected,
      })}
      onClick={handleSelect}
    >
      {Card}
    </div>
  );
};

export default CardWrapper;
