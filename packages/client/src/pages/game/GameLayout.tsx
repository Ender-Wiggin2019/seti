import { createDefaultSetupConfig } from '@seti/common/constant/sectorSetup';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { ActionConfirm } from '@/features/actions/ActionConfirm';
import { ActionMenu } from '@/features/actions/ActionMenu';
import { FreeActionBar } from '@/features/actions/FreeActionBar';
import { buildMoveAction } from '@/features/board/moveAction';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import type { TProbeInsetPxByRing } from '@/features/board/SolarSystemView';
import { SolarSystemView } from '@/features/board/SolarSystemView';
import { TechBoardView } from '@/features/board/TechBoardView';
import { CardDetail } from '@/features/cards/CardDetail';
import { CardRowView } from '@/features/cards/CardRowView';
import { EndOfRoundStacks } from '@/features/cards/EndOfRoundStacks';
import { InputRenderer } from '@/features/input/InputRenderer';
import { HandView, PlayedMissions, PlayerDashboard } from '@/features/player';
import { useGameContext } from '@/pages/game/GameContext';
import { GameOverDialog } from '@/pages/game/GameOverDialog';
import { type TBoardTab, useGameViewStore } from '@/stores/gameViewStore';
import type { IFreeActionRequest } from '@/types/re-exports';
import { EFreeAction, EPlayerInputType } from '@/types/re-exports';

const BOARD_TABS: { value: TBoardTab; label: string }[] = [
  { value: 'board', label: 'Board' },
  { value: 'planets', label: 'Planets' },
  { value: 'tech', label: 'Tech' },
  { value: 'cards', label: 'Cards' },
  { value: 'aliens', label: 'Aliens' },
  { value: 'scoring', label: 'Scoring' },
];

export function GameLayout({
  showSolarSystemSpaceConfig = false,
  probeInsetPxByRing,
}: {
  showSolarSystemSpaceConfig?: boolean;
  probeInsetPxByRing?: TProbeInsetPxByRing;
}): React.JSX.Element {
  const activeTab = useGameViewStore((s) => s.activeTab);
  const setActiveTab = useGameViewStore((s) => s.setActiveTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<IBaseCard | null>(null);

  const handleInspectCard = (card: IBaseCard): void => {
    setDetailCard(card);
    setDetailOpen(true);
  };

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
            <BoardTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onInspectCard={handleInspectCard}
              showSolarSystemSpaceConfig={showSolarSystemSpaceConfig}
              probeInsetPxByRing={probeInsetPxByRing}
            />

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
      <BottomBar onInspectCard={handleInspectCard} />

      <CardDetail
        card={detailCard}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <GameOverDialog />
    </div>
  );
}

