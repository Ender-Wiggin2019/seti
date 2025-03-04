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

import { AdvancedFilter } from '@/components/filters/AdvancedFilter';

import { EResource, IIconItem } from '@/types/element';
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
  const ratedCard = {
    id: card.id,
    card: card,
    model: {} as any,
    rating: 3,
    ratingCount: 10,
  };

  const iconItem: IIconItem = {
    // type: EResource.MOVE,
    // type: EResource.DATA,
    type: EResource.PUBLICITY,

    value: 1,
    options: {
      showValue: true,
      diamondShape: true,
    },
  };
  return (
    <div className='p-4'>
      {/* <PreviewBaseCard card={card} showLink={true} />
      <PreviewBaseCardV2 card={card} showLink={true} />
      <IconFactory iconItem={getIcon(e.ORBIT())} /> */}
      <AdvancedFilter onFilterChange={(tag) => () => tag} reset={false} />
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
