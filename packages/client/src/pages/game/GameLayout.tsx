import { createDefaultSetupConfig } from '@seti/common/constant/sectorSetup';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const BOARD_TABS: TBoardTab[] = [
  'board',
  'planets',
  'tech',
  'cards',
  'aliens',
  'scoring',
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
  const { t } = useTranslation('common');
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
              aria-label={t('client.game_layout.toggle_sidebar')}
            >
              {sidebarOpen
                ? t('client.game_layout.board')
                : t('client.game_layout.info')}
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
  const { t } = useTranslation('common');
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
            <TabsTrigger key={tab} value={tab}>
              {t(`client.game_layout.tabs.${tab}`)}
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
                  {t('client.game_layout.buy_from_deck')}
                </button>
                <button
                  type='button'
                  className='rounded border border-surface-700/70 bg-surface-800/60 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-text-300 transition-colors hover:bg-surface-700/70'
                  onClick={() => setArmedCardRowBuy((v) => !v)}
                >
                  {armedCardRowBuy
                    ? t('client.game_layout.cancel_row_buy')
                    : t('client.game_layout.buy_from_row')}
                </button>
                <div className='ml-auto flex items-center gap-2'>
                  <div className='h-[72px] w-[52px] rounded border border-surface-700/60 bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center shadow-lg' />
                  <span className='font-mono text-[11px] uppercase tracking-wide text-text-500'>
                    {t('client.game_layout.main_deck')}
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
                  {t('client.game_layout.scores')}
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

/**
 * Convert IPublicMilestoneState (buckets with resolvedPlayerIds[]) into
 * the flat IMilestoneItem[] that MilestoneTrack expects.
 *
 * Because a bucket can have multiple resolved players we create one
 * IMilestoneItem per player-resolution (showing who claimed it) plus one
 * "open" entry when nobody has resolved a bucket yet.
 */
export function buildMilestoneItems(
  milestones: IPublicMilestoneState,
  playerColors: Record<string, string>,
): IMilestoneItem[] {
  const items: IMilestoneItem[] = [];
  const totalPlayers = Math.max(Object.keys(playerColors).length, 1);

  for (const bucket of milestones.goldMilestones) {
    for (const pid of bucket.resolvedPlayerIds) {
      items.push({
        id: `gold-${bucket.threshold}-${pid}`,
        threshold: bucket.threshold,
        type: 'gold',
        claimedBy: pid,
      });
    }
    const canStillClaim = bucket.resolvedPlayerIds.length < totalPlayers;
    if (canStillClaim) {
      items.push({
        id: `gold-${bucket.threshold}-open`,
        threshold: bucket.threshold,
        type: 'gold',
      });
    }
  }

  for (const bucket of milestones.neutralMilestones) {
    for (const pid of bucket.resolvedPlayerIds) {
      items.push({
        id: `neutral-${bucket.threshold}-${pid}`,
        threshold: bucket.threshold,
        type: 'neutral',
        claimedBy: pid,
      });
    }
    for (let i = 0; i < bucket.markersRemaining; i++) {
      items.push({
        id: `neutral-${bucket.threshold}-open-${i}`,
        threshold: bucket.threshold,
        type: 'neutral',
      });
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
  const { t } = useTranslation('common');
  if (tiles.length === 0) {
    return (
      <p className='text-xs text-text-500'>
        {t('client.game_layout.no_gold_tiles')}
      </p>
    );
  }

  return (
    <section className='rounded border border-surface-700/55 bg-surface-950/45 p-2'>
      <p className='mb-2 font-mono text-[10px] uppercase tracking-wide text-text-500'>
        {t('client.game_layout.gold_scoring_tiles')}
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
                  alt={t('client.game_layout.gold_tile_alt')}
                  className='h-3.5 w-3.5'
                />
                <span className='font-mono text-[11px] font-medium text-text-200'>
                  {tile.id}
                </span>
                <span className='rounded bg-surface-700/50 px-1 py-0.5 font-mono text-[9px] uppercase text-text-400'>
                  {t('client.game_layout.side', { side: tile.side })}
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
                      title={
                        claimer
                          ? t('client.game_layout.claimed_by', {
                              player: claimer,
                            })
                          : t('client.common.open')
                      }
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
  const { t } = useTranslation('common');
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
  const [placeDataOpen, setPlaceDataOpen] = useState(false);
  const [convertEnergyOpen, setConvertEnergyOpen] = useState(false);

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
  const placeDataOptions = buildPlaceDataOptions(myPlayer);
  const maxConvertibleEnergy = myPlayer?.resources?.[EResource.ENERGY] ?? 0;

  const handleFreeActionClick = (action: EFreeAction) => {
    switch (action) {
      case EFreeAction.BUY_CARD:
        setCornerSelectionMode(false);
        setConfirmRequest({ type: EFreeAction.BUY_CARD, fromDeck: true });
        setConfirmOpen(true);
        return;
      case EFreeAction.PLACE_DATA:
        setCornerSelectionMode(false);
        if (placeDataOptions.length <= 0) {
          toast({
            title: t('client.game_layout.toast.no_computer_slot'),
            description: t('client.game_layout.toast.no_computer_slot_desc'),
            variant: 'error',
          });
          return;
        }
        setPlaceDataOpen(true);
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
          title: t('client.game_layout.toast.mission_required'),
          description: t('client.game_layout.toast.mission_required_desc'),
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
          title: t('client.game_layout.toast.card_required'),
          description: t('client.game_layout.toast.card_required_desc'),
        });
        return;
      case EFreeAction.MOVEMENT:
        setCornerSelectionMode(false);
        toast({
          title: t('client.game_layout.toast.select_probe'),
          description: t('client.game_layout.toast.select_probe_desc'),
        });
        return;
      case EFreeAction.EXCHANGE_RESOURCES:
        setCornerSelectionMode(false);
        setExchangeOpen(true);
        return;
      case EFreeAction.CONVERT_ENERGY_TO_MOVEMENT:
        setCornerSelectionMode(false);
        if (maxConvertibleEnergy <= 0) {
          toast({
            title: t('client.game_layout.toast.not_enough_energy'),
            description: t('client.game_layout.toast.not_enough_energy_desc'),
            variant: 'error',
          });
          return;
        }
        setConvertEnergyOpen(true);
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
            {t('client.game_layout.dashboard')}
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
            <p className='text-xs text-text-500'>
              {t('client.common.loading')}
            </p>
          )}
        </div>

        {/* Hand View */}
        <div className='p-3' data-testid='bottom-hand'>
          <h4 className='mb-1.5 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
            {t('client.game_layout.hand_and_missions')}
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
                  {t('client.game_layout.corner_selection_hint')}
                </p>
              )}
              <PlayedMissions missions={missionCards} />
            </div>
          ) : (
            <p className='text-xs text-text-500'>
              {t('client.common.loading')}
            </p>
          )}
        </div>

        {/* Action Menu / Input Renderer */}
        <div className='p-3' data-testid='bottom-actions'>
          <h4 className='mb-1.5 font-mono text-xs font-medium uppercase tracking-widest text-text-500'>
            {t('client.game_layout.actions')}
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
        title={t('client.game_layout.buy_card_title')}
        description={t('client.game_layout.buy_card_desc')}
        costs={[t('client.game_layout.buy_card_cost')]}
        confirmLabel={t('client.game_layout.buy')}
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

      <PlaceDataDialog
        open={placeDataOpen}
        options={placeDataOptions}
        onCancel={() => setPlaceDataOpen(false)}
        onConfirm={(slotIndex) => {
          sendFreeAction({ type: EFreeAction.PLACE_DATA, slotIndex });
          setPlaceDataOpen(false);
        }}
      />

      <ConvertEnergyDialog
        open={convertEnergyOpen}
        maxAmount={maxConvertibleEnergy}
        onCancel={() => setConvertEnergyOpen(false)}
        onConfirm={(amount) => {
          sendFreeAction({
            type: EFreeAction.CONVERT_ENERGY_TO_MOVEMENT,
            amount,
          });
          setConvertEnergyOpen(false);
        }}
      />
    </div>
  );
}

