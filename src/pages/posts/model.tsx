/*
 * @Author: Ender-Wiggin
 * @Date: 2025-04-14 17:16:03
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-14 19:03:26
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
  content: string;
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const content = _props.content;

  return <MarkdownContainer content={content} />;
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const filePath = path.join(process.cwd(), 'src/posts', 'model.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');

  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'zh-CN', [
        'common',
        'seti',
        'flavorText',
      ])),
      content: fileContents,
    },
  };
};
