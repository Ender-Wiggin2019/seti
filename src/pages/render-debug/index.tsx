/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-11 23:41:00
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-17 01:22:05
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import { PureCardList } from '@/components/cards/base_cards/PureCardList';
// make sure to import your TextFilter
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';

import { Tier } from '@/constant/tier';
import { getCardsById } from '@/utils/card';
import baseCards from '@/data/baseCards';
import { sortCards } from '@/utils/sort';
import BaseCardType from '@/types/BaseCard';
import { BaseCard } from '@/components/cards/base_cards/BaseCard';
import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
import { CardRender } from '@/components/form/CardRender';
type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');
  const cards = sortCards(baseCards);
  return (
    <Layout>
      <Seo templateTitle='About' />
      <Container>
        <div className='mt-4 flex flex-col'>
          {cards.map((card) => {
            const oriCard: BaseCardType = {
              ...card,
              special: { enableEffectRender: false },
            };
            const renderCard: BaseCardType = {
              ...card,
              special: { enableEffectRender: true },
            };
            return (
              <div className='flex justify-start gap-4' key={oriCard.id}>
                <div className='text-xl text-white'>{oriCard.id}</div>
                <div className='relative'>
                  <PreviewBaseCard card={oriCard} />
                </div>
                <div className='relative'>
                  <CardRender card={renderCard} />
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Layout>
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
