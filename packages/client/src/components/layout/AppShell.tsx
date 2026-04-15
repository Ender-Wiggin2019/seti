import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { APP_NAME } from '@/config/constants';
import { useAuthStore } from '@/stores/authStore';

interface IAppShellProps {
  children: React.ReactNode;
}

export function AppShell(props: IAppShellProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userName = useAuthStore((s) => s.user?.name);

  return (
    <div className='min-h-screen bg-background-950 text-text-100'>
      <div
        className='fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
        aria-hidden
      />
      <header className='border-b border-surface-700/70 bg-surface-900/70 backdrop-blur-md'>
        <div className='mx-auto flex max-w-5xl items-center justify-between px-4 py-3'>
          <Link
            to='/'
            className='font-display text-xl tracking-wider text-text-100 hover:text-accent-400 transition-colors'
          >
            {APP_NAME}
          </Link>
          <nav className='flex items-center gap-4'>
            {isAuthenticated ? (
              <>
                <Link
                  to='/lobby'
                  className='text-sm text-text-300 hover:text-text-100 transition-colors'
                  activeProps={{ className: 'text-accent-400' }}
                >
                  {t('client.app_shell.lobby')}
                </Link>
                <Link
                  to='/profile'
                  className='flex items-center gap-2 text-sm text-text-300 hover:text-text-100 transition-colors'
                  activeProps={{ className: 'text-accent-400' }}
                >
                  <span className='flex h-6 w-6 items-center justify-center rounded-full bg-surface-800 font-mono text-xs font-bold'>
                    {userName?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                  {userName ?? t('client.app_shell.profile')}
                </Link>
              </>
            ) : (
              <Link
                to='/auth'
                className='text-sm text-text-300 hover:text-text-100 transition-colors'
              >
                {t('client.app_shell.login')}
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className='mx-auto max-w-5xl px-4 py-6'>{props.children}</main>
    </div>
  );
}
