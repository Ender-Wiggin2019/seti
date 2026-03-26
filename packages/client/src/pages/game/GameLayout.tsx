import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/cn';
import { useGameContext } from '@/pages/game/GameContext';
import { GameOverDialog } from '@/pages/game/GameOverDialog';
import { type TBoardTab, useGameViewStore } from '@/stores/gameViewStore';

const BOARD_TABS: { value: TBoardTab; label: string }[] = [
  { value: 'board', label: 'Board' },
  { value: 'planets', label: 'Planets' },
  { value: 'tech', label: 'Tech' },
  { value: 'cards', label: 'Cards' },
  { value: 'aliens', label: 'Aliens' },
  { value: 'scoring', label: 'Scoring' },
];

export function GameLayout(): React.JSX.Element {
  const activeTab = useGameViewStore((s) => s.activeTab);
  const setActiveTab = useGameViewStore((s) => s.setActiveTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-background-950 text-text-100'>
      <div
        className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
        aria-hidden
      />

      <TopBar />

      <div className='flex min-h-0 flex-1'>
        {/* Main board area + sidebar grid */}
        <div className='flex min-h-0 flex-1 flex-col lg:flex-row'>
          {/* Board area */}
          <main className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
            <BoardTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Mobile sidebar toggle */}
            <button
              type='button'
              onClick={() => setSidebarOpen((v) => !v)}
              className='absolute right-3 top-3 z-10 rounded border border-surface-700 bg-surface-900/80 px-2 py-1 font-mono text-xs text-text-300 backdrop-blur-sm transition-colors hover:bg-surface-800 lg:hidden'
              aria-label='Toggle sidebar'
            >
              {sidebarOpen ? 'Board' : 'Info'}
            </button>

            {/* Mobile/tablet sidebar overlay */}
            {sidebarOpen && (
              <div className='absolute inset-0 z-20 lg:hidden'>
                <Sidebar className='h-full' />
              </div>
            )}
          </main>

          {/* Desktop sidebar */}
          <Sidebar className='hidden w-72 shrink-0 xl:w-80 lg:flex' />
        </div>
      </div>

      {/* Bottom bar */}
      <BottomBar />

      <GameOverDialog />
    </div>
  );
}

function BoardTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TBoardTab;
  onTabChange: (tab: TBoardTab) => void;
}): React.JSX.Element {
  const { gameState } = useGameContext();

  return (
    <Tabs
      defaultValue='board'
      value={activeTab}
      onValueChange={(v) => onTabChange(v as TBoardTab)}
      className='flex min-h-0 flex-1 flex-col'
    >
      <div className='shrink-0 overflow-x-auto border-b border-surface-700/50 bg-surface-900/30 px-3 py-1.5'>
        <TabsList className='w-max'>
          {BOARD_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className='min-h-0 flex-1 overflow-auto p-4'>
        <TabsContent value='board' className='mt-0 h-full'>
          <BoardPlaceholder
            title='Main Board'
            description='Solar system (4 concentric rings) with 8 sectors arranged as the outer perimeter. Card market above, probes overlaid.'
            bgImage='/assets/seti/boards/_board.png'
          >
            {gameState && (
              <div className='mt-3 grid grid-cols-4 gap-2'>
                {gameState.sectors.map((s) => (
                  <div
                    key={s.sectorId}
                    className={cn(
                      'rounded border border-surface-700/60 bg-surface-800/40 px-2 py-1.5 text-center font-mono text-xs',
                      s.completed && 'border-accent-500/40 bg-accent-500/10',
                    )}
                  >
                    <span className='text-text-300'>{s.color}</span>
                    {s.completed && (
                      <span className='ml-1 text-accent-400'>OK</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </BoardPlaceholder>
        </TabsContent>

        <TabsContent value='planets' className='mt-0 h-full'>
          <BoardPlaceholder
            title='Planetary Board'
            description='Planets with orbit/landing slots, moon availability, and first-arrive bonuses.'
            bgImage='/assets/seti/boards/planetBoard.jpg'
          />
        </TabsContent>

        <TabsContent value='tech' className='mt-0 h-full'>
          <BoardPlaceholder
            title='Tech Board'
            description='12 tech stacks grid with 2VP tiles and player acquisition markers.'
          >
            {gameState && gameState.techBoard.stacks.length > 0 && (
              <div className='mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4'>
                {gameState.techBoard.stacks.map((stack) => (
                  <div
                    key={stack.tech}
                    className='rounded border border-surface-700/60 bg-surface-800/40 px-2 py-1.5 text-center font-mono text-xs'
                  >
                    <span className='text-text-300'>{stack.tech}</span>
                    <span className='ml-1 text-text-500'>
                      x{stack.remainingTiles}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </BoardPlaceholder>
        </TabsContent>

        <TabsContent value='cards' className='mt-0 h-full'>
          <BoardPlaceholder
            title='Cards'
            description='Card market (3 open cards) and end-of-round card stacks.'
          />
        </TabsContent>

        <TabsContent value='aliens' className='mt-0 h-full'>
          <BoardPlaceholder
            title='Aliens'
            description='Discovery track and species-specific boards after discovery.'
          />
        </TabsContent>

        <TabsContent value='scoring' className='mt-0 h-full'>
          <BoardPlaceholder
            title='Scoring'
            description='Gold/neutral milestones, current scores, and score breakdown.'
          >
            {gameState && (
              <div className='mt-3 flex flex-col gap-1'>
                {gameState.players
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p) => (
                    <div
                      key={p.playerId}
                      className='flex items-center justify-between rounded border border-surface-700/40 bg-surface-800/30 px-3 py-1.5'
                    >
                      <span className='text-xs font-medium text-text-100'>
                        {p.playerName}
                      </span>
                      <span className='font-mono text-sm font-bold text-accent-400'>
                        {p.score}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </BoardPlaceholder>
        </TabsContent>
      </div>
    </Tabs>
  );
}

function BoardPlaceholder({
  title,
  description,
  bgImage,
  children,
}: {
  title: string;
  description: string;
  bgImage?: string;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className='relative flex h-full flex-col items-center justify-center rounded-lg border border-surface-700/40 bg-surface-900/30 p-6'
      style={
        bgImage
          ? {
              backgroundImage: `linear-gradient(rgba(8, 13, 25, 0.75), rgba(8, 13, 25, 0.85)), url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <h2 className='font-display text-lg font-bold uppercase tracking-wider text-text-100'>
        {title}
      </h2>
      <p className='mt-1 max-w-md text-center text-xs text-text-500'>
        {description}
      </p>
      {children}
    </div>
  );
}

function BottomBar(): React.JSX.Element {
  const { gameState, myPlayerId, isMyTurn, pendingInput } = useGameContext();

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);

  return (
    <div className='shrink-0 border-t border-surface-700/70 bg-surface-900/60 backdrop-blur-sm'>
      {/* Main bottom content area */}
      <div className='grid min-h-[120px] grid-cols-1 divide-surface-700/40 md:grid-cols-3 md:divide-x'>
        {/* Player Dashboard */}
        <div className='p-3' data-testid='bottom-dashboard'>
          <h4 className='mb-1.5 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
            Dashboard
          </h4>
          {myPlayer ? (
            <div className='grid grid-cols-4 gap-2'>
              <ResourceCell label='Credits' value={myPlayer.resources.credit} />
              <ResourceCell label='Energy' value={myPlayer.resources.energy} />
              <ResourceCell label='Data' value={myPlayer.resources.data} />
              <ResourceCell
                label='Publicity'
                value={myPlayer.resources.publicity}
              />
            </div>
          ) : (
            <p className='text-xs text-text-500'>Loading...</p>
          )}
        </div>

        {/* Hand View */}
        <div className='p-3' data-testid='bottom-hand'>
          <h4 className='mb-1.5 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
            Hand
          </h4>
          {myPlayer ? (
            <p className='text-xs text-text-300'>
              {myPlayer.handSize} card{myPlayer.handSize !== 1 ? 's' : ''} in
              hand
            </p>
          ) : (
            <p className='text-xs text-text-500'>Loading...</p>
          )}
        </div>

        {/* Action Menu / Input Renderer */}
        <div className='p-3' data-testid='bottom-actions'>
          <h4 className='mb-1.5 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
            Actions
          </h4>
          {pendingInput ? (
            <div className='rounded border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-xs text-accent-400'>
              Input required: {pendingInput.type}
            </div>
          ) : isMyTurn ? (
            <p className='text-xs text-accent-400'>Choose your action...</p>
          ) : (
            <p className='text-xs text-text-500'>Waiting for opponent...</p>
          )}
        </div>
      </div>

      {/* Free Action Bar */}
      {isMyTurn && (
        <div
          className='flex items-center gap-2 border-t border-surface-700/40 px-4 py-1.5'
          data-testid='free-action-bar'
        >
          <span className='mr-1 font-mono text-xs text-text-500'>Free:</span>
          {FREE_ACTIONS.map((fa) => (
            <button
              key={fa.id}
              type='button'
              disabled
              className='rounded border border-surface-700/60 bg-surface-800/60 px-2 py-0.5 font-mono text-xs text-text-500 opacity-60'
              title={fa.label}
            >
              {fa.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCell({
  label,
  value,
}: {
  label: string;
  value: number;
}): React.JSX.Element {
  return (
    <div className='rounded border border-surface-700/40 bg-surface-800/30 px-2 py-1 text-center'>
      <p className='font-mono text-sm font-bold text-text-100'>{value}</p>
      <p className='text-xs text-text-500'>{label}</p>
    </div>
  );
}

const FREE_ACTIONS = [
  { id: 'move', label: 'Move' },
  { id: 'place-data', label: 'Data' },
  { id: 'mission', label: 'Mission' },
  { id: 'card-corner', label: 'Card' },
  { id: 'buy-card', label: 'Buy' },
  { id: 'exchange', label: 'Trade' },
];
