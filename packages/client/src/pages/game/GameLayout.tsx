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
import { HandDock, PlayedMissions, PlayerDashboard } from '@/features/player';
import type { IMilestoneItem } from '@/features/scoring';
import { MilestoneTrack } from '@/features/scoring';
import { cn } from '@/lib/cn';
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

/**
 * GameLayout — the top-level in-game shell.
 *
 * Spatial model (desktop):
 *
 *   ┌─────────────────────────── TopBar ───────────────────────────┐
 *   ├── TopActionBar (main actions + free actions + undo) ─────────┤
 *   ├──────────────────────────────┬───────────────────────────────┤
 *   │ Board area (Solar System +   │ Personal column:              │
 *   │ Planets / Tech / Cards / …)  │   • Personal board            │
 *   │                              │   • Mission area              │
 *   │                              │   • Intel (log + opponents)   │
 *   ├──────────────────────────────┴───────────────────────────────┤
 *   │ HandDock (collapsible grid of hand cards)                    │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * On screens narrower than `lg` the personal column collapses behind a
 * toggle so the board area always claims the full width on tablet/phone.
 *
 * All dialog state (exchange, place-data, convert-energy, corner selection)
 * lives here because two descendants (TopActionBar for free-action clicks,
 * HandDock for corner-card selection) both need to read and write it. That
 * single source of truth is exposed via `useActionController` below.
 */
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
  const [personalColumnOpen, setPersonalColumnOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<IBaseCard | null>(null);
  const [handExpanded, setHandExpanded] = useState(true);

  const handleInspectCard = (card: IBaseCard): void => {
    setDetailCard(card);
    setDetailOpen(true);
  };

  const actionController = useActionController();

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-background-950 text-text-100'>
      <div
        className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
        aria-hidden
      />

      <TopBar />

      <TopActionBar
        onFreeActionClick={actionController.handleFreeActionClick}
        cornerSelectionHint={actionController.cornerSelectionMode}
      />

      <div className='flex min-h-0 flex-1'>
        <main className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          <BoardTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onInspectCard={handleInspectCard}
            showSolarSystemSpaceConfig={showSolarSystemSpaceConfig}
            probeInsetPxByRing={probeInsetPxByRing}
            allowMoveAnyProbe={allowMoveAnyProbe}
          />

          <button
            type='button'
            onClick={() => setPersonalColumnOpen((v) => !v)}
            className='absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-300 shadow-hairline-inset backdrop-blur-sm transition-[background,border-color] hover:border-[oklch(0.40_0.04_240)] hover:bg-background-800/80 lg:hidden'
            aria-label={t('client.game_layout.toggle_sidebar')}
          >
            <span
              aria-hidden
              className='h-1.5 w-1.5 rounded-full bg-accent-500/80'
            />
            {personalColumnOpen
              ? t('client.game_layout.board')
              : t('client.game_layout.info')}
          </button>

          {personalColumnOpen && (
            <div className='absolute inset-0 z-20 lg:hidden'>
              <PersonalColumn className='h-full' />
            </div>
          )}
        </main>

        <PersonalColumn className='hidden w-[360px] shrink-0 xl:w-[400px] lg:flex' />
      </div>

      <HandDockBlock
        expanded={handExpanded}
        onToggle={() => setHandExpanded((v) => !v)}
        cornerSelectionMode={actionController.cornerSelectionMode}
        clearCornerSelectionMode={() =>
          actionController.setCornerSelectionMode(false)
        }
        onInspectCard={handleInspectCard}
      />

      <CardDetail
        card={detailCard}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <GameOverDialog />

      {actionController.dialogs}
    </div>
  );
}

/**
 * useActionController — single source of truth for free-action side
 * effects and the dialogs they open. Exposes:
 *
 *  • `handleFreeActionClick(action)` — called from FreeActionBar
 *  • `cornerSelectionMode` — boolean read by HandDock to highlight cards
 *  • `setCornerSelectionMode` — so HandDock can clear it once the player
 *    picks a card (the corner free-action has been dispatched)
 *  • `dialogs` — JSX to render once at the bottom of the layout
 */
