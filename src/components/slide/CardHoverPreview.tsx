import { useTranslation } from 'next-i18next';
import React from 'react';

import { BaseCard } from '@/components/cards/base_cards/BaseCard';
import { ALL_CARDS } from '@/data/index';
import { IBaseCard } from '@/types/BaseCard';

type RecommendCard = {
  id: string;
  name: string;
};

interface CardHoverPreviewProps {
  card: RecommendCard;
  scale?: number;
  onCardClick?: (card: IBaseCard | null) => void;
}

const findCardById = (id: string): IBaseCard | undefined => {
  return ALL_CARDS.find((c) => c.id === id);
};

export const CardHoverPreview: React.FC<CardHoverPreviewProps> = ({
  card,
  scale = 1,
  onCardClick,
}) => {
  const fullCard = findCardById(card.id);

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(fullCard || null);
    }
  };

  if (!fullCard) {
    return (
      <span
        className='px-3 py-1 rounded-full cursor-default'
        style={{
          background: 'rgba(148, 163, 184, 0.1)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          fontSize: `${0.875 * scale}rem`,
        }}
      >
        {card.name}
      </span>
    );
  }

  return (
    <span
      className='px-3 py-1 rounded-full cursor-pointer transition-all duration-200 hover:scale-105'
      style={{
        background: 'rgba(34, 211, 238, 0.1)',
        color: '#67e8f9',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        fontSize: `${0.875 * scale}rem`,
      }}
      onClick={handleClick}
    >
      {card.name}
    </span>
  );
};
