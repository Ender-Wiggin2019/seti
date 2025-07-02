/*
 * @Author: Ender-Wiggin
 * @Date: 2025-07-02 11:29:51
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-02 11:29:58
 * @Description:
 */
/* eslint-disable @next/next/no-img-element */

import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import { fanMadeCorps } from '@/data/fanMadeCorps';

import { CorpRenderCard } from '@/components/corp/CorpRenderCard';

type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');

  return (
    <div>
      <CorpRenderCard corp={fanMadeCorps[0]} />
    </div>
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
