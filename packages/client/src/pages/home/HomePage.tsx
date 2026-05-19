import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

/**
 * HomePage — the observation deck entry bay.
 *
 * Hero strip introduces the operator (or invites them to sign on); below,
 * a tactile control strip with the primary mission action and a
 * ghost-escape path. Language and text-mode controls live in the global
 * AppShell header, so they are reachable from any route.
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
      {/* Hero instrument panel */}
      <section
        className={cn(
          'metal-hairline-rounded relative overflow-hidden p-7',
          'bg-[oklch(0.12_0.022_260/0.6)] shadow-instrument',
        )}
      >
        {/* A single soft instrument light pool in the upper-right. */}
        <span
          aria-hidden
          className='pointer-events-none absolute right-[-80px] top-[-80px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,oklch(0.45_0.12_240/0.18),transparent_70%)]'
        />
        <div className='relative flex flex-col gap-3'>
          <span className='micro-label inline-flex items-center gap-2 text-[oklch(0.74_0.10_240)]'>
            <span className='h-1 w-6 bg-[oklch(0.68_0.11_240)]' />
            {t('client.home.hero_kicker', { defaultValue: 'Observatory' })}
          </span>
          <h1 className='font-display text-3xl font-semibold tracking-[0.08em] text-text-100 sm:text-4xl'>
            {t('home.title')}
          </h1>
          <p className='max-w-xl text-sm leading-relaxed text-text-300'>
            {isAuthenticated
              ? t('home.subtitle_authenticated', { name: userName })
              : t('home.subtitle_guest')}
          </p>
        </div>
      </section>

      {/* Control strip */}
      <section
        className={cn(
          'flex flex-wrap items-center gap-3',
          'border-t border-[color:var(--metal-edge-soft)] pt-6',
        )}
      >
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
