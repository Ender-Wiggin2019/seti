import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RivalActionCardRender } from '@/features/solo';
import { formatRivalActionKind } from '@/features/solo/rivalActionCardPresentation';
import { cn } from '@/lib/cn';
import {
  EAlienType,
  EGameEventType,
  type TGameEvent,
  type TRivalActionCardId,
} from '@/types/re-exports';

interface IEventEntryProps {
  event: TGameEvent;
  playerNames?: Record<string, string>;
  index: number;
}

/**
 * Small glyph component per event type. These are drawn, not emoji:
 * keeps the log reading like an instrument trace instead of chat.
 * Each glyph is ~10x10 and rendered in a muted instrument color.
 */
function EventGlyph({ type }: { type: EGameEventType }): React.JSX.Element {
  const commonProps = {
    viewBox: '0 0 10 10',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (type) {
    case EGameEventType.ACTION:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <circle cx='5' cy='5' r='3' />
          <circle cx='5' cy='5' r='1' fill='currentColor' />
        </svg>
      );
    case EGameEventType.FREE_ACTION:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <circle cx='5' cy='5' r='1.5' />
          <path d='M5 1v1.5M5 7.5V9M1 5h1.5M7.5 5H9' />
        </svg>
      );
    case EGameEventType.INPUT:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M2 5.5l2 2 4-4.5' />
        </svg>
      );
    case EGameEventType.UNDO:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M6.8 3H3.5a2.5 2.5 0 102 4' />
          <path d='M4 1.8L2.8 3 4 4.2' />
        </svg>
      );
    case EGameEventType.RESOURCE_CHANGE:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M2 7l3-3 3 3' />
          <path d='M2 3h6' />
        </svg>
      );
    case EGameEventType.SCORE_CHANGE:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M5 1.5l1.1 2.3 2.5.4-1.8 1.7.4 2.5L5 7.2 2.8 8.4l.4-2.5L1.4 4.2l2.5-.4z' />
        </svg>
      );
    case EGameEventType.SECTOR_COMPLETED:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <circle cx='5' cy='5' r='3.5' />
          <path d='M5 1.5v7M1.5 5h7' />
        </svg>
      );
    case EGameEventType.TRACE_MARKED:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M5 1.5v7' />
          <path d='M2.5 4l2.5-2.5L7.5 4' />
          <path d='M2.5 6l2.5 2.5L7.5 6' />
        </svg>
      );
    case EGameEventType.ALIEN_DISCOVERED:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M2.5 4a2.5 2.5 0 015 0v1.5a2.5 2.5 0 01-5 0z' />
          <circle cx='4' cy='4.5' r='0.4' fill='currentColor' stroke='none' />
          <circle cx='6' cy='4.5' r='0.4' fill='currentColor' stroke='none' />
        </svg>
      );
    case EGameEventType.ROTATION:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M7.5 4.5a3 3 0 10-.5 2.8' />
          <path d='M8 2v2.5H5.5' />
        </svg>
      );
    case EGameEventType.ROUND_END:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <circle cx='5' cy='5' r='3.5' />
          <path d='M5 3v2l1.5 1' />
        </svg>
      );
    case EGameEventType.GAME_END:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M2 2v6' />
          <path d='M2 2l5 1.5-5 1.5' />
        </svg>
      );
    default:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <circle cx='5' cy='5' r='1' />
        </svg>
      );
  }
}

/**
 * Instrument color tint by event category — temperature, not hue.
 */
const EVENT_TINT: Record<EGameEventType, string> = {
  [EGameEventType.ACTION]: 'text-[oklch(0.82_0.10_240)]',
  [EGameEventType.FREE_ACTION]: 'text-text-300',
  [EGameEventType.INPUT]: 'text-[oklch(0.82_0.10_150)]',
  [EGameEventType.UNDO]: 'text-[oklch(0.82_0.12_75)]',
  [EGameEventType.RESOURCE_CHANGE]: 'text-text-300',
  [EGameEventType.SCORE_CHANGE]: 'text-[oklch(0.82_0.12_75)]',
  [EGameEventType.SECTOR_COMPLETED]: 'text-[oklch(0.82_0.10_240)]',
  [EGameEventType.TRACE_MARKED]: 'text-[oklch(0.72_0.13_300)]',
  [EGameEventType.ALIEN_DISCOVERED]: 'text-[oklch(0.72_0.13_300)]',
  [EGameEventType.ROTATION]: 'text-text-500',
  [EGameEventType.ROUND_END]: 'text-text-400',
  [EGameEventType.GAME_END]: 'text-[oklch(0.82_0.10_240)]',
};

