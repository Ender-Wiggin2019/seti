import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import {
  buildMoveAction,
  SolarSystemView,
} from '@/features/board/SolarSystemView';
import { TechBoardView } from '@/features/board/TechBoardView';
import { CardDetail } from '@/features/cards/CardDetail';
import { CardRowView } from '@/features/cards/CardRowView';
import { EndOfRoundStacks } from '@/features/cards/EndOfRoundStacks';
import { InputRenderer } from '@/features/input/InputRenderer';
import { useGameContext } from '@/pages/game/GameContext';
import { GameOverDialog } from '@/pages/game/GameOverDialog';
import { type TBoardTab, useGameViewStore } from '@/stores/gameViewStore';
import { EPlayerInputType } from '@/types/re-exports';

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
  const { gameState, myPlayerId, pendingInput, sendFreeAction, sendInput } =
    useGameContext();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);

  const playerColors =
    gameState?.players.reduce<Record<string, string>>((acc, p) => {
      acc[p.playerId] = p.color;
      return acc;
    }, {}) ?? {};
  const detailCard =
    gameState?.cardRow.find((card) => card.id === detailCardId) ?? null;

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
          <div className='space-y-3'>
            {gameState && (
              <SolarSystemView
                solarSystem={gameState.solarSystem}
                sectors={gameState.sectors}
                pendingInput={pendingInput}
                playerColors={playerColors}
                myPlayerId={myPlayerId}
                onMoveProbe={(fromSpaceId, toSpaceId) => {
                  sendFreeAction(buildMoveAction(fromSpaceId, toSpaceId));
                }}
                onRespondInput={sendInput}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value='planets' className='mt-0 h-full'>
          {gameState && (
            <PlanetaryBoardView
              planetaryBoard={gameState.planetaryBoard}
              pendingInput={pendingInput}
              playerColors={playerColors}
            />
          )}
        </TabsContent>

        <TabsContent value='tech' className='mt-0 h-full'>
          {gameState && (
            <TechBoardView
              techBoard={gameState.techBoard}
              players={gameState.players}
              pendingInput={pendingInput}
              playerColors={playerColors}
            />
          )}
        </TabsContent>

        <TabsContent value='cards' className='mt-0 h-full'>
          {gameState && (
            <div className='space-y-3'>
              <CardRowView
                cards={gameState.cardRow}
                mode={
                  pendingInput?.type === EPlayerInputType.CARD
                    ? 'discard'
                    : 'idle'
                }
                onCardInspect={(card) => {
                  setDetailCardId(card.id);
                  setDetailOpen(true);
                }}
              />
              <EndOfRoundStacks
                stacks={gameState.endOfRoundStacks ?? [[], [], [], []]}
                currentRoundIndex={gameState.currentEndOfRoundStackIndex ?? 0}
                mode={
                  pendingInput?.type === EPlayerInputType.END_OF_ROUND
                    ? 'select'
                    : 'idle'
                }
              />
              <CardDetail
                card={detailCard}
                open={detailOpen}
                onOpenChange={setDetailOpen}
              />
            </div>
          )}
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
  const { gameState, myPlayerId, isMyTurn, pendingInput, sendInput } =
    useGameContext();

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
              <InputRenderer model={pendingInput} onSubmit={sendInput} />
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
