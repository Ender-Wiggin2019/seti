import { APP_NAME } from '@/config/constants';

interface IAppShellProps {
  children: React.ReactNode;
}

export function AppShell(props: IAppShellProps): React.JSX.Element {
  return (
    <div className='min-h-screen bg-background-950 text-text-100'>
      <div
        className='fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
        aria-hidden
      />
      <header className='border-b border-surface-700/70 bg-surface-900/70 backdrop-blur'>
        <div className='mx-auto flex max-w-5xl items-center justify-between px-4 py-3'>
          <h1 className='font-display text-xl tracking-wider text-text-100'>
            {APP_NAME}
          </h1>
          <span className='font-mono text-xs uppercase tracking-[0.2em] text-text-500'>
            Scaffold
          </span>
        </div>
      </header>
      <main className='mx-auto max-w-5xl px-4 py-6'>{props.children}</main>
    </div>
  );
}
