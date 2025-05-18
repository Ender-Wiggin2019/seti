/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-03 12:45:16
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-18 21:14:38
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lang = (_props as any)?._nextI18Next?.initialLocale;
  const { t } = useTranslation('common');
  const posts = lang === 'en' ? Posts.filter((p) => !p.cnOnly) : Posts;
  return (
    <Layout>
      <Seo templateTitle='About' />

      <Container>
        <div className='mt-8 flex flex-col justify-start items-center gap-4'>
          {posts.map((post) => (
            <PostItem key={post.title} {...post} />
          ))}
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
