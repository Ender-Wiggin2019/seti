import { useTranslation } from 'react-i18next';
import { ERoomStatus, type IRoom } from '@/api/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RoomCard } from '@/components/RoomCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type TMissionFilterValue =
  | 'all'
  | ERoomStatus.WAITING
  | ERoomStatus.PLAYING;

interface IMissionHubStats {
  waiting: number;
  playing: number;
  players: number;
}

interface IMissionHubStatLabels {
  waiting: string;
  waitingSub: string;
  playing: string;
  playingSub: string;
  players: string;
  playersSub: string;
}

interface IMissionHubFilterLabels {
  all: string;
  waiting: string;
  playing: string;
}

interface IMissionHubViewProps {
  title: string;
  subtitle: string;
  kicker: string;
  createLabel: string;
  onCreateMission: () => void;
  filter: TMissionFilterValue;
  onFilterChange: (value: TMissionFilterValue) => void;
  filterLabels: IMissionHubFilterLabels;
  stats: IMissionHubStats;
  statLabels: IMissionHubStatLabels;
  rooms?: IRoom[];
  isLoading?: boolean;
  loadingLabel?: string;
  emptyLabel: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
  onPageChange?: (page: number) => void;
}

const STAT_SIGNAL = {
  waiting: 'blue',
  playing: 'violet',
  players: 'green',
} as const;

const STAT_SCENES = {
  waiting: '/assets/seti/sprites/terrain_01_00.webp',
  playing: '/assets/seti/sprites/terrain_00_02.webp',
  players: '/assets/seti/sprites/terrain_01_01.webp',
} as const;