function useActionController(): {
  handleFreeActionClick: (action: EFreeAction) => void;
  cornerSelectionMode: boolean;
  setCornerSelectionMode: (next: boolean) => void;
  dialogs: React.JSX.Element;
} {
  const { t } = useTranslation('common');
  const { gameState, myPlayerId, sendFreeAction } = useGameContext();
  const [confirmRequest, setConfirmRequest] =
    useState<IFreeActionRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cornerSelectionMode, setCornerSelectionMode] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [placeDataOpen, setPlaceDataOpen] = useState(false);
  const [convertEnergyOpen, setConvertEnergyOpen] = useState(false);

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const missionCards =
    (myPlayer as { playedMissions?: IBaseCard[] } | undefined)
      ?.playedMissions ?? [];
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

  const dialogs = (
    <>
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
    </>
  );

  return {
    handleFreeActionClick,
    cornerSelectionMode,
    setCornerSelectionMode,
    dialogs,
  };
}

/**
 * TopActionBar — the top instrument strip.
 *
 * Hosts the main action menu rendered horizontally, the FreeActionBar,
 * and (when the server requests a specific input that isn't an OR fork)
 * replaces the action menu with the InputRenderer so the player cannot
 * miss the prompt. A thin corner-selection hint rides below when the
 * USE_CARD_CORNER free action has been armed.
 */
function TopActionBar({
  onFreeActionClick,
  cornerSelectionHint,
}: {
  onFreeActionClick: (action: EFreeAction) => void;
  cornerSelectionHint: boolean;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const {
    gameState,
    myPlayerId,
    isMyTurn,
    pendingInput,
    sendAction,
    sendEndTurn,
    sendInput,
    requestUndo,
  } = useGameContext();

  const canUndo = Boolean((gameState as { canUndo?: boolean } | null)?.canUndo);
  const showInputRenderer =
    pendingInput !== null && pendingInput.type !== EPlayerInputType.OR;

  return (
    <section
      className='relative shrink-0 border-b border-[color:var(--metal-edge-soft)] bg-background-950/85 backdrop-blur-sm'
      data-testid='bottom-actions'
    >
      <div
        aria-hidden
        className='pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--surface-700)] to-transparent opacity-60'
      />

      {showInputRenderer ? (
        <div className='px-4 py-2'>
          <div className='instrument-panel p-3'>
            <div className='section-head mb-2'>
              <span aria-hidden className='section-head__tick' />
              <p className='font-mono text-[11px] uppercase tracking-[0.14em] text-accent-400'>
                {t('client.game_layout.awaiting_input', {
                  defaultValue: 'Input Required',
                })}
              </p>
              <div aria-hidden className='section-head__rule' />
              <span
                aria-hidden
                className='h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_6px_oklch(0.68_0.11_240/0.8)] motion-safe:animate-pulse'
              />
            </div>
            <InputRenderer model={pendingInput} onSubmit={sendInput} />
          </div>
        </div>
      ) : (
        <div className='flex min-w-0 items-center gap-3 px-4 py-2'>
          <ActionMenu
            gameState={gameState}
            myPlayerId={myPlayerId}
            isMyTurn={isMyTurn}
            pendingInput={pendingInput}
            canUndo={canUndo}
            onSendAction={sendAction}
            onSendEndTurn={sendEndTurn}
            onRequestUndo={requestUndo}
            orientation='horizontal'
          />
        </div>
      )}

      <FreeActionBar
        gameState={gameState}
        myPlayerId={myPlayerId}
        isMyTurn={isMyTurn}
        onActionClick={onFreeActionClick}
      />

      {cornerSelectionHint && (
        <div className='flex items-center gap-2 border-t border-accent-500/40 bg-accent-500/[0.05] px-4 py-1.5'>
          <span
            aria-hidden
            className='h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_4px_oklch(0.68_0.11_240/0.7)] motion-safe:animate-pulse'
          />
          <p className='font-mono text-[10px] uppercase tracking-[0.12em] text-accent-400'>
            {t('client.game_layout.corner_selection_hint')}
          </p>
        </div>
      )}
    </section>
  );
}

interface IPersonalColumnProps {
  className?: string;
}

/**
 * PersonalColumn — the right-hand vertical stack.
 *
 * Order (top to bottom):
 *  1. PlayerDashboard — resources, computer, inventory, tech, data pool
 *  2. PlayedMissions — cards currently in play
 *  3. Intel strip — EventLog + opponents (rehomed from the old Sidebar)
 *
 * The column owns its own scroll so the dashboard + missions never push
 * the log out of view on short screens.
 */
function PersonalColumn({
  className,
}: IPersonalColumnProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const { gameState, myPlayerId, pendingInput, sendFreeAction } =
    useGameContext();

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const extendedPlayer = myPlayer as
    | (typeof myPlayer & {
        creditIncome?: number;
        energyIncome?: number;
        playedMissions?: IBaseCard[];
      })
    | undefined;
  const missionCards = extendedPlayer?.playedMissions ?? [];

  return (
    <aside
      className={cn(
        'flex-col gap-3 overflow-y-auto p-3',
        'border-l border-[color:var(--metal-edge-soft)]',
        'bg-[oklch(0.13_0.022_260/0.5)] backdrop-blur-sm',
        className,
      )}
      aria-label={t('client.game_layout.personal_board')}
    >
      <section data-testid='bottom-dashboard'>
        <div className='section-head mb-2'>
          <span aria-hidden className='section-head__tick' />
          <p className='micro-label'>
            {t('client.game_layout.personal_board')}
          </p>
          <div aria-hidden className='section-head__rule' />
        </div>
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
          <LoadingLine label={t('client.common.loading')} />
        )}
      </section>

      <section data-testid='mission-area'>
        <div className='section-head mb-2'>
          <span aria-hidden className='section-head__tick' />
          <p className='micro-label'>{t('client.game_layout.mission_area')}</p>
          <div aria-hidden className='section-head__rule' />
        </div>
        <PlayedMissions missions={missionCards} />
      </section>

      <div className='instrument-tick' />

      <Sidebar className='-mx-3 border-l-0 bg-transparent p-3 pt-1' />
    </aside>
  );
}

