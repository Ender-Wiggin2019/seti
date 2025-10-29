import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useEffect, useMemo, useState } from 'react';
import { FiRotateCcw } from 'react-icons/fi';

import { useSettings } from '@/hooks/useSettings';

import { SortButton } from '@/components/buttons/SortButton';
import { BaseCardList } from '@/components/cards/base_cards/BaseCardList';
import { AdvancedFilter } from '@/components/filters/AdvancedFilter';
import { AlienFilter } from '@/components/filters/AlienFilter';
import { CardSourceFilter } from '@/components/filters/CardSourceFilter';
import { CreditFilter } from '@/components/filters/CreditFilter';
import { ResourceFilter } from '@/components/filters/FreeActionFilter';
import { IconFilter } from '@/components/filters/IconFilter';
import { SectorFilter } from '@/components/filters/SectorFilter';
import { TextFilter } from '@/components/filters/TextFilter'; // make sure to import your TextFilter
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import { CardOdometer } from '@/components/ui/CardOdometer';
import { SettingsDialogButton } from '@/components/ui/enable-alien-dialog';

import {
  ALL_ALIENS,
  BASE_FREE_ACTIONS,
  BASE_INCOMES,
  EAlienType,
} from '@/types/BaseCard';
import { CardSource } from '@/types/CardSource';
import { ECardType, EResource, ESector, TIcon } from '@/types/element';
import { SortOrder } from '@/types/Order';
type Props = {
  // Add custom props here
};

