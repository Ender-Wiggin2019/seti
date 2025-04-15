/*
 * @Author: Ender-Wiggin
 * @Date: 2025-04-14 17:16:03
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-15 00:23:14
 * @Description:
 */
import fs from 'fs';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import path from 'path';
import React from 'react';

// make sure to import your TextFilter
import { MarkdownContainer } from '@/components/MarkdownContainer';
type Props = {
  title: string;
  content: string;
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const content = _props.content;

  return <MarkdownContainer title={_props.title} content={content} />;
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const post = locale?.includes('zh') ? 'model-zh.md' : 'model.md';
  const title = locale?.includes('zh')
    ? '基础模型介绍'
    : 'SETI Strategy: Basic Model';
  const filePath = path.join(process.cwd(), 'src/posts', post);
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