function getPlayerName(
  playerId: string,
  playerNames: Record<string, string>,
): string {
  return playerNames[playerId] ?? playerId;
}

function getEventDescription(
  event: TGameEvent,
  playerNames: Record<string, string>,
  t: (key: string, options?: Record<string, unknown>) => string,
): React.ReactNode {
  switch (event.type) {
    case EGameEventType.ACTION: {
      const rivalAction = getRivalActionEventDetails(event);
      if (rivalAction) {
        return t('client.event_entry.rival_action', {
          player: getPlayerName(event.playerId, playerNames),
          card: rivalAction.cardId,
          action: rivalAction.actionKind
            ? formatRivalActionKind(rivalAction.actionKind, t)
            : t('client.rival_action_card.unknown_action', {
                defaultValue: 'action',
              }),
        });
      }
      const actionName =
        typeof event.action === 'string' ? event.action : event.action.type;
      const actionLabel = formatMainActionName(actionName, t);
      const cardDetails = getCardDetails(event);
      if (cardDetails) {
        return (
          <>
            {t('client.event_entry.action', {
              player: getPlayerName(event.playerId, playerNames),
              action: actionLabel,
            })}{' '}
            <CardReference
              cardId={cardDetails.cardId}
              cardName={cardDetails.cardName}
            />
          </>
        );
      }
      return t('client.event_entry.action', {
        player: getPlayerName(event.playerId, playerNames),
        action: actionLabel,
      });
    }
    case EGameEventType.FREE_ACTION:
      return t('client.event_entry.free_action', {
        player: getPlayerName(event.playerId, playerNames),
        action: formatFreeActionName(event.action.type, t),
      });
    case EGameEventType.INPUT:
      return t('client.event_entry.input', {
        player: getPlayerName(event.playerId, playerNames),
        response: prettifyToken(event.response.type),
      });
    case EGameEventType.UNDO:
      return t('client.event_entry.undo', {
        defaultValue: '{{player}} undid turn {{turn}}',
        player: getPlayerName(event.playerId, playerNames),
        turn: event.turnIndex,
      });
    case EGameEventType.RESOURCE_CHANGE:
      return t('client.event_entry.resource_change', {
        player: getPlayerName(event.playerId, playerNames),
        direction:
          event.delta >= 0
            ? t('client.event_entry.gained')
            : t('client.event_entry.lost'),
        amount: Math.abs(event.delta),
        resource: prettifyToken(event.resource),
      });
    case EGameEventType.SCORE_CHANGE:
      return t('client.event_entry.score_change', {
        player: getPlayerName(event.playerId, playerNames),
        delta: `${event.delta >= 0 ? '+' : ''}${event.delta}`,
        source: prettifyToken(event.source),
      });
    case EGameEventType.SECTOR_COMPLETED:
      return t('client.event_entry.sector_completed', {
        sector: event.sectorId,
        winner: getPlayerName(event.winnerId, playerNames),
      });
    case EGameEventType.TRACE_MARKED:
      return t('client.event_entry.trace_marked', {
        defaultValue: '{{player}} marked {{trace}} trace',
        player: getPlayerName(event.playerId, playerNames),
        trace: prettifyToken(event.traceColor),
      });
    case EGameEventType.ALIEN_DISCOVERED:
      return t('client.event_entry.alien_discovered', {
        alien: formatAlienTypeName(event.alienType),
      });
    case EGameEventType.ROTATION:
      return t('client.event_entry.rotation', { disc: event.discIndex + 1 });
    case EGameEventType.ROUND_END:
      return t('client.event_entry.round_end', { round: event.round });
    case EGameEventType.GAME_END:
      return t('client.event_entry.game_end');
    default:
      return t('client.event_entry.unknown');
  }
}

