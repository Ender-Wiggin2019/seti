import { createDefaultSetupConfig } from '@seti/common/constant/sectorSetup';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { ActionConfirm } from '@/features/actions/ActionConfirm';
import { ActionMenu } from '@/features/actions/ActionMenu';
import { FreeActionBar } from '@/features/actions/FreeActionBar';
import { AlienBoardView } from '@/features/board/AlienBoardView';
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
import type { IMilestoneItem } from '@/features/scoring';
import { MilestoneTrack } from '@/features/scoring';
import { useGameContext } from '@/pages/game/GameContext';
import { GameOverDialog } from '@/pages/game/GameOverDialog';
import { type TBoardTab, useGameViewStore } from '@/stores/gameViewStore';
import type {
  IFreeActionRequest,
  IPublicGoldScoringTile,
  IPublicMilestoneState,
  IPublicPlayerState,
} from '@/types/re-exports';
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
  allowMoveAnyProbe = false,
}: {
  showSolarSystemSpaceConfig?: boolean;
  probeInsetPxByRing?: TProbeInsetPxByRing;
  allowMoveAnyProbe?: boolean;
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
              allowMoveAnyProbe={allowMoveAnyProbe}
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
  allowMoveAnyProbe,
}: {
  activeTab: TBoardTab;
  onTabChange: (tab: TBoardTab) => void;
  onInspectCard: (card: IBaseCard) => void;
  showSolarSystemSpaceConfig: boolean;
  probeInsetPxByRing?: TProbeInsetPxByRing;
  allowMoveAnyProbe: boolean;
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
                allowMoveAnyProbe={allowMoveAnyProbe}
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
          {gameState && (
            <AlienBoardView
              aliens={gameState.aliens}
              playerColors={playerColors}
            />
          )}
        </TabsContent>

        <TabsContent value='scoring' className='mt-0 h-full'>
          {gameState && (
            <div className='space-y-4'>
              {/* Score Rankings */}
              <div className='rounded border border-surface-700/40 bg-surface-900/30 p-3'>
                <h3 className='mb-2 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
                  Scores
                </h3>
                <div className='flex flex-col gap-1'>
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
              </div>

              {/* Milestones */}
              <MilestoneTrack
                milestones={buildMilestoneItems(
                  gameState.milestones,
                  playerColors,
                )}
              />

              {/* Gold Scoring Tiles */}
              <GoldScoringTilesView
                tiles={gameState.goldScoringTiles}
                playerColors={playerColors}
              />
            </div>
          )}
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

/**
 * Convert IPublicMilestoneState (buckets with resolvedPlayerIds[]) into
 * the flat IMilestoneItem[] that MilestoneTrack expects.
 *
 * Because a bucket can have multiple resolved players we create one
 * IMilestoneItem per player-resolution (showing who claimed it) plus one
 * "open" entry when nobody has resolved a bucket yet.
 */
function buildMilestoneItems(
  milestones: IPublicMilestoneState,
  _playerColors: Record<string, string>,
): IMilestoneItem[] {
  const items: IMilestoneItem[] = [];

  for (const bucket of milestones.goldMilestones) {
    if (bucket.resolvedPlayerIds.length === 0) {
      items.push({
        id: `gold-${bucket.threshold}`,
        threshold: bucket.threshold,
        type: 'gold',
      });
    } else {
      for (const pid of bucket.resolvedPlayerIds) {
        items.push({
          id: `gold-${bucket.threshold}-${pid}`,
          threshold: bucket.threshold,
          type: 'gold',
          claimedBy: pid,
        });
      }
    }
  }

  for (const bucket of milestones.neutralMilestones) {
    if (bucket.resolvedPlayerIds.length === 0) {
      items.push({
        id: `neutral-${bucket.threshold}`,
        threshold: bucket.threshold,
        type: 'neutral',
      });
    } else {
      for (const pid of bucket.resolvedPlayerIds) {
        items.push({
          id: `neutral-${bucket.threshold}-${pid}`,
          threshold: bucket.threshold,
          type: 'neutral',
          claimedBy: pid,
        });
      }
    }
  }

  return items;
}

/**
 * Inline display for gold scoring tiles — richer than GoldTileSelector
 * because we show per-slot values and individual claims.
 */
function GoldScoringTilesView({
  tiles,
  playerColors,
}: {
  tiles: IPublicGoldScoringTile[];
  playerColors: Record<string, string>;
}): React.JSX.Element {
  if (tiles.length === 0) {
    return <p className='text-xs text-text-500'>No gold scoring tiles.</p>;
  }

  return (
    <section className='rounded border border-surface-700/55 bg-surface-950/45 p-2'>
      <p className='mb-2 font-mono text-[10px] uppercase tracking-wide text-text-500'>
        Gold Scoring Tiles
      </p>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {tiles.map((tile) => {
          const claimedSlots = new Map(
            tile.claims.map((c) => [c.value, c.playerId]),
          );
          return (
            <div
              key={tile.id}
              className='rounded border border-surface-700/60 bg-surface-900/65 p-2'
            >
              {/* Tile header */}
              <div className='mb-1.5 flex items-center gap-1.5'>
                <img
                  src='/assets/seti/icons/vp.png'
                  alt='gold tile'
                  className='h-3.5 w-3.5'
                />
                <span className='font-mono text-[11px] font-medium text-text-200'>
                  {tile.id}
                </span>
                <span className='rounded bg-surface-700/50 px-1 py-0.5 font-mono text-[9px] uppercase text-text-400'>
                  Side {tile.side}
                </span>
              </div>

              {/* Slot values */}
              <div className='flex flex-wrap gap-1'>
                {tile.slotValues.map((value, idx) => {
                  const claimer = claimedSlots.get(value);
                  const claimerColor = claimer
                    ? (playerColors[claimer] ?? '#888')
                    : undefined;
                  return (
                    <div
                      key={`${tile.id}-slot-${idx}`}
                      className={[
                        'flex min-w-[36px] items-center justify-center rounded border px-1.5 py-0.5 font-mono text-[11px]',
                        claimer
                          ? 'border-accent-500/50 bg-accent-500/10 text-accent-300'
                          : 'border-surface-600/50 bg-surface-800/40 text-text-400',
                      ].join(' ')}
                      title={claimer ? `Claimed by ${claimer}` : 'Open'}
                    >
                      {claimer && (
                        <span
                          className='mr-1 inline-block h-2 w-2 rounded-full'
                          style={{ backgroundColor: claimerColor }}
                        />
                      )}
                      {value}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
  const [exchangeOpen, setExchangeOpen] = useState(false);

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
        setCornerSelectionMode(false);
        setExchangeOpen(true);
        return;
      case EFreeAction.CONVERT_ENERGY_TO_MOVEMENT:
        setCornerSelectionMode(false);
        sendFreeAction({
          type: EFreeAction.CONVERT_ENERGY_TO_MOVEMENT,
          amount: 1,
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

      <ExchangeResourcesDialog
        open={exchangeOpen}
        player={myPlayer}
        onCancel={() => setExchangeOpen(false)}
        onConfirm={(from, to) => {
          sendFreeAction({
            type: EFreeAction.EXCHANGE_RESOURCES,
            from,
            to,
          });
          setExchangeOpen(false);
        }}
      />
    </div>
  );
}

const EXCHANGE_OPTIONS: Array<{
  from: EResource;
  to: EResource;
  label: string;
}> = [
  {
    from: EResource.CREDIT,
    to: EResource.ENERGY,
    label: '2 Credits → 1 Energy',
  },
  { from: EResource.CREDIT, to: EResource.CARD, label: '2 Credits → 1 Card' },
  {
    from: EResource.ENERGY,
    to: EResource.CREDIT,
    label: '2 Energy → 1 Credit',
  },
  { from: EResource.ENERGY, to: EResource.CARD, label: '2 Energy → 1 Card' },
  { from: EResource.CARD, to: EResource.CREDIT, label: '2 Cards → 1 Credit' },
  { from: EResource.CARD, to: EResource.ENERGY, label: '2 Cards → 1 Energy' },
];

function ExchangeResourcesDialog({
  open,
  player,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  player: IPublicPlayerState | null | undefined;
  onCancel: () => void;
  onConfirm: (from: EResource, to: EResource) => void;
}): React.JSX.Element {
  const canAfford = (from: EResource): boolean => {
    if (!player) return false;
    if (from === EResource.CARD) return (player.handSize ?? 0) >= 2;
    if (from === EResource.CREDIT)
      return (player.resources[EResource.CREDIT] ?? 0) >= 2;
    if (from === EResource.ENERGY)
      return (player.resources[EResource.ENERGY] ?? 0) >= 2;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exchange Resources</DialogTitle>
          <p className='text-sm text-text-300'>
            Trade 2 of one resource for 1 of another.
          </p>
        </DialogHeader>
        <div className='grid grid-cols-1 gap-2'>
          {EXCHANGE_OPTIONS.map((opt) => (
            <Button
              key={`${opt.from}-${opt.to}`}
              type='button'
              variant='ghost'
              disabled={!canAfford(opt.from)}
              onClick={() => onConfirm(opt.from, opt.to)}
              className='h-10 justify-start border border-surface-700/60 bg-surface-800/50 px-3 text-left text-sm text-text-200 hover:bg-surface-700/70 disabled:opacity-40'
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
