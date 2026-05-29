import { createDefaultSetupConfig } from '@seti/common/constant/sectorSetup';
import {
  canPlaySpecificCard,
  getAvailableMainActions,
} from '@seti/common/rules';
import { ALL_CARDS } from '@seti/common/data/index';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EPlanet, EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { getMascamitesSampleDeliveryDestination } from '@seti/common/utils/mascamitesSampleDelivery';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventSidebarDrawer } from '@/components/layout/EventSidebarDrawer';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { ActionMenu } from '@/features/actions/ActionMenu';
import { FreeActionBar } from '@/features/actions/FreeActionBar';
import { AlienBoardView } from '@/features/board/AlienBoardView';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import {
  isOrbitalDynamicsMoveInputModel,
  SolarSystemView,
} from '@/features/board/SolarSystemView';
import { TechBoardView } from '@/features/board/TechBoardView';
import { CardDetail } from '@/features/cards/CardDetail';
import { CardRender } from '@/features/cards/CardRender';
import { CardRowView } from '@/features/cards/CardRowView';
import { EndOfRoundStacks } from '@/features/cards/EndOfRoundStacks';
import { translateInputText } from '@/features/input/inputI18n';
import { InputRenderer } from '@/features/input/InputRenderer';
import { EventLog } from '@/features/log';
import {
  HandDock,
  type IPlayedMissionRow,
  PlayedMissions,
  PlayerDashboard,
} from '@/features/player';
import type { IMilestoneItem } from '@/features/scoring';
import { MilestoneTrack } from '@/features/scoring';
import { SetupChoiceModal } from '@/features/setup/SetupChoiceModal';
import { RivalPanel } from '@/features/solo';
import { cn } from '@/lib/cn';
import { mapPlayerColors, resolvePlayerColor } from '@/lib/playerColor';
import { useGameContext } from '@/pages/game/GameContext';
import { GameOverDialog } from '@/pages/game/GameOverDialog';
import { type TBoardTab, useGameViewStore } from '@/stores/gameViewStore';
import type {
  IMainActionRequest,
  IPlayerInputModel,
  IPublicAlienState,
  IPublicGameState,
  IPublicGoldScoringTile,
  IPublicMascamitesCapsule,
  IPublicMilestoneState,
  IPublicOumuamuaTile,
  IPublicPlayerState,
  TGameEvent,
} from '@/types/re-exports';
import {
  EFreeAction,
  EGameEventType,
  EMainAction,
  EPhase,
  EPlayerInputType,
} from '@/types/re-exports';

const CARD_CUSTOM_EFFECT_UNHANDLED = 'CARD_CUSTOM_EFFECT_UNHANDLED';

function actionEventName(event: TGameEvent): string | null {
  if (event.type !== EGameEventType.ACTION) return null;
  const a = event.action;
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object' && 'type' in a) {
    return String((a as { type: string }).type);
  }
  return null;
}

const BOARD_TABS: TBoardTab[] = [
  'board',
  'planets',
  'tech',
  'cards',
  'aliens',
  'scoring',
];

/**
 * True when the pending input is something that lands on an alien board:
 * either picking a trace color (TRACE) or picking a specific trace slot via a
 * SelectOption whose options reference alien slot ids.
 *
 * Also matches the main-action ORBIT/LAND slot picker when the planet is
 * Oumuamua — those land on the Aliens tab so the player sees the
 * Oumuamua tile's landing surface (mirrors the planetary board for
 * other planets).
 */
export function isAlienBoardInput(model: IPlayerInputModel | null): boolean {
  if (!model) return false;
  if (model.type === EPlayerInputType.TRACE) return true;
  if (model.type !== EPlayerInputType.OPTION) return false;
  return model.options.some(
    (option) =>
      /^alien-\d+-(?:discovery|overflow|anomaly-column|oumuamua-trace|mascamites|centaurians|exertians|glyphids|amoeba|arkhos)/.test(
        option.id,
      ) ||
      // EPlanet.OUMUAMUA serializes as the lowercase 'oumuamua'
      // string — match case-insensitively so this regex tracks the
      // enum's wire value rather than the TypeScript identifier.
      /^main-action-(?:land|orbit)-slot-oumuamua-/i.test(option.id),
  );
}

/**
 * True when the pending input lands on the planetary board: today this
 * is the main-action LAND/ORBIT planet picker (Step 1) and the slot
 * picker (Step 2) for any non-Oumuamua planet.
 */
export function isPlanetaryBoardInput(
  model: IPlayerInputModel | null,
): boolean {
  if (!model) return false;
  if (model.type !== EPlayerInputType.OPTION) return false;
  return model.options.some((option) =>
    // Match planet/slot pickers for any planet *except* the
    // lowercase Oumuamua wire id; those route to the Aliens tab
    // via `isAlienBoardInput` instead.
    /^main-action-(?:land|orbit)-(?:planet-(?!oumuamua\b)|slot-(?!oumuamua-))/i.test(
      option.id,
    ),
  );
}

/**
 * Derive the effective planet-action mode from a pending input. The
 * planetary board lights up its hotspots based on whether ORBIT or
 * LAND is active. Returns null when the input isn't a slot picker
 * (the planet picker, Step 1, doesn't need anchors yet — the player
 * just sees the option list).
 */
function getSlotPickerMode(
  model: IPlayerInputModel | null,
): EMainAction.ORBIT | EMainAction.LAND | null {
  if (!model || model.type !== EPlayerInputType.OPTION) return null;
  const sample = model.options[0]?.id ?? '';
  if (/^main-action-orbit-slot-/.test(sample)) return EMainAction.ORBIT;
  if (/^main-action-land-slot-/.test(sample)) return EMainAction.LAND;
  return null;
}

/**
 * Match a clicked planet hotspot against the active slot-picker's
 * options. Returns the option id when the click is a valid resolution,
 * or null when there's no matching option. The picker labels options
 * by planet + (isMoon, moonId) — so a click on Mars's planet hotspot
 * resolves `main-action-land-slot-MARS-planet`, while a click on
 * Saturn / Triton resolves `main-action-land-slot-SATURN-moon-saturn-titan`.
 */
function resolveSlotPickerOptionId(
  model: IPlayerInputModel | null,
  planet: EPlanet,
  options?: { isMoon?: boolean; moonId?: string },
): string | null {
  if (!model || model.type !== EPlayerInputType.OPTION) return null;
  const isMoon = options?.isMoon === true;
  const moonId = options?.moonId;
  for (const option of model.options) {
    // LAND slots: …-slot-PLANET-planet OR …-slot-PLANET-moon-MOONID
    const landMatch = option.id.match(
      /^main-action-land-slot-([^-]+)-(planet|moon-(.+))$/,
    );
    if (landMatch) {
      const [, optionPlanet, kind, optionMoonId] = landMatch;
      if (optionPlanet !== planet) continue;
      if (!isMoon && kind === 'planet') return option.id;
      if (isMoon && optionMoonId !== undefined && optionMoonId === moonId) {
        return option.id;
      }
      continue;
    }
    // ORBIT slots: …-slot-PLANET-first OR …-slot-PLANET-regular. The
    // anchor click can't distinguish first vs regular — there's only
    // one orbit slot per planet on the board today. If both options
    // exist we default to first-orbit (matches the typical "take the
    // bonus" intent); the player can still pick "regular" via the
    // input panel.
    const orbitMatch = option.id.match(
      /^main-action-orbit-slot-([^-]+)-(first|regular)$/,
    );
    if (orbitMatch) {
      const [, optionPlanet, kind] = orbitMatch;
      if (optionPlanet !== planet) continue;
      if (kind === 'first') return option.id;
    }
  }
  // Fallback: if only "regular" exists (first already claimed), pick it.
  for (const option of model.options) {
    if (option.id === `main-action-orbit-slot-${planet}-regular`) {
      return option.id;
    }
  }
  return null;
}

function findOumuamuaTile(
  aliens: IPublicAlienState[] | undefined,
): IPublicOumuamuaTile | null {
  const oumuamua = aliens?.find((alien) => alien.board?.type === 'oumuamua');
  return oumuamua?.board?.type === 'oumuamua'
    ? (oumuamua.board.tile ?? null)
    : null;
}

