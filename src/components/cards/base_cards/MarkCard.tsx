/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 12:05:53
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-14 18:39:51
 * @Description:
 */

interface PreviewBaseCardProps {
  ids: string[];
  onlyId?: boolean;
}

import { alienCards } from '@/data/alienCards';
import baseCards from '@/data/baseCards';

import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';

import { sortCards } from '@/utils/sort';

export const MarkCard: React.FC<PreviewBaseCardProps> = ({ ids, onlyId }) => {
  const _cards = sortCards([...baseCards, ...alienCards]);
  const cards = _cards.filter((card) => ids.includes(card.id));

  if (cards.length === 0) return null;

  if (onlyId) {
    return (
      <PreviewBaseCard key={cards[0].id} card={cards[0]} onlyId={onlyId} />
    );
  }
  return (
    <div className='flex justify-center gap-4 p-1 rounded-md bg-primary-500/50'>
      {cards.map((card) => (
        <PreviewBaseCard key={card.id} card={card} />
      ))}
    </div>
  );
};
