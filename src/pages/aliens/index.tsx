/*
 * @Author: Ender-Wiggin
 * @Date: 2025-04-22 00:15:55
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-22 01:12:36
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

// make sure to import your TextFilter
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

      <Container className='w-full flex flex-col justify-start items-center'>
        <div className='flex justify-center items-center rounded-2xl ring-2 ring-white/10 max-w-96 h-32 container-oumuamua'>
          <span className='alien-text'>Oumuamua</span>
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
