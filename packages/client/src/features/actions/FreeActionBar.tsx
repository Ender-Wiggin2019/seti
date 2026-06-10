import { getAvailableFreeActions } from '@seti/common/rules';
import { EOrganizationId } from '@seti/common/types/organization';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { getOrganizationDisplayName } from '@/lib/organizationText';
import type { IPlayerInputModel, IPublicGameState } from '@/types/re-exports';
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
];

type TFreeActionKey =
  | `action:${EFreeAction}`
  | `organization:${EOrganizationId}`;

export interface IFreeActionBarProps {
  gameState: IPublicGameState | null;
  myPlayerId: string;
  isMyTurn: boolean;
  pendingInput?: IPlayerInputModel | null;
  onActionClick: (
    action: EFreeAction,
    organizationId?: EOrganizationId,
  ) => void;
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
  pendingInput = null,
  onActionClick,
}: IFreeActionBarProps): React.JSX.Element | null {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);
  const myPlayer =
    isMyTurn && gameState
      ? gameState.players.find((player) => player.playerId === myPlayerId)
      : undefined;
  const available = new Set(
    myPlayer && gameState ? getAvailableFreeActions(myPlayer, gameState) : [],
  );
  const visibleActions = VISIBLE_ACTIONS;
  const collapsibleActions = COLLAPSIBLE_ACTIONS;
  const organizationIds = myPlayer ? (myPlayer.organizationIds ?? []) : [];
  const renderedOrganizationIds = organizationIds;
  const availableActionSignature = getAvailableActionKeys(
    available,
    organizationIds,
    myPlayer,
    gameState,
  ).join('|');
  const highlightedKeys = useNewlyAvailableActionKeys(
    gameState?.turnIndex ?? -1,
    availableActionSignature,
  );

  if (!isMyTurn || !gameState || !myPlayer) {
    return null;
  }

  if (pendingInput !== null) {
    return null;
  }

  const availableCount = [...visibleActions, ...collapsibleActions].filter(
    (a) => available.has(a),
  ).length;
  const availableOrganizationPowerCount = renderedOrganizationIds.filter(
    (organizationId) =>
      isOrganizationPowerAvailable(myPlayer, organizationId, gameState),
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
            {availableCount + availableOrganizationPowerCount}
          </span>
        </div>

        {visibleActions.map((action) => (
          <FreeActionButton
            key={action}
            action={action}
            label={getFreeActionLabel(
              action,
              t(`client.free_action_bar.actions.${action}`),
              myPlayer.movementPoints,
            )}
            disabled={!available.has(action)}
            newlyAvailable={highlightedKeys.has(getFreeActionKey(action))}
            onClick={onActionClick}
          />
        ))}

        {expanded
          ? collapsibleActions.map((action) => (
              <FreeActionButton
                key={action}
                action={action}
                label={getFreeActionLabel(
                  action,
                  t(`client.free_action_bar.actions.${action}`),
                  myPlayer.movementPoints,
                )}
                disabled={!available.has(action)}
                newlyAvailable={highlightedKeys.has(getFreeActionKey(action))}
                onClick={onActionClick}
              />
            ))
          : null}

        {expanded
          ? renderedOrganizationIds.map((organizationId) => (
              <OrganizationPowerButton
                key={organizationId}
                organizationId={organizationId}
                label={t(
                  `client.free_action_bar.actions.${EFreeAction.USE_ORGANIZATION_POWER}`,
                )}
                disabled={
                  !isOrganizationPowerAvailable(
                    myPlayer,
                    organizationId,
                    gameState,
                  )
                }
                newlyAvailable={highlightedKeys.has(
                  getOrganizationActionKey(organizationId),
                )}
                onClick={onActionClick}
              />
            ))
          : null}

        {collapsibleActions.length > 0 ? (
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
        ) : null}
      </div>
    </div>
  );
}

