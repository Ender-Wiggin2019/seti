import { getAvailableFreeActions } from '@seti/common/rules';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { IPublicGameState } from '@/types/re-exports';
import { EFreeAction } from '@/types/re-exports';

const VISIBLE_ACTIONS: EFreeAction[] = [
  EFreeAction.MOVEMENT,
  EFreeAction.COMPLETE_MISSION,
];

const COLLAPSIBLE_ACTIONS: EFreeAction[] = [
  EFreeAction.CONVERT_ENERGY_TO_MOVEMENT,
  EFreeAction.PLACE_DATA,
  EFreeAction.DELIVER_SAMPLE,
  EFreeAction.USE_CARD_CORNER,
  EFreeAction.BUY_CARD,
  EFreeAction.EXCHANGE_RESOURCES,
  EFreeAction.SPEND_SIGNAL_TOKEN,
];

export interface IFreeActionBarProps {
  gameState: IPublicGameState | null;
  myPlayerId: string;
  isMyTurn: boolean;
  onActionClick: (action: EFreeAction) => void;
}

/**
 * FreeActionBar — a secondary instrument strip below the main
 * action menu. Fixed-height rail with a leading micro-label, a
 * row of ghost-metal chips for the always-visible actions, and
 * a collapse/expand chevron that reveals the rest.
 */
export function FreeActionBar({
  gameState,
  myPlayerId,
  isMyTurn,
  onActionClick,
}: IFreeActionBarProps): React.JSX.Element | null {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);

  if (!isMyTurn || !gameState) {
    return null;
  }

  const myPlayer = gameState.players.find(
    (player) => player.playerId === myPlayerId,
  );

  if (!myPlayer) {
    return null;
  }

  const available = new Set(getAvailableFreeActions(myPlayer, gameState));

  const availableCount = [...VISIBLE_ACTIONS, ...COLLAPSIBLE_ACTIONS].filter(
    (a) => available.has(a),
  ).length;

  return (
    <div
      className='relative border-t border-[color:var(--metal-edge-soft)] bg-background-950/70 px-4 py-1.5'
      data-testid='free-action-bar'
    >
      <div
        aria-hidden
        className='pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--surface-700)] to-transparent opacity-70'
      />

      <div className='flex flex-wrap items-center gap-1.5'>
        <div className='flex items-center gap-1.5 pr-1'>
          <span aria-hidden className='section-head__tick' />
          <p className='micro-label'>{t('client.free_action_bar.title')}</p>
          <span className='font-mono text-[10px] text-text-500'>
            {availableCount}
          </span>
        </div>

        {VISIBLE_ACTIONS.map((action) => (
          <FreeActionButton
            key={action}
            action={action}
            label={getFreeActionLabel(
              action,
              t(`client.free_action_bar.actions.${action}`),
              myPlayer.movementPoints,
            )}
            disabled={!available.has(action)}
            onClick={onActionClick}
          />
        ))}

        {expanded
          ? COLLAPSIBLE_ACTIONS.map((action) => (
              <FreeActionButton
                key={action}
                action={action}
                label={getFreeActionLabel(
                  action,
                  t(`client.free_action_bar.actions.${action}`),
                  myPlayer.movementPoints,
                )}
                disabled={!available.has(action)}
                onClick={onActionClick}
              />
            ))
          : null}

        <Button
          variant='ghost'
          size='sm'
          className='ml-auto h-7 gap-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.14em]'
          onClick={() => setExpanded((prev) => !prev)}
          data-testid='free-action-toggle'
        >
          {expanded
            ? t('client.free_action_bar.collapse')
            : t('client.free_action_bar.expand')}
          <span
            aria-hidden
            className={cn(
              'inline-block h-0 w-0 border-x-[4px] border-x-transparent transition-transform',
              expanded
                ? 'border-b-[5px] border-b-current'
                : 'border-t-[5px] border-t-current',
            )}
          />
        </Button>
      </div>
    </div>
  );
}

function getFreeActionLabel(
  action: EFreeAction,
  label: string,
  movementPoints: number,
): string {
  if (action !== EFreeAction.MOVEMENT) {
    return label;
  }

  return `${label} (${movementPoints})`;
}

function FreeActionButton({
  action,
  label,
  disabled,
  onClick,
}: {
  action: EFreeAction;
  label: string;
  disabled: boolean;
  onClick: (action: EFreeAction) => void;
}): React.JSX.Element {
  return (
    <Button
      variant='ghost'
      size='sm'
      disabled={disabled}
      onClick={() => onClick(action)}
      data-testid={`free-action-${action}`}
      className='h-7 px-2 font-mono text-[11px] uppercase tracking-[0.1em]'
    >
      {label}
    </Button>
  );
}
