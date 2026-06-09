import { canPlaySpecificCard } from '@seti/common/rules';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { ActionMenu } from '@/features/actions/ActionMenu';
import { FreeActionBar } from '@/features/actions/FreeActionBar';
import {
  getPlayerInputPresentationMode,
  isOrbitalDynamicsMoveInputModel,
  shouldRenderPendingInputPrompt,
} from '@/features/input/inputPresentation';
import { PendingInputPrompt } from '@/features/input/PendingInputPrompt';
import { useGameContext } from '@/pages/game/GameContext';
import {
  EMainAction,
  EPlayerInputType,
  type IMainActionRequest,
} from '@/types/re-exports';
import {
  useActionController,
  useArmedFlagAutoReset,
} from '../actionController';
import { useGameSession } from '../GameSessionContext';
import { useLayoutStore } from '../layoutStore';
import type { ISectionRenderProps } from '../sectionRegistry';

// `gameState.canUndo` is the server-authoritative flag for recovery controls.

/**
 * ActionBarSection — ActionMenu + FreeActionBar + the cross-section hints
 * (movement mode banner, corner-selection hint). Owns the action controller
 * (free-action dialogs) plus armed-flag auto-reset.
 */
export function ActionBarSection(_: ISectionRenderProps): React.JSX.Element {
  void _;
  const { t } = useTranslation('common');
  const {
    gameState,
    isMyTurn,
    pendingInput,
    myPlayerId,
    sendAction,
    sendInput,
    sendEndTurn,
    requestUndo,
  } = useGameContext();
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const {
    cornerSelectionMode,
    setCornerSelectionMode,
    movementModeActive,
    setMovementModeActive,
    focusSection,
    setPlayCardSelectionMode,
    setHandExpanded,
  } = useGameSession();
  const { handleFreeActionClick, dialogs } = useActionController();
  useArmedFlagAutoReset();

  const myPlayer = gameState?.players.find((p) => p.playerId === myPlayerId);
  const movementPoints = myPlayer?.movementPoints ?? 0;
  const canUndo = gameState?.canUndo ?? false;
  const orbitalDynamicsInput = isOrbitalDynamicsMoveInputModel(pendingInput)
    ? pendingInput
    : null;
  const orbitalDynamicsDoneOption =
    orbitalDynamicsInput?.options.find((option) => option.id === 'done') ??
    null;
  const showBoardInputHint = orbitalDynamicsInput !== null;
  const presentationMode = getPlayerInputPresentationMode(pendingInput, {
    cardRowCardIds: gameState
      ? new Set(gameState.cardRow.map((card) => card.id))
      : undefined,
  });
  const showPendingInputPrompt = shouldRenderPendingInputPrompt(pendingInput);
  const promptInput = showPendingInputPrompt ? pendingInput : null;

  const handleSendAction = (request: IMainActionRequest): void => {
    setMovementModeActive(false);
    setCornerSelectionMode(false);
    if (request.type === EMainAction.PLAY_CARD) {
      const hand = myPlayer?.hand ?? [];
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

      if (playableIndexes.length > 1) {
        setPlayCardSelectionMode(true);
        setHandExpanded(true);
        toast({
          title: t('client.game_layout.toast.card_required'),
          description: t('client.game_layout.toast.card_required_desc'),
        });
      }
      return;
    }
    sendAction(request);
  };

  return (
    <div className='flex flex-col' data-testid='bottom-actions'>
      {promptInput ? (
        <PendingInputPrompt
          model={promptInput}
          onSubmit={sendInput}
          phase={gameState?.phase}
          techBoard={gameState?.techBoard}
          presentationMode={presentationMode ?? undefined}
          boardHint={
            showBoardInputHint
              ? {
                  title: t('client.game_layout.orbital_dynamics'),
                  description: t('client.game_layout.select_highlighted_space'),
                  doneLabel: orbitalDynamicsDoneOption?.label,
                  onDone: orbitalDynamicsDoneOption
                    ? () =>
                        sendInput({
                          inputId: orbitalDynamicsInput.inputId,
                          type: EPlayerInputType.OPTION,
                          optionId: orbitalDynamicsDoneOption.id,
                        })
                    : undefined,
                }
              : undefined
          }
        />
      ) : (
        <div className='flex min-w-0 items-center gap-3 px-4 py-2'>
          <ActionMenu
            gameState={gameState}
            myPlayerId={myPlayerId}
            isMyTurn={isMyTurn}
            pendingInput={pendingInput}
            canUndo={canUndo}
            onSendAction={handleSendAction}
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
        onActionClick={(action, organizationId) => {
          handleFreeActionClick(action, organizationId);
          if (action === 'BUY_CARD') {
            setActiveTab('cards');
            focusSection('cardRows');
          }
          if (action === 'MOVEMENT') {
            setActiveTab('board');
            focusSection('solarSystem');
          }
        }}
      />

      {movementModeActive ? (
        <div
          className='flex items-center gap-2 border-t border-accent-500/40 bg-accent-500/[0.05] px-4 py-1.5'
          data-testid='movement-mode-hint'
        >
          <span
            aria-hidden
            className='h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_4px_oklch(0.68_0.11_240/0.7)] motion-safe:animate-pulse'
          />
          <p className='font-mono text-[10px] uppercase tracking-[0.12em] text-accent-400'>
            {t('client.action_bar.move_probe', { defaultValue: 'Move Probe' })}
          </p>
          <span className='font-mono text-[10px] uppercase tracking-[0.12em] text-text-300'>
            {movementPoints}{' '}
            {movementPoints === 1
              ? t('client.action_bar.step', { defaultValue: 'step' })
              : t('client.action_bar.steps', { defaultValue: 'steps' })}
          </span>
          <Button
            variant='ghost'
            size='sm'
            className='ml-auto h-6 px-2 font-mono text-[10px] uppercase tracking-[0.12em]'
            onClick={() => setMovementModeActive(false)}
          >
            {t('client.action_bar.end_move', { defaultValue: 'End Move' })}
          </Button>
        </div>
      ) : null}

      {cornerSelectionMode ? (
        <div className='flex items-center gap-2 border-t border-accent-500/40 bg-accent-500/[0.05] px-4 py-1.5'>
          <span
            aria-hidden
            className='h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_4px_oklch(0.68_0.11_240/0.7)] motion-safe:animate-pulse'
          />
          <p className='font-mono text-[10px] uppercase tracking-[0.12em] text-accent-400'>
            {t('client.game_layout.toast.card_required')}
          </p>
          <Button
            variant='ghost'
            size='sm'
            className='ml-auto h-6 px-2 font-mono text-[10px] uppercase tracking-[0.12em]'
            onClick={() => setCornerSelectionMode(false)}
          >
            {t('client.action_bar.cancel', { defaultValue: 'Cancel' })}
          </Button>
        </div>
      ) : null}

      {dialogs}
    </div>
  );
}