function BoardTabs({
  activeTab,
  onTabChange,
  onInspectCard,
  showSolarSystemSpaceConfig,
  probeInsetPxByRing,
}: {
  activeTab: TBoardTab;
  onTabChange: (tab: TBoardTab) => void;
  onInspectCard: (card: IBaseCard) => void;
  showSolarSystemSpaceConfig: boolean;
  probeInsetPxByRing?: TProbeInsetPxByRing;
}): React.JSX.Element {
  const { gameState, myPlayerId, pendingInput, sendFreeAction, sendInput } =
    useGameContext();
  const [armedCardRowBuy, setArmedCardRowBuy] = useState(false);

  const playerColors =
    gameState?.players.reduce<Record<string, string>>((acc, p) => {
      acc[p.playerId] = p.color;
      return acc;
    }, {}) ?? {};
  const cardSelectionInput =
    pendingInput?.type === EPlayerInputType.CARD ? pendingInput : null;
  const selectableCardIds = new Set(
    cardSelectionInput?.cards.map((c) => c.id) ?? [],
  );
  const isSelectingFromCardRow =
    cardSelectionInput !== null &&
    gameState?.cardRow.some((card) => selectableCardIds.has(card.id));

  function handleCardRowClick(card: IBaseCard): void {
    if (isSelectingFromCardRow) {
      sendInput({ type: EPlayerInputType.CARD, cardIds: [card.id] });
      return;
    }

    if (armedCardRowBuy) {
      sendFreeAction({ type: EFreeAction.BUY_CARD, cardId: card.id });
      setArmedCardRowBuy(false);
      return;
    }

    onInspectCard(card);
  }

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
                setupConfig={
                  gameState.solarSystemSetup ?? createDefaultSetupConfig()
                }
                pendingInput={pendingInput}
                playerColors={playerColors}
                myPlayerId={myPlayerId}
                onMoveProbe={(fromSpaceId, toSpaceId) => {
                  sendFreeAction(buildMoveAction(fromSpaceId, toSpaceId));
                }}
                onRespondInput={sendInput}
                showSpaceConfigDebug={showSolarSystemSpaceConfig}
                probeInsetPxByRing={probeInsetPxByRing}
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
              <div className='flex flex-wrap items-center gap-2 rounded border border-surface-700/40 bg-surface-900/30 p-2'>
                <button
                  type='button'
                  className='rounded border border-accent-500/60 bg-accent-500/10 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-accent-300 transition-colors hover:bg-accent-500/20'
                  onClick={() =>
                    sendFreeAction({
                      type: EFreeAction.BUY_CARD,
                      fromDeck: true,
                    })
                  }
                >
                  Buy From Deck
                </button>
                <button
                  type='button'
                  className='rounded border border-surface-700/70 bg-surface-800/60 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-text-300 transition-colors hover:bg-surface-700/70'
                  onClick={() => setArmedCardRowBuy((v) => !v)}
                >
                  {armedCardRowBuy ? 'Cancel Row Buy' : 'Buy From Row'}
                </button>
                <div className='ml-auto flex items-center gap-2'>
                  <div className='h-[72px] w-[52px] rounded border border-surface-700/60 bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center shadow-lg' />
                  <span className='font-mono text-[11px] uppercase tracking-wide text-text-500'>
                    Main Deck
                  </span>
                </div>
              </div>

              <CardRowView
                cards={gameState.cardRow}
                mode={
                  isSelectingFromCardRow
                    ? 'discard'
                    : armedCardRowBuy
                      ? 'buy'
                      : 'idle'
                }
                onCardClick={handleCardRowClick}
                onCardInspect={onInspectCard}
              />
              <EndOfRoundStacks
                stacks={gameState.endOfRoundStacks ?? [[], [], [], []]}
                currentRoundIndex={gameState.currentEndOfRoundStackIndex ?? 0}
                mode={
                  pendingInput?.type === EPlayerInputType.END_OF_ROUND
                    ? 'select'
                    : 'idle'
                }
                onSelectCard={(card) => {
                  if (pendingInput?.type !== EPlayerInputType.END_OF_ROUND) {
                    onInspectCard(card);
                    return;
                  }

                  sendInput({
                    type: EPlayerInputType.END_OF_ROUND,
                    cardId: card.id,
                  });
                }}
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

function BottomBar({
  onInspectCard,
}: {
  onInspectCard: (card: IBaseCard) => void;
}): React.JSX.Element {
  const {
    gameState,
    myPlayerId,
    isMyTurn,
    pendingInput,
    sendAction,
    sendFreeAction,
    sendInput,
    requestUndo,
  } = useGameContext();
  const [confirmRequest, setConfirmRequest] =
    useState<IFreeActionRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cornerSelectionMode, setCornerSelectionMode] = useState(false);

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const extendedPlayer = myPlayer as
    | (typeof myPlayer & {
        creditIncome?: number;
        energyIncome?: number;
        playedMissions?: IBaseCard[];
      })
    | undefined;
  const missionCards = extendedPlayer?.playedMissions ?? [];
  const canUndo = Boolean((gameState as { canUndo?: boolean } | null)?.canUndo);

  const handleFreeActionClick = (action: EFreeAction) => {
    switch (action) {
      case EFreeAction.BUY_CARD:
        setCornerSelectionMode(false);
        setConfirmRequest({ type: EFreeAction.BUY_CARD, fromDeck: true });
        setConfirmOpen(true);
        return;
      case EFreeAction.PLACE_DATA:
        setCornerSelectionMode(false);
        sendFreeAction({ type: EFreeAction.PLACE_DATA, slotIndex: 0 });
        return;
      case EFreeAction.COMPLETE_MISSION:
        setCornerSelectionMode(false);
        if (missionCards.length === 1) {
          sendFreeAction({
            type: EFreeAction.COMPLETE_MISSION,
            cardId: missionCards[0].id,
          });
          return;
        }
        toast({
          title: 'Mission selection required',
          description:
            'Use mission controls to pick which mission to complete.',
          variant: 'error',
        });
        return;
      case EFreeAction.USE_CARD_CORNER:
        if (!myPlayer?.hand?.length) {
          return;
        }

        if (myPlayer?.hand?.length === 1 && myPlayer.hand[0]?.id) {
          setCornerSelectionMode(false);
          sendFreeAction({
            type: EFreeAction.USE_CARD_CORNER,
            cardId: myPlayer.hand[0].id,
          });
          return;
        }
        setCornerSelectionMode(true);
        toast({
          title: 'Card selection required',
          description: 'Select a specific card to use its corner free action.',
        });
        return;
      case EFreeAction.MOVEMENT:
        setCornerSelectionMode(false);
        toast({
          title: 'Select probe movement on board',
          description:
            'Click a probe and choose a destination in the board view.',
        });
        return;
      case EFreeAction.EXCHANGE_RESOURCES:
      case EFreeAction.CONVERT_ENERGY_TO_MOVEMENT:
        setCornerSelectionMode(false);
        toast({
          title: 'Action requires extra selection',
          description:
            'This free action needs additional options before sending.',
        });
        return;
      default:
        return;
    }
  };

  const handleConfirmFreeAction = () => {
    if (confirmRequest) {
      sendFreeAction(confirmRequest);
    }
    setConfirmOpen(false);
    setConfirmRequest(null);
  };

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
            <PlayerDashboard
              player={myPlayer}
              pendingInput={pendingInput}
              onFreeAction={sendFreeAction}
              income={{
                credit: extendedPlayer?.creditIncome ?? 0,
                energy: extendedPlayer?.energyIncome ?? 0,
              }}
              playedMissions={missionCards}
            />
          ) : (
            <p className='text-xs text-text-500'>Loading...</p>
          )}
        </div>

        {/* Hand View */}
        <div className='p-3' data-testid='bottom-hand'>
          <h4 className='mb-1.5 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
            Hand & Missions
          </h4>
          {myPlayer ? (
            <div className='flex h-full min-h-[86px] flex-col gap-2'>
              <HandView
                cards={myPlayer.hand}
                handSize={myPlayer.handSize}
                pendingInput={pendingInput}
                cornerSelectionMode={cornerSelectionMode}
                onSubmitSelection={(cardIds) => {
                  sendInput({
                    type: EPlayerInputType.CARD,
                    cardIds,
                  });
                }}
                onCardCornerSelect={(cardId) => {
                  sendFreeAction({
                    type: EFreeAction.USE_CARD_CORNER,
                    cardId,
                  });
                  setCornerSelectionMode(false);
                }}
                onCardInspect={onInspectCard}
              />
              {cornerSelectionMode && (
                <p className='rounded border border-amber-500/50 bg-amber-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-amber-200'>
                  Click a hand card to use its corner action
                </p>
              )}
              <PlayedMissions missions={missionCards} />
            </div>
          ) : (
            <p className='text-xs text-text-500'>Loading...</p>
          )}
        </div>

        {/* Action Menu / Input Renderer */}
        <div className='p-3' data-testid='bottom-actions'>
          <h4 className='mb-1.5 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
            Actions
          </h4>
          {pendingInput && pendingInput.type !== EPlayerInputType.OR ? (
            <div className='rounded border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-xs text-accent-400'>
              <InputRenderer model={pendingInput} onSubmit={sendInput} />
            </div>
          ) : (
            <ActionMenu
              gameState={gameState}
              myPlayerId={myPlayerId}
              isMyTurn={isMyTurn}
              pendingInput={pendingInput}
              canUndo={canUndo}
              onSendAction={sendAction}
              onRequestUndo={requestUndo}
            />
          )}
        </div>
      </div>

      {/* Free Action Bar */}
      <FreeActionBar
        gameState={gameState}
        myPlayerId={myPlayerId}
        isMyTurn={isMyTurn}
        onActionClick={handleFreeActionClick}
      />

      <ActionConfirm
        open={confirmOpen}
        title='Buy Card'
        description='Spend 3 publicity and draw from the deck?'
        costs={['3 publicity']}
        confirmLabel='Buy'
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmRequest(null);
        }}
        onConfirm={handleConfirmFreeAction}
      />
    </div>
  );
}
