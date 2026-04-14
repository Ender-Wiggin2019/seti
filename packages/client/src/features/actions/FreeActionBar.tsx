import { getAvailableFreeActions } from '@seti/common/rules';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { IPublicGameState } from '@/types/re-exports';
import { EFreeAction } from '@/types/re-exports';

const VISIBLE_ACTIONS: EFreeAction[] = [
  EFreeAction.MOVEMENT,
  EFreeAction.COMPLETE_MISSION,
];

const COLLAPSIBLE_ACTIONS: EFreeAction[] = [
  EFreeAction.CONVERT_ENERGY_TO_MOVEMENT,
  EFreeAction.PLACE_DATA,
  EFreeAction.USE_CARD_CORNER,
  EFreeAction.BUY_CARD,
  EFreeAction.EXCHANGE_RESOURCES,
];

export interface IFreeActionBarProps {
  gameState: IPublicGameState | null;
  myPlayerId: string;
  isMyTurn: boolean;
  onActionClick: (action: EFreeAction) => void;
}

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

  return (
    <div
      className='flex flex-wrap items-center gap-2 border-t border-surface-700/40 px-4 py-1.5'
      data-testid='free-action-bar'
    >
      <span className='mr-1 font-mono text-xs uppercase tracking-wide text-text-500'>
        {t('client.free_action_bar.title')}
      </span>

      {VISIBLE_ACTIONS.map((action) => (
        <FreeActionButton
          key={action}
          action={action}
          label={t(`client.free_action_bar.actions.${action}`)}
          disabled={!available.has(action)}
          onClick={onActionClick}
        />
      ))}

      {expanded
        ? COLLAPSIBLE_ACTIONS.map((action) => (
            <FreeActionButton
              key={action}
              action={action}
              label={t(`client.free_action_bar.actions.${action}`)}
              disabled={!available.has(action)}
              onClick={onActionClick}
            />
          ))
        : null}

      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-8 border border-surface-700/60 bg-surface-800/40 px-2 font-mono text-[11px] uppercase tracking-wide text-text-300 hover:bg-surface-700/60'
        onClick={() => setExpanded((prev) => !prev)}
        data-testid='free-action-toggle'
      >
        {expanded
          ? t('client.free_action_bar.collapse')
          : t('client.free_action_bar.expand')}
      </Button>
    </div>
  );
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
      type='button'
      variant='ghost'
      size='sm'
      disabled={disabled}
      onClick={() => onClick(action)}
      data-testid={`free-action-${action}`}
      className='h-8 border border-surface-700/60 bg-surface-800/60 px-2 text-xs text-text-300 hover:bg-surface-700/70 disabled:opacity-40'
    >
      {label}
    </Button>
  );
}
