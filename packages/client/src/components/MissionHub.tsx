import { useTranslation } from 'react-i18next';
import { ERoomStatus, type IRoom } from '@/api/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RoomCard } from '@/components/RoomCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/cn';

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
}

const STAT_SIGNAL = {
  waiting: 'blue',
  playing: 'violet',
  players: 'green',
} as const;

const MISSION_HERO_SCENE = '/assets/seti/sprites/terrain_00_02.webp';

const STAT_SCENES = {
  waiting: '/assets/seti/sprites/terrain_01_00.webp',
  playing: '/assets/seti/sprites/terrain_00_02.webp',
  players: '/assets/seti/sprites/terrain_01_01.webp',
} as const;

const ASSET_STRIP_ITEMS = [
  {
    asset: 'objects_01_01.webp',
    className: 'left-[-1%] bottom-[-18%] w-36 opacity-68 sm:w-40 lg:w-44',
  },
  {
    asset: 'terrain_00_00.webp',
    className: 'left-[13%] bottom-[-6%] w-40 opacity-70 sm:w-48 lg:w-52',
  },
  {
    asset: 'objects_02_02.webp',
    className: 'left-[34%] bottom-[-10%] w-32 opacity-56 sm:w-36 lg:w-40',
  },
  {
    asset: 'terrain_00_02.webp',
    className: 'left-[50%] bottom-[-12%] w-40 opacity-70 sm:w-48 lg:w-52',
  },
  {
    asset: 'terrain_02_00.webp',
    className: 'right-[7%] bottom-[-5%] w-40 opacity-64 sm:w-44 lg:w-48',
  },
];

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
}: IMissionHubViewProps): React.JSX.Element {
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
        <span
          aria-hidden
          className='pointer-events-none absolute right-[-2%] top-[-10%] h-44 w-44 rounded-full bg-[radial-gradient(circle,oklch(0.58_0.12_45/0.18),transparent_70%)] blur-[2px]'
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
              {String(rooms?.length ?? 0).padStart(2, '0')}
            </span>
          </div>

          {isLoading ? (
            <LoadingSpinner variant='scanline' label={loadingLabel} />
          ) : !rooms?.length ? (
            <MissionEmptyState label={emptyLabel} />
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </section>

      <MissionAssetStrip />
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
      className={cn(
        'mission-scene relative overflow-hidden rounded-[8px]',
        'border border-[color:var(--metal-edge)] bg-[var(--surface-deep)]',
        'shadow-instrument',
      )}
      data-testid='mission-hero-scene'
      data-scene='lunar-lobby'
      data-scene-treatment='single-image'
    >
      <img
        src={MISSION_HERO_SCENE}
        alt=''
        aria-hidden
        data-testid='mission-hero-image'
        className='pointer-events-none absolute inset-y-[-4%] right-[8%] h-[108%] w-auto max-w-none select-none object-contain opacity-[0.9] max-sm:right-[-18%]'
        style={{
          WebkitMaskImage:
            'linear-gradient(90deg, transparent 0%, black 28%, black 100%)',
          maskImage:
            'linear-gradient(90deg, transparent 0%, black 28%, black 100%)',
        }}
      />
      <span
        aria-hidden
        className='absolute inset-0 bg-[linear-gradient(90deg,oklch(0.05_0.018_260/0.92)_0%,oklch(0.07_0.02_260/0.72)_42%,oklch(0.07_0.02_260/0.28)_68%,oklch(0.05_0.018_260/0.50)_100%)]'
      />
      <span
        aria-hidden
        className='absolute right-[18%] top-[-16%] h-[380px] w-[260px] rotate-[22deg] bg-[linear-gradient(180deg,oklch(0.66_0.13_48/0.24),transparent_78%)] blur-[1px]'
      />
      <span
        aria-hidden
        className='absolute bottom-[-18%] left-[-4%] h-[42%] w-[110%] bg-[radial-gradient(ellipse_at_center,oklch(0.42_0.025_250/0.22),transparent_67%)]'
      />

      <div className='relative z-10 flex min-h-[320px] flex-col justify-between gap-10 p-6 sm:min-h-[360px] sm:p-8 lg:p-10'>
        <div className='max-w-[520px] space-y-5'>
          <span className='micro-label inline-flex items-center gap-3 text-[oklch(0.82_0.09_235)]'>
            <span className='h-px w-8 bg-[var(--signal-blue)]' />
            {kicker}
            <span className='readout text-[10px] text-text-300'>
              {String(waitingCount).padStart(2, '0')}
            </span>
          </span>
          <div className='space-y-3'>
            <h1 className='font-display text-[clamp(2.7rem,7vw,4.9rem)] font-black leading-[0.95] tracking-[0.04em] text-text-100'>
              {title}
            </h1>
            <p className='max-w-md text-base leading-relaxed text-text-300 sm:text-lg'>
              {subtitle}
            </p>
          </div>
        </div>

        <div className='flex justify-start sm:justify-end'>
          <Button
            size='lg'
            onClick={onCreateMission}
            className='min-w-[150px]'
            data-testid='mission-create-button'
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
        className='absolute inset-0 bg-[linear-gradient(90deg,oklch(0.08_0.02_260/0.88)_0%,oklch(0.08_0.02_260/0.82)_42%,oklch(0.10_0.02_260/0.58)_62%,oklch(0.10_0.02_260/0.34)_78%,oklch(0.08_0.02_260/0.46)_100%)]'
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
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(420px_200px_at_50%_30%,oklch(0.28_0.08_240/0.14),transparent_70%)]'
      />
      <p className='relative font-mono text-[0.75rem] uppercase tracking-microlabel text-text-500'>
        {label}
      </p>
    </div>
  );
}

function MissionAssetStrip(): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='mission-panel border-transparent px-4 py-5 max-md:hidden'>
      <div className='mb-2'>
        <p className='micro-label text-text-500'>
          {t('client.mission_hub.background_elements', {
            defaultValue: 'Background Elements',
          })}
        </p>
        <p className='text-xs uppercase tracking-[0.16em] text-text-700'>
          {t('client.mission_hub.low_poly_assets', {
            defaultValue: 'Low-poly mission assets',
          })}
        </p>
      </div>
      <div className='relative h-44 overflow-hidden rounded-[6px] bg-[linear-gradient(180deg,transparent,oklch(0.09_0.02_260/0.78))]'>
        <span
          aria-hidden
          className='absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(180deg,transparent,oklch(0.09_0.02_260/0.56)_45%,oklch(0.09_0.02_260/0.92))]'
        />
        <span
          aria-hidden
          className='absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,var(--surface-700),transparent)]'
        />
        {ASSET_STRIP_ITEMS.map(({ asset, className }) => (
          <img
            key={asset}
            src={`/assets/seti/sprites/${asset}`}
            alt=''
            aria-hidden
            className={cn(
              'pointer-events-none absolute select-none mix-blend-screen',
              className,
            )}
          />
        ))}
      </div>
    </section>
  );
}