const INIT_MAX_NUM = 20;

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { t } = useTranslation('common');
  const { settings, setSettings } = useSettings();

  // change search mode
  const [reset, setReset] = useState<boolean>(false);

  // limit the number of cards to be displayed for optimization
  const [totalMaxNum, setTotalMaxNum] = useState<number>(INIT_MAX_NUM);
  const [selectedFreeActions, setSelectedFreeActions] = useState<EResource[]>(
    []
  );
  const [selectedSectors, setSelectedSectors] = useState<ESector[]>([]);
  const [selectedIncomes, setSelectedIncomes] = useState<EResource[]>([]);
  const [selectedAliens, setSelectedAliens] = useState<EAlienType[]>(
    settings.enableAlien ? ALL_ALIENS : []
  );

  const [textFilter, setTextFilter] = useState<string>(''); // add this line
  const [selectedCardTypes, setSelectedCardTypes] = useState<ECardType[]>([]);
  const [selectedCardSources, setSelectedCardSources] = useState<CardSource[]>(
    []
  );
  const [advancedIcons, setAdvancedIcons] = useState<TIcon[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ID_ASC);
  const [credit, setCredit] = useState<number[]>([5]);
  // const [strength, setStrength] = useState<number[]>([0]);

  const [cardsCount, setCardsCount] = useState<{ base: number; alien: number }>(
    { base: 0, alien: 0 }
  );
  const { base: baseCardsCount, alien: alienCardCount } = cardsCount;
  const animalMaxNum = useMemo(() => {
    if (reset) return INIT_MAX_NUM;
    return baseCardsCount > 0 ? Math.min(totalMaxNum, baseCardsCount) : 0;
  }, [baseCardsCount, reset, totalMaxNum]);

  useEffect(() => {
    if (reset) {
      setReset(false);
    }
  }, [reset]);

  const resetAll = () => {
    setSelectedFreeActions([]);
    setSelectedSectors([]);
    setTextFilter('');
    setSelectedCardTypes([]);
    setSelectedCardSources([]);
    setAdvancedIcons([]);
    setSelectedAliens(settings.enableAlien ? ALL_ALIENS : []);
    // setBaseCardsCount(0);
    // setSponsorCardsCount(0);
    setSortOrder(SortOrder.ID_ASC);
    setCredit([5]);
    // setStrength([0]);
    setTotalMaxNum(INIT_MAX_NUM); // reset the total number of cards to be displayed
    setReset(true);
  };

  return (
    <Layout>
      <Seo templateTitle='Home' />
      {/* <Seo /> */}

      <main>
        <div className='flex flex-col space-y-4 px-2 py-2 md:px-4'>
          <div className='flex flex-col md:flex-row'>
            {settings.enableAlien && (
              <AlienFilter
                alienTypes={ALL_ALIENS}
                onFilterChange={setSelectedAliens}
                reset={reset}
              />
            )}
          </div>
          {/* <div className='text-lg text-primary-200 font-bold'>
            {t('Card Source')}
          </div> */}
          <CardSourceFilter
            onFilterChange={setSelectedCardSources}
            reset={reset}
          />
          <div className='text-lg text-primary-200 font-bold'>
            {t('free_action')}
          </div>
          <ResourceFilter
            onFilterChange={setSelectedFreeActions}
            src={BASE_FREE_ACTIONS}
            reset={reset}
          />
          <div className='text-lg text-primary-200 font-bold'>
            {t('income')}
          </div>
          <ResourceFilter
            onFilterChange={setSelectedIncomes}
            src={BASE_INCOMES}
            reset={reset}
          />
          <div className='text-lg text-primary-200 font-bold'>
            {t('sector')}
          </div>
          <SectorFilter onFilterChange={setSelectedSectors} reset={reset} />
          <div className='text-lg text-primary-200 font-bold'>
            {t('Card Type')}
          </div>
          <IconFilter<ECardType>
            options={[ECardType.MISSION, ECardType.END_SCORING]}
            onFilterChange={setSelectedCardTypes}
            reset={reset}
          />
          <AdvancedFilter onFilterChange={setAdvancedIcons} reset={reset} />
          <div className='flex flex-row space-x-4'>
            <TextFilter onTextChange={setTextFilter} reset={reset} />
            <div
              onClick={resetAll}
              className='group flex w-auto items-center justify-between space-x-2 rounded-md bg-primary px-4 py-2 text-lg font-medium text-zinc-100 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md hover:bg-zinc-500 hover:text-primary-400 focus:outline-none focus-visible:ring-2 dark:from-zinc-900/30 dark:to-zinc-800/80 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20 dark:focus-visible:ring-yellow-500/80'
            >
              <FiRotateCcw className='' />
            </div>
          </div>
          <div className='flex flex-row space-x-4'>
            <SortButton sortOrder={sortOrder} setSortOrder={setSortOrder} />
            <CreditFilter onFilterChange={setCredit} reset={reset} />
            {/* <StrengthFilter onFilterChange={setStrength} reset={reset} /> */}
          </div>
          {/* <Button size='lg' className='text-white'
            onClick={() => setIsAdvancedSearch(prev => !prev)}>
              {t('advanced_search')}
            </Button> */}
          <div className='flex flex-row space-x-4'>
            <CardOdometer
              value={baseCardsCount}
              name={t('base_cards')}
              className='text-amber-500 hover:text-amber-600'
            />
            {!settings.enableAlien ? (
              <SettingsDialogButton
                onSubmit={() => {
                  setSettings({ enableAlien: true });
                  setSelectedAliens(ALL_ALIENS);
                }}
              />
            ) : (
              <CardOdometer
                value={alienCardCount}
                name={t('aliens')}
                className='text-primary hover:text-sky-700'
              />
            )}
          </div>
        </div>
        <div className='mb-2 md:mb-8'></div>
        <div className='relative'>
          <BaseCardList
            selectedFreeActions={selectedFreeActions}
            selectedSectors={selectedSectors}
            selectedIncomes={selectedIncomes}
            selectedCardSources={selectedCardSources}
            selectedAliens={selectedAliens}
            advancedIcons={advancedIcons}
            selectedCardTypes={selectedCardTypes}
            textFilter={textFilter}
            sortOrder={sortOrder}
            onCardCountChange={setCardsCount}
            credit={credit}
            maxNum={animalMaxNum}
          />
          {/* {shouldDisplayViewMore && (
            <>
              <div className='h-10 w-full'></div>
              <div className='absolute bottom-0 h-40 w-full bg-gradient-to-b from-transparent via-[#ecf5e8] to-[#ecf5e8] lg:h-60 xl:h-80'></div>
              <Button
                className='absolute bottom-5 h-12 w-full bg-primary-600 hover:bg-primary-700'
                onClick={handleViewMore}
              >
                {t('View More')}
              </Button>
            </>
          )} */}
        </div>
      </main>
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
