/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 00:33:02
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 11:46:47
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';

import { alienCards } from '@/data/alienCards';

import { EffectFactory } from '@/components/Effect';

import { DESC_WITH_TYPE, e } from '@/constant/effect';

import { ETrace } from '@/types/element';

// make sure to import your TextFilter
type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');
  const _card = alienCards[0];
  // const card = _card;
  const card = { ..._card, position: { src: '', row: 0, col: 0 } };

  // const iconItem: IIconItem = {
  //   // type: EResource.MOVE,
  //   // type: EResource.DATA,
  //   type: EResource.PUBLICITY,

  //   value: 1,
  //   options: {
  //     showValue: true,
  //     diamondShape: true,
  //   },
  // };
  const effects = [
    e.MOVE(1),
    DESC_WITH_TYPE(
      ETrace.BLUE,
      '{move-2} {score-2} test {orbit-action-1} test'
    ),
  ];
  return (
    <div className='p-4'>
      {/* <PreviewBaseCard card={card} showLink={true} />
      <PreviewBaseCardV2 card={card} showLink={true} /> */}
      {/* <IconFactory iconItem={getIconItem(e.ORBIT())} />
      <IconFactory iconItem={getIconItem(e.MOVE(2))} />
      <IconFactory iconItem={getIconItem(e.PUBLICITY(2))} /> */}
      {effects.map((effect, index) => (
        <EffectFactory key={index} effect={effect} />
      ))}
      <div className='scale-75'>
        {/* <DescRender desc='test {score-2} {orbit-action-1} test'/> */}
      </div>
      {/* <AdvancedFilter onFilterChange={(tag) => () => tag} reset={false} /> */}
      {/* {Object.entries(EResourceMap).map(([resource, value]) => (
        <IconFactory
          key={resource}
          iconItem={{ ...iconItem, type: resource as EResource }}
        />
      ))} */}
      {/* <IconFactory iconItem={iconItem} /> */}
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
