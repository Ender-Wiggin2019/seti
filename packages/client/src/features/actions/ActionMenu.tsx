import { getAvailableMainActions } from '@seti/common/rules';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { UndoButton } from '@/features/actions/UndoButton';
import { cn } from '@/lib/cn';
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

const ACTION_GLYPHS: Record<EMainAction, string> = {
  [EMainAction.LAUNCH_PROBE]: '01',
  [EMainAction.ORBIT]: '02',
  [EMainAction.LAND]: '03',
  [EMainAction.SCAN]: '04',
  [EMainAction.ANALYZE_DATA]: '05',
  [EMainAction.PLAY_CARD]: '06',
  [EMainAction.RESEARCH_TECH]: '07',
  [EMainAction.PASS]: '08',
};

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

export type TActionMenuOrientation = 'vertical' | 'horizontal';

export interface IActionMenuProps {
  gameState: IPublicGameState | null;
  myPlayerId: string;
  isMyTurn: boolean;
  pendingInput: IPlayerInputModel | null;
  canUndo: boolean;
  onSendAction: (action: IMainActionRequest) => void;
  onSendEndTurn: () => void;
  onRequestUndo: () => void;
  /**
   * `vertical` (default) — renders as a stacked panel with a grid of action
   * buttons. Used when the menu lives in a side/bottom column.
   * `horizontal` — renders as a single-row strip of chip buttons. Used when
   * the menu lives in a top action bar where vertical real estate is scarce.
   */
  orientation?: TActionMenuOrientation;
}