function findMascamitesCapsules(
  aliens: IPublicAlienState[] | undefined,
): IPublicMascamitesCapsule[] {
  return (
    aliens?.flatMap((alien) =>
      alien.board?.type === 'mascamites' ? alien.board.capsules : [],
    ) ?? []
  );
}

/**
 * Build mission-slot rows for the player's pending Centaurian message
 * cards. Each pending card resolves at a `+15 VP` milestone tracked on
 * the Centaurian board; we surface the threshold + remaining-VP hint
 * so the player can see how close they are to triggering each card's
 * green (delayed) effect. Cards already resolved are NOT shown here —
 * they've been tucked / discarded and removed from `pendingMessagesByPlayer`.
 *
 * Per FAQ Centaurian cards are not missions; they only share the
 * physical missions slot until they resolve.
 */
function buildPendingCentaurianRows(
  aliens: IPublicAlienState[] | undefined,
  playerId: string | null,
  currentScore: number,
): IPlayedMissionRow[] {
  if (!playerId) return [];
  const centaurians = aliens?.find(
    (alien) => alien.board?.type === 'centaurians',
  );
  const board =
    centaurians?.board?.type === 'centaurians' ? centaurians.board : null;
  if (!board) return [];

  const pendingCardIds = board.pendingMessagesByPlayer[playerId] ?? [];
  if (pendingCardIds.length === 0) return [];

  return pendingCardIds.map((cardId, queueIndex) => {
    const card = CARD_BY_ID.get(cardId);
    const milestone = board.messageMilestones.find(
      (entry) =>
        entry.playerId === playerId &&
        entry.sourceCardId === cardId &&
        !entry.resolved,
    );
    const threshold = milestone?.threshold;
    const toGo =
      threshold !== undefined ? Math.max(0, threshold - currentScore) : null;
    return {
      card: card ?? ({ id: cardId, name: cardId } as IBaseCard),
      // queueIndex disambiguates if the same card id appears twice in the queue.
      key: `centaurian-pending-${cardId}-${queueIndex}`,
      annotation: {
        label:
          threshold !== undefined ? `→ ${threshold} VP` : 'pending milestone',
        hint: toGo !== null ? `${toGo} VP to go` : undefined,
        tone: 'pending',
      },
    };
  });
}

const CARD_BY_ID = new Map<string, IBaseCard>(
  ALL_CARDS.map((card) => [card.id, card]),
);

interface ISampleDeliveryOption {
  capsuleId: string;
  cardId: string;
  label: string;
}

function buildSampleDeliveryOptions(
  gameState: IPublicGameState | null,
  playerId: string,
): ISampleDeliveryOption[] {
  if (!gameState) {
    return [];
  }

  const player = gameState.players.find(
    (candidate) => candidate.playerId === playerId,
  );
  const missionCards = player?.playedMissions ?? [];
  if (!player || missionCards.length === 0) {
    return [];
  }

  return findMascamitesCapsules(gameState.aliens)
    .filter((capsule) => capsule.ownerId === playerId)
    .flatMap((capsule) =>
      missionCards
        .filter((mission) =>
          isCapsuleAtPlanet(
            gameState,
            capsule,
            getMascamitesSampleDeliveryDestination(mission),
          ),
        )
        .map((mission) => ({
          capsuleId: capsule.capsuleId,
          cardId: mission.id,
          label: `${mission.name ?? mission.id} / ${capsule.capsuleId}`,
        })),
    );
}

function isCapsuleAtPlanet(
  gameState: IPublicGameState,
  capsule: IPublicMascamitesCapsule,
  planet: EPlanet | undefined,
): boolean {
  if (!planet) {
    return false;
  }
  const solarSystem = gameState.solarSystem;
  if (solarSystem.planetSpaceIds?.[planet] === capsule.spaceId) {
    return true;
  }

  const state = solarSystem.spaceStates?.[capsule.spaceId];
  if (!state) {
    return false;
  }

  return (
    state.elements?.some(
      (element) =>
        element.planet === planet ||
        (planet === EPlanet.EARTH && element.type === 'EARTH'),
    ) ??
    (planet === EPlanet.EARTH && state.elementTypes.includes('EARTH'))
  );
}

