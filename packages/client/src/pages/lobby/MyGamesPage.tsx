import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lobbyApi } from '@/api/lobbyApi';
import { useSceneHero } from '@/components/layout/SceneBackground';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RoomCard } from '@/components/RoomCard';
import { Button } from '@/components/ui/button';

const MY_GAMES_PAGE_SIZE = 12;

const MY_GAMES_SCENE_HERO = '/assets/seti/scenes/my-games.webp';

export function MyGamesPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['my-games', page],
    queryFn: () =>
      lobbyApi.listMyGames({ page, pageSize: MY_GAMES_PAGE_SIZE }),
    refetchInterval: 5000,
  });

  useSceneHero(MY_GAMES_SCENE_HERO);

  return (
    <div className='space-y-5' data-testid='my-games-page'>
      <section className='mission-panel px-5 py-5 sm:px-6'>
        <div className='relative z-10 flex flex-wrap items-end justify-between gap-3'>
          <div className='space-y-2'>
            <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.78_0.10_240)]'>
              <span className='h-px w-6 bg-[var(--signal-blue)]' />
              {t('client.my_games.kicker', { defaultValue: 'Personal Log' })}
            </span>
            <h1 className='font-display text-3xl font-semibold tracking-[0.08em] text-text-100'>
              {t('client.my_games.title', { defaultValue: 'My Games' })}
            </h1>
          </div>
          <span className='readout text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
            {String(data?.total ?? 0).padStart(2, '0')}
          </span>
        </div>
      </section>

      <section className='mission-panel px-4 py-4 sm:px-5 sm:py-5'>
        <div className='relative z-10 space-y-4'>
          {isLoading ? (
            <LoadingSpinner
              variant='scanline'
              label={t('client.my_games.loading', {
                defaultValue: 'Loading your games...',
              })}
            />
          ) : !data?.items.length ? (
            <div className='metal-hairline-rounded bg-[var(--surface-instrument)]/70 p-12 text-center'>
              <p className='font-mono text-[0.75rem] uppercase tracking-microlabel text-text-500'>
                {t('client.my_games.empty', {
                  defaultValue: 'No games yet.',
                })}
              </p>
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {data.items.map((room, index) => (
                <RoomCard key={room.id} room={room} index={index} />
              ))}
            </div>
          )}

          {(data?.totalPages ?? 0) > 1 ? (
            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--metal-edge-soft)] pt-4'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                {t('client.common.previous', { defaultValue: 'Previous' })}
              </Button>
              <span className='readout text-[0.6875rem] uppercase tracking-microlabel text-text-500'>
                {String(data?.page ?? page).padStart(2, '0')} /{' '}
                {String(data?.totalPages ?? 0).padStart(2, '0')}
              </span>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setPage((current) => current + 1)}
                disabled={!data?.hasMore}
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