function OrganizationPowerButton({
  organizationId,
  label,
  disabled,
  newlyAvailable,
  onClick,
}: {
  organizationId: EOrganizationId;
  label: string;
  disabled: boolean;
  newlyAvailable: boolean;
  onClick: (action: EFreeAction, organizationId?: EOrganizationId) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const organizationName = getOrganizationDisplayName(t, organizationId);
  return (
    <Button
      variant='ghost'
      size='sm'
      disabled={disabled}
      aria-label={`${organizationName} ${label}`}
      onClick={() =>
        onClick(EFreeAction.USE_ORGANIZATION_POWER, organizationId)
      }
      data-newly-available={newlyAvailable ? 'true' : undefined}
      data-testid={`organization-power-${organizationId}`}
      className={cn(
        'h-7 px-2 font-mono text-[11px] uppercase tracking-[0.1em]',
        newlyAvailable &&
          'border-accent-300 bg-accent-500/15 text-accent-100 ring-1 ring-accent-300/80',
      )}
    >
      {label}
    </Button>
  );
}

function isOrganizationPowerAvailable(
  player: IPublicGameState['players'][number],
  organizationId: EOrganizationId,
  _gameState: IPublicGameState,
): boolean {
  return player.usableOrganizationPowerIds?.includes(organizationId) === true;
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
  newlyAvailable,
  onClick,
}: {
  action: EFreeAction;
  label: string;
  disabled: boolean;
  newlyAvailable: boolean;
  onClick: (action: EFreeAction) => void;
}): React.JSX.Element {
  return (
    <Button
      variant='ghost'
      size='sm'
      disabled={disabled}
      onClick={() => onClick(action)}
      data-newly-available={newlyAvailable ? 'true' : undefined}
      data-testid={`free-action-${action}`}
      className={cn(
        'h-7 px-2 font-mono text-[11px] uppercase tracking-[0.1em]',
        newlyAvailable &&
          'border-accent-300 bg-accent-500/15 text-accent-100 ring-1 ring-accent-300/80',
      )}
    >
      {label}
    </Button>
  );
}

function getAvailableActionKeys(
  freeActions: Set<EFreeAction>,
  organizationIds: EOrganizationId[],
  player: IPublicGameState['players'][number] | undefined,
  gameState: IPublicGameState | null,
): TFreeActionKey[] {
  const keys: TFreeActionKey[] = [...freeActions].map(getFreeActionKey);
  if (player && gameState) {
    for (const organizationId of organizationIds) {
      if (isOrganizationPowerAvailable(player, organizationId, gameState)) {
        keys.push(getOrganizationActionKey(organizationId));
      }
    }
  }
  return keys.sort();
}

function useNewlyAvailableActionKeys(
  turnIndex: number,
  availableActionSignature: string,
): Set<TFreeActionKey> {
  const previousRef = useRef<{
    turnIndex: number;
    keys: Set<TFreeActionKey>;
  } | null>(null);
  const [highlightedKeys, setHighlightedKeys] = useState<Set<TFreeActionKey>>(
    () => new Set(),
  );

  useEffect(() => {
    const availableKeys =
      availableActionSignature.length > 0
        ? (availableActionSignature.split('|') as TFreeActionKey[])
        : [];
    const currentKeys = new Set(availableKeys);
    const previous = previousRef.current;
    if (previous && previous.turnIndex === turnIndex) {
      setHighlightedKeys((current) => {
        const next = new Set<TFreeActionKey>();
        for (const key of current) {
          if (currentKeys.has(key)) {
            next.add(key);
          }
        }
        for (const key of currentKeys) {
          if (!previous.keys.has(key)) {
            next.add(key);
          }
        }
        return next;
      });
    } else {
      setHighlightedKeys(new Set());
    }
    previousRef.current = { turnIndex, keys: currentKeys };
  }, [availableActionSignature, turnIndex]);

  return highlightedKeys;
}

function getFreeActionKey(action: EFreeAction): TFreeActionKey {
  return `action:${action}`;
}

function getOrganizationActionKey(
  organizationId: EOrganizationId,
): TFreeActionKey {
  return `organization:${organizationId}`;
}