function MenuFrame({
  statusLabel,
  canUndo,
  onRequestUndo,
  orientation,
  children,
}: {
  statusLabel: string;
  canUndo: boolean;
  onRequestUndo: () => void;
  orientation: TActionMenuOrientation;
  children: React.ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation('common');

  if (orientation === 'horizontal') {
    return (
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <div className='flex items-center gap-2 pr-1'>
          <span aria-hidden className='section-head__tick' />
          <p className='micro-label whitespace-nowrap'>
            {t('client.action_menu.title')}
          </p>
          <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-300 whitespace-nowrap'>
            {statusLabel}
          </span>
        </div>
        <div className='min-w-0 flex-1'>{children}</div>
        <UndoButton disabled={!canUndo} onRequestUndo={onRequestUndo} />
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <div className='section-head'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>{t('client.action_menu.title')}</p>
        <div aria-hidden className='section-head__rule' />
        <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-text-300'>
          {statusLabel}
        </span>
        <UndoButton disabled={!canUndo} onRequestUndo={onRequestUndo} />
      </div>
      {children}
    </div>
  );
}

function StatusLine({
  dotClass,
  orientation = 'vertical',
  children,
}: {
  dotClass: string;
  orientation?: TActionMenuOrientation;
  children: React.ReactNode;
}): React.JSX.Element {
  if (orientation === 'horizontal') {
    return (
      <div className='flex min-w-0 items-center gap-2'>
        <span
          aria-hidden
          className={cn('inline-block h-1.5 w-1.5 rounded-full', dotClass)}
        />
        <p className='truncate font-mono text-[11px] uppercase tracking-[0.12em] text-text-300'>
          {children}
        </p>
      </div>
    );
  }

  return (
    <div className='instrument-panel px-3 py-2'>
      <div className='flex items-center gap-2'>
        <span
          aria-hidden
          className={cn('inline-block h-1.5 w-1.5 rounded-full', dotClass)}
        />
        <p className='font-mono text-[11px] uppercase tracking-[0.12em] text-text-300'>
          {children}
        </p>
      </div>
    </div>
  );
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
  orientation = 'vertical',
}: IActionMenuProps): React.JSX.Element {
  const { t } = useTranslation('common');
  if (!gameState) {
    return (
      <MenuFrame
        statusLabel={t('client.action_menu.status.loading', {
          defaultValue: 'Standby',
        })}
        canUndo={canUndo}
        onRequestUndo={onRequestUndo}
        orientation={orientation}
      >
        <StatusLine
          dotClass='bg-text-500/70 animate-pulse'
          orientation={orientation}
        >
          {t('client.action_menu.loading_actions')}
        </StatusLine>
      </MenuFrame>
    );
  }

  const currentPlayer = gameState.players.find(
    (player) => player.playerId === gameState.currentPlayerId,
  );

  if (isMyTurn && gameState.phase === EPhase.AWAIT_END_TURN) {
    return (
      <MenuFrame
        statusLabel={t('client.action_menu.status.turn', {
          defaultValue: 'Active',
        })}
        canUndo={canUndo}
        onRequestUndo={onRequestUndo}
        orientation={orientation}
      >
        <Button
          variant='primary'
          size={orientation === 'horizontal' ? 'sm' : 'md'}
          onClick={onSendEndTurn}
          data-testid='action-menu-end-turn'
          className={cn(
            'gap-2 font-mono uppercase tracking-[0.16em]',
            orientation === 'horizontal'
              ? 'h-8 px-3 text-[11px]'
              : 'w-full text-[13px]',
          )}
        >
          <span
            aria-hidden
            className='inline-block h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-current'
          />
          {t('client.action_menu.end_turn', { defaultValue: 'End Turn' })}
        </Button>
      </MenuFrame>
    );
  }

  if (!isMyTurn || gameState.phase !== EPhase.AWAIT_MAIN_ACTION) {
    return (
      <MenuFrame
        statusLabel={t('client.action_menu.status.waiting', {
          defaultValue: 'Standby',
        })}
        canUndo={canUndo}
        onRequestUndo={onRequestUndo}
        orientation={orientation}
      >
        <StatusLine dotClass='bg-text-500/70' orientation={orientation}>
          {t('client.action_menu.waiting_for', {
            player:
              currentPlayer?.playerName ??
              t('client.action_menu.another_player'),
          })}
        </StatusLine>
      </MenuFrame>
    );
  }

  const myPlayer = gameState.players.find(
    (player) => player.playerId === myPlayerId,
  );

  if (!myPlayer) {
    return (
      <MenuFrame
        statusLabel={t('client.action_menu.status.offline', {
          defaultValue: 'Offline',
        })}
        canUndo={canUndo}
        onRequestUndo={onRequestUndo}
        orientation={orientation}
      >
        <StatusLine dotClass='bg-danger-500/80' orientation={orientation}>
          {t('client.action_menu.player_unavailable')}
        </StatusLine>
      </MenuFrame>
    );
  }

  const serverAvailable = getServerAvailableActions(pendingInput);
  const ruleAvailable = new Set(getAvailableMainActions(myPlayer, gameState));
  const available = serverAvailable.size > 0 ? serverAvailable : ruleAvailable;

  return (
    <MenuFrame
      statusLabel={t('client.action_menu.status.turn', {
        defaultValue: 'Active',
      })}
      canUndo={canUndo}
      onRequestUndo={onRequestUndo}
      orientation={orientation}
    >
      <div
        className={cn(
          orientation === 'horizontal'
            ? 'flex flex-wrap items-center gap-1.5'
            : 'grid grid-cols-2 gap-1.5',
        )}
      >
        {MAIN_ACTIONS.map((actionType) => {
          const enabled = available.has(actionType);

          return (
            <Button
              key={actionType}
              variant='ghost'
              size='sm'
              disabled={!enabled}
              onClick={() => onSendAction({ type: actionType })}
              data-testid={`action-menu-${actionType}`}
              className={cn(
                'gap-1.5 text-left text-xs',
                orientation === 'horizontal'
                  ? 'h-8 justify-center px-2.5'
                  : 'h-9 justify-start px-2',
                enabled && 'hover:border-accent-500/60 hover:text-text-100',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'font-mono text-[10px] tracking-[0.14em]',
                  enabled ? 'text-accent-400' : 'text-text-500',
                )}
              >
                {ACTION_GLYPHS[actionType]}
              </span>
              <span
                className={cn(
                  orientation === 'horizontal'
                    ? 'whitespace-nowrap'
                    : 'flex-1 truncate',
                )}
              >
                {t(`client.action_menu.actions.${actionType}`)}
              </span>
            </Button>
          );
        })}
      </div>
    </MenuFrame>
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
