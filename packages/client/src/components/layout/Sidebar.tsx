import { useTranslation } from 'react-i18next';
import { EventLog } from '@/features/log';
import { OpponentSummary } from '@/features/player';
import { cn } from '@/lib/cn';
import { useGameContext } from '@/pages/game/GameContext';

interface ISidebarProps {
  className?: string;
}

/**
 * Sidebar — the secondary instrument column.
 *
 * Hairline-bordered columns of grouped intel: mission log, opponents,
 * alien boards. Each section is a micro-label capped subsection;
 * sections are separated by a thin instrument tick rather than card
 * walls to keep the column reading as one continuous strip.
 */
export function Sidebar({ className }: ISidebarProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const { gameState, myPlayerId, events } = useGameContext();

  const opponents = gameState?.players.filter((p) => p.playerId !== myPlayerId);

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 overflow-y-auto p-4',
        'border-l border-[color:var(--metal-edge-soft)]',
        'bg-[oklch(0.13_0.022_260/0.5)] backdrop-blur-sm',
        className,
      )}
      aria-label={t('client.sidebar.opponents')}
    >
      <EventLog events={events} players={gameState?.players ?? []} />

      <div className='instrument-tick' />

      {!opponents?.length ? (
        <SidebarSection title={t('client.sidebar.opponents')}>
          <EmptyNote>{t('client.sidebar.no_opponents')}</EmptyNote>
        </SidebarSection>
      ) : (
        <OpponentSummary opponents={opponents} />
      )}

      <div className='instrument-tick' />

      <SidebarSection title={t('client.sidebar.alien_boards')}>
        <EmptyNote>{t('client.sidebar.alien_boards_hint')}</EmptyNote>
      </SidebarSection>
    </aside>
  );
}

interface ISidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

function SidebarSection({
  title,
  children,
}: ISidebarSectionProps): React.JSX.Element {
  return (
    <section>
      <h3 className='micro-label mb-2.5'>{title}</h3>
      {children}
    </section>
  );
}

function EmptyNote({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <p className='text-xs italic text-text-500'>{children}</p>;
}
