/* eslint-disable @next/next/no-img-element */

import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import { fanMadeCorps } from '@/data/fanMadeCorps';

import CorpCard from '@/components/corp/CorpCard';
import ModelCard from '@/components/corp/ModelCard';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';

type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');

  return (
    <Layout>
      <Seo templateTitle='About' />
      <Container>
        <h1 className='text-3xl font-bold text-center mt-8'>
          {t('粉丝自制公司 V0.1')}
        </h1>
        <p className='text-center text-gray-300 mt-2'>{t('corps.desc')}</p>
        <div className='mt-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
          {fanMadeCorps.map((card) => {
            return (
              <div className='flex justify-center gap-4' key={card.name}>
                <div className='bg-zinc-50 rounded-md relative shadow-lg p-4 hover:bg-white duration-300 hover:z-10'>
                  <div className='flex flex-col items-start justify-center'>
                    <h2 className='text-black text-2xl font-bold text-center mb-2'>
                      {card.name}
                    </h2>
                    <p className='text-gray-700 text-lg mb-2'>
                      {t('设计者')}: {card.author}
                    </p>
                    <CorpCard corp={card} />
                    <ModelCard corp={card} round={4} />
                  </div>
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
