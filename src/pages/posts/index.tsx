/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-03 12:45:16
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-03 12:58:44
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

// make sure to import your TextFilter
import Layout from '@/components/layout/Layout';
import { PostItem } from '@/components/posts/PostItem';
import Seo from '@/components/Seo';
import { Container } from '@/components/ui/Container';

import { Posts } from '@/constant/post';
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
        {Posts.map((post) => (
          <PostItem key={post.title} {...post} />
        ))}
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
