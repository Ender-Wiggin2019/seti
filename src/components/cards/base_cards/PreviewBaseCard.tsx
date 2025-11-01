/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-28 12:05:53
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-01 23:21:30
 * @Description:
 */
import { useTranslation } from 'next-i18next';
import React from 'react';

import { FAQ } from '@/components/cards/base_cards/FAQ';
import { FlavorText } from '@/components/cards/base_cards/FlavorText';
import { CardRender } from '@/components/form/CardRender';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { BaseCard } from './BaseCard';

import { IBaseCard } from '@/types/BaseCard';

interface PreviewBaseCardProps {
  card: IBaseCard;
  showLink?: boolean;
  onlyId?: boolean;
}

export const PreviewBaseCard: React.FC<PreviewBaseCardProps> = ({
  card,
  showLink,
  onlyId,
}) => {
  const { t } = useTranslation('seti');

  const enableEffectRender = card?.special?.enableEffectRender;
  return (
    <Dialog>
      <DialogTrigger asChild>
        {onlyId ? (
          <span className='underline underline-offset-4 font-bold cursor-pointer hover:text-primary-500'>
            #{card.id} {t(card.name)}
          </span>
        ) : (
          <div className='w-fit cursor-pointer'>
            {enableEffectRender ? (
              <CardRender card={card} />
            ) : (
              <BaseCard card={card} />
            )}
          </div>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] bg-gradient-to-b from-zinc-100 to-white backdrop-blur-lg'>
        <DialogHeader className='space-y-1 lg:space-y-1.5'>
          <DialogTitle>
            {t(card.name)} ({card.id})
          </DialogTitle>
          <DialogDescription>
            {/* Make changes to your profile here. Click save when you're done. */}
          </DialogDescription>
        </DialogHeader>
        <div className='p-4 w-full flex justify-center items-center h-[450px]'>
          <div className='scale-[2] w-fit'>
            {enableEffectRender ? (
              <CardRender card={card} />
            ) : (
              <BaseCard card={card} />
            )}
          </div>
        </div>
        {card.special?.faq && <FAQ items={card.special.faq} />}
        {!card.special?.faq && card.flavorText && (
          <div className=''>
            <h3 className='text-left text-lg font-semibold mb-3'>
              {t('Flavor Text')}
            </h3>
            <FlavorText
              id={card.id}
              flavorText={card.flavorText}
              display='normal'
            />
          </div>
        )}

        {/* <DialogFooter>
          <Button type='submit'>Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};
