import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { HeaderControls } from '@/components/layout/HeaderControls';
import { APP_NAME } from '@/config/constants';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

interface IAppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell — the global chrome outside of a live game.
 *
 * The page sits in three depth planes:
 *   1. Cosmic atmosphere fixed behind everything (--bg-atmosphere).
 *   2. Surface-deep top bar (the first lift off the void).
 *   3. Surface-panel content cards within the main column.
 */
export function AppShell(props: IAppShellProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userName = useAuthStore((s) => s.user?.name);

  return (
    <div className='relative min-h-screen text-text-100'>
      {/* Cosmic atmosphere — fixed behind all content, three-layer composition. */}
      <div
        className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)] bg-cover bg-center'
        aria-hidden
      />

      <header
        className={cn(
          'sticky top-0 z-20',
          'border-b border-[color:var(--metal-edge-soft)]',
          'bg-[var(--surface-deep)]/82 backdrop-blur-md',
        )}
      >
        <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3'>
          <Link
            to='/'
            className={cn(
              'group flex shrink-0 items-center gap-3 text-text-100 max-sm:w-full',
              'transition-colors',
            )}
          >
            <WordmarkMark />
            <span className='font-display text-sm font-medium tracking-wordmark uppercase'>
              {APP_NAME}
            </span>
          </Link>

          <div className='flex min-w-0 flex-1 items-center justify-end gap-4 max-sm:w-full max-sm:flex-none max-sm:justify-between max-sm:gap-2'>
            <HeaderControls variant='shell' />
            <nav className='flex shrink-0 items-center gap-1'>
              {isAuthenticated ? (
                <>
                  <NavLink to='/lobby'>{t('client.app_shell.lobby')}</NavLink>
                  <NavLink
                    to='/profile'
                    leading={
                      <span className='flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-instrument)] border border-[color:var(--metal-edge-soft)] font-mono text-[10px] font-semibold text-text-100'>
                        {userName?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                    }
                  >
                    {userName ?? t('client.app_shell.profile')}
                  </NavLink>
                </>
              ) : (
                <NavLink to='/auth'>{t('client.app_shell.login')}</NavLink>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-5 py-8'>{props.children}</main>
    </div>
  );
}

/**
 * A small instrument-diamond mark — wordmark companion.
 * Two concentric rhombi stacked, hairline-drawn anodized blue.
 */
function WordmarkMark(): React.JSX.Element {
  return (
    <span
      aria-hidden
      className='relative inline-flex h-6 w-6 shrink-0 items-center justify-center'
    >
      <span className='absolute inset-0.5 rotate-45 border border-[color:var(--metal-edge)] bg-[var(--surface-instrument)]' />
      <span className='absolute inset-[6px] rotate-45 border border-[oklch(0.48_0.10_240)] bg-[oklch(0.32_0.08_240)]' />
      <span className='absolute inset-[9px] rotate-45 bg-[var(--signal-blue-hi)]' />
    </span>
  );
}

interface INavLinkProps {
  to: string;
  children: React.ReactNode;
  leading?: React.ReactNode;
}

function NavLink({ to, children, leading }: INavLinkProps): React.JSX.Element {
  return (
    <Link
      to={to}
      className={cn(
        'group relative flex items-center gap-2 rounded-[4px] px-3 py-1.5',
        'text-sm text-text-300',
        'transition-colors duration-150',
        'hover:text-text-100 hover:bg-[var(--surface-panel)]/60',
      )}
      activeProps={{
        className:
          'text-text-100 bg-[var(--surface-panel)]/70 [&>.nav-active-tick]:opacity-100',
      }}
    >
      {leading}
      <span>{children}</span>
      <span
        aria-hidden
        className='nav-active-tick pointer-events-none absolute bottom-[-9px] left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[var(--signal-blue)] opacity-0 transition-opacity'
      />
    </Link>
  );
}
