import {
  canPlaySpecificCard,
  getAvailableMainActions,
} from '@seti/common/rules';
import { EAlienMap } from '@seti/common/types/BaseCard';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { CardDetail } from '@/features/cards/CardDetail';
import { useGameContext } from '@/pages/game/GameContext';
import { GameOverDialog } from '@/pages/game/GameOverDialog';
import {
  EGameEventType,
  EMainAction,
  EPhase,
  type TGameEvent,
} from '@/types/re-exports';
import { GameSessionProvider, useGameSession } from './GameSessionContext';
import { LayoutProvider } from './LayoutContext';
import { LayoutShell } from './LayoutShell';
import { GameLayoutRuntimeOptionsProvider } from './runtimeOptions';
import { getInputFocusSection } from './sectionInputs';
import { ensureSectionsRegistered } from './sections';

const CARD_CUSTOM_EFFECT_UNHANDLED = 'CARD_CUSTOM_EFFECT_UNHANDLED';

type TAlienDiscoveredEvent = Extract<
  TGameEvent,
  { type: EGameEventType.ALIEN_DISCOVERED }
>;

interface IAlienDiscoveryNotice {
  key: string;
  alienType: TAlienDiscoveredEvent['alienType'];
  alienIndex?: number;
}

/**
 * GameLayoutV2 — the new configurable layout shell. Wraps the game in:
 *   • LayoutProvider (resolves preset + overrides + responsive)
 *   • GameSessionProvider (cross-section UI state)
 *   • LayoutShell (renders tab/waterfall/mobile + pinned chrome)
 *
 * Sections are registered once on mount; the registry stays live for the
 * dev panel's section list.
 */
export function GameLayoutV2({
  showSolarSystemSpaceConfig = false,
  allowMoveAnyProbe = false,
}: {
  showSolarSystemSpaceConfig?: boolean;
  allowMoveAnyProbe?: boolean;
}): React.JSX.Element {
  ensureSectionsRegistered();

  return (
    <GameLayoutRuntimeOptionsProvider
      value={{ showSolarSystemSpaceConfig, allowMoveAnyProbe }}
    >
      <LayoutProvider>
        <GameSessionProvider>
          <LayoutShell />
          <PendingInputFocusBridge />
          <GlobalEventEffects />
          <GlobalDialogs />
        </GameSessionProvider>
      </LayoutProvider>
    </GameLayoutRuntimeOptionsProvider>
  );
}

function PendingInputFocusBridge(): null {
  const { pendingInput } = useGameContext();
  const { focusSection } = useGameSession();
  const lastInputIdRef = useRef<string | null>(null);

  useEffect(() => {
    const sectionId = getInputFocusSection(pendingInput);
    if (sectionId === null) {
      lastInputIdRef.current = null;
      return;
    }
    const inputId = pendingInput?.inputId ?? null;
    if (inputId === lastInputIdRef.current) return;
    lastInputIdRef.current = inputId;
    const frame = requestAnimationFrame(() => focusSection(sectionId));
    return () => cancelAnimationFrame(frame);
  }, [focusSection, pendingInput]);

  return null;
}

/**
 * GlobalDialogs — CardDetail + GameOverDialog, which float above the layout
 * and aren't tied to any single section.
 */
function GlobalDialogs(): React.JSX.Element {
  const { gameState, myPlayerId, isMyTurn, pendingInput, sendAction } =
    useGameContext();
  const { detailCard, detailOpen, closeDetail } = useGameSession();

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
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
    closeDetail();
  };

  const myMissionClaimsByCardId: Record<string, boolean[]> = Object.fromEntries(
    (
      (
        myPlayer as
          | (typeof myPlayer & {
              missionClaims?: Array<{
                cardId: string;
                branchClaims: boolean[];
              }>;
            })
          | undefined
      )?.missionClaims ?? []
    ).map((entry) => [entry.cardId, entry.branchClaims]),
  );

  return (
    <>
      <CardDetail
        card={detailCard}
        open={detailOpen}
        onOpenChange={(next) => !next && closeDetail()}
        canPlayCard={canPlayDetailCard}
        onPlayCard={handlePlayDetailCard}
        branchClaimsByCardId={myMissionClaimsByCardId}
        ownerPlayerColor={myPlayer?.color}
      />
      <GameOverDialog />
    </>
  );
}

