/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 00:33:02
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-13 00:13:39
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useState } from 'react';

import baseCards from '@/data/baseCards';

import { EffectContainer } from '@/components/effect/EffectContainer';
import { EffectSelector } from '@/components/form/EffectSelector';

import { EEffectType, Effect, IBaseEffect } from '@/types/effect';
import { updateEffectArray } from '@/utils/effect';
import { EffectsGenerator } from '@/components/form/EffectsGenerator';
import Layout from '@/components/layout/Layout';

// make sure to import your TextFilter
type Props = {
  // Add custom props here
};

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');
  const _card = baseCards.filter((c) => c.id === '76')[0];

  // const _card = testCards.filter((c) => c.id === 'test')[0];
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
  // const effects = [
  //   e.MOVE(1),
  //   DESC_WITH_TYPE(
  //     ETrace.BLUE,
  //     '{move-2} {score-2} test {orbit-action-1} test'
  //   ),
  // ];
  const [currentEffects, setCurrentEffects] = useState<Effect[]>([]);
  console.log('🎸 [test] - currentEffects:', currentEffects);
  const handleEffectChange = (effect: IBaseEffect) => {
    console.log('🎸 [test] - handleEffectChange - effect:', effect);

    setCurrentEffects((prevEffects) => updateEffectArray(prevEffects, effect));
  };
  return (
    <Layout>
      <div className='relative p-4 flex flex-col w-full'>
        <div className='relative z-50 h-64'>
          <EffectContainer effects={currentEffects} />
        </div>
        {/* <EffectSelector
        currentEffects={currentEffects}
        onChange={handleEffectChange}
      /> */}

        <EffectsGenerator selectedEffects={[]} />
        <div></div>
        {/* <PreviewBaseCard card={_card} showLink={true} /> */}
        {/* <PreviewBaseCard card={card} showLink={true} />
      <PreviewBaseCardV2 card={card} showLink={true} /> */}
        {/* <IconFactory iconItem={getIconItem(e.ORBIT())} />
      <IconFactory iconItem={getIconItem(e.MOVE(2))} />
      <IconFactory iconItem={getIconItem(e.PUBLICITY(2))} /> */}
        {/* {effects.map((effect, index) => (
        <EffectFactory key={index} effect={effect} />
      ))}
       */}
        {/* {card.effects && <EffectContainer effects={card.effects} />} */}
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
