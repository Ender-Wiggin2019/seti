/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 12:05:53
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-15 01:19:13
 * @Description:
 */

interface PreviewBaseCardProps {
  ids: string[];
  onlyId?: boolean;
}

import { cn } from '@/lib/utils';

import { alienCards } from '@/data/alienCards';
import baseCards from '@/data/baseCards';

import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';

import { IBaseCard } from '@/types/BaseCard';
import { useTranslation } from 'next-i18next';

export const MarkCard: React.FC<PreviewBaseCardProps> = ({ ids, onlyId }) => {
  const { t } = useTranslation('common');
  const _cards = [...baseCards, ...alienCards];
  const cards: IBaseCard[] = [];
  ids.forEach((id) => {
    const card = _cards.find((card) => card.id === id);
    if (card) {
      cards.push(card);
    }
  });

  if (cards.length === 0) return null;

  if (onlyId) {
    return (
      <PreviewBaseCard key={cards[0].id} card={cards[0]} onlyId={onlyId} />
    );
  }
  return (
    <div className=''>
      <div
        className={cn(
          'flex justify-center rounded-md gap-8 md:gap-8 scale-[0.7] md:scale-100',
          { 'scale-[0.55] gap-4': cards.length >= 4 }
        )}
      >
        {cards.map((card) => (
          <div key={card.id} className=''>
            <PreviewBaseCard card={card} />
          </div>
        ))}
        {/* <p>{t('article.enlarge')}</p> */}
      </div>
    </div>
  );
};
