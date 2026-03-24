/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-03 12:45:16
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-12-01 16:48:07
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
  _props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  const lang = (_props as any)?._nextI18Next?.initialLocale;
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
