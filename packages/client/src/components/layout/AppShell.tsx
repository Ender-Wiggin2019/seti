import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { APP_NAME } from '@/config/constants';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';

interface IAppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell — the global chrome outside of a live game.
 *
 * A thin hairline-bordered header sits on the void, with an
 * ambient instrument-light background softly glowing behind it.
 * No logo images — the wordmark is the display font itself.
 */
export function AppShell(props: IAppShellProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userName = useAuthStore((s) => s.user?.name);

  return (
    <div className='relative min-h-screen bg-background-950 text-text-100'>
      {/* Ambient atmosphere layer — sits behind all content. */}
      <div
        className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
        aria-hidden
      />

      <header
        className={cn(
          'sticky top-0 z-20',
          'border-b border-[color:var(--metal-edge-soft)]',
          'bg-background-950/75 backdrop-blur-md',
        )}
      >
        <div className='mx-auto flex max-w-6xl items-center justify-between px-5 py-3'>
          <Link
            to='/'
            className={cn(
              'group flex items-center gap-3 text-text-100',
              'transition-colors',
            )}
          >
            <WordmarkMark />
            <span className='font-display text-sm font-medium tracking-[0.18em] uppercase'>
              {APP_NAME}
            </span>
          </Link>

          <nav className='flex items-center gap-1'>
            {isAuthenticated ? (
              <>
                <NavLink to='/lobby'>{t('client.app_shell.lobby')}</NavLink>
                <NavLink
                  to='/profile'
                  leading={
                    <span className='flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.20_0.03_260)] border border-[color:var(--metal-edge-soft)] font-mono text-[10px] font-semibold text-text-100'>
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
      </header>

      <main className='mx-auto max-w-6xl px-5 py-8'>{props.children}</main>
    </div>
  );
}

/**
 * A small instrument-diamond mark: the wordmark's visual companion.
 * Two concentric rhombi stacked, subtly anodized-blue. Not a logo
 * in the branded sense — a hairline-drawn instrument symbol.
 */
function WordmarkMark(): React.JSX.Element {
  return (
    <span
      aria-hidden
      className='relative inline-flex h-6 w-6 shrink-0 items-center justify-center'
    >
      <span className='absolute inset-0.5 rotate-45 border border-[color:var(--metal-edge)] bg-[oklch(0.14_0.025_240)]' />
      <span className='absolute inset-[6px] rotate-45 border border-[oklch(0.48_0.10_240)] bg-[oklch(0.32_0.08_240)]' />
      <span className='absolute inset-[9px] rotate-45 bg-[oklch(0.82_0.10_240)]' />
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
        'hover:text-text-100 hover:bg-[oklch(0.18_0.025_260)]',
      )}
      activeProps={{
        className:
          'text-text-100 bg-[oklch(0.18_0.025_260)] [&>.nav-active-tick]:opacity-100',
      }}
    >
      {leading}
      <span>{children}</span>
      {/* Active-state anodized-blue tick underline */}
      <span
        aria-hidden
        className='nav-active-tick pointer-events-none absolute bottom-[-9px] left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[oklch(0.68_0.11_240)] opacity-0 transition-opacity'
      />
    </Link>
  );
}
