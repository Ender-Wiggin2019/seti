import {
  ALL_ALIENS,
  BASE_FREE_ACTIONS,
  BASE_INCOMES,
  EAlienType,
} from '@seti/common/types/BaseCard';
import { CardSource } from '@seti/common/types/CardSource';
import {
  ECardType,
  EResource,
  ESector,
  TIcon,
} from '@seti/common/types/element';
import { SortOrder } from '@seti/common/types/Order';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { FiRotateCcw } from 'react-icons/fi';
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
import { useSettings } from '@/hooks/useSettings';

type Props = {
  // Add custom props here
};

const INIT_MAX_NUM = 20;

const panelClassName =
  'lg:rounded-2xl lg:bg-gradient-to-b lg:from-zinc-900/70 lg:to-zinc-800/80 lg:shadow-xl lg:shadow-zinc-950/30 lg:ring-1 lg:ring-white/10 lg:backdrop-blur-md';
const desktopIconGridClassName =
  'lg:grid-cols-3 xl:grid-cols-4 lg:gap-x-5 lg:gap-y-4';

function FilterSection({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <section className='space-y-3'>
      {title && (
        <h2 className='text-lg font-bold text-primary-200 lg:text-sm lg:uppercase lg:tracking-wide'>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export default function HomePage(
  _props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { t } = useTranslation('common');
  const { settings, setSettings } = useSettings();

  // change search mode
  const [reset, setReset] = useState<boolean>(false);

  // limit the number of cards to be displayed for optimization
  const [totalMaxNum, setTotalMaxNum] = useState<number>(INIT_MAX_NUM);
  const [selectedFreeActions, setSelectedFreeActions] = useState<EResource[]>(
    [],
  );
  const [selectedSectors, setSelectedSectors] = useState<ESector[]>([]);
  const [selectedIncomes, setSelectedIncomes] = useState<EResource[]>([]);
  const [selectedAliens, setSelectedAliens] = useState<EAlienType[]>(
    settings.enableAlien ? ALL_ALIENS : [],
  );

  const [textFilter, setTextFilter] = useState<string>(''); // add this line
  const [selectedCardTypes, setSelectedCardTypes] = useState<ECardType[]>([]);
  const [selectedCardSources, setSelectedCardSources] = useState<CardSource[]>(
    [],
  );
  const [advancedIcons, setAdvancedIcons] = useState<TIcon[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ID_ASC);
  const [credit, setCredit] = useState<number[]>([5]);
  // const [strength, setStrength] = useState<number[]>([0]);

  const [cardsCount, setCardsCount] = useState<{ base: number; alien: number }>(
    { base: 0, alien: 0 },
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

  const cardCounters = (
    <>
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
    </>
  );

  return (
    <Layout>
      <Seo templateTitle='Home' />
      {/* <Seo /> */}

      <main
        data-testid='home-explorer-layout'
        className='flex flex-col space-y-4 px-2 py-2 md:px-4 lg:space-y-0 lg:pb-14'
      >
        <section
          data-testid='home-hero'
          className='hidden gap-5 lg:mb-5 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end'
        >
          <div className='min-w-0 py-2'>
            <p className='mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary-200/80'>
              {t('home.explorer_kicker', { defaultValue: 'SETI Database' })}
            </p>
            <h1 className='max-w-3xl text-4xl font-black uppercase leading-none tracking-wide text-zinc-50 sm:text-6xl lg:text-7xl'>
              SETI Card
              <br />
              Explorer
            </h1>
            <p className='mt-4 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base'>
              {t('home.explorer_subtitle', {
                defaultValue:
                  'Search cards by source, action icons, income, sector, type, text, and credit cost.',
              })}
            </p>
          </div>

          <div className={`${panelClassName} p-4 sm:p-5`}>
            <div className='mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400'>
              {t('home.signal_index', { defaultValue: 'Signal Index' })}
            </div>
            <div className='flex flex-wrap gap-3'>{cardCounters}</div>
          </div>
        </section>

        {settings.enableAlien && (
          <div
            data-testid='home-alien-filter-bar'
            className='flex flex-col md:flex-row lg:mb-5'
          >
            <AlienFilter
              alienTypes={ALL_ALIENS}
              onFilterChange={setSelectedAliens}
              reset={reset}
            />
          </div>
        )}

        <section
          data-testid='home-control-grid'
          className='flex flex-col space-y-4 lg:grid lg:items-start lg:gap-5 lg:space-y-0 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]'
        >
          <aside
            data-testid='home-filter-panel'
            className={`flex flex-col space-y-4 lg:space-y-5 lg:p-5 ${panelClassName}`}
          >
            <FilterSection title={t('Card Source')}>
              <CardSourceFilter
                onFilterChange={setSelectedCardSources}
                reset={reset}
              />
            </FilterSection>

            <FilterSection title={t('free_action')}>
              <ResourceFilter
                onFilterChange={setSelectedFreeActions}
                src={BASE_FREE_ACTIONS}
                reset={reset}
                className={desktopIconGridClassName}
              />
            </FilterSection>

            <FilterSection title={t('income')}>
              <ResourceFilter
                onFilterChange={setSelectedIncomes}
                src={BASE_INCOMES}
                reset={reset}
                className={desktopIconGridClassName}
              />
            </FilterSection>

            <FilterSection title={t('sector')}>
              <SectorFilter
                onFilterChange={setSelectedSectors}
                reset={reset}
                className={desktopIconGridClassName}
              />
            </FilterSection>

            <FilterSection title={t('Card Type')}>
              <IconFilter<ECardType>
                options={[ECardType.MISSION, ECardType.END_SCORING]}
                onFilterChange={setSelectedCardTypes}
                reset={reset}
                className={desktopIconGridClassName}
              />
            </FilterSection>

            <FilterSection title={t('Advanced')}>
              <AdvancedFilter onFilterChange={setAdvancedIcons} reset={reset} />
            </FilterSection>
          </aside>

          <section
            data-testid='home-results-panel'
            className='flex min-w-0 flex-col space-y-4 lg:space-y-5'
          >
            <div className={`flex flex-col space-y-4 lg:p-4 ${panelClassName}`}>
              <div className='flex flex-row space-x-4'>
                <div className='min-w-0 flex-1'>
                  <TextFilter
                    onTextChange={setTextFilter}
                    reset={reset}
                    className='lg:w-full'
                  />
                </div>
                <button
                  type='button'
                  onClick={resetAll}
                  aria-label={t('Reset')}
                  className='group flex w-auto shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-lg font-medium text-zinc-100 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md transition hover:bg-zinc-500 hover:text-primary-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/80 lg:h-14 lg:w-14 lg:rounded-xl lg:px-0 lg:py-0 lg:text-xl'
                >
                  <FiRotateCcw aria-hidden='true' />
                </button>
              </div>

              <div className='flex flex-row space-x-4'>
                <SortButton sortOrder={sortOrder} setSortOrder={setSortOrder} />
                <CreditFilter onFilterChange={setCredit} reset={reset} />
                {/* <StrengthFilter onFilterChange={setStrength} reset={reset} /> */}
              </div>

              <div className='flex flex-row space-x-4 lg:hidden'>
                {cardCounters}
              </div>
            </div>

            {/* <Button size='lg' className='text-white'
            onClick={() => setIsAdvancedSearch(prev => !prev)}>
              {t('advanced_search')}
            </Button> */}

            <div className='relative -mx-2 sm:mx-0'>
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
                compactDesktop
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
          </section>
        </section>
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
