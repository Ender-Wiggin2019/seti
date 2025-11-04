/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-11 23:41:00
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-04 22:28:26
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import spaceAgencyAliens from '@/data/spaceAgencyAliens';

import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
import { DownloadableCardRender } from '@/components/form/DownloadableCardRender';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';

import { sortCards } from '@/utils/sort';

import { IBaseCard } from '@/types/BaseCard';
type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t: _t } = useTranslation('common');
  // const cards = sortCards([...baseCards, ...alienCards]).slice(105);
  const cards = sortCards([...spaceAgencyAliens]);

  // const cards = sortCards([...alienCards]);

  return (
    <Layout>
      <Seo templateTitle='About' />
      <Container>
        <div className='mt-4 flex flex-col gap-2'>
          {cards.map((card) => {
            const oriCard: IBaseCard = {
              ...card,
              special: { enableEffectRender: false },
            };
            const renderCard: IBaseCard = {
              ...card,
              special: { ...card.special, enableEffectRender: true },
            };
            return (
              <div className='flex justify-start gap-4' key={oriCard.id}>
                <div className='text-xl text-white'>{oriCard.id}</div>
                <div className='relative'>
                  <PreviewBaseCard card={oriCard} />
                </div>
                <div className='relative'>
                  <DownloadableCardRender card={renderCard} />
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