/**
 * GameLayout — the top-level in-game shell.
 *
 * Spatial model (desktop):
 *
 *   ┌─────────────────────────── TopBar ───────────────────────────┐
 *   ├── TopActionBar (main actions + free actions + undo) ─────────┤
 *   ├──────────────────────────────┬──────────────────────────────────────────┤
 *   │ Board area (Solar System +   │ Personal column + event intel drawer    │
 *   │ Planets / Tech / Cards / …)  │ (drawer opens from right edge)          │
 *   ├──────────────────────────────┴──────────────────────────────────────────┤
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
  allowMoveAnyProbe = false,
}: {
  showSolarSystemSpaceConfig?: boolean;
  allowMoveAnyProbe?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const activeTab = useGameViewStore((s) => s.activeTab);
  const setActiveTab = useGameViewStore((s) => s.setActiveTab);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<IBaseCard | null>(null);
  const [handExpanded, setHandExpanded] = useState(true);
  const [armedCardRowBuy, setArmedCardRowBuy] = useState(false);
  const [playCardSelectionMode, setPlayCardSelectionMode] = useState(false);
  const [movementModeActive, setMovementModeActive] = useState(false);
  const {
    gameState,
    isMyTurn,
    pendingInput,
    events,
    myPlayerId,
    sendAction,
    sendInput,
  } = useGameContext();
  const effectivePlanetActionMode = getSlotPickerMode(pendingInput);
  const unhandledEffectToastKeysRef = useRef<Set<string>>(new Set());
  const lastGameIdRef = useRef<string | undefined>(undefined);
  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const currentPlayerMovementPoints = myPlayer?.movementPoints ?? 0;
  // Surface mission branch-claim flags up here so both the missions
  // slot (PersonalColumn) and the enlarged-preview dialog (CardDetail)
  // can render claim tokens against the same data.
  const myMissionClaimsByCardId: Record<string, boolean[]> = Object.fromEntries(
    ((
      myPlayer as { missionClaims?: Array<{ cardId: string; branchClaims: boolean[] }> }
        | undefined
    )?.missionClaims ?? []).map((entry) => [entry.cardId, entry.branchClaims]),
  );

  useEffect(() => {
    const gid = gameState?.gameId;
    if (gid !== lastGameIdRef.current) {
      unhandledEffectToastKeysRef.current.clear();
      lastGameIdRef.current = gid;
    }
  }, [gameState?.gameId]);

  useEffect(() => {
    for (const event of events) {
      if (event.type !== EGameEventType.ACTION) continue;
      if (actionEventName(event) !== CARD_CUSTOM_EFFECT_UNHANDLED) continue;
      const details = event.details as
        | { cardId?: string; customId?: string }
        | undefined;
      const at = event.at ?? 0;
      const cardId = details?.cardId ?? '';
      const customId = details?.customId ?? '';
      const dedupeKey = `${at}|${event.playerId}|${cardId}|${customId}`;
      if (unhandledEffectToastKeysRef.current.has(dedupeKey)) continue;
      unhandledEffectToastKeysRef.current.add(dedupeKey);
      toast({
        title: t('client.game_layout.toast.card_custom_effect_unhandled'),
        description: t(
          'client.game_layout.toast.card_custom_effect_unhandled_desc',
          { cardId, customId },
        ),
      });
    }
  }, [events, t]);

  useEffect(() => {
    if (!playCardSelectionMode) return;
    if (
      !isMyTurn ||
      pendingInput !== null ||
      gameState?.phase !== EPhase.AWAIT_MAIN_ACTION
    ) {
      setPlayCardSelectionMode(false);
    }
  }, [gameState?.phase, isMyTurn, pendingInput, playCardSelectionMode]);

  useEffect(() => {
    if (!movementModeActive) return;
    // Keep movement mode armed across multi-step probe paths so the
    // player can keep clicking neighbors without re-arming the free
    // action between hops. Only auto-clear on:
    //  - turn change (someone else acts now)
    //  - run-out (movement points hit zero AND no convertible energy
    //    is available — re-arming wouldn't do anything)
    //  - phase leaves the action window (BETWEEN_TURNS, FINAL_SCORING)
    //
    // pendingInput is intentionally NOT a clear trigger here: a
    // movement step that lands on a planet/asteroid can briefly
    // raise an inline prompt (Trajectory Correction etc.) which
    // resolves to undefined within the same tick — flipping mode
    // off mid-flight forced the player to re-click "Move Probe"
    // every step, which is what the user reported.
    const phase = gameState?.phase;
    const hasConvertibleEnergy =
      (myPlayer?.resources?.[EResource.ENERGY] ?? 0) > 0;
    if (
      !isMyTurn ||
      (phase !== undefined &&
        phase !== EPhase.AWAIT_MAIN_ACTION &&
        phase !== EPhase.AWAIT_END_TURN &&
        phase !== EPhase.IN_RESOLUTION) ||
      (currentPlayerMovementPoints <= 0 && !hasConvertibleEnergy)
    ) {
      setMovementModeActive(false);
    }
  }, [
    currentPlayerMovementPoints,
    gameState?.phase,
    isMyTurn,
    movementModeActive,
    myPlayer?.resources?.[EResource.ENERGY],
  ]);

  // Auto-jump to the Aliens tab when the player is asked to place a trace
  // (or otherwise act on an alien-board slot). Track the input by id so we
  // only switch on the *first* render of a new alien input — the player can
  // freely flip back to other tabs afterward without us re-stomping them.
  const lastAlienInputIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAlienBoardInput(pendingInput)) {
      lastAlienInputIdRef.current = null;
      return;
    }
    const inputId = pendingInput?.inputId ?? null;
    if (inputId === lastAlienInputIdRef.current) return;
    lastAlienInputIdRef.current = inputId;
    setActiveTab('aliens');
  }, [pendingInput, setActiveTab]);

  // Mirror of the alien-tab effect above for the planetary board: the
  // main-action ORBIT/LAND picker chain (planet selector + non-Oumuamua
  // slot picker) auto-jumps to the Planets tab so the planet cards are
  // in front of the player.
  const lastPlanetaryInputIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isPlanetaryBoardInput(pendingInput)) {
      lastPlanetaryInputIdRef.current = null;
      return;
    }
    const inputId = pendingInput?.inputId ?? null;
    if (inputId === lastPlanetaryInputIdRef.current) return;
    lastPlanetaryInputIdRef.current = inputId;
    setActiveTab('planets');
  }, [pendingInput, setActiveTab]);

  const handleInspectCard = (card: IBaseCard): void => {
    setDetailCard(card);
    setDetailOpen(true);
  };

  const detailCardHandIndex =
    detailCard && myPlayer?.hand
      ? myPlayer.hand.findIndex((card) => card.id === detailCard.id)
      : -1;
  const canPlayDetailCard =
    detailCard !== null &&
    detailCardHandIndex >= 0 &&
    isMyTurn &&
    pendingInput === null &&
    gameState?.phase === EPhase.AWAIT_MAIN_ACTION &&
    myPlayer !== undefined &&
    getAvailableMainActions(myPlayer, gameState).includes(
      EMainAction.PLAY_CARD,
    ) &&
    canPlaySpecificCard(myPlayer, detailCard);

  const handlePlayDetailCard = (): void => {
    if (!canPlayDetailCard) return;

    sendAction({
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: detailCardHandIndex },
    });
    setDetailOpen(false);
    setDetailCard(null);
  };

  const handlePlanetMainActionSelect = (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ): void => {
    // New flow: an anchor click on a planet card resolves the active
    // slot-picker pendingInput by matching the option id. This lets
    // non-text-mode players click directly on the board instead of
    // (or in parallel with) the input panel.
    const slotOptionId = resolveSlotPickerOptionId(
      pendingInput,
      planet,
      options,
    );
    if (slotOptionId !== null && pendingInput?.inputId !== undefined) {
      sendInput({
        inputId: pendingInput.inputId,
        type: EPlayerInputType.OPTION,
        optionId: slotOptionId,
      });
      return;
    }
  };

  const actionController = useActionController({
    clearCardRowBuy: () => {
      setArmedCardRowBuy(false);
    },
    openCardsTab: () => {
      // BUY_CARD free action jumps to the Cards tab where the buy
      // chooser strip is permanently surfaced.
      setArmedCardRowBuy(false);
      setActiveTab('cards');
    },
    armMoveMode: () => {
      setMovementModeActive(true);
      setActiveTab('board');
    },
    clearMoveMode: () => {
      setMovementModeActive(false);
    },
    openBoardTab: () => setActiveTab('board'),
  });

  return (
    <div className='flex h-screen flex-col overflow-hidden bg-[var(--surface-void)] text-text-100'>
      <div
        className='pointer-events-none fixed inset-0 -z-10 bg-[image:var(--bg-atmosphere)]'
        aria-hidden
      />

      <TopBar />

      <TopActionBar
        onFreeActionClick={actionController.handleFreeActionClick}
        cornerSelectionHint={actionController.cornerSelectionMode}
        movementModeActive={movementModeActive}
        onEndMovementMode={() => setMovementModeActive(false)}
        onRequestPlayCardSelection={() => {
          setPlayCardSelectionMode(true);
          setHandExpanded(true);
        }}
      />

      <div className='flex min-h-0 flex-1'>
        <main className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          <BoardTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onInspectCard={handleInspectCard}
            showSolarSystemSpaceConfig={showSolarSystemSpaceConfig}
            allowMoveAnyProbe={allowMoveAnyProbe}
            movementModeActive={movementModeActive}
            armedCardRowBuy={armedCardRowBuy}
            setArmedCardRowBuy={setArmedCardRowBuy}
            planetActionMode={effectivePlanetActionMode}
            onSelectMainActionPlanet={handlePlanetMainActionSelect}
          />
        </main>

        <PersonalColumn
          className='hidden w-[440px] shrink-0 xl:w-[520px] lg:flex'
          onInspectCard={handleInspectCard}
        />
        <EventSidebarDrawer />
      </div>

      <HandDockBlock
        expanded={handExpanded}
        onToggle={() => setHandExpanded((v) => !v)}
        cornerSelectionMode={actionController.cornerSelectionMode}
        playCardSelectionMode={playCardSelectionMode}
        clearCornerSelectionMode={() =>
          actionController.setCornerSelectionMode(false)
        }
        clearPlayCardSelectionMode={() => setPlayCardSelectionMode(false)}
        onInspectCard={handleInspectCard}
      />

      <CardDetail
        card={detailCard}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canPlayCard={canPlayDetailCard}
        onPlayCard={handlePlayDetailCard}
        branchClaimsByCardId={myMissionClaimsByCardId}
        ownerPlayerColor={myPlayer?.color}
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
function useActionController({
  clearCardRowBuy,
  openCardsTab,
  armMoveMode,
  clearMoveMode,
  openBoardTab,
}: {
  clearCardRowBuy: () => void;
  openCardsTab: () => void;
  armMoveMode: () => void;
  clearMoveMode: () => void;
  openBoardTab: () => void;
}): {
  handleFreeActionClick: (
    action: EFreeAction,
    organizationId?: EOrganizationId,
  ) => void;
  cornerSelectionMode: boolean;
  setCornerSelectionMode: (next: boolean) => void;
  dialogs: React.JSX.Element;
} {
  const { t } = useTranslation('common');
  const { gameState, myPlayerId, sendFreeAction } = useGameContext();
  const [cornerSelectionMode, setCornerSelectionMode] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [placeDataOpen, setPlaceDataOpen] = useState(false);
  const [convertEnergyOpen, setConvertEnergyOpen] = useState(false);
  const [deliverSampleOpen, setDeliverSampleOpen] = useState(false);

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const missionCards =
    (myPlayer as { playedMissions?: IBaseCard[] } | undefined)
      ?.playedMissions ?? [];
  const completableMissionBranches = myPlayer?.completableMissionBranches ?? [];
  const sampleDeliveryOptions = buildSampleDeliveryOptions(
    gameState,
    myPlayerId,
  );
  const placeDataOptions = buildPlaceDataOptions(myPlayer);
  const maxConvertibleEnergy = myPlayer?.resources?.[EResource.ENERGY] ?? 0;

  const handleFreeActionClick = (
    action: EFreeAction,
    organizationId?: EOrganizationId,
  ) => {
    switch (action) {
      case EFreeAction.BUY_CARD:
        setCornerSelectionMode(false);
        clearMoveMode();
        clearCardRowBuy();
        openCardsTab();
        return;
      case EFreeAction.PLACE_DATA:
        setCornerSelectionMode(false);
        clearMoveMode();
        if (placeDataOptions.length <= 0) {
          toast({
            title: t('client.game_layout.toast.no_computer_slot'),
            description: t('client.game_layout.toast.no_computer_slot_desc'),
            variant: 'warning',
          });
          return;
        }
        setPlaceDataOpen(true);
        return;
      case EFreeAction.COMPLETE_MISSION:
        setCornerSelectionMode(false);
        clearMoveMode();
        if (completableMissionBranches.length === 1) {
          const [branch] = completableMissionBranches;
          sendFreeAction({
            type: EFreeAction.COMPLETE_MISSION,
            cardId: branch.cardId,
            branchIndex: branch.branchIndex,
          });
          return;
        }
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
          variant: 'warning',
        });
        return;
      case EFreeAction.DELIVER_SAMPLE:
        setCornerSelectionMode(false);
        clearMoveMode();
        if (sampleDeliveryOptions.length === 1) {
          const option = sampleDeliveryOptions[0];
          sendFreeAction({
            type: EFreeAction.DELIVER_SAMPLE,
            capsuleId: option.capsuleId,
            cardId: option.cardId,
          });
          return;
        }
        if (sampleDeliveryOptions.length > 1) {
          setDeliverSampleOpen(true);
          return;
        }
        toast({
          title: t('client.game_layout.toast.sample_delivery_required'),
          description: t(
            'client.game_layout.toast.sample_delivery_required_desc',
          ),
          variant: 'warning',
        });
        return;
      case EFreeAction.USE_CARD_CORNER:
        clearMoveMode();
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
        clearCardRowBuy();
        armMoveMode();
        toast({
          title: t('client.game_layout.toast.select_probe'),
          description: t('client.game_layout.toast.select_probe_desc'),
        });
        return;
      case EFreeAction.EXCHANGE_RESOURCES:
        setCornerSelectionMode(false);
        clearMoveMode();
        setExchangeOpen(true);
        return;
      case EFreeAction.CONVERT_ENERGY_TO_MOVEMENT:
        setCornerSelectionMode(false);
        clearMoveMode();
        if (maxConvertibleEnergy <= 0) {
          toast({
            title: t('client.game_layout.toast.not_enough_energy'),
            description: t('client.game_layout.toast.not_enough_energy_desc'),
            variant: 'warning',
          });
          return;
        }
        setConvertEnergyOpen(true);
        return;
      case EFreeAction.SPEND_SIGNAL_TOKEN:
        setCornerSelectionMode(false);
        clearMoveMode();
        clearCardRowBuy();
        sendFreeAction({ type: EFreeAction.SPEND_SIGNAL_TOKEN });
        return;
      case EFreeAction.USE_ORGANIZATION_POWER:
        setCornerSelectionMode(false);
        clearMoveMode();
        clearCardRowBuy();
        if (!organizationId) {
          return;
        }
        if (organizationId === EOrganizationId.ORBITAL_DYNAMICS) {
          openBoardTab();
        }
        sendFreeAction({
          type: EFreeAction.USE_ORGANIZATION_POWER,
          organizationId,
        });
        return;
      default:
        return;
    }
  };

  const dialogs = (
    <>
      <ExchangeResourcesDialog
        open={exchangeOpen}
        player={myPlayer}
        onCancel={() => setExchangeOpen(false)}
        onConfirm={(from, to, cardPick) => {
          sendFreeAction({
            type: EFreeAction.EXCHANGE_RESOURCES,
            from,
            to,
            ...(from === EResource.CARD && cardPick?.spentCardIds
              ? { spentCardIds: cardPick.spentCardIds }
              : {}),
            ...(to === EResource.CARD && cardPick
              ? { fromDeck: cardPick.fromDeck }
              : {}),
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

      <SampleDeliveryDialog
        open={deliverSampleOpen}
        options={sampleDeliveryOptions}
        onCancel={() => setDeliverSampleOpen(false)}
        onConfirm={(option) => {
          sendFreeAction({
            type: EFreeAction.DELIVER_SAMPLE,
            capsuleId: option.capsuleId,
            cardId: option.cardId,
          });
          setDeliverSampleOpen(false);
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
  movementModeActive,
  onEndMovementMode,
  onRequestPlayCardSelection,
}: {
  onFreeActionClick: (
    action: EFreeAction,
    organizationId?: EOrganizationId,
  ) => void;
  cornerSelectionHint: boolean;
  movementModeActive: boolean;
  onEndMovementMode: () => void;
  onRequestPlayCardSelection: () => void;
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

  const canUndo = gameState?.canUndo ?? false;
  const orbitalDynamicsInput = isOrbitalDynamicsMoveInputModel(pendingInput)
    ? pendingInput
    : null;
  const orbitalDynamicsDoneOption =
    orbitalDynamicsInput?.options.find((option) => option.id === 'done') ??
    null;
  const showBoardInputHint = orbitalDynamicsInput !== null;
  const showInputRenderer =
    pendingInput !== null &&
    pendingInput.type !== EPlayerInputType.OR &&
    !showBoardInputHint;
  const showSetupChoiceInput =
    gameState?.phase === EPhase.SETUP_CHOICE && pendingInput !== null;
  const myPlayer = gameState?.players.find(
    (player) => player.playerId === myPlayerId,
  );
  const movementPoints = myPlayer?.movementPoints ?? 0;
  const handleMainAction = (action: IMainActionRequest) => {
    if (action.type !== EMainAction.PLAY_CARD) {
      // ORBIT and LAND used to arm a client-side selection mode and
      // wait for the user to click a planet card. The server now
      // returns a SelectOption picker when the action arrives without
      // a planet payload — the existing pendingInput pipeline (with
      // its tab-jump behaviour) handles the rest.
      sendAction(action);
      return;
    }

    const hand = myPlayer?.hand ?? [];
    if (hand.length <= 0) {
      return;
    }

    const playableIndexes =
      myPlayer === undefined
        ? []
        : hand
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => canPlaySpecificCard(myPlayer, card))
            .map(({ index }) => index);

    if (playableIndexes.length === 1) {
      sendAction({
        type: EMainAction.PLAY_CARD,
        payload: { cardIndex: playableIndexes[0] },
      });
      return;
    }

    if (playableIndexes.length === 0) {
      return;
    }

    onRequestPlayCardSelection();
    toast({
      title: t('client.game_layout.toast.card_required'),
      description: t('client.game_layout.toast.card_required_desc'),
    });
  };

  return (
    <section
      className='relative shrink-0 border-b border-[color:var(--metal-edge-soft)] bg-[var(--surface-deep)]/85 backdrop-blur-sm'
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
            {showSetupChoiceInput ? (
              <SetupChoiceModal model={pendingInput} onSubmit={sendInput} />
            ) : (
              <InputRenderer
                model={pendingInput}
                onSubmit={sendInput}
                techBoard={gameState?.techBoard}
              />
            )}
          </div>
        </div>
      ) : showBoardInputHint ? (
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
            </div>
            <p className='font-mono text-[11px] uppercase tracking-[0.14em] text-text-300'>
              {t('client.game_layout.orbital_dynamics', {
                defaultValue: 'Orbital Dynamics',
              })}
            </p>
            <p className='mt-1 text-sm text-text-100'>
              {t('client.game_layout.select_highlighted_space', {
                defaultValue: 'Select a highlighted space on the board.',
              })}
            </p>
            {orbitalDynamicsDoneOption ? (
              <Button
                variant='ghost'
                size='sm'
                className='mt-3 h-7 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em]'
                onClick={() =>
                  sendInput({
                    inputId: orbitalDynamicsInput.inputId,
                    type: EPlayerInputType.OPTION,
                    optionId: orbitalDynamicsDoneOption.id,
                  })
                }
              >
                {translateInputText(t, orbitalDynamicsDoneOption.label)}
              </Button>
            ) : null}
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
            onSendAction={handleMainAction}
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
        pendingInput={pendingInput}
        onActionClick={onFreeActionClick}
      />

      {movementModeActive && (
        <div
          className='flex items-center gap-2 border-t border-accent-500/40 bg-accent-500/[0.05] px-4 py-1.5'
          data-testid='movement-mode-hint'
        >
          <span
            aria-hidden
            className='h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_4px_oklch(0.68_0.11_240/0.7)] motion-safe:animate-pulse'
          />
          <p className='font-mono text-[10px] uppercase tracking-[0.12em] text-accent-400'>
            {t('client.game_layout.move_probe', { defaultValue: 'Move Probe' })}
          </p>
          <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-text-300'>
            {t('client.game_layout.movement_points_steps', {
              count: movementPoints,
              defaultValue: '{{count}} steps',
            })}
          </span>
          <Button
            variant='ghost'
            size='sm'
            className='ml-auto h-6 px-2 font-mono text-[10px] uppercase tracking-[0.12em]'
            onClick={onEndMovementMode}
          >
            {t('client.game_layout.end_move', { defaultValue: 'End Move' })}
          </Button>
        </div>
      )}

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
  dashboardTestId?: string;
  missionAreaTestId?: string;
  rivalAreaTestId?: string;
  /** Reuses the same enlarged-card preview the hand dock uses. */
  onInspectCard?: (card: IBaseCard) => void;
}

