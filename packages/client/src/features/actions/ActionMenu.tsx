import { getAvailableMainActions } from '@seti/common/rules';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { UndoButton } from '@/features/actions/UndoButton';
import type {
  IMainActionRequest,
  IPlayerInputModel,
  IPublicGameState,
} from '@/types/re-exports';
import { EMainAction, EPhase, EPlayerInputType } from '@/types/re-exports';

const MAIN_ACTIONS: EMainAction[] = [
  EMainAction.LAUNCH_PROBE,
  EMainAction.ORBIT,
  EMainAction.LAND,
  EMainAction.SCAN,
  EMainAction.ANALYZE_DATA,
  EMainAction.PLAY_CARD,
  EMainAction.RESEARCH_TECH,
  EMainAction.PASS,
];

const ACTION_KEYWORDS: Record<EMainAction, string[]> = {
  [EMainAction.LAUNCH_PROBE]: ['launch probe', 'startprobe', 'start probe'],
  [EMainAction.ORBIT]: ['orbit'],
  [EMainAction.LAND]: ['land', 'landing'],
  [EMainAction.SCAN]: ['scan', 'look'],
  [EMainAction.ANALYZE_DATA]: ['analyze data', 'analyze', 'clearcomputer'],
  [EMainAction.PLAY_CARD]: ['play card', 'card'],
  [EMainAction.RESEARCH_TECH]: ['research tech', 'research', 'techpop'],
  [EMainAction.PASS]: ['pass'],
};

export interface IActionMenuProps {
  gameState: IPublicGameState | null;
  myPlayerId: string;
  isMyTurn: boolean;
  pendingInput: IPlayerInputModel | null;
  canUndo: boolean;
  onSendAction: (action: IMainActionRequest) => void;
  onSendEndTurn: () => void;
  onRequestUndo: () => void;
}

export function ActionMenu({
  gameState,
  myPlayerId,
  isMyTurn,
  pendingInput,
  canUndo,
  onSendAction,
  onSendEndTurn,
  onRequestUndo,
}: IActionMenuProps): React.JSX.Element {
  const { t } = useTranslation('common');
  if (!gameState) {
    return (
      <p className='text-xs text-text-500'>
        {t('client.action_menu.loading_actions')}
      </p>
    );
  }

  const currentPlayer = gameState.players.find(
    (player) => player.playerId === gameState.currentPlayerId,
  );

  if (isMyTurn && gameState.phase === EPhase.AWAIT_END_TURN) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <p className='font-mono text-xs uppercase tracking-wide text-text-400'>
            {t('client.action_menu.title')}
          </p>
          <UndoButton disabled={!canUndo} onRequestUndo={onRequestUndo} />
        </div>
        <Button
          type='button'
          size='sm'
          onClick={onSendEndTurn}
          data-testid='action-menu-end-turn'
          className='h-9 w-full'
        >
          {t('client.action_menu.end_turn', { defaultValue: 'End Turn' })}
        </Button>
      </div>
    );
  }

  if (!isMyTurn || gameState.phase !== EPhase.AWAIT_MAIN_ACTION) {
    return (
      <p className='text-xs text-text-400'>
        {t('client.action_menu.waiting_for', {
          player:
            currentPlayer?.playerName ?? t('client.action_menu.another_player'),
        })}
      </p>
    );
  }

  const myPlayer = gameState.players.find(
    (player) => player.playerId === myPlayerId,
  );

  if (!myPlayer) {
    return (
      <p className='text-xs text-text-500'>
        {t('client.action_menu.player_unavailable')}
      </p>
    );
  }

  const serverAvailable = getServerAvailableActions(pendingInput);
  const ruleAvailable = new Set(getAvailableMainActions(myPlayer, gameState));
  const available = serverAvailable.size > 0 ? serverAvailable : ruleAvailable;

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <p className='font-mono text-xs uppercase tracking-wide text-text-400'>
          {t('client.action_menu.title')}
        </p>
        <UndoButton disabled={!canUndo} onRequestUndo={onRequestUndo} />
      </div>

      <div className='grid grid-cols-2 gap-2'>
        {MAIN_ACTIONS.map((actionType) => {
          const enabled = available.has(actionType);

          return (
            <Button
              key={actionType}
              type='button'
              variant='ghost'
              size='sm'
              disabled={!enabled}
              onClick={() => onSendAction({ type: actionType })}
              data-testid={`action-menu-${actionType}`}
              className='h-9 justify-start border border-surface-700/60 bg-surface-800/50 px-2 text-left text-xs text-text-200 hover:bg-surface-700/70 disabled:opacity-40'
            >
              {t(`client.action_menu.actions.${actionType}`)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function getServerAvailableActions(
  pendingInput: IPlayerInputModel | null,
): Set<EMainAction> {
  if (!pendingInput || pendingInput.type !== EPlayerInputType.OR) {
    return new Set<EMainAction>();
  }

  const actions = new Set<EMainAction>();

  for (const option of pendingInput.options) {
    const texts: string[] = [
      option.type,
      option.title ?? '',
      option.description ?? '',
    ];

    if (option.type === EPlayerInputType.OPTION) {
      for (const item of option.options) {
        texts.push(item.id);
        texts.push(item.label);
      }
    }

    for (const text of texts) {
      const matched = resolveMainAction(text);
      if (matched) {
        actions.add(matched);
      }
    }
  }

  return actions;
}

function resolveMainAction(text: string): EMainAction | null {
  const normalized = text.toLowerCase().replaceAll(/[^a-z]+/g, '');

  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS) as Array<
    [EMainAction, string[]]
  >) {
    const matched = keywords.some((keyword) =>
      normalized.includes(keyword.replaceAll(/[^a-z]+/g, '')),
    );

    if (matched) {
      return action;
    }
  }

  return null;
}
