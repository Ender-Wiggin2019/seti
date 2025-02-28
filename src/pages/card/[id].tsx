/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 13:08:14
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import { BaseCard } from '@/components/cards/base_cards/BaseCard';
import { HoverCard } from '@/components/cards/base_cards/HoverCard';
import { Comments } from '@/components/comments/Comments';
// make sure to import your TextFilter
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';

import { getAllCardIds, getCardById } from '@/utils/card';

import BaseCardType from '@/types/BaseCard';
type Props = {
  // Add custom props here
};

export default function Page(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const router = useRouter();

  /* {router.query.id} 根据这个获得BaseCard*/
  const { t } = useTranslation('common');
  if (typeof router.query.id !== 'string') return null;
  const card = getCardById(router.query.id);

  if (!card) return null;
  return (
    <Layout>
      <Seo templateTitle={`Seti Card #${card.id} ${card.name}`} />
      <div className='mb-24 flex flex-col'>
        <div className='flex flex-col items-center py-24 md:py-36 lg:pb-48 lg:pt-36'>
          <div className='flex flex-row md:scale-125 lg:scale-150'>
            <div className='mr-3 flex-initial md:mr-10 lg:mr-20'>
              <BaseCard card={card as BaseCardType} />
            </div>
            <HoverCard card={card} showLink={false} />
          </div>
        </div>

        <Comments cardId={router.query.id} />
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh-CN', ['common', 'seti'])),
  },
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function getStaticPaths({ locales }) {
  const ids = getAllCardIds();
  const paths = ids
    .map((id) =>
      locales.map((locale: string) => ({
        params: { id: id.toString() },
        locale, //locale should not be inside `params`
      }))
    )
    .flat(); // to avoid nested array
  return {
    paths,
    fallback: false,
  };
}