function GlobalEventEffects(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { events, gameState } = useGameContext();
  const unhandledEffectToastKeysRef = useRef<Set<string>>(new Set());
  const alienNoticeKeysRef = useRef<Set<string>>(new Set());
  const lastGameIdRef = useRef<string | undefined>(undefined);
  const [alienNoticeQueue, setAlienNoticeQueue] = useState<
    IAlienDiscoveryNotice[]
  >([]);

  useEffect(() => {
    const gid = gameState?.gameId;
    if (gid !== lastGameIdRef.current) {
      unhandledEffectToastKeysRef.current.clear();
      alienNoticeKeysRef.current.clear();
      setAlienNoticeQueue([]);
      lastGameIdRef.current = gid;
    }
  }, [gameState?.gameId]);

  useEffect(() => {
    const nextNotices: IAlienDiscoveryNotice[] = [];
    for (const event of [...events].reverse()) {
      if (event.type !== EGameEventType.ALIEN_DISCOVERED) continue;
      const key = alienDiscoveredEventKey(event);
      if (alienNoticeKeysRef.current.has(key)) continue;
      alienNoticeKeysRef.current.add(key);
      nextNotices.push({
        key,
        alienType: event.alienType,
        alienIndex: event.alienIndex,
      });
    }

    if (nextNotices.length === 0) return;
    setAlienNoticeQueue((current) => [...current, ...nextNotices]);
  }, [events]);

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

  const alienNotice = alienNoticeQueue[0] ?? null;
  const alienNoticeName = alienNotice
    ? t(
        `client.alien_board.types.${alienTypeTranslationKey(alienNotice.alienType)}`,
        {
          defaultValue: alienTypeTranslationKey(alienNotice.alienType),
        },
      )
    : '';
  const dismissAlienNotice = (): void => {
    setAlienNoticeQueue((current) => current.slice(1));
  };

  return (
    <Dialog
      open={alienNotice !== null}
      onOpenChange={(open) => {
        if (!open) dismissAlienNotice();
      }}
    >
      <DialogContent data-testid='alien-found-dialog'>
        <DialogHeader>
          <DialogTitle>
            {t('client.game_layout.alien_found_title', {
              alien: alienNoticeName,
              defaultValue: `Alien ${alienNoticeName} is Found!`,
            })}
          </DialogTitle>
        </DialogHeader>
        <p className='text-sm leading-6 text-text-300'>
          {t('client.game_layout.alien_found_desc', {
            alien: alienNoticeName,
            defaultValue:
              'The species board has been revealed and its discovery effects are now resolved.',
          })}
        </p>
        <DialogFooter>
          <Button onClick={dismissAlienNotice} variant='primary'>
            {t('client.common.ok', { defaultValue: 'OK' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function actionEventName(event: TGameEvent): string | null {
  if (event.type !== EGameEventType.ACTION) return null;
  const action = event.action;
  if (typeof action === 'string') return action;
  if (action && typeof action === 'object' && 'type' in action) {
    return String((action as { type: string }).type);
  }
  return null;
}

function alienDiscoveredEventKey(event: TAlienDiscoveredEvent): string {
  return (
    event.id ??
    `${event.type}|${event.at ?? ''}|${event.alienType}|${event.alienIndex ?? ''}`
  );
}

function alienTypeTranslationKey(
  alienType: TAlienDiscoveredEvent['alienType'],
): string {
  return EAlienMap[alienType] ?? String(alienType).toLowerCase();
}
