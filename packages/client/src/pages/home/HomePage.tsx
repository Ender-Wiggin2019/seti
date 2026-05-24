import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SignalIndicator } from '@/components/ui/telemetry';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

/**
 * HomePage — the Space Agencies entry point.
 *
 * One panel, one signal indicator, two controls. No fabricated
 * telemetry (no Bandwidth, no Stardate, no player-count fiction) — only
 * what is actually true about the user's session right now.
 */
export function HomePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userName = useAuthStore(
    (state) => state.user?.name ?? t('client.home.default_name'),
  );

  return (
    <div className='space-y-8'>
      {/* Hero panel — the mission identifier strip. */}
      <section
        className={cn(
          'metal-hairline-rounded relative overflow-hidden p-7 sm:p-9',
          'bg-[var(--surface-deep)]/72 backdrop-blur-[2px]',
          'shadow-instrument',
        )}
      >
        {/* Single instrument-light pool, upper-right. */}
        <span
          aria-hidden
          className='pointer-events-none absolute right-[-120px] top-[-140px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,oklch(0.42_0.13_240/0.18),transparent_70%)]'
        />
        <div className='relative flex flex-col gap-5'>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
            <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.78_0.10_240)]'>
              <span className='h-px w-6 bg-[var(--signal-blue)]' />
              {t('client.home.hero_kicker', { defaultValue: 'Space Agencies' })}
            </span>
            {isAuthenticated ? (
              <SignalIndicator
                signal='green'
                active
                label={t('client.home.station_nominal', {
                  defaultValue: 'Signed in',
                })}
              />
            ) : (
              <SignalIndicator
                signal='amber'
                label={t('client.home.station_offline', {
                  defaultValue: 'Sign in to play',
                })}
              />
            )}
          </div>
          <h1 className='font-display text-3xl font-semibold tracking-[0.08em] text-text-100 sm:text-[2.5rem] leading-[1.1]'>
            {t('home.title')}
          </h1>
          <p className='max-w-xl text-sm leading-relaxed text-text-300'>
            {isAuthenticated
              ? t('home.subtitle_authenticated', { name: userName })
              : t('home.subtitle_guest')}
          </p>
        </div>
      </section>

      {/* Control strip. No tiles — just the two paths. */}
      <section className='flex flex-wrap items-center gap-3'>
        {isAuthenticated ? (
          <>
            <Button size='lg' onClick={() => navigate({ to: '/lobby' })}>
              {t('home.open_lobby')}
            </Button>
            <Button
              variant='ghost'
              size='lg'
              onClick={() => navigate({ to: '/profile' })}
            >
              {t('home.profile')}
            </Button>
          </>
        ) : (
          <>
            <Button size='lg' onClick={() => navigate({ to: '/auth' })}>
              {t('home.sign_in')}
            </Button>
            <Button
              variant='ghost'
              size='lg'
              onClick={() => navigate({ to: '/auth' })}
            >
              {t('home.create_account')}
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
