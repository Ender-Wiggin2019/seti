import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import Layout from '@/components/layout/Layout';
import { DownloadableReplayItem } from '@/components/replay-card';

import { REPLAY_LIST } from '@/constant/replay';

/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-22 00:25:32
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-05-22 01:11:54
 * @Description:
 */
export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  return (
    <Layout>
      <div className='flex flex-col gap-4 p-4'>
        {REPLAY_LIST.map((item) => (
          <DownloadableReplayItem
            key={String(item.round) + item.turn}
            {...item}
          />
        ))}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh-CN', [
      'common',
      'seti',
      'flavorText',
    ])),
  },
});
