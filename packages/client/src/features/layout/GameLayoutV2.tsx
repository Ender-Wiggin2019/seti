import {
  canPlaySpecificCard,
  getAvailableMainActions,
} from '@seti/common/rules';
import { useEffect, useRef } from 'react';
import { CardDetail } from '@/features/cards/CardDetail';
import { useGameContext } from '@/pages/game/GameContext';
import { GameOverDialog } from '@/pages/game/GameOverDialog';
import { EMainAction, EPhase } from '@/types/re-exports';
import { GameSessionProvider, useGameSession } from './GameSessionContext';
import { LayoutProvider } from './LayoutContext';
import { LayoutShell } from './LayoutShell';
import { getInputFocusSection } from './sectionInputs';
import { ensureSectionsRegistered } from './sections';

/**
 * GameLayoutV2 — the new configurable layout shell. Wraps the game in:
 *   • LayoutProvider (resolves preset + overrides + responsive)
 *   • GameSessionProvider (cross-section UI state)
 *   • LayoutShell (renders tab/waterfall/mobile + pinned chrome)
 *
 * Sections are registered once on mount; the registry stays live for the
 * dev panel's section list.
 */
export function GameLayoutV2(): React.JSX.Element {
  ensureSectionsRegistered();

  return (
    <LayoutProvider>
      <GameSessionProvider>
        <LayoutShell />
        <PendingInputFocusBridge />
        <GlobalDialogs />
      </GameSessionProvider>
    </LayoutProvider>
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
