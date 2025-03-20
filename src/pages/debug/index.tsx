/* eslint-disable @typescript-eslint/no-non-null-assertion */
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 00:33:02
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-21 01:52:34
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
import { EffectSelector } from '@/components/form/EffectSelector';
import { EffectsGenerator } from '@/components/form/EffectsGenerator';
import Layout from '@/components/layout/Layout';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  effects2FreeAction,
  getEffectByIconType,
  updateEffectArray,
} from '@/utils/effect';

import BaseCard from '@/types/BaseCard';
import { Effect } from '@/types/effect';
import { EResource, ESector, TSize } from '@/types/element';
import { Button } from '@/components/ui/button';

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
  const card = { ..._card, position: { src: '', row: 1, col: 1 } };

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
  const [currentCredit, setCurrentCredit] = useState<string>();
  const [currentTitle, setCurrentTitle] = useState<string>();
  const [currentFlavorText, setCurrentFlavorText] = useState<string>();
  const [currentFreeActions, setCurrentFreeActions] = useState<Effect[]>([]);

  const handleReset = () => {
    setCurrentEffects([]);
    setCurrentIncome(EResource.CREDIT);
    setCurrentSector(ESector.RED);
    setCurrentCredit('');
    setCurrentTitle('');
    setCurrentFlavorText('');
    setCurrentFreeActions([]);
    setCurrentImage('');
  };
  console.log('🎸 [test] - currentEffects:', currentEffects);
  const handleEffectsChange = (effects: Effect[]) => {
    setCurrentEffects(effects);
  };

  const handleIncomeChange = (data: EResource) => {
    setCurrentIncome(data);
  };

  const handleFreeActionChange = (effect: Effect) => {
    setCurrentFreeActions((prevEffects) =>
      updateEffectArray(prevEffects, effect)
    );
  };

  const handleSectorChange = (data: ESector) => {
    setCurrentSector(data);
  };

  const handleImageUpload = (e: any) => {
    if (e.target.files) setCurrentImage(URL.createObjectURL(e.target.files[0]));
  };

  const handleCreditChange = (data: string) => {
    setCurrentCredit(data);
  };

  const handleTitleChange = (data: string) => {
    setCurrentTitle(data);
  };

  const handleFlavorTextChange = (data: string) => {
    setCurrentFlavorText(data);
  };

  const renderCard = useMemo(() => {
    const res: BaseCard = {
      ...baseCards[0],
      effects: currentEffects,
      income: currentIncome,
      sector: currentSector,
      // position: { src: currentImage || '', row: 0, col: 0 },
      image:
        currentImage ||
        'https://m.media-amazon.com/images/M/MV5BMDdkYWZiZWYtMzA0Yi00NzNlLThkODktY2Q3N2NjN2ExZmMwXkEyXkFqcGc@._V1_.jpg',
      price: Number(currentCredit) || 0,
      name: currentTitle || '',
      flavorText: currentFlavorText,
      freeAction: effects2FreeAction(currentFreeActions),
    };

    return res;
  }, [
    currentEffects,
    currentIncome,
    currentSector,
    currentImage,
    currentCredit,
    currentTitle,
    currentFlavorText,
    currentFreeActions,
  ]);
  return (
    <Layout>
      <div className='flex flex-col lg:flex-row gap-4 px-2'>
        <div className='relative flex flex-col w-full lg:w-3/5'>
          <div className='w-80 h-[440px]'>
            <div className='card-larger'>
              <CardRender card={renderCard} />
            </div>
            {/* <EffectContainer effects={currentEffects} /> */}
          </div>
          <Button variant='destructive' className='w-20' onClick={handleReset}>
            Reset
          </Button>
          {/* <Button variant="highlight" className="w-20" onClick={handleExport}>Export</Button> */}

          {/* <EffectSelector
        currentEffects={currentEffects}
        onChange={handleEffectChange}
      /> */}
          <AccordionV2 title='Effect'>
            <EffectsGenerator
              selectedEffects={currentEffects}
              onChange={(e) => handleEffectsChange(e)}
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
        <div className='flex flex-col gap-2'>
          <AccordionV2 title='Free Action'>
            <EffectSelector
              currentEffects={currentFreeActions}
              onChange={handleFreeActionChange}
            />
          </AccordionV2>

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
                      effect={{
                        ...getEffectByIconType(e)!,
                        size: 'xl' as TSize,
                      }}
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
                      effect={{
                        ...getEffectByIconType(e)!,
                        size: 'xl' as TSize,
                      }}
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
          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='credit'>credit</Label>
            <Input
              type='credit'
              id='credit'
              placeholder='credit'
              onChange={(e) => handleCreditChange(e.target.value)}
            />
          </div>
          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='title'>Title</Label>
            <Input
              type='title'
              id='title'
              placeholder='title'
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='title'>Flavor Text</Label>
            <Input
              type='title'
              id='title'
              placeholder='title'
              onChange={(e) => handleFlavorTextChange(e.target.value)}
            />
          </div>
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
