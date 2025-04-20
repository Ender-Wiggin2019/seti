/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-11 23:41:00
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-21 00:13:23
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import { alienCards } from '@/data/alienCards';

import { CardRender } from '@/components/form/CardRender';

import { IBaseCard } from '@/types/BaseCard';
type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');
  // const cards = sortCards([...baseCards, ...alienCards]).slice(105);
  // const cards = sortCards([...baseCards, ...alienCards]);

  const cards = alienCards.filter((card) => {
    const id = Number(card.id.split('.')?.[1]);
    return id >= 0 && id <= 10;
  }); // tts should use original sort logic

  return (
    <div className='p-4'>
      <div className='grid grid-cols-5 gap-0 w-[750px]'>
        {cards.map((card) => {
          // const oriCard: IBaseCard = {
          //   ...card,
          //   special: { enableEffectRender: false },
          // };
          const renderCard: IBaseCard = {
            ...card,
            special: { ...card.special, enableEffectRender: true },
          };
          return (
            // <div className='' key={card.id}>
            // <div className='relative w-[150px]' key={card.id}>
            <CardRender key={card.id} card={renderCard} />
            // </div>
            // </div>
          );
        })}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh-CN', [
      'common',
      'seti',
      'flavorText',
    ])),
  },
});
