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
      <SidebarSection title='Event Log'>
        {events.length === 0 ? (
          <p className='text-xs italic text-text-500'>No events yet.</p>
        ) : (
          <div className='flex flex-col gap-1'>
            {events.slice(0, 20).map((event, i) => (
              <div
                key={`${event.type}-${i}`}
                className='rounded bg-surface-900/50 px-2 py-1 font-mono text-xs text-text-300'
              >
                {event.type}
              </div>
            ))}
          </div>
        )}
      </SidebarSection>

      <SidebarSection title='Opponents'>
        {!opponents?.length ? (
          <p className='text-xs italic text-text-500'>No opponents.</p>
        ) : (
          <div className='flex flex-col gap-2'>
            {opponents.map((p) => (
              <div
                key={p.playerId}
                className='rounded border border-surface-700/60 bg-surface-900/50 px-2.5 py-2'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-medium text-text-100'>
                    {p.playerName}
                  </span>
                  <span className='font-mono text-xs text-text-500'>
                    {p.score} VP
                  </span>
                </div>
                <div className='mt-1 flex gap-2 font-mono text-xs text-text-500'>
                  <span>H:{p.handSize}</span>
                  <span>D:{p.dataPoolCount}</span>
                  {p.passed && <span className='text-accent-400'>Passed</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SidebarSection>

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
