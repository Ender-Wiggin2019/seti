/* eslint-disable @typescript-eslint/no-non-null-assertion */
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 00:33:02
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-19 01:39:53
 * @Description:
 */
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import baseCards from '@/data/baseCards';

import { EffectFactory } from '@/components/effect/Effect';
import { CardRender } from '@/components/form/CardRender';
import { EffectsGenerator } from '@/components/form/EffectsGenerator';

import { getEffectByIconType } from '@/utils/effect';

import { Effect } from '@/types/effect';
import { EResource, ESector, TSize } from '@/types/element';
import Layout from '@/components/layout/Layout';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
  const [currentIncome, setCurrentIncome] = useState<EResource>(
    EResource.CREDIT
  );
  const [currentSector, setCurrentSector] = useState<ESector>(ESector.RED);
  const [currentImage, setCurrentImage] = useState<string>();

  console.log('🎸 [test] - currentEffects:', currentEffects);
  const handleEffectsChange = (effects: Effect[]) => {
    setCurrentEffects(effects);
  };

  const handleIncomeChange = (data: EResource) => {
    setCurrentIncome(data);
  };

  const handleSectorChange = (data: ESector) => {
    setCurrentSector(data);
  };

  const handleImageUpload = (e: any) => {
    if (e.target.files) setCurrentImage(URL.createObjectURL(e.target.files[0]));
  };
  const renderCard = useMemo(() => {
    return {
      ...baseCards[0],
      effects: currentEffects,
      income: currentIncome,
      sector: currentSector,
      position: { src: currentImage, row: 0, col: 0 },
    };
  }, [currentEffects, currentIncome, currentSector, currentImage]);
  return (
    <Layout>
      <div className='flex flex-col lg:flex-row gap-4 px-2'>
        <div className='relative flex flex-col w-full'>
          <div className='w-80 h-[440px]'>
            <div className='card-larger'>
              <CardRender card={renderCard} />
            </div>
            {/* <EffectContainer effects={currentEffects} /> */}
          </div>
          {/* <EffectSelector
        currentEffects={currentEffects}
        onChange={handleEffectChange}
      /> */}
          <AccordionV2 title='Effect'>
            <EffectsGenerator
              selectedEffects={[]}
              onChange={handleEffectsChange}
            />
          </AccordionV2>
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
        <AccordionV2 title='Income'>
          {/* <div className='text-white text-lg'>Income</div> */}
          <div className='w-full grid grid-cols-5 gap-4 lg:grid-cols-5 flex-shrink-0 h-40'>
            {Object.values(EResource).map((e) => {
              return (
                <div
                  key={e}
                  onClick={() => handleIncomeChange(e)}
                  className={cn(
                    'flex w-40 h-40 items-center rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 p-2 shadow-md h-18 w-18 justify-center'
                    // { 'ring-white/10 from-zinc-900/30 to-primary/80': hasEffect }
                  )}
                >
                  <EffectFactory
                    effect={{ ...getEffectByIconType(e)!, size: 'xl' as TSize }}
                  />
                </div>
              );
            })}
          </div>
        </AccordionV2>

        <AccordionV2 title='Sector'>
          {/* <div className='text-white text-lg'>Sector</div> */}
          <div className='w-full grid grid-cols-5 gap-4 lg:grid-cols-5 flex-shrink-0'>
            {Object.values(ESector).map((e) => {
              return (
                <div
                  key={e}
                  onClick={() => handleSectorChange(e as ESector)}
                  className={cn(
                    'flex w-40 h-fit items-center rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 p-2 shadow-md h-18 w-18 justify-center'
                    // { 'ring-white/10 from-zinc-900/30 to-primary/80': hasEffect }
                  )}
                >
                  <EffectFactory
                    effect={{ ...getEffectByIconType(e)!, size: 'xl' as TSize }}
                  />
                </div>
              );
            })}
          </div>
        </AccordionV2>

        <div className='grid w-full max-w-sm items-center gap-1.5'>
          <Label htmlFor='picture'>Picture</Label>
          <Input
            id='picture'
            type='file'
            onChange={(e) => handleImageUpload(e)}
          />
        </div>
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
