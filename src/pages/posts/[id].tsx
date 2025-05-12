/*
 * @Author: Ender-Wiggin
 * @Date: 2025-04-14 17:16:03
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-12 20:50:35
 * @Description:
 */
import fs from 'fs';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import path from 'path';
import React from 'react';

// make sure to import your TextFilter
import { MarkdownContainer } from '@/components/MarkdownContainer';

import { Posts } from '@/constant/post';

type Props = {
  title: string;
  content: string;
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const content = _props.content;
  const postItem = Posts.find((p) => p.title === _props.title);

  return (
    <MarkdownContainer
      title={_props.title}
      content={content}
      giscusProps={postItem?.giscusProps}
    />
  );
}

export const getStaticProps: GetStaticProps<Props> = async (props) => {
  const { locale, params } = props;
  const pageId = String(params?.id || '');
  const postItem = Posts.find((post) => post.path === pageId);
  if (!postItem) {
    throw new Error('Please config this post in constant/Posts.');
  }
  console.log(
    '🎸 [test] - constgetStaticProps:GetStaticProps<Props>= - props:',
    props
  );

  const mdPath = locale?.includes('zh')
    ? `${postItem.path}-zh.md`
    : `${postItem.path}.md`;
  const title = postItem.title;
  const filePath = path.join(process.cwd(), 'src/posts', mdPath);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'zh-CN', [
        'common',
        'seti',
        'flavorText',
      ])),
      title,
      content: fileContents,
    },
  };
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function getStaticPaths({ locales }) {
  const paths = Posts.map((post) =>
    locales.map((locale: string) => ({
      params: { id: post.path },
      locale, //locale should not be inside `params`
    }))
  ).flat(); // to avoid nested array
  return {
    paths,
    fallback: false,
  };
}