function formatMainActionName(
  action: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const internalLabels: Record<string, string> = {
    ACTION_COST: t('client.event_entry.action_cost', {
      defaultValue: 'Action Cost',
    }),
    ACTION_REWARD: t('client.event_entry.action_reward', {
      defaultValue: 'Action Reward',
    }),
    CARD_CUSTOM_EFFECT_UNHANDLED: t('client.event_entry.card_unhandled', {
      defaultValue: 'Unhandled Card Effect',
    }),
    CARD_MARK_TRACE: t('client.event_entry.card_mark_trace', {
      defaultValue: 'Card Trace',
    }),
    SECTOR_MARKED: t('client.event_entry.sector_marked_action', {
      defaultValue: 'Marked Sector',
    }),
    MILESTONE_CHECK: t('client.event_entry.milestone_check', {
      defaultValue: 'Milestone Check',
    }),
    MILESTONE_GOLD_RESOLVED: t('client.event_entry.gold_resolved', {
      defaultValue: 'Gold Milestone',
    }),
    MILESTONE_NEUTRAL_RESOLVED: t('client.event_entry.neutral_resolved', {
      defaultValue: 'Neutral Milestone',
    }),
    RIVAL_ACTION: t('client.event_entry.rival_action_name', {
      defaultValue: 'Rival Action',
    }),
    END_TURN: t('client.event_entry.end_turn', {
      defaultValue: 'End Turn',
    }),
  };

  if (internalLabels[action]) {
    return internalLabels[action];
  }

  return t(`client.action_menu.actions.${action}`, {
    defaultValue: prettifyToken(action),
  });
}

function formatFreeActionName(
  action: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  return t(`client.free_action_bar.actions.${action}`, {
    defaultValue: prettifyToken(action),
  });
}

function prettifyToken(token: string): string {
  const parts = token.split(':');
  const normalized = token.includes(':') ? (parts.at(-1) ?? token) : token;
  return normalized
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatAlienTypeName(alienType: EAlienType): string {
  return prettifyToken(EAlienType[alienType] ?? String(alienType));
}

function getCardDetails(
  event: TGameEvent,
): { cardId: string; cardName: string } | null {
  if (!('details' in event) || !event.details) {
    return null;
  }

  const cardId = event.details.cardId;
  if (typeof cardId !== 'string' || cardId.length === 0) {
    return null;
  }

  const cardName =
    typeof event.details.cardName === 'string' &&
    event.details.cardName.length > 0
      ? event.details.cardName
      : cardId;

  return { cardId, cardName };
}

function CardReference({
  cardId,
  cardName,
}: {
  cardId: string;
  cardName: string;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type='button'
        className='rounded-[3px] px-1 font-semibold text-accent-300 underline-offset-2 hover:text-accent-200 hover:underline'
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {cardName}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>{cardName}</DialogTitle>
          </DialogHeader>
          <p className='micro-label'>{cardId}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getRivalActionEventDetails(
  event: TGameEvent,
): { cardId: TRivalActionCardId; actionKind?: string } | null {
  if (event.type !== EGameEventType.ACTION || event.action !== 'RIVAL_ACTION') {
    return null;
  }
  const details = event.details ?? {};
  const cardId = details.cardId;
  if (typeof cardId !== 'string' || !/^S\.\d+$/.test(cardId)) {
    return null;
  }
  const actionKind =
    typeof details.actionKind === 'string' ? details.actionKind : undefined;
  return { cardId: cardId as TRivalActionCardId, actionKind };
}

export function EventEntry({
  event,
  playerNames = {},
  index,
}: IEventEntryProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const rivalAction = getRivalActionEventDetails(event);

  return (
    <article
      className={cn(
        'group relative grid grid-cols-[16px_1fr_auto] items-start gap-2',
        'rounded-[2px] px-1.5 py-1',
        'hover:bg-[oklch(0.16_0.025_260/0.6)] transition-colors',
      )}
      data-testid={`event-entry-${index}`}
      tabIndex={rivalAction ? 0 : undefined}
    >
      <span
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center',
          EVENT_TINT[event.type] ?? 'text-text-500',
        )}
      >
        <EventGlyph type={event.type} />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='text-xs leading-snug text-text-200'>
          {getEventDescription(event, playerNames, t)}
        </p>
        <p className='micro-label mt-0.5 opacity-60'>
          {event.level === 'debug'
            ? t('client.event_entry.debug', { defaultValue: 'Debug' })
            : t('client.event_entry.info', { defaultValue: 'Info' })}
        </p>
      </div>
      <span className='mt-0.5 font-mono text-[10px] tabular-nums text-text-500'>
        {String(index + 1).padStart(3, '0')}
      </span>
      {rivalAction ? (
        <div
          className='pointer-events-none absolute right-1 top-full z-30 mt-1 hidden w-40 group-hover:block group-focus-within:block'
          data-testid={`rival-card-hover-${rivalAction.cardId}`}
        >
          <RivalActionCardRender cardId={rivalAction.cardId} compact />
        </div>
      ) : null}
    </article>
  );
}
