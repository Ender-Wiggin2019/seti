/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ArrowBigDownDash, ArrowBigUpDash, Undo2 } from 'lucide-react';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { EffectFactory } from '@/components/effect/Effect';
import { CardRender } from '@/components/form/CardRender';
import { EffectSelector } from '@/components/form/EffectSelector';
import { EffectsGenerator } from '@/components/form/EffectsGenerator';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  effects2FreeAction,
  freeAction2Effect,
  freeActions2Effects,
  getEffectByIconType,
  updateEffectArray,
} from '@/utils/effect';
import { downloadImage, exportToJson } from '@/utils/file';

import { IBaseCard } from '@/types/BaseCard';
import { Effect } from '@/types/effect';
import { EResource, ESector, TSize } from '@/types/element';
import { DEFAULT_BASE_CARD } from '@/data/defaultCards';

type Props = {
  // Add custom props here
};

const MAX_HISTORY = 10;

export default function DiyPage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const downloadRef = React.useRef<HTMLDivElement>(null);

  const [card, setCard] = useState<IBaseCard>(DEFAULT_BASE_CARD);
  const [history, setHistory] = useState<IBaseCard[]>([]);
  const [useUrl, setUseUrl] = useState(false);
  const [loading, setLoading] = useState(false);

  const pushToHistory = (newCard: IBaseCard) => {
    setHistory((prevHistory) => {
      const newHistory = [newCard, ...prevHistory];
      return newHistory.length > MAX_HISTORY
        ? newHistory.slice(0, MAX_HISTORY)
        : newHistory;
    });
  };

  const updateCard = (updates: Partial<IBaseCard>) => {
    pushToHistory(card);
    setCard((prevCard) => ({ ...prevCard, ...updates }));
  };

  const undo = () => {
    if (history.length > 0) {
      const [lastState, ...restHistory] = history;
      setCard(lastState);
      setHistory(restHistory);
    }
  };

  const updateSpecial = (updates: Partial<IBaseCard['special']>) => {
    pushToHistory(card);
    setCard((prevCard) => ({
      ...prevCard,
      special: { ...prevCard.special, ...updates },
    }));
  };

  const handleReset = () => {
    pushToHistory(card);
    const resetCard = DEFAULT_BASE_CARD;
    setCard(resetCard);
  };

  const handleEffectsChange = (effects: Effect[]) => {
    updateCard({ effects });
  };

  const handleIncomeChange = (income: EResource) => {
    updateCard({ income });
  };

  const handleFreeActionChange = (effect: Effect) => {
    updateCard({
      freeAction: effects2FreeAction(
        updateEffectArray(freeActions2Effects(card.freeAction || []), effect)
      ),
    });
  };

  const handleSectorChange = (sector: ESector) => {
    updateCard({ sector });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImageUpload = (e: any) => {
    if (e.target.files)
      updateCard({ image: URL.createObjectURL(e.target.files[0]) });
  };

  const handleSetImage = (image: string) => {
    updateCard({ image });
  };

  const handleCreditChange = (price: string) => {
    updateCard({ price: Number(price) || 0 });
  };

  const handleTitleChange = (name: string) => {
    updateCard({ name });
  };

  const handleTitleHeightChange = (height: number) => {
    updateSpecial({
      titleHeight: Math.max((card?.special?.titleHeight || 95) + height, 45),
    });
  };

  const handleFlavorTextChange = (flavorText: string) => {
    updateCard({ flavorText });
  };

  const handlePriceTypeChange = (priceType: EResource) => {
    updateCard({ priceType });
  };

  const handleUrlChange = () => {
    setUseUrl((prev) => !prev);
  };

  const handleDownloadImage = async () => {
    setLoading(true);
    toast({ title: 'Please wait...' });
    downloadImage(
      downloadRef.current,
      card.name,
      (msg: string) => {
        setLoading(false);
        toast({ title: msg, variant: 'success' });
      },
      (msg: string) => {
        toast({ title: msg, variant: 'destructive' });
      }
    );
  };

  const handleExport = () => {
    exportToJson(card);
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (!e.target.files) {
      return;
    }
    fileReader.readAsText(e.target.files[0], 'UTF-8');
    fileReader.onload = (event) => {
      if (!event.target) {
        return;
      }
      try {
        const parsedData = JSON.parse(event.target.result as string);
        // if (!parsedData?.special?.fanMade) {
        //   throw new Error(t('Not Validate!'));
        // }
        setCard(parsedData);
      } catch (error) {
        alert(t("Failed to parse the JSON. Please ensure it's a valid JSON."));
      }
    };
  };

  const renderCard = useMemo(() => {
    return {
      ...card,
    };
  }, [card]);

  return (
    <Layout>
      <Seo templateTitle='Card Editor' />
      <div className='flex flex-col lg:flex-row gap-4 px-2'>
        <div className='relative flex flex-col w-full lg:w-3/5'>
          <div className='relative w-80 h-[440px]'>
            <div className='card-larger'>
              <div ref={downloadRef}>
                <CardRender card={renderCard} />
              </div>
            </div>
            <div className='absolute -right-8 flex flex-col gap-4'>
              <Button
                variant='dark'
                className='w-10 h-10 text-md p-0 hover:text-primary'
                onClick={() => handleTitleHeightChange(-10)}
              >
                <ArrowBigUpDash />
              </Button>
              <Button
                variant='dark'
                className='w-10 h-10 text-md p-0 hover:text-primary'
                onClick={() => handleTitleHeightChange(10)}
              >
                <ArrowBigDownDash />
              </Button>
            </div>
          </div>
          <div className='flex justify-start items-center gap-2 mb-2'>
            <Button
              variant='default'
              className='w-20'
              disabled={history.length === 0}
              onClick={undo}
            >
              <Undo2 />
              {t('Undo')}
            </Button>
            <Button
              variant='destructive'
              className='w-20 mr-8'
              disabled={history.length === 0}
              onClick={handleReset}
            >
              {t('Reset')}
            </Button>
            <Button
              variant='default'
              className='w-20'
              onClick={handleDownloadImage}
            >
              {t('Download')}
            </Button>
            <Button variant='default' className='w-20' onClick={handleExport}>
              {t('Export')}
            </Button>
          </div>
          <AccordionV2 title={t('Effect')}>
            <EffectsGenerator
              selectedEffects={card.effects}
              onChange={handleEffectsChange}
            />
          </AccordionV2>
        </div>
        <div className='flex flex-col gap-2'>
          <EffectSelector
            title={t('Free Action')}
            currentEffects={
              card.freeAction?.map((a) => freeAction2Effect(a)) || []
            }
            icons={[
              EResource.PUBLICITY,
              EResource.DATA,
              EResource.MOVE,
              EResource.SCORE,
            ]}
            onChange={handleFreeActionChange}
          />

          <AccordionV2 title={t('Income')}>
            <div className='w-full grid grid-cols-5 gap-4 lg:grid-cols-5 flex-shrink-0 h-40'>
              {Object.values(EResource).map((e) => (
                <div
                  key={e}
                  onClick={() => handleIncomeChange(e)}
                  className={cn(
                    'flex w-40 h-40 items-center rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 p-2 shadow-md h-18 w-18 justify-center'
                  )}
                >
                  <EffectFactory
                    effect={{
                      ...getEffectByIconType(e)!,
                      size: 'xl' as TSize,
                    }}
                  />
                </div>
              ))}
            </div>
          </AccordionV2>

          <AccordionV2 title={t('Sector')}>
            <div className='w-full grid grid-cols-5 gap-4 lg:grid-cols-5 flex-shrink-0'>
              {Object.values(ESector).map((e) => (
                <div
                  key={e}
                  onClick={() => handleSectorChange(e as ESector)}
                  className={cn(
                    'flex w-40 h-fit items-center rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 p-2 shadow-md h-18 w-18 justify-center'
                  )}
                >
                  <EffectFactory
                    effect={{
                      ...getEffectByIconType(e)!,
                      size: 'xl' as TSize,
                    }}
                  />
                </div>
              ))}
            </div>
          </AccordionV2>

          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='picture'>{t('Image')}</Label>
            <div className='flex gap-2'>
              {!useUrl ? (
                <Input
                  id='picture'
                  type='file'
                  accept='.jpg,.jpeg,.webp,.png'
                  onChange={handleImageUpload}
                />
              ) : (
                <Input
                  type='url'
                  id='url'
                  placeholder={t('url')}
                  value={card.image}
                  onChange={(e) => handleSetImage(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='credit'>{t('Credit')}</Label>
            <Input
              type='credit'
              id='credit'
              placeholder={t('Your card price')}
              value={card.price.toString()}
              onChange={(e) => handleCreditChange(e.target.value)}
            />
          </div>
          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='title'>{t('Title')}</Label>
            <Input
              type='title'
              id='title'
              placeholder={t('Your card title')}
              value={card.name}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='flavorText'>{t('Flavor Text')}</Label>
            <Input
              type='text'
              id='flavorText'
              value={card.flavorText}
              placeholder={t('Tell more about your card')}
              onChange={(e) => handleFlavorTextChange(e.target.value)}
            />
          </div>
          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='title'>{t('Card ID')}</Label>
            <Input
              type='text'
              id='cardId'
              value={card.id}
              placeholder={t('Enter card title')}
              onChange={(e) => updateCard({ id: e.target.value })}
            />
          </div>

          <AccordionV2 title={t('Advanced')}>
            <div className='grid w-full max-w-sm items-center gap-1.5'>
              <Label>{t('Title Color')}</Label>
              <HexColorPicker
                color={card.special?.titleColor}
                onChange={(color) => updateSpecial({ titleColor: color })}
              />
            </div>

            <AccordionV2 title={t('Price Type')}>
              <div className='w-full grid grid-cols-5 gap-4 lg:grid-cols-5 flex-shrink-0 h-40'>
                {Object.values(EResource).map((e) => (
                  <div
                    key={e}
                    onClick={() => handlePriceTypeChange(e)}
                    className={cn(
                      'flex w-40 h-40 items-center rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 p-2 shadow-md h-18 w-18 justify-center'
                    )}
                  >
                    <EffectFactory
                      effect={{
                        ...getEffectByIconType(e)!,
                        size: 'xl' as TSize,
                      }}
                    />
                  </div>
                ))}
              </div>
            </AccordionV2>
          </AccordionV2>

          <div className='grid w-full max-w-sm items-center gap-1.5'>
            <Label htmlFor='animal-json-import'>{t('diy.import_json')}</Label>
            <Input
              id='json-import'
              type='file'
              accept='.json'
              onChange={handleJsonImport}
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
