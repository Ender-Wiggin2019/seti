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
import { PreludeCard } from '@/components/cards/prelude';
import withDownloadable from '@/components/form/withDownloadable';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';
import { preludeCards } from '@/data/preludeCards';

import { IPreludeCard } from '@/types/prelude';

type PreludeCardProps = {
  card: IPreludeCard;
};

const DownloadablePreludeCard = withDownloadable<PreludeCardProps>(
  PreludeCard,
  (props) => props.card.id + '.png',
);
type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t: _t } = useTranslation('common');

  return (
    <Layout>
      <Seo templateTitle='Prelude Debug' />
      <Container>
        <div className='mt-4 flex flex-col gap-2'>
          {preludeCards.map((card: IPreludeCard) => {
            return (
              <div className='flex justify-start gap-4' key={card.id}>
                <div className='text-xl text-white'>{card.id}</div>
                <div className='relative'>
                  <PreludeCard card={card} />
                </div>
                <div className='relative'>
                  <DownloadablePreludeCard card={card} />
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
