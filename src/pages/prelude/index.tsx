/*
 * @Author: Ender-Wiggin
 * @Date: 2025-11-05 00:08:55
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-12-01 16:48:53
 * @Description: Prelude Cards Page
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { PreludeCard } from '@/components/cards/prelude';
import CardList from '@/components/cards/shared/CardList';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';
import { preludeCards } from '@/data/preludeCards';

import { IPreludeCard } from '@/types/prelude';

type Props = {
  // Add custom props here
};

export default function PreludePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation('common');

  return (
    <Layout>
      <Seo templateTitle='Prelude' />
      <Container>
        <div className='mt-4'>
          <h1 className='mb-4 text-2xl font-bold text-white'>
            {t('Prelude Cards')}
          </h1>
          <CardList>
            {preludeCards.map((card: IPreludeCard) => (
              <div
                key={card.id}
                className='scale-100 sm:mb-1 sm:scale-100 md:mb-4 md:scale-100 md:translate-y-8'
              >
                <PreludeCard card={card} />
              </div>
            ))}
          </CardList>
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