/**
 * PersonalColumn — the right-hand vertical stack.
 *
 * Order (top to bottom):
 *  1. PlayerDashboard — resources, computer, inventory, tech, data pool
 *  2. PlayedMissions — cards currently in play (mission + end-game cards)
 *
 * The column owns its own scroll so dashboard and missions remain stable
 * regardless of hand/board height changes.
 */
function PersonalColumn({
  className,
  dashboardTestId = 'bottom-dashboard',
  missionAreaTestId = 'mission-area',
  rivalAreaTestId = 'rival-area',
  onInspectCard,
}: IPersonalColumnProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const { gameState, myPlayerId, pendingInput, sendFreeAction } =
    useGameContext();

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const extendedPlayer = myPlayer as
    | (typeof myPlayer & {
        creditIncome?: number;
        energyIncome?: number;
        cardIncome?: number;
        tuckedCreditIncome?: number;
        tuckedEnergyIncome?: number;
        tuckedCardIncome?: number;
        playedMissions?: IBaseCard[];
        endGameCards?: IBaseCard[];
        completedMissions?: IBaseCard[];
        missionClaims?: Array<{ cardId: string; branchClaims: boolean[] }>;
      })
    | undefined;
  // Personal-board "missions" slot keeps:
  //  - ongoing mission cards (with branch progress)
  //  - end-game (golden) scoring cards
  //  - pending Centaurian message cards (waiting on a +15 milestone
  //    to trigger their green effect; per FAQ they're NOT missions,
  //    but they sit in the same physical slot until resolved)
  // Completed missions are rendered as a single stacked-pile tile by
  // <PlayedMissions>; click the pile to inspect every completed card.
  const missionCards = [
    ...(extendedPlayer?.playedMissions ?? []),
    ...(extendedPlayer?.endGameCards ?? []),
  ];
  const completedMissions = extendedPlayer?.completedMissions ?? [];
  // Build a cardId → branchClaims lookup so child <CardRender>
  // instances can overlay the right per-branch claim tokens via
  // the cards-package render context.
  const branchClaimsByCardId: Record<string, boolean[]> = Object.fromEntries(
    (extendedPlayer?.missionClaims ?? []).map((entry) => [
      entry.cardId,
      entry.branchClaims,
    ]),
  );
  const missionRows: IPlayedMissionRow[] = [
    ...missionCards.map((card) => {
      const claims = branchClaimsByCardId[card.id];
      // "N / M claimed" annotation is only useful for FULL_MISSION-
      // style cards with multiple branches that aren't all claimed
      // yet. Single-branch (QUICK) cards already disappear into the
      // completed-pile when they fire, so the annotation just
      // duplicates info; skip for them.
      const annotation =
        claims && claims.length > 1 && claims.some((c) => c)
          ? {
              label: t('client.game_layout.mission_claimed_progress', {
                claimed: claims.filter((c) => c).length,
                total: claims.length,
                defaultValue: `${claims.filter((c) => c).length} / ${claims.length} claimed`,
              }),
              tone: 'pending' as const,
            }
          : undefined;
      return annotation ? { card, annotation } : { card };
    }),
    ...buildPendingCentaurianRows(
      gameState?.aliens,
      myPlayerId,
      myPlayer?.score ?? 0,
    ),
  ];
  // Tile only exists post-discovery; gates the per-player exofossil
  // readout in the dashboard (kept hidden for non-Oumuamua games).
  const personalOumuamuaTile = findOumuamuaTile(gameState?.aliens);
  const isSyntheticRivalView =
    gameState?.rival?.rivalPlayerId !== undefined &&
    myPlayerId === gameState.rival.rivalPlayerId;

  return (
    <aside
      className={cn(
        'flex-col gap-3 overflow-y-auto p-3',
        'border-l border-[color:var(--metal-edge-soft)]',
        'bg-[var(--surface-deep)]/70 backdrop-blur-sm',
        className,
      )}
      aria-label={t('client.game_layout.personal_board')}
    >
      <section data-testid={dashboardTestId}>
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
              card: extendedPlayer?.cardIncome ?? 0,
              tuckedCredit: extendedPlayer?.tuckedCreditIncome,
              tuckedEnergy: extendedPlayer?.tuckedEnergyIncome,
              tuckedCard: extendedPlayer?.tuckedCardIncome,
            }}
            playedMissions={missionCards}
            showExofossils={personalOumuamuaTile !== null}
          />
        ) : (
          <LoadingLine label={t('client.common.loading')} />
        )}
      </section>

      {gameState?.isSoloMode && gameState.rival ? (
        <section data-testid={rivalAreaTestId}>
          <div className='section-head mb-2'>
            <span aria-hidden className='section-head__tick' />
            <p className='micro-label'>
              {t('client.game_layout.rival_board', {
                defaultValue: 'Rival Board',
              })}
            </p>
            <div aria-hidden className='section-head__rule' />
          </div>
          <RivalPanel rival={gameState.rival} />
        </section>
      ) : null}

      {!isSyntheticRivalView ? (
        <section data-testid={missionAreaTestId}>
          <div className='section-head mb-2'>
            <span aria-hidden className='section-head__tick' />
            <p className='micro-label'>
              {t('client.game_layout.mission_area')}
            </p>
            <div aria-hidden className='section-head__rule' />
          </div>
          <PlayedMissions
            missions={missionRows}
            onCardInspect={onInspectCard}
            completedCards={completedMissions}
            branchClaimsByCardId={branchClaimsByCardId}
            ownerPlayerColor={myPlayer?.color}
          />
        </section>
      ) : null}
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
  playCardSelectionMode,
  clearCornerSelectionMode,
  clearPlayCardSelectionMode,
  onInspectCard,
}: {
  expanded: boolean;
  onToggle: () => void;
  cornerSelectionMode: boolean;
  playCardSelectionMode: boolean;
  clearCornerSelectionMode: () => void;
  clearPlayCardSelectionMode: () => void;
  onInspectCard: (card: IBaseCard) => void;
}): React.JSX.Element {
  const {
    gameState,
    myPlayerId,
    pendingInput,
    sendFreeAction,
    sendInput,
    sendAction,
  } = useGameContext();
  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);

  return (
    <div data-testid='bottom-hand'>
      <HandDock
        cards={myPlayer?.hand}
        handSize={myPlayer?.handSize ?? 0}
        pendingInput={pendingInput}
        cornerSelectionMode={cornerSelectionMode}
        playCardSelectionMode={playCardSelectionMode}
        expanded={expanded}
        onToggle={onToggle}
        onSubmitSelection={(cardIds) => {
          if (pendingInput?.type !== EPlayerInputType.CARD) return;
          sendInput({
            inputId: pendingInput.inputId,
            type: EPlayerInputType.CARD,
            cardIds,
          });
        }}
        onCardCornerSelect={(cardId) => {
          sendFreeAction({ type: EFreeAction.USE_CARD_CORNER, cardId });
          clearCornerSelectionMode();
        }}
        onCardPlaySelect={(cardId) => {
          const hand = myPlayer?.hand ?? [];
          const cardIndex = hand.findIndex((card) => card.id === cardId);
          if (cardIndex < 0) {
            clearPlayCardSelectionMode();
            return;
          }
          const card = hand[cardIndex];
          if (!myPlayer || !canPlaySpecificCard(myPlayer, card)) {
            return;
          }

          sendAction({
            type: EMainAction.PLAY_CARD,
            payload: { cardIndex },
          });
          clearPlayCardSelectionMode();
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
  allowMoveAnyProbe,
  movementModeActive,
  armedCardRowBuy,
  setArmedCardRowBuy,
  planetActionMode,
  onSelectMainActionPlanet,
}: {
  activeTab: TBoardTab;
  onTabChange: (tab: TBoardTab) => void;
  onInspectCard: (card: IBaseCard) => void;
  showSolarSystemSpaceConfig: boolean;
  allowMoveAnyProbe: boolean;
  movementModeActive: boolean;
  armedCardRowBuy: boolean;
  setArmedCardRowBuy: (next: boolean | ((prev: boolean) => boolean)) => void;
  planetActionMode: EMainAction.ORBIT | EMainAction.LAND | null;
  onSelectMainActionPlanet: (
    planet: EPlanet,
    options?: { isMoon?: boolean; moonId?: string },
  ) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const {
    gameState,
    myPlayerId,
    pendingInput,
    events,
    sendFreeAction,
    sendInput,
  } = useGameContext();
  // Confirm dialog for buy actions — both cost 3 publicity.
  //   - 'deck': fires immediately on confirm (no card pick).
  //   - card object: user has armed row-buy and clicked a specific
  //     card; confirm dialog shows the card + cost and on confirm
  //     fires BUY_CARD with that cardId.
  const [buyConfirm, setBuyConfirm] = useState<
    { kind: 'deck' } | { kind: 'row'; card: IBaseCard } | null
  >(null);
  const playerColors = gameState ? mapPlayerColors(gameState.players) : {};
  const cardSelectionInput =
    pendingInput?.type === EPlayerInputType.CARD ? pendingInput : null;
  const selectableCardIds = new Set(
    cardSelectionInput?.cards.map((c) => c.id) ?? [],
  );
  const isSelectingFromCardRow =
    cardSelectionInput !== null &&
    gameState?.cardRow.some((card) => selectableCardIds.has(card.id));
  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const oumuamuaTile = findOumuamuaTile(gameState?.aliens);

  function handleCardRowClick(card: IBaseCard): void {
    if (isSelectingFromCardRow) {
      sendInput({
        inputId: cardSelectionInput.inputId,
        type: EPlayerInputType.CARD,
        cardIds: [card.id],
      });
      return;
    }

    if (armedCardRowBuy) {
      // Cost confirm fires after the user picks a card, so the
      // dialog can show *which* card is being bought + the 3-publicity
      // cost. Confirm dispatches BUY_CARD with that cardId.
      setBuyConfirm({ kind: 'row', card });
      return;
    }

    onInspectCard(card);
  }

  return (
    <>
    <Tabs
      defaultValue='board'
      value={activeTab}
      onValueChange={(v) => onTabChange(v as TBoardTab)}
      className='flex min-h-0 flex-1 flex-col'
    >
      <div className='relative shrink-0 overflow-x-auto bg-[var(--surface-deep)]/60 px-3 py-2'>
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
          <div
            data-testid='board-tab-solar-column'
            className='w-fit max-w-full space-y-3'
          >
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
                movementPoints={myPlayer?.movementPoints ?? 0}
                moveModeActive={movementModeActive}
                onMoveProbe={(path, target) => {
                  if (!target) return;
                  sendFreeAction({ type: EFreeAction.MOVEMENT, path, target });
                }}
                onRespondInput={sendInput}
                showSpaceConfigDebug={showSolarSystemSpaceConfig}
                allowMoveAnyProbe={allowMoveAnyProbe}
                oumuamuaTile={oumuamuaTile}
              />
            )}
            <PersonalColumn
              className='mt-3 flex max-w-full border-l-0 border-t lg:hidden'
              dashboardTestId='mobile-bottom-dashboard'
              missionAreaTestId='mobile-mission-area'
              rivalAreaTestId='mobile-rival-area'
              onInspectCard={onInspectCard}
            />
          </div>
        </TabsContent>

        <TabsContent value='planets' className='mt-0 h-full'>
          {gameState && (
            <PlanetaryBoardView
              gameState={gameState}
              myPlayerId={myPlayerId}
              planetaryBoard={gameState.planetaryBoard}
              pendingInput={pendingInput}
              playerColors={playerColors}
              mainActionPlanetMode={planetActionMode}
              onSelectMainActionPlanet={onSelectMainActionPlanet}
              onRespondInput={sendInput}
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
              onSubmit={sendInput}
            />
          )}
        </TabsContent>

        <TabsContent value='cards' className='mt-0 h-full'>
          {gameState && (
            // inline-flex w-fit shrinks the column to its widest
            // child — keeps the card row + end-of-round stacks
            // panels snug around their actual cards instead of
            // stretching to the full tab width.
            <div className='inline-flex w-fit flex-col gap-3'>
              {/*
                Cards tab is inspection-only: card row + end-of-round
                stacks + a passive main-deck readout. Buying cards
                lives exclusively in the free-action bar's "Buy Card
                (3 PR)" entry, which already presents Deck / Row
                choices and routes row picks through the same confirm
                dialog. Keeps the buy UX in one place.
              */}
              <div className='instrument-panel flex w-full items-center gap-3 p-2'>
                <div className='flex items-center gap-2'>
                  <div className='relative h-[72px] w-[52px] overflow-hidden rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center shadow-[inset_0_1px_0_oklch(0.78_0.07_240/0.2),0_4px_12px_oklch(0.08_0.018_260/0.8)]'>
                    <span
                      aria-hidden
                      className='pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[oklch(0.08_0.018_260/0.4)]'
                    />
                  </div>
                  <div className='flex flex-col items-start gap-0.5'>
                    <span className='micro-label leading-none'>
                      {t('client.game_layout.main_deck')}
                    </span>
                    <span
                      className='font-mono text-[11px] font-bold tabular-nums text-text-200'
                      data-testid='main-deck-remaining'
                    >
                      {gameState.mainDeck.drawPileSize}
                    </span>
                  </div>
                </div>
                {/*
                  Discard pile preview — same dimensions as the main
                  deck, but dimmer/desaturated to read as "out of
                  play". Discarded card-row leftovers from each
                  round + tucked-and-discarded play piles end up here.
                */}
                <div className='flex items-center gap-2'>
                  <div className='relative h-[72px] w-[52px] overflow-hidden rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center opacity-50 grayscale shadow-[inset_0_1px_0_oklch(0.78_0.07_240/0.15),0_4px_12px_oklch(0.08_0.018_260/0.6)]'>
                    <span
                      aria-hidden
                      className='pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[oklch(0.08_0.018_260/0.5)]'
                    />
                  </div>
                  <div className='flex flex-col items-start gap-0.5'>
                    <span className='micro-label leading-none text-text-500'>
                      {t('client.game_layout.discard_pile', {
                        defaultValue: 'Discard',
                      })}
                    </span>
                    <span
                      className='font-mono text-[11px] font-bold tabular-nums text-text-300'
                      data-testid='main-deck-discard'
                    >
                      {gameState.mainDeck.discardPileSize}
                    </span>
                  </div>
                </div>
                {armedCardRowBuy ? (
                  <span
                    className='ml-auto rounded border border-accent-500/60 bg-accent-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-300'
                    data-testid='card-row-buy-armed-hint'
                  >
                    {t('client.game_layout.buy_from_row_pick_hint', {
                      defaultValue: 'Pick a card from the row',
                    })}
                  </span>
                ) : null}
              </div>

              {/*
                Permanent buy chooser strip. The Cards tab is the
                single buy entry point — Buy From Deck opens a confirm
                dialog with a card-back preview; Buy From Row arms the
                row picker, then a row-card click opens the same
                confirm dialog with the picked card. The "Buy Card
                (3 PR)" free action just jumps to this tab.
              */}
              <div
                className='instrument-panel flex w-full flex-wrap items-center gap-2 border-accent-500/40 bg-accent-500/[0.05] p-2'
                data-testid='cards-tab-buy-chooser'
              >
                <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-accent-300'>
                  {t('client.game_layout.buy_card_title', {
                    defaultValue: 'Buy Card',
                  })}
                </span>
                <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-400'>
                  {t('client.game_layout.buy_card_cost', {
                    defaultValue: '3 publicity',
                  })}
                </span>
                <Button
                  variant='primary'
                  size='sm'
                  className='ml-auto h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em]'
                  data-testid='cards-tab-buy-from-deck'
                  onClick={() => {
                    setArmedCardRowBuy(false);
                    setBuyConfirm({ kind: 'deck' });
                  }}
                >
                  {t('client.game_layout.buy_from_deck')}
                </Button>
                <Button
                  variant={armedCardRowBuy ? 'primary' : 'ghost'}
                  size='sm'
                  className='h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em]'
                  data-testid='cards-tab-buy-from-row'
                  onClick={() => setArmedCardRowBuy((v) => !v)}
                >
                  {armedCardRowBuy
                    ? t('client.game_layout.cancel_row_buy', {
                        defaultValue: 'Cancel Row Pick',
                      })
                    : t('client.game_layout.buy_from_row')}
                </Button>
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
                stacks={
                  gameState.endOfRoundStacks ??
                  gameState.endOfRoundStackCounts?.map(() => []) ?? [
                    [],
                    [],
                    [],
                    [],
                  ]
                }
                stackCounts={gameState.endOfRoundStackCounts}
                currentRoundIndex={gameState.currentEndOfRoundStackIndex ?? 0}
                hasRoundFirstPassOccurred={
                  gameState.hasRoundFirstPassOccurred ?? false
                }
                round={gameState.round}
                maxRounds={gameState.maxRounds}
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
                    inputId: pendingInput.inputId,
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
              planetaryBoard={gameState.planetaryBoard}
              gameState={gameState}
              myPlayerId={myPlayerId}
              pendingInput={pendingInput}
              planetActionMode={planetActionMode}
              onSelectMainActionPlanet={onSelectMainActionPlanet}
              onRespondInput={sendInput}
              onCardInspect={onInspectCard}
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

      <EventLog
        compact
        className='lg:hidden'
        events={events}
        players={gameState?.players ?? []}
      />
    </Tabs>
    <Dialog
      open={buyConfirm !== null}
      onOpenChange={(open) => {
        if (!open) setBuyConfirm(null);
      }}
    >
      <DialogContent className='w-fit max-w-fit bg-surface-900/95'>
        <DialogHeader>
          <DialogTitle>
            {buyConfirm?.kind === 'deck'
              ? t('client.game_layout.buy_from_deck')
              : t('client.game_layout.buy_from_row')}
          </DialogTitle>
        </DialogHeader>
        {/*
          Card preview matches CardDetail's enlarged size (1.8×/2×
          scale of CardRender's intrinsic 150×209 footprint), so the
          card the player is about to commit to looks the same here as
          when they tap a row card to inspect it. Deck buys show a
          card-back tile at the same dimensions instead.
        */}
        <div className='max-h-[78vh] overflow-auto rounded border border-surface-700/50 bg-surface-950/70 p-3'>
          <div className='relative h-[376px] w-[270px] sm:h-[418px] sm:w-[300px]'>
            {buyConfirm?.kind === 'row' ? (
              <div className='absolute left-0 top-0 origin-top-left scale-[1.8] sm:scale-[2]'>
                <CardRender card={buyConfirm.card} />
              </div>
            ) : (
              <div
                className='absolute inset-0 rounded border border-surface-700/50 bg-[url(/assets/seti/cards/back_base.jpg)] bg-cover bg-center'
                aria-hidden
              />
            )}
          </div>
        </div>
        <div className='instrument-panel p-3'>
          <div className='section-head mb-2'>
            <span aria-hidden className='section-head__tick' />
            <p className='micro-label'>{t('client.action_confirm.cost')}</p>
            <div aria-hidden className='section-head__rule' />
          </div>
          <p className='readout font-mono text-[13px] text-text-100'>
            3 {t('client.resources.publicity', { defaultValue: 'publicity' })}
          </p>
        </div>
        <DialogFooter>
          <Button variant='ghost' onClick={() => setBuyConfirm(null)}>
            {t('client.common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            variant='primary'
            onClick={() => {
              if (buyConfirm?.kind === 'deck') {
                sendFreeAction({
                  type: EFreeAction.BUY_CARD,
                  fromDeck: true,
                });
              } else if (buyConfirm?.kind === 'row') {
                sendFreeAction({
                  type: EFreeAction.BUY_CARD,
                  cardId: buyConfirm.card.id,
                });
                setArmedCardRowBuy(false);
              }
              setBuyConfirm(null);
            }}
          >
            {t('client.common.confirm', { defaultValue: 'Confirm' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
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
              style={{ backgroundColor: resolvePlayerColor(p.color) }}
            />
            <span
              className='flex-1 truncate text-[13px] font-medium'
              style={{ color: resolvePlayerColor(p.color) }}
            >
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
 * Rulebook descriptions for each gold scoring tile side. The text
 * matches the printed tile so players can read the rule from the
 * scoring tab without grabbing the rulebook. Keys here line up with
 * `client.gold_tile.<id>_<side>` in the locale files.
 */
const GOLD_TILE_DESCRIPTIONS: Record<string, { i18nKey: string; en: string }> =
  {
    tech_A: {
      i18nKey: 'client.gold_tile.tech_a',
      en: 'Each set of three techs (one of each type — probe / scan / computer)',
    },
    tech_B: {
      i18nKey: 'client.gold_tile.tech_b',
      en: 'Each pair of techs you have',
    },
    mission_A: {
      i18nKey: 'client.gold_tile.mission_a',
      en: 'Each completed mission (conditional + triggered both count)',
    },
    mission_B: {
      i18nKey: 'client.gold_tile.mission_b',
      en: 'Each pair of completed missions / end-game cards',
    },
    income_A: {
      i18nKey: 'client.gold_tile.income_a',
      en: 'Each set of three tucked income cards (one credit + one energy + one card)',
    },
    income_B: {
      i18nKey: 'client.gold_tile.income_b',
      en: 'The income type you tucked the most: credit or energy',
    },
    other_A: {
      i18nKey: 'client.gold_tile.other_a',
      en: 'Each set of three life traces (one pink + one yellow + one blue)',
    },
    other_B: {
      i18nKey: 'client.gold_tile.other_b',
      en: 'Each sector win paired with an orbiter or lander',
    },
  };

/**
 * Inline display for gold scoring tiles — shows per-side rulebook
 * description, the 3 rank multipliers (with the bottom rank holding
 * 2 markers), and any markers already placed by players.
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
          // Group consecutive equal slot values together — physically
          // the bottom rank is one position that holds up to 2 markers,
          // so [8, 6, 4, 4] → 3 ranked positions where the last has a
          // 2-marker capacity. We fold same-value slots into one rank
          // and surface "×2" capacity hint.
          const ranks: Array<{ value: number; capacity: number }> = [];
          for (const value of tile.slotValues) {
            const last = ranks[ranks.length - 1];
            if (last && last.value === value) {
              last.capacity += 1;
            } else {
              ranks.push({ value, capacity: 1 });
            }
          }
          // Distribute claims to ranks in claim order. claims[0] takes
          // the highest-value rank's first slot, claims[1] takes the
          // next slot down, etc.
          const claimsByRank: Array<string[]> = ranks.map(() => []);
          let cursor = 0;
          for (const claim of tile.claims) {
            // Find the rank whose value matches this claim, with a
            // free spot remaining.
            const matchIdx = ranks.findIndex(
              (rank, i) =>
                rank.value === claim.value &&
                claimsByRank[i].length < rank.capacity,
            );
            if (matchIdx >= 0) {
              claimsByRank[matchIdx].push(claim.playerId);
            } else {
              // Fall through if the value doesn't match — shouldn't
              // happen with the new SLOT_VALUES_BY_TILE table but
              // guards older serialized games.
              claimsByRank[cursor]?.push(claim.playerId);
              cursor = Math.min(cursor + 1, ranks.length - 1);
            }
          }

          const description =
            GOLD_TILE_DESCRIPTIONS[`${tile.id}_${tile.side}`];

          return (
            <div
              key={tile.id}
              className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/70 p-2 shadow-hairline-inset'
            >
              <div className='mb-1 flex items-center gap-1.5'>
                <img
                  src='/assets/seti/icons/vp.png'
                  alt=''
                  aria-hidden
                  className='h-3.5 w-3.5 opacity-90'
                />
                <span className='font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-200'>
                  {t(`client.gold_tile.label.${tile.id}`, {
                    defaultValue: tile.id,
                  })}
                </span>
                <span
                  className='chip ml-auto'
                  title={t('client.game_layout.side', { side: tile.side })}
                >
                  {tile.side}
                </span>
              </div>

              {description ? (
                <p
                  className='mb-2 font-body text-[10px] leading-snug text-text-400'
                  data-testid={`gold-tile-desc-${tile.id}-${tile.side}`}
                >
                  {t(description.i18nKey, { defaultValue: description.en })}
                </p>
              ) : null}

              <div className='flex flex-wrap gap-1'>
                {ranks.map((rank, idx) => {
                  const occupants = claimsByRank[idx];
                  return (
                    <div
                      key={`${tile.id}-rank-${idx}`}
                      className={cn(
                        'flex min-w-[44px] items-center justify-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
                        occupants.length > 0
                          ? 'border-accent-500/60 bg-accent-500/[0.08] text-text-100 shadow-[inset_0_0_0_1px_oklch(0.68_0.11_240/0.2)]'
                          : 'border-[color:var(--metal-edge-soft)] bg-background-950/50 text-text-500',
                      )}
                      title={
                        occupants.length > 0
                          ? occupants
                              .map((pid) =>
                                t('client.game_layout.claimed_by', {
                                  player: pid,
                                }),
                              )
                              .join(', ')
                          : t('client.common.open', {
                              defaultValue: 'Open',
                            })
                      }
                    >
                      <span className='flex items-center gap-0.5'>
                        {occupants.map((pid) => (
                          <span
                            key={pid}
                            aria-hidden
                            className='inline-block h-2 w-2 rounded-full border border-[oklch(0.96_0.008_260/0.4)]'
                            style={{
                              backgroundColor:
                                playerColors[pid] ?? '#cbd5e1',
                            }}
                          />
                        ))}
                      </span>
                      {rank.value}×
                      {rank.capacity > 1 ? (
                        <span
                          className='font-mono text-[8px] uppercase tracking-[0.16em] text-text-500'
                          title={t('client.gold_tile.capacity_hint', {
                            count: rank.capacity,
                            defaultValue: '{{count}} markers fit',
                          })}
                        >
                          ·{rank.capacity}
                        </span>
                      ) : null}
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

type TExchangeOption =
  | { from: EResource; to: EResource; cardSource?: undefined }
  | {
      from: EResource;
      to: EResource.CARD;
      cardSource: 'row' | 'deck';
    };

const EXCHANGE_OPTIONS: TExchangeOption[] = [
  { from: EResource.CREDIT, to: EResource.ENERGY },
  { from: EResource.CREDIT, to: EResource.CARD, cardSource: 'row' },
  { from: EResource.CREDIT, to: EResource.CARD, cardSource: 'deck' },
  { from: EResource.ENERGY, to: EResource.CREDIT },
  { from: EResource.ENERGY, to: EResource.CARD, cardSource: 'row' },
  { from: EResource.ENERGY, to: EResource.CARD, cardSource: 'deck' },
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
  onConfirm: (
    from: EResource,
    to: EResource,
    cardPick?: { fromDeck?: boolean; spentCardIds?: string[] },
  ) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const [spentCardIds, setSpentCardIds] = useState<string[]>([]);
  useEffect(() => {
    if (!open) {
      setSpentCardIds([]);
    }
  }, [open]);
  const handCards = player?.hand ?? [];
  const toggleSpentCard = (cardId: string): void => {
    setSpentCardIds((current) => {
      if (current.includes(cardId)) {
        return current.filter((id) => id !== cardId);
      }
      if (current.length >= 2) {
        return current;
      }
      return [...current, cardId];
    });
  };
  const canAfford = (from: EResource): boolean => {
    if (!player) return false;
    if (from === EResource.CARD) {
      return handCards.length >= 2 && spentCardIds.length === 2;
    }
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
        {handCards.length > 0 ? (
          <div className='rounded-md border border-surface-700/50 p-2'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-text-300'>
              Select 2 cards to spend
            </p>
            <div className='grid grid-cols-1 gap-1.5'>
              {handCards.map((card) => {
                const isSelected = spentCardIds.includes(card.id);
                return (
                  <Button
                    key={card.id}
                    type='button'
                    variant={isSelected ? 'primary' : 'ghost'}
                    data-testid={`exchange-spend-card-${card.id}`}
                    aria-pressed={isSelected}
                    onClick={() => toggleSpentCard(card.id)}
                    className='h-9 justify-start px-3 text-left text-xs'
                  >
                    {card.name ?? card.id}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className='grid grid-cols-1 gap-1.5'>
          {EXCHANGE_OPTIONS.map((opt) => {
            const key =
              opt.to === EResource.CARD && opt.cardSource
                ? `${opt.from}-${opt.to}-${opt.cardSource}`
                : `${opt.from}-${opt.to}`;
            const label =
              opt.to === EResource.CARD && opt.cardSource
                ? t('client.game_layout.exchange_into_card', {
                    from: t(`client.resources.${RESOURCE_I18N_KEY[opt.from]}`),
                    source:
                      opt.cardSource === 'row'
                        ? t('client.game_layout.buy_from_row')
                        : t('client.game_layout.buy_from_deck'),
                  })
                : t('client.game_layout.exchange_option', {
                    from: t(`client.resources.${RESOURCE_I18N_KEY[opt.from]}`),
                    to: t(`client.resources.${RESOURCE_I18N_KEY[opt.to]}`),
                  });
            return (
              <Button
                key={key}
                variant='ghost'
                disabled={!canAfford(opt.from)}
                onClick={() => {
                  const cardPick = {
                    ...(opt.from === EResource.CARD ? { spentCardIds } : {}),
                    ...(opt.to === EResource.CARD && opt.cardSource
                      ? { fromDeck: opt.cardSource === 'deck' }
                      : {}),
                  };
                  onConfirm(
                    opt.from,
                    opt.to,
                    Object.keys(cardPick).length > 0 ? cardPick : undefined,
                  );
                }}
                className='h-10 justify-start gap-2 px-3 text-left text-sm'
              >
                <span
                  aria-hidden
                  className='inline-block h-px w-3 bg-accent-500/80'
                />
                <span className='flex-1 font-body text-[13px] text-text-100'>
                  {label}
                </span>
              </Button>
            );
          })}
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
  const options: IPlaceDataOption[] = [];

  if (topIndex >= 0) {
    options.push({
      slotIndex: topIndex,
      row: 'top',
    });
  }

  options.push(
    ...columns
      .map((col, index) => ({ col, index }))
      .filter(
        ({ col }) => col.hasBottomSlot && col.topFilled && !col.bottomFilled,
      )
      .map(({ index }) => ({
        slotIndex: index,
        row: 'bottom' as const,
      })),
  );

  return options;
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

function SampleDeliveryDialog({
  open,
  options,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  options: ISampleDeliveryOption[];
  onCancel: () => void;
  onConfirm: (option: ISampleDeliveryOption) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('client.game_layout.deliver_sample_title')}
          </DialogTitle>
          <p className='text-sm text-text-300'>
            {t('client.game_layout.deliver_sample_desc')}
          </p>
        </DialogHeader>
        <div className='grid grid-cols-1 gap-1.5'>
          {options.map((option) => (
            <Button
              key={`${option.capsuleId}-${option.cardId}`}
              variant='ghost'
              onClick={() => onConfirm(option)}
              className='h-10 justify-start gap-2 px-3 text-left text-sm'
            >
              <span
                aria-hidden
                className='inline-flex h-5 w-5 items-center justify-center rounded-full border border-text-100/60 bg-surface-950 font-mono text-[9px] font-bold text-text-100'
              >
                S
              </span>
              <span className='flex-1 font-body text-[13px] text-text-100'>
                {option.label}
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
