import { EventLog } from '@/features/log';
import { OpponentSummary } from '@/features/player';
import { cn } from '@/lib/cn';
import { useGameContext } from '@/pages/game/GameContext';

interface ISidebarProps {
  className?: string;
}

export function Sidebar({ className }: ISidebarProps): React.JSX.Element {
  const { gameState, myPlayerId, events } = useGameContext();

  const opponents = gameState?.players.filter((p) => p.playerId !== myPlayerId);

  return (
    <aside
      className={cn(
        'flex flex-col gap-3 overflow-y-auto border-l border-surface-700/70 bg-surface-900/40 p-3',
        className,
      )}
    >
      <EventLog events={events} players={gameState?.players ?? []} />

      {!opponents?.length ? (
        <SidebarSection title='Opponents'>
          <p className='text-xs italic text-text-500'>No opponents.</p>
        </SidebarSection>
      ) : (
        <OpponentSummary opponents={opponents} />
      )}

      <SidebarSection title='Alien Boards'>
        <p className='text-xs italic text-text-500'>
          Alien boards will appear here after discovery.
        </p>
      </SidebarSection>
    </aside>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <h3 className='mb-2 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
        {title}
      </h3>
      {children}
    </div>
  );
}