const EXCHANGE_OPTIONS: Array<{
  from: EResource;
  to: EResource;
}> = [
  { from: EResource.CREDIT, to: EResource.ENERGY },
  { from: EResource.CREDIT, to: EResource.CARD },
  { from: EResource.ENERGY, to: EResource.CREDIT },
  { from: EResource.ENERGY, to: EResource.CARD },
  { from: EResource.CARD, to: EResource.CREDIT },
  { from: EResource.CARD, to: EResource.ENERGY },
];

const RESOURCE_I18N_KEY: Partial<Record<EResource, string>> = {
  [EResource.CREDIT]: 'credit',
  [EResource.ENERGY]: 'energy',
  [EResource.CARD]: 'card',
};

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
  const { t } = useTranslation('common');
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
          <DialogTitle>{t('client.game_layout.exchange_title')}</DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.exchange_desc')}
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
              {t('client.game_layout.exchange_option', {
                from: t(`client.resources.${RESOURCE_I18N_KEY[opt.from]}`),
                to: t(`client.resources.${RESOURCE_I18N_KEY[opt.to]}`),
              })}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface IPlaceDataOption {
  slotIndex: number;
  row: 'top' | 'bottom';
}

function buildPlaceDataOptions(
  player: IPublicPlayerState | null | undefined,
): IPlaceDataOption[] {
  const columns = player?.computer?.columns ?? [];
  if (!columns.length) return [];

  const topIndex = columns.findIndex((col) => !col.topFilled);
  if (topIndex >= 0) {
    return [
      {
        slotIndex: topIndex,
        row: 'top',
      },
    ];
  }

  return columns
    .map((col, index) => ({ col, index }))
    .filter(({ col }) => col.hasBottomSlot && !col.bottomFilled)
    .map(({ index }) => ({
      slotIndex: index,
      row: 'bottom' as const,
    }));
}