export function MissionHubView({
  title,
  subtitle,
  kicker,
  createLabel,
  onCreateMission,
  filter,
  onFilterChange,
  filterLabels,
  stats,
  statLabels,
  rooms,
  isLoading = false,
  loadingLabel = 'Loading missions...',
  emptyLabel,
  page = 1,
  total = rooms?.length ?? 0,
  totalPages = total > 0 ? 1 : 0,
  hasMore = false,
  onPageChange,
}: IMissionHubViewProps): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-5' data-testid='mission-hub'>
      <MissionHero
        title={title}
        subtitle={subtitle}
        kicker={kicker}
        waitingCount={stats.waiting}
        createLabel={createLabel}
        onCreateMission={onCreateMission}
      />

      <section className='grid gap-3 md:grid-cols-3'>
        <MissionStatTile
          id='waiting'
          label={statLabels.waiting}
          value={stats.waiting}
          sub={statLabels.waitingSub}
          signal={STAT_SIGNAL.waiting}
          scene={STAT_SCENES.waiting}
        />
        <MissionStatTile
          id='playing'
          label={statLabels.playing}
          value={stats.playing}
          sub={statLabels.playingSub}
          signal={STAT_SIGNAL.playing}
          scene={STAT_SCENES.playing}
        />
        <MissionStatTile
          id='players'
          label={statLabels.players}
          value={stats.players}
          sub={statLabels.playersSub}
          signal={STAT_SIGNAL.players}
          scene={STAT_SCENES.players}
        />
      </section>

      <section
        className='mission-panel px-4 py-4 sm:px-5 sm:py-5'
        data-testid='mission-room-list'
        data-panel-scene='list'
      >
        <img
          aria-hidden
          src='/assets/seti/sprites/terrain_02_02.webp'
          alt=''
          className='pointer-events-none absolute inset-x-0 bottom-0 h-[62%] w-full object-cover object-bottom opacity-[0.16]'
        />
        <div className='relative z-10 space-y-4'>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <Tabs
              value={filter}
              defaultValue='all'
              onValueChange={(value) =>
                onFilterChange(value as TMissionFilterValue)
              }
            >
              <TabsList className='w-full justify-start overflow-x-auto rounded-none border-x-0 border-t-0 bg-transparent p-0'>
                <TabsTrigger value='all'>{filterLabels.all}</TabsTrigger>
                <TabsTrigger value={ERoomStatus.WAITING}>
                  {filterLabels.waiting}
                </TabsTrigger>
                <TabsTrigger value={ERoomStatus.PLAYING}>
                  {filterLabels.playing}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className='readout text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
              {String(total).padStart(2, '0')}
            </span>
          </div>

          {isLoading ? (
            <LoadingSpinner variant='scanline' label={loadingLabel} />
          ) : !rooms?.length ? (
            <MissionEmptyState label={emptyLabel} />
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {rooms.map((room, index) => (
                <RoomCard key={room.id} room={room} index={index} />
              ))}
            </div>
          )}
          {totalPages > 1 && onPageChange ? (
            <div
              className='flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--metal-edge-soft)] pt-4'
              data-testid='mission-pagination'
            >
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                data-testid='mission-page-prev'
              >
                {t('client.common.previous', { defaultValue: 'Previous' })}
              </Button>
              <span className='readout text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
                {String(page).padStart(2, '0')} /{' '}
                {String(totalPages).padStart(2, '0')}
              </span>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => onPageChange(page + 1)}
                disabled={!hasMore}
                data-testid='mission-page-next'
              >
                {t('client.common.next', { defaultValue: 'Next' })}
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

interface IMissionHeroProps {
  title: string;
  subtitle: string;
  kicker: string;
  waitingCount: number;
  createLabel: string;
  onCreateMission: () => void;
}

function MissionHero({
  title,
  subtitle,
  kicker,
  waitingCount,
  createLabel,
  onCreateMission,
}: IMissionHeroProps): React.JSX.Element {
  return (
    <section
      className='relative'
      data-testid='mission-hero-scene'
      data-scene='lunar-lobby'
      data-scene-treatment='single-image'
    >
      <div className='relative z-10 flex min-h-[320px] flex-col justify-between gap-10 py-6 sm:min-h-[360px] sm:py-8 lg:py-10'>
        <div className='max-w-[520px] space-y-5'>
          <span className='micro-label inline-flex items-center gap-3 text-[oklch(0.82_0.09_235)]'>
            <span className='h-px w-8 bg-[var(--signal-blue)]' />
            {kicker}
            <span className='readout text-[10px] text-text-300'>
              {String(waitingCount).padStart(2, '0')}
            </span>
          </span>
          <div className='space-y-3'>
            <h1
              className='font-display text-[clamp(2.7rem,7vw,4.9rem)] font-black leading-[0.95] tracking-[0.04em] text-text-100'
              style={{ textShadow: '0 2px 18px rgba(1, 15, 30, 0.7)' }}
            >
              {title}
            </h1>
            <p
              className='max-w-md text-base leading-relaxed text-text-100/90 sm:text-lg'
              style={{ textShadow: '0 1px 10px rgba(1, 15, 30, 0.7)' }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <div className='flex justify-start'>
          <Button
            size='lg'
            onClick={onCreateMission}
            className='min-w-[150px]'
            data-testid='lobby-new-mission'
          >
            {createLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

type TStatSignal = 'blue' | 'violet' | 'green';

interface IMissionStatTileProps {
  id: 'waiting' | 'playing' | 'players';
  label: string;
  value: number;
  sub: string;
  signal: TStatSignal;
  scene: string;
}

function MissionStatTile({
  id,
  label,
  value,
  sub,
  signal,
  scene,
}: IMissionStatTileProps): React.JSX.Element {
  return (
    <article
      className='mission-stat-card relative min-h-[126px] overflow-hidden rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)] p-5 shadow-hairline-inset'
      data-testid={`mission-stat-${id}`}
      data-signal={signal}
    >
      <img
        aria-hidden
        src={scene}
        alt=''
        className='pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-[0.38]'
      />
      <span
        aria-hidden
        className='absolute inset-0 bg-[oklch(0.08_0.02_260/0.66)]'
      />
      <div className='relative z-10 flex h-full flex-col justify-between gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <span className='text-sm font-medium text-text-300'>{label}</span>
          <span
            aria-hidden
            className='signal-dot'
            data-signal={signal}
            data-active={value > 0 ? 'true' : 'false'}
          />
        </div>
        <div className='font-display text-4xl font-black leading-none tabular-nums text-[color:var(--stat-color)] sm:text-5xl'>
          {String(value).padStart(2, '0')}
        </div>
        <p className='text-sm text-text-500'>{sub}</p>
      </div>
    </article>
  );
}

function MissionEmptyState({ label }: { label: string }): React.JSX.Element {
  return (
    <div className='metal-hairline-rounded relative overflow-hidden bg-[var(--surface-instrument)]/70 p-12 text-center'>
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[oklch(0.28_0.08_240/0.07)]'
      />
      <p className='relative font-mono text-[0.75rem] uppercase tracking-microlabel text-text-500'>
        {label}
      </p>
    </div>
  );
}
