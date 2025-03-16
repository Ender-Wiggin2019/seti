/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 00:33:02
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-16 11:54:16
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useMemo, useState } from 'react';

import baseCards from '@/data/baseCards';

import { CardRender } from '@/components/form/CardRender';
import { EffectsGenerator } from '@/components/form/EffectsGenerator';

import { Effect } from '@/types/effect';

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
  const handleEffectsChange = (effects: Effect[]) => {
    setCurrentEffects(effects);
  };

  const renderCard = useMemo(() => {
    return {
      ...baseCards[0],
      effects: currentEffects,
    };
  }, [currentEffects]);
  return (
    <div className='relative p-4 flex flex-col w-full'>
      <div className=''>
        {/* <EffectContainer effects={currentEffects} /> */}
        <CardRender card={renderCard} />
      </div>
      {/* <EffectSelector
        currentEffects={currentEffects}
        onChange={handleEffectChange}
      /> */}

      <EffectsGenerator selectedEffects={[]} onChange={handleEffectsChange} />
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