function PlaceDataDialog({
  open,
  options,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  options: IPlaceDataOption[];
  onCancel: () => void;
  onConfirm: (slotIndex: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('client.game_layout.place_data_title')}</DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.place_data_desc')}
          </p>
        </DialogHeader>
        <div className='grid grid-cols-1 gap-2'>
          {options.map((opt) => (
            <Button
              key={`${opt.row}-${opt.slotIndex}`}
              type='button'
              variant='ghost'
              onClick={() => onConfirm(opt.slotIndex)}
              className='h-10 justify-start border border-surface-700/60 bg-surface-800/50 px-3 text-left text-sm text-text-200 hover:bg-surface-700/70'
            >
              {opt.row === 'top'
                ? t('client.game_layout.place_data_top', {
                    index: opt.slotIndex + 1,
                  })
                : t('client.game_layout.place_data_bottom', {
                    index: opt.slotIndex + 1,
                  })}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConvertEnergyDialog({
  open,
  maxAmount,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  maxAmount: number;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const options = Array.from(
    { length: Math.max(0, maxAmount) },
    (_, i) => i + 1,
  ).slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('client.game_layout.convert_energy_title')}
          </DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.convert_energy_desc')}
          </p>
        </DialogHeader>
        <div className='grid grid-cols-2 gap-2'>
          {options.map((amount) => (
            <Button
              key={amount}
              type='button'
              variant='ghost'
              onClick={() => onConfirm(amount)}
              className='h-10 justify-center border border-surface-700/60 bg-surface-800/50 text-sm text-text-200 hover:bg-surface-700/70'
            >
              {t('client.game_layout.convert_energy_option', { amount })}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
