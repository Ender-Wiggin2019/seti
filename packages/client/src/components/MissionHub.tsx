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

const HERO_SCENE_ASSETS = [
  {
    src: '/assets/seti/sprites/terrain_00_02.webp',
    className:
      'right-[9%] top-[4%] w-[40%] min-w-[250px] max-w-[470px] rotate-[-5deg] opacity-92 max-sm:right-[-16%] max-sm:top-[14%] max-sm:w-[290px]',
  },
  {
    src: '/assets/seti/sprites/terrain_00_00.webp',
    className:
      'bottom-[-4%] left-[4%] w-[32%] min-w-[190px] max-w-[340px] opacity-80 max-sm:left-[-10%] max-sm:w-[220px]',
  },
  {
    src: '/assets/seti/sprites/terrain_01_01.webp',
    className:
      'bottom-[2%] right-[22%] w-[24%] min-w-[150px] max-w-[270px] opacity-68 max-sm:right-[16%] max-sm:bottom-[12%] max-sm:w-[160px]',
  },
  {
    src: '/assets/seti/sprites/objects_02_00.webp',
    className:
      'right-[1%] top-[14%] w-[18%] min-w-[110px] max-w-[180px] opacity-48 max-md:hidden',
  },
];

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
          bgTile='terrain_01_00.webp'
        />
        <MissionStatTile
          id='playing'
          label={statLabels.playing}
          value={stats.playing}
          sub={statLabels.playingSub}
          signal={STAT_SIGNAL.playing}
          bgTile='terrain_00_02.webp'
        />
        <MissionStatTile
          id='players'
          label={statLabels.players}
          value={stats.players}
          sub={statLabels.playersSub}
          signal={STAT_SIGNAL.players}
          bgTile='terrain_01_01.webp'
        />
      </section>

      <section
        className='mission-panel px-4 py-4 sm:px-5 sm:py-5'
        data-testid='mission-room-list'
        data-panel-scene='list'
      >
        <span
          aria-hidden
          className='pointer-events-none absolute inset-x-0 bottom-0 h-[58%] opacity-[0.18]'
          style={{
            backgroundImage: "url('/assets/seti/sprites/terrain_02_02.webp')",
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'repeat-x',
            backgroundSize: '280px auto',
          }}
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
    >
      {HERO_SCENE_ASSETS.map((asset) => (
        <SceneImage
          key={asset.src}
          src={asset.src}
          alt=''
          className={asset.className}
        />
      ))}
      <span
        aria-hidden
        className='absolute right-[12%] top-[-18%] h-[360px] w-[240px] rotate-[24deg] bg-[linear-gradient(180deg,oklch(0.66_0.13_48/0.34),transparent_78%)] blur-[1px]'
      />
      <span
        aria-hidden
        className='absolute left-[34%] top-[36%] h-28 w-56 bg-[radial-gradient(circle,oklch(0.68_0.11_235/0.16),transparent_72%)] blur-md'
      />
      <span
        aria-hidden
        className='absolute bottom-[-18%] left-[-4%] h-[44%] w-[110%] bg-[radial-gradient(ellipse_at_center,oklch(0.42_0.025_250/0.22),transparent_67%)]'
      />

      <div className='relative z-10 flex min-h-[360px] flex-col justify-between gap-10 p-6 sm:min-h-[410px] sm:p-8 lg:p-10'>
        <div className='max-w-[520px] space-y-5'>
          <span className='micro-label inline-flex items-center gap-3 text-[oklch(0.82_0.09_235)]'>
            <span className='h-px w-8 bg-[var(--signal-blue)]' />
            {kicker}
            <span className='readout text-[10px] text-text-300'>
              {String(waitingCount).padStart(2, '0')}
            </span>
          </span>
          <div className='space-y-3'>
            <h1 className='font-display text-[clamp(2.8rem,8vw,5.8rem)] font-black leading-[0.95] tracking-[0.04em] text-text-100'>
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

interface ISceneImageProps {
  src: string;
  alt: string;
  className: string;
}

function SceneImage({
  src,
  alt,
  className,
}: ISceneImageProps): React.JSX.Element {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      className={cn(
        'pointer-events-none absolute select-none mix-blend-screen',
        className,
      )}
    />
  );
}

type TStatSignal = 'blue' | 'violet' | 'green';

interface IMissionStatTileProps {
  id: 'waiting' | 'playing' | 'players';
  label: string;
  value: number;
  sub: string;
  signal: TStatSignal;
  bgTile: string;
}

function MissionStatTile({
  id,
  label,
  value,
  sub,
  signal,
  bgTile,
}: IMissionStatTileProps): React.JSX.Element {
  return (
    <article
      className='mission-stat-card relative min-h-[126px] overflow-hidden rounded-[6px] border border-[color:var(--metal-edge-soft)] bg-[var(--surface-instrument)] p-5 shadow-hairline-inset'
      data-testid={`mission-stat-${id}`}
      data-signal={signal}
    >
      <span
        aria-hidden
        className='absolute inset-0 opacity-[0.36]'
        style={{
          backgroundImage: `url('/assets/seti/sprites/${bgTile}')`,
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'auto 118%',
        }}
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
