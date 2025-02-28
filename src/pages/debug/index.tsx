import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

// make sure to import your TextFilter
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';
import baseCards from '@/data/baseCards';
import { alienCards } from '@/data/alienCards';
import { RatedBaseCard } from '@/components/cards/base_cards/RatedBaseCard';
import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');
  const _card = alienCards[0];
  const card = _card;
  // const card = {..._card, position: {src: '', row: 0, col: 0}};
  const ratedCard = {
    id: card.id,
    card: card,
    model: {} as any,
    rating: 3,
    ratingCount: 10,
  };
  return (
    <div className='p-4'>
      <PreviewBaseCard card={card} showLink={true} />
      <RatedBaseCard cardData={ratedCard} showLink={true} />
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh-CN', ['common', 'seti'])),
  },
});