/**
 * HandDockBlock — the thin wire between the game context and the
 * presentation-only HandDock. Reads the local player's hand from
 * context and dispatches card selection / corner selection. Corner
 * mode is controlled from above (see useActionController) because
 * it's toggled by a free-action clicked elsewhere.
 */
function HandDockBlock({
  expanded,
  onToggle,
  cornerSelectionMode,
  clearCornerSelectionMode,
  onInspectCard,
}: {
  expanded: boolean;
  onToggle: () => void;
  cornerSelectionMode: boolean;
  clearCornerSelectionMode: () => void;
  onInspectCard: (card: IBaseCard) => void;
}): React.JSX.Element {
  const { gameState, myPlayerId, pendingInput, sendFreeAction, sendInput } =
    useGameContext();
  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);

  return (
    <div data-testid='bottom-hand'>
      <HandDock
        cards={myPlayer?.hand}
        handSize={myPlayer?.handSize ?? 0}
        pendingInput={pendingInput}
        cornerSelectionMode={cornerSelectionMode}
        expanded={expanded}
        onToggle={onToggle}
        onSubmitSelection={(cardIds) => {
          sendInput({ type: EPlayerInputType.CARD, cardIds });
        }}
        onCardCornerSelect={(cardId) => {
          sendFreeAction({ type: EFreeAction.USE_CARD_CORNER, cardId });
          clearCornerSelectionMode();
        }}
        onCardInspect={onInspectCard}
      />
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
      <div className='relative shrink-0 overflow-x-auto bg-background-950/60 px-3 py-2'>
        <TabsList className='w-max'>
          {BOARD_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`client.game_layout.tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <div
          aria-hidden
          className='pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[color:var(--surface-700)] to-transparent opacity-70'
        />
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
              myPlayerId={myPlayerId}
            />
          )}
        </TabsContent>

        <TabsContent value='cards' className='mt-0 h-full'>
          {gameState && (
            <div className='space-y-3'>
              <div className='instrument-panel flex flex-wrap items-center gap-2 p-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 gap-1.5 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] hover:border-accent-500/70 hover:text-text-100'
                  onClick={() =>
                    sendFreeAction({
                      type: EFreeAction.BUY_CARD,
                      fromDeck: true,
                    })
                  }
                >
                  <span
                    aria-hidden
                    className='h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_4px_oklch(0.68_0.11_240/0.7)]'
                  />
                  {t('client.game_layout.buy_from_deck')}
                </Button>
                <Button
                  variant={armedCardRowBuy ? 'primary' : 'ghost'}
                  size='sm'
                  className='h-8 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em]'
                  onClick={() => setArmedCardRowBuy((v) => !v)}
                >
                  {armedCardRowBuy
                    ? t('client.game_layout.cancel_row_buy')
                    : t('client.game_layout.buy_from_row')}
                </Button>
                <div className='ml-auto flex items-center gap-2'>
                  <div className='relative h-[72px] w-[52px] overflow-hidden rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center shadow-[inset_0_1px_0_oklch(0.78_0.07_240/0.2),0_4px_12px_oklch(0.08_0.018_260/0.8)]'>
                    <span
                      aria-hidden
                      className='pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[oklch(0.08_0.018_260/0.4)]'
                    />
                  </div>
                  <span className='micro-label leading-none'>
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
              {/* Score Rankings — instrumentation ladder */}
              <section className='instrument-panel p-3'>
                <div className='section-head mb-2'>
                  <span aria-hidden className='section-head__tick' />
                  <p className='micro-label'>
                    {t('client.game_layout.scores')}
                  </p>
                  <div aria-hidden className='section-head__rule' />
                </div>
                <ScoreLadder players={gameState.players} />
              </section>

              <MilestoneTrack
                milestones={buildMilestoneItems(
                  gameState.milestones,
                  playerColors,
                )}
              />

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
 * ScoreLadder — inline leaderboard for the scoring tab. Each row is a
 * mono-readout instrument strip; the leader carries the accent glow.
 */
function ScoreLadder({
  players,
}: {
  players: IPublicPlayerState[];
}): React.JSX.Element {
  const sorted = players.slice().sort((a, b) => b.score - a.score);
  const top = sorted[0]?.score ?? 0;
  const range = Math.max(1, top);

  return (
    <div className='flex flex-col gap-1.5'>
      {sorted.map((p, index) => {
        const isLeader = p.score === top && p.score > 0;
        const ratio = Math.min(100, Math.round((p.score / range) * 100));
        return (
          <div
            key={p.playerId}
            className='relative flex items-center gap-3 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 px-3 py-1.5 shadow-hairline-inset'
          >
            <span className='w-5 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              aria-hidden
              className='h-2 w-2 shrink-0 rounded-full border border-[oklch(0.96_0.008_260/0.4)]'
              style={{ backgroundColor: p.color }}
            />
            <span className='flex-1 truncate text-[13px] font-medium text-text-100'>
              {p.playerName}
            </span>
            <div className='hidden min-w-[80px] flex-[0.5] items-center sm:flex'>
              <div className='meter flex-1' data-full={isLeader}>
                <div className='meter__fill' style={{ width: `${ratio}%` }} />
              </div>
            </div>
            <span
              className={
                isLeader
                  ? 'readout text-[15px] font-semibold text-text-100 leading-none'
                  : 'readout text-[15px] text-text-200 leading-none'
              }
            >
              {p.score}
            </span>
          </div>
        );
      })}
    </div>
  );
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
      <p className='font-mono text-[10px] tracking-[0.08em] text-text-500'>
        {t('client.game_layout.no_gold_tiles')}
      </p>
    );
  }

  return (
    <section className='instrument-panel p-2'>
      <div className='section-head mb-2'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.game_layout.gold_scoring_tiles')}
        </p>
        <div aria-hidden className='section-head__rule' />
        <span className='font-mono text-[10px] tabular-nums text-text-500'>
          {tiles.length}
        </span>
      </div>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {tiles.map((tile) => {
          const claimedSlots = new Map(
            tile.claims.map((c) => [c.value, c.playerId]),
          );
          return (
            <div
              key={tile.id}
              className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 p-2 shadow-hairline-inset'
            >
              <div className='mb-1.5 flex items-center gap-1.5'>
                <img
                  src='/assets/seti/icons/vp.png'
                  alt=''
                  aria-hidden
                  className='h-3.5 w-3.5 opacity-90'
                />
                <span className='font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-200'>
                  {tile.id}
                </span>
                <span
                  className='chip ml-auto'
                  title={t('client.game_layout.side', { side: tile.side })}
                >
                  {tile.side}
                </span>
              </div>

              <div className='flex flex-wrap gap-1'>
                {tile.slotValues.map((value, idx) => {
                  const claimer = claimedSlots.get(value);
                  const claimerColor = claimer
                    ? (playerColors[claimer] ?? undefined)
                    : undefined;
                  return (
                    <div
                      key={`${tile.id}-slot-${idx}`}
                      className={[
                        'flex min-w-[38px] items-center justify-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
                        claimer
                          ? 'border-accent-500/60 bg-accent-500/[0.08] text-text-100 shadow-[inset_0_0_0_1px_oklch(0.68_0.11_240/0.2)]'
                          : 'border-[color:var(--metal-edge-soft)] bg-background-950/50 text-text-500',
                      ].join(' ')}
                      title={
                        claimer
                          ? t('client.game_layout.claimed_by', {
                              player: claimer,
                            })
                          : t('client.common.open')
                      }
                    >
                      {claimer ? (
                        <span
                          aria-hidden
                          className='inline-block h-2 w-2 rounded-full border border-[oklch(0.96_0.008_260/0.4)]'
                          style={{ backgroundColor: claimerColor }}
                        />
                      ) : null}
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

function LoadingLine({ label }: { label: string }): React.JSX.Element {
  return (
    <div className='flex items-center gap-2 px-1 py-1'>
      <span
        aria-hidden
        className='h-1.5 w-1.5 rounded-full bg-text-500 motion-safe:animate-pulse'
      />
      <p className='font-mono text-[11px] uppercase tracking-[0.12em] text-text-500'>
        {label}
      </p>
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
        <div className='grid grid-cols-1 gap-1.5'>
          {EXCHANGE_OPTIONS.map((opt) => (
            <Button
              key={`${opt.from}-${opt.to}`}
              variant='ghost'
              disabled={!canAfford(opt.from)}
              onClick={() => onConfirm(opt.from, opt.to)}
              className='h-10 justify-start gap-2 px-3 text-left text-sm'
            >
              <span
                aria-hidden
                className='inline-block h-px w-3 bg-accent-500/80'
              />
              <span className='flex-1 font-body text-[13px] text-text-100'>
                {t('client.game_layout.exchange_option', {
                  from: t(`client.resources.${RESOURCE_I18N_KEY[opt.from]}`),
                  to: t(`client.resources.${RESOURCE_I18N_KEY[opt.to]}`),
                })}
              </span>
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
        <div className='grid grid-cols-1 gap-1.5'>
          {options.map((opt) => (
            <Button
              key={`${opt.row}-${opt.slotIndex}`}
              variant='ghost'
              onClick={() => onConfirm(opt.slotIndex)}
              className='h-10 justify-start gap-2 px-3 text-left text-sm'
            >
              <img
                src='/assets/seti/tokens/data.png'
                alt=''
                aria-hidden
                className='h-5 w-5'
              />
              <span className='flex-1 font-body text-[13px] text-text-100'>
                {opt.row === 'top'
                  ? t('client.game_layout.place_data_top', {
                      index: opt.slotIndex + 1,
                    })
                  : t('client.game_layout.place_data_bottom', {
                      index: opt.slotIndex + 1,
                    })}
              </span>
              <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-500'>
                {opt.row === 'top' ? 'A' : 'B'}
                {opt.slotIndex + 1}
              </span>
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
        <div className='grid grid-cols-2 gap-1.5 sm:grid-cols-4'>
          {options.map((amount) => (
            <Button
              key={amount}
              variant='ghost'
              onClick={() => onConfirm(amount)}
              className='h-11 flex-col gap-0.5 px-3 text-sm'
            >
              <span className='readout text-[15px] font-semibold text-text-100 leading-none'>
                {amount}
              </span>
              <span className='font-mono text-[9px] uppercase tracking-[0.14em] text-text-500'>
                {t('client.game_layout.convert_energy_unit', {
                  defaultValue: '⚡ → MOV',
                })}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
