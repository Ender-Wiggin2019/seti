/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-21 00:27:12
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { PreviewBaseCard } from '@/components/cards/base_cards/PreviewBaseCard';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';

import { IBaseCard } from '@/types/BaseCard';
import { getAllCardIds, getCardById } from '@/utils/card';

type Props = {
  // Add custom props here
};

export default function Page(
  _props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const router = useRouter();

  /* {router.query.id} 根据这个获得BaseCard*/
  if (typeof router.query.id !== 'string') return null;
  const card = getCardById(router.query.id);

  if (!card) return null;
  return (
    <Layout>
      <Seo templateTitle={`Seti Card #${card.id} ${card.name}`} />
      <div className='mb-24 flex flex-col'>
        <div className='flex flex-col items-center pt-48 lg:pt-48'>
          <div className='flex flex-row scale-[2]'>
            <PreviewBaseCard card={card as IBaseCard} />
          </div>
        </div>
      </div>
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

// @ts-ignore
export async function getStaticPaths({ locales }) {
  const ids = getAllCardIds();
  const paths = ids
    .map((id) =>
      locales.map((locale: string) => ({
        params: { id: id.toString() },
        locale, //locale should not be inside `params`
      })),
    )
    .flat(); // to avoid nested array
  return {
    paths,
    fallback: false,
  };
}
