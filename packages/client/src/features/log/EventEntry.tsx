import { CardRender } from '@seti/cards';
import { ALL_CARDS } from '@seti/common/data/index';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import React, { useState } from 'react';
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

const CARD_BY_ID = new Map<string, IBaseCard>(
  ALL_CARDS.map((card) => [card.id, card]),
);

interface IEventEntryProps {
  event: TGameEvent;
  playerNames?: Record<string, string>;
  /**
   * Optional mapping of `playerId → player color` (already resolved
   * to the final hex via `mapPlayerColors`). When provided, log lines
   * tint each occurrence of a player's display name with their color
   * so the event log reads at a glance — same dictionary the score
   * ladder uses.
   */
  playerColors?: Record<string, string>;
  index: number;
}

/**
 * Post-process the i18n-rendered description text by wrapping every
 * known player-name occurrence in a <span> tinted with that player's
 * color. The i18n templates emit raw player names (`{{player}}`,
 * `{{winner}}`), so a longest-match-first scan over the names map
 * gives us colored chips without changing every translation key.
 *
 * Names are matched by literal substring; we order longest-first so
 * "Bot Vega" wins over an accidentally substring-overlapping "Bot".
 */
function colorizePlayerNames(
  description: string,
  playerNames: Record<string, string>,
  playerColors: Record<string, string> | undefined,
): React.ReactNode {
  if (!playerColors || Object.keys(playerColors).length === 0) {
    return description;
  }
  const entries = Object.entries(playerNames)
    .map(([id, name]) => ({ id, name, color: playerColors[id] }))
    .filter((entry) => entry.color && entry.name)
    .sort((a, b) => b.name.length - a.name.length);
  if (entries.length === 0) return description;

  const segments: React.ReactNode[] = [];
  let cursor = 0;
  let chunkIndex = 0;
  while (cursor < description.length) {
    let nextMatch: { index: number; entry: (typeof entries)[number] } | null =
      null;
    for (const entry of entries) {
      const idx = description.indexOf(entry.name, cursor);
      if (idx >= 0 && (nextMatch === null || idx < nextMatch.index)) {
        nextMatch = { index: idx, entry };
      }
    }
    if (!nextMatch) {
      segments.push(description.slice(cursor));
      break;
    }
    if (nextMatch.index > cursor) {
      segments.push(description.slice(cursor, nextMatch.index));
    }
    segments.push(
      <span
        key={`pname-${chunkIndex++}`}
        style={{ color: nextMatch.entry.color }}
        className='font-medium'
      >
        {nextMatch.entry.name}
      </span>,
    );
    cursor = nextMatch.index + nextMatch.entry.name.length;
  }
  return segments;
}

/**
 * Walk a React node tree and apply `colorizePlayerNames` to every
 * string child while preserving non-string elements (CardReference,
 * other tinted spans we add elsewhere). Used so descriptions that
 * already include `<CardReference>` can still get player-name color
 * without losing the card preview link.
 */
function colorizeReactNode(
  node: React.ReactNode,
  playerNames: Record<string, string>,
  playerColors: Record<string, string> | undefined,
  keyPrefix = 'cz',
): React.ReactNode {
  if (typeof node === 'string') {
    return colorizePlayerNames(node, playerNames, playerColors);
  }
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <React.Fragment key={`${keyPrefix}-${index}`}>
        {colorizeReactNode(
          child,
          playerNames,
          playerColors,
          `${keyPrefix}-${index}`,
        )}
      </React.Fragment>
    ));
  }
  if (node && typeof node === 'object' && 'props' in node) {
    // React element — leave it alone; player names appearing inside
    // a custom element are unlikely (we only emit them as plain
    // text via i18n).
    return node;
  }
  return node;
}

type TTranslate = (key: string, options?: Record<string, unknown>) => string;
type TActionEvent = Extract<TGameEvent, { type: EGameEventType.ACTION }>;

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
    case EGameEventType.RESOURCE_CHANGED:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M2 7l3-3 3 3' />
          <path d='M2 3h6' />
        </svg>
      );
    case EGameEventType.SCORE_CHANGED:
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
    case EGameEventType.PROBE_MOVED:
      return (
        <svg {...commonProps} className='h-2.5 w-2.5'>
          <path d='M2 7.5L5 2l3 5.5' />
          <path d='M3.2 5.5h3.6' />
        </svg>
      );
    case EGameEventType.DISC_ROTATED:
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
  [EGameEventType.RESOURCE_CHANGED]: 'text-text-300',
  [EGameEventType.SCORE_CHANGED]: 'text-[oklch(0.82_0.12_75)]',
  [EGameEventType.SECTOR_COMPLETED]: 'text-[oklch(0.82_0.10_240)]',
  [EGameEventType.TRACE_MARKED]: 'text-[oklch(0.72_0.13_300)]',
  [EGameEventType.ALIEN_DISCOVERED]: 'text-[oklch(0.72_0.13_300)]',
  [EGameEventType.PROBE_MOVED]: 'text-[oklch(0.82_0.10_240)]',
  [EGameEventType.DISC_ROTATED]: 'text-text-500',
  [EGameEventType.ROUND_END]: 'text-text-400',
  [EGameEventType.GAME_END]: 'text-[oklch(0.82_0.10_240)]',
};

/**
 * Classify an event into one of three reading buckets so the log
 * can give each row a clear left-rail kind indicator:
 *   - 'main'   — top-level main action (LAUNCH/ORBIT/LAND/SCAN/
 *                ANALYZE/PLAY_CARD/RESEARCH/PASS, plus structured
 *                rival actions). Visually anchored as the trunk of
 *                the action narrative.
 *   - 'free'   — free-action lines (BUY_CARD, MOVEMENT,
 *                EXCHANGE_RESOURCES, etc.). Slotted between mains.
 *   - 'effect' — side effects of an action: resource/score deltas,
 *                trace marks, milestone resolutions, sector wins,
 *                alien discoveries, internal ACTION_COST /
 *                ACTION_REWARD bookkeeping. Rendered indented under
 *                the parent action.
 *   - 'meta'   — round/game/rotation/undo events: structural
 *                punctuation that's neither action nor effect.
 */
type TEntryKind = 'main' | 'free' | 'effect' | 'meta';

const INTERNAL_ACTION_NAMES = new Set([
  'ACTION_COST',
  'ACTION_REWARD',
  'CARD_CUSTOM_EFFECT_UNHANDLED',
  'CARD_MARK_TRACE',
  'SECTOR_MARKED',
  'SECTOR_COMPLETION_RESOLVED',
  'MILESTONE_CHECK',
  'MILESTONE_GOLD_RESOLVED',
  'MILESTONE_NEUTRAL_RESOLVED',
  'ARKHOS_EXPLORATION_REWARD_REVEALED',
  'ARKHOS_SECURITY_CARD_USED',
  'ARKHOS_SECURITY_BREACHED',
  'ANOMALY_TRIGGERED',
  'CENTAURIANS_REWARD_CLAIMED',
  'DRAW_ALIEN_CARD',
]);

const META_ACTION_NAMES = new Set(['END_TURN']);

function classifyEvent(event: TGameEvent): TEntryKind {
  switch (event.type) {
    case EGameEventType.ACTION: {
      const actionName =
        typeof event.action === 'string' ? event.action : event.action?.type;
      if (actionName === 'RIVAL_ACTION') return 'main';
      if (actionName && META_ACTION_NAMES.has(actionName)) {
        return 'meta';
      }
      if (actionName && INTERNAL_ACTION_NAMES.has(actionName)) {
        return 'effect';
      }
      return 'main';
    }
    case EGameEventType.FREE_ACTION:
      return 'free';
    case EGameEventType.INPUT:
    case EGameEventType.RESOURCE_CHANGED:
    case EGameEventType.SCORE_CHANGED:
    case EGameEventType.PROBE_MOVED:
    case EGameEventType.TRACE_MARKED:
    case EGameEventType.SECTOR_COMPLETED:
      return 'effect';
    case EGameEventType.ALIEN_DISCOVERED:
    case EGameEventType.DISC_ROTATED:
    case EGameEventType.ROUND_END:
    case EGameEventType.GAME_END:
    case EGameEventType.UNDO:
      return 'meta';
    default:
      return 'effect';
  }
}

const ENTRY_KIND_STYLES: Record<
  TEntryKind,
  {
    rail: string;
    indent: string;
    badge: string;
    badgeKey: string;
    badgeFallback: string;
  }
> = {
  main: {
    rail: 'border-accent-500/80 bg-accent-500/[0.06]',
    indent: 'pl-2',
    badge: 'border-accent-500/60 bg-accent-500/15 text-accent-200',
    badgeKey: 'client.event_entry.kind.main',
    badgeFallback: 'MAIN',
  },
  free: {
    rail: 'border-[oklch(0.74_0.13_155/0.7)] bg-[oklch(0.74_0.13_155/0.06)]',
    indent: 'pl-2',
    badge:
      'border-[oklch(0.74_0.13_155/0.6)] bg-[oklch(0.74_0.13_155/0.15)] text-[oklch(0.86_0.13_155)]',
    badgeKey: 'client.event_entry.kind.free',
    badgeFallback: 'FREE',
  },
  effect: {
    rail: 'border-[color:var(--metal-edge-soft)] bg-transparent',
    // Effects render indented under the preceding main/free action so
    // the eye reads them as belonging to the trunk above.
    indent: 'pl-6',
    badge:
      'border-[color:var(--metal-edge-soft)] bg-background-950/40 text-text-500',
    badgeKey: 'client.event_entry.kind.effect',
    badgeFallback: '↳',
  },
  meta: {
    rail: 'border-[color:var(--metal-edge-soft)] bg-background-950/40',
    indent: 'pl-2',
    badge:
      'border-[color:var(--metal-edge-soft)] bg-background-950/60 text-text-400',
    badgeKey: 'client.event_entry.kind.meta',
    badgeFallback: '⋯',
  },
};

function getPlayerName(
  playerId: string,
  playerNames: Record<string, string>,
): string {
  return playerNames[playerId] ?? playerId;
}

function getActorName(
  actorId: string | null,
  playerNames: Record<string, string>,
): string {
  return actorId ? getPlayerName(actorId, playerNames) : 'System';
}

function getEventDescription(
  event: TGameEvent,
  playerNames: Record<string, string>,
  t: TTranslate,
): React.ReactNode {
  switch (event.type) {
    case EGameEventType.ACTION: {
      const rivalAction = getRivalActionEventDetails(event);
      if (rivalAction) {
        return t('client.event_entry.rival_action', {
          player: getActorName(event.actorId, playerNames),
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
      const player = getActorName(event.actorId, playerNames);
      // Each well-known internal action gets its own narrative
      // template so the line reads like a real sentence ("Alice
      // marked a trace via card effect") instead of the generic
      // "Alice used X" mold that made internal events look like
      // main actions.
      switch (actionName) {
        case 'ARKHOS_EXPLORATION_REWARD_REVEALED':
          return getArkhosExplorationRewardEventDescription(
            event,
            playerNames,
            t,
          );
        case 'ARKHOS_SECURITY_CARD_USED':
          return getArkhosSecurityCardUsedEventDescription(
            event,
            playerNames,
            t,
          );
        case 'ARKHOS_SECURITY_BREACHED':
          return getArkhosSecurityBreachedEventDescription(
            event,
            playerNames,
            t,
          );
        case 'PLAY_CARD': {
          const cardDetails = getCardDetails(event);
          if (cardDetails) {
            return (
              <>
                {t('client.event_entry.played_card_prefix', {
                  player,
                  defaultValue: '{{player}} played ',
                })}
                <CardReference
                  cardId={cardDetails.cardId}
                  cardName={cardDetails.cardName}
                />
              </>
            );
          }
          return t('client.event_entry.played_unknown_card', {
            player,
            defaultValue: '{{player}} played a card',
          });
        }
        case 'CARD_MARK_TRACE':
          return t('client.event_entry.card_mark_trace_line', {
            player,
            defaultValue: '{{player}} marked a trace via card effect',
          });
        case 'SECTOR_MARKED':
          return t('client.event_entry.sector_marked_line', {
            player,
            defaultValue: '{{player}} placed a sector marker',
          });
        case 'SECTOR_COMPLETION_RESOLVED':
          return t('client.event_entry.sector_completion_resolved_line', {
            player,
            defaultValue: '{{player}} resolved sector completion',
          });
        case 'ANOMALY_TRIGGERED':
          return t('client.event_entry.anomaly_triggered_line', {
            player,
            defaultValue: '{{player}} triggered an Anomaly token',
          });
        case 'CENTAURIANS_REWARD_CLAIMED':
          return t('client.event_entry.centaurians_reward_claimed_line', {
            player,
            defaultValue: '{{player}} claimed a Centaurians message reward',
          });
        case 'DRAW_ALIEN_CARD':
          return t('client.event_entry.draw_alien_card_line', {
            player,
            defaultValue: '{{player}} drew an alien card',
          });
        case 'MILESTONE_GOLD_RESOLVED': {
          const threshold =
            typeof event.details?.threshold === 'number'
              ? event.details.threshold
              : '?';
          return t('client.event_entry.milestone_gold_resolved_line', {
            player,
            threshold,
            defaultValue:
              '{{player}} reached the {{threshold}} VP gold milestone',
          });
        }
        case 'MILESTONE_NEUTRAL_RESOLVED': {
          const threshold =
            typeof event.details?.threshold === 'number'
              ? event.details.threshold
              : '?';
          return t('client.event_entry.milestone_neutral_resolved_line', {
            player,
            threshold,
            defaultValue:
              '{{player}} crossed the {{threshold}} VP neutral milestone',
          });
        }
        case 'MILESTONE_CHECK':
        case 'ACTION_COST':
        case 'ACTION_REWARD':
        case 'CARD_CUSTOM_EFFECT_UNHANDLED':
          // These are debug-level bookkeeping events that the log
          // toggle hides by default. When shown, give them a quiet
          // technical label rather than the "X used Y" frame.
          return t(`client.event_entry.internal_${actionName.toLowerCase()}`, {
            player,
            defaultValue: `${player} — ${prettifyToken(actionName)}`,
          });
        case 'END_TURN':
          return t('client.event_entry.end_turn_line', {
            player,
            defaultValue: '{{player}} ended their turn',
          });
        case 'LAUNCH_PROBE':
          return t('client.event_entry.main.LAUNCH_PROBE', {
            player,
            defaultValue: '{{player}} launched a probe',
          });
        case 'ORBIT': {
          const planetName = formatPlanetName(event, t);
          if (!planetName) {
            return t('client.event_entry.main.ORBIT_NO_PLANET', {
              player,
              defaultValue: '{{player}} orbited',
            });
          }
          return t('client.event_entry.main.ORBIT', {
            player,
            planet: planetName,
            defaultValue: '{{player}} orbited {{planet}}',
          });
        }
        case 'LAND': {
          const planetName = formatPlanetName(event, t);
          const moonName = formatMoonName(event);
          if (!planetName) {
            return t('client.event_entry.main.LAND_NO_PLANET', {
              player,
              defaultValue: '{{player}} landed',
            });
          }
          if (moonName) {
            return t('client.event_entry.main.LAND_WITH_MOON', {
              player,
              planet: planetName,
              moon: moonName,
              defaultValue: '{{player}} landed on {{moon}} ({{planet}} moon)',
            });
          }
          return t('client.event_entry.main.LAND', {
            player,
            planet: planetName,
            defaultValue: '{{player}} landed on {{planet}}',
          });
        }
        case 'SCAN':
          return t('client.event_entry.main.SCAN', {
            player,
            defaultValue: '{{player}} scanned',
          });
        case 'ANALYZE_DATA':
          return t('client.event_entry.main.ANALYZE_DATA', {
            player,
            defaultValue: '{{player}} analyzed data',
          });
        case 'RESEARCH_TECH':
          return t('client.event_entry.main.RESEARCH_TECH', {
            player,
            defaultValue: '{{player}} researched a tech',
          });
        case 'PASS':
          return t('client.event_entry.main.PASS', {
            player,
            defaultValue: '{{player}} passed',
          });
        default:
          break;
      }
      // USE_ORGANIZATION_ACTION and any unknown actions still use the
      // generic "X used Y" mold — organization powers are too varied
      // to template per-id and the generic mold reads naturally for
      // them ("Alice used Cosmos Strategy Group").
      const actionLabel = formatMainActionName(actionName, t);
      const cardDetails = getCardDetails(event);
      if (cardDetails) {
        return (
          <>
            {t('client.event_entry.action', {
              player,
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
        player,
        action: actionLabel,
      });
    }
    case EGameEventType.FREE_ACTION: {
      const player = getActorName(event.actorId, playerNames);
      const actionName = event.action.type;
      // Each free action has a per-name full-sentence template under
      // `client.event_entry.free.<NAME>`. Falling back to the
      // generic "X used free Y" mold only when a name isn't keyed.
      const specificKey = `client.event_entry.free.${actionName}`;
      const specific = t(specificKey, {
        player,
        defaultValue: '',
      });
      if (specific && specific !== specificKey && specific.length > 0) {
        return specific;
      }
      return t('client.event_entry.free_action', {
        player,
        action: formatFreeActionName(actionName, t),
      });
    }
    case EGameEventType.INPUT:
      return t('client.event_entry.input', {
        player: getActorName(event.actorId, playerNames),
        response: prettifyToken(event.response.type),
      });
    case EGameEventType.UNDO:
      return t('client.event_entry.undo', {
        defaultValue: '{{player}} undid turn {{turn}}',
        player: getActorName(event.actorId, playerNames),
        turn: event.turnIndex,
      });
    case EGameEventType.RESOURCE_CHANGED: {
      const delta = event.after - event.before;
      const baseLine = t('client.event_entry.resource_change', {
        player: getActorName(event.actorId, playerNames),
        direction:
          delta >= 0
            ? t('client.event_entry.gained')
            : t('client.event_entry.lost'),
        amount: Math.abs(delta),
        resource: prettifyToken(event.resource),
      });
      return `${baseLine} (${event.before} -> ${event.after})`;
    }
    case EGameEventType.SCORE_CHANGED: {
      const delta = event.after - event.before;
      return t('client.event_entry.score_change', {
        player: getActorName(event.actorId, playerNames),
        delta: `${delta >= 0 ? '+' : ''}${delta}`,
        source: prettifyToken(event.source),
      });
    }
    case EGameEventType.SECTOR_COMPLETED:
      return t('client.event_entry.sector_completed', {
        sector: event.sectorId,
        winner: getPlayerName(event.winnerId, playerNames),
      });
    case EGameEventType.TRACE_MARKED:
      return t('client.event_entry.trace_marked', {
        defaultValue: '{{player}} marked {{trace}} trace',
        player: getActorName(event.actorId, playerNames),
        trace: prettifyToken(event.traceColor),
      });
    case EGameEventType.ALIEN_DISCOVERED:
      return t('client.event_entry.alien_discovered', {
        alien: formatAlienTypeName(event.alienType),
      });
    case EGameEventType.PROBE_MOVED:
      return t('client.event_entry.probe_moved', {
        defaultValue: '{{player}} moved a probe',
        player: getActorName(event.actorId, playerNames),
      });
    case EGameEventType.DISC_ROTATED:
      return t('client.event_entry.rotation', { disc: event.ring });
    case EGameEventType.ROUND_END:
      return t('client.event_entry.round_end', { round: event.round });
    case EGameEventType.GAME_END:
      return t('client.event_entry.game_end');
    default:
      return t('client.event_entry.unknown');
  }
}

/**
 * Splits a translated string at its `{{card}}` placeholder so we can
 * substitute a `<CardReference>` element while keeping all other
 * placeholders inline as text. Falls back to the raw string when the
 * translation doesn't include `{{card}}` (locale missing the slot).
 */
function renderWithCardSlot(
  rendered: string,
  cardId: string,
  cardName: string,
): React.ReactNode {
  // Match what i18next emitted when `card` was passed but the
  // template didn't have a placeholder — fall through.
  const idx = rendered.indexOf(cardId);
  if (idx < 0) return rendered;
  // We don't know what label the locale used for the card; assume
  // the cardId itself was the substitution. The CardReference will
  // re-render using the localized seti name.
  return (
    <>
      {rendered.slice(0, idx)}
      <CardReference cardId={cardId} cardName={cardName} />
      {rendered.slice(idx + cardId.length)}
    </>
  );
}

function getArkhosExplorationRewardEventDescription(
  event: TActionEvent,
  playerNames: Record<string, string>,
  t: TTranslate,
): React.ReactNode {
  const details = event.details ?? {};
  const cardId = typeof details.cardId === 'string' ? details.cardId : '?';
  const player = getActorName(event.actorId, playerNames);
  const size = typeof details.size === 'string' ? details.size : 'minor';
  const rendered = t('client.event_entry.arkhos_exploration_reward', {
    player,
    card: cardId,
    size: formatArkhosRewardSize(size, t),
  });
  return cardId !== '?'
    ? renderWithCardSlot(rendered, cardId, cardId)
    : rendered;
}

function getArkhosSecurityCardUsedEventDescription(
  event: TActionEvent,
  playerNames: Record<string, string>,
  t: TTranslate,
): React.ReactNode {
  const details = event.details ?? {};
  const cardId = typeof details.cardId === 'string' ? details.cardId : '?';
  const player = getActorName(event.actorId, playerNames);
  const size =
    typeof details.rewardSize === 'string' ? details.rewardSize : 'minor';
  const rendered = t('client.event_entry.arkhos_security_card_used', {
    player,
    card: cardId,
    size: formatArkhosRewardSize(size, t),
  });
  return cardId !== '?'
    ? renderWithCardSlot(rendered, cardId, cardId)
    : rendered;
}

function getArkhosSecurityBreachedEventDescription(
  event: TActionEvent,
  playerNames: Record<string, string>,
  t: TTranslate,
): React.ReactNode {
  const details = event.details ?? {};
  const cardId = typeof details.cardId === 'string' ? details.cardId : '?';
  const player = getActorName(event.actorId, playerNames);
  const trace =
    typeof details.traceColor === 'string'
      ? t(`client.alien_board.arkhos.trace.${details.traceColor}`, {
          defaultValue: prettifyToken(details.traceColor),
        })
      : '?';
  const access =
    typeof details.accessLevel === 'number' ? details.accessLevel : '?';
  const rendered = t('client.event_entry.arkhos_security_breached', {
    player,
    card: cardId,
    trace,
    access,
  });
  return cardId !== '?'
    ? renderWithCardSlot(rendered, cardId, cardId)
    : rendered;
}

function formatArkhosRewardSize(size: string, t: TTranslate): string {
  return t(`client.alien_board.arkhos.reward_size.${size}`, {
    defaultValue: prettifyToken(size),
  });
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

/**
 * Free-action labels rendered in the log. The bar's button labels
 * sometimes include a cost hint ("Buy Card (3 PR)") for
 * affordability — fine for a button, noisy for a log line — so each
 * action gets a dedicated `client.event_entry.free.<NAME>` key with
 * a clean log-friendly label, falling through to the bar's label
 * if a key is missing.
 */
function formatFreeActionName(
  action: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  return t(`client.event_entry.free.${action}`, {
    defaultValue: t(`client.free_action_bar.actions.${action}`, {
      defaultValue: prettifyToken(action),
    }),
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

/**
 * Pull the planet name out of an ACTION event's `details.planetLabel`
 * (server emits the canonical English label like "Mars") and run it
 * through the seti-namespace i18n so the locale-specific spelling
 * shows up ("火星(Mars)" / "Marte"). Returns `undefined` when the
 * event predates the planet-detail addition.
 */
function formatPlanetName(
  event: TActionEvent,
  t: TTranslate,
): string | undefined {
  const label =
    typeof event.details?.planetLabel === 'string'
      ? event.details.planetLabel
      : undefined;
  if (!label) return undefined;
  return t(label, { ns: 'seti', defaultValue: label });
}

function formatMoonName(event: TActionEvent): string | undefined {
  const moon =
    typeof event.details?.moon === 'string' ? event.details.moon : undefined;
  return moon && moon.length > 0 ? moon : undefined;
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

/**
 * Inline card reference rendered inside a log line. Shows
 * `<localized name> (#NN)` so players can scan ids and names at a
 * glance, with a hover popover that paints the actual card art and
 * a click-to-open dialog that enlarges it (CardDetail-equivalent
 * 1.8×–2× scale of the intrinsic 150×209 footprint).
 *
 * Falls back gracefully when the cardId isn't in the static registry
 * — keeps the bare id as the link label without a popover (since we
 * don't have art to show).
 */
function CardReference({
  cardId,
  cardName,
}: {
  cardId: string;
  cardName: string;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const card = CARD_BY_ID.get(cardId) ?? null;
  const localizedName = card?.name
    ? t(card.name, { ns: 'seti', defaultValue: card.name })
    : cardName;
  const labelText = `${localizedName} (#${cardId})`;

  return (
    <span
      className='relative inline-block'
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type='button'
        className='rounded-[3px] px-1 font-semibold text-accent-300 underline-offset-2 hover:text-accent-200 hover:underline'
        data-testid={`event-card-ref-${cardId}`}
        onClick={(event) => {
          event.stopPropagation();
          if (card) setOpen(true);
        }}
      >
        {labelText}
      </button>

      {/*
        Hover popover — small thumbnail (intrinsic CardRender size,
        150×209) anchored above the link. Skipped when the card isn't
        in the registry (rival action cards, transient ids).
      */}
      {hover && card ? (
        <span
          className='pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 rounded border border-surface-700/60 bg-surface-950/95 p-1 shadow-lg'
          role='presentation'
        >
          <span className='block'>
            <CardRender card={card} />
          </span>
        </span>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='w-fit max-w-fit'>
          <DialogHeader>
            <DialogTitle>{labelText}</DialogTitle>
          </DialogHeader>
          {card ? (
            <div className='max-h-[78vh] overflow-auto rounded border border-surface-700/50 bg-surface-950/70 p-3'>
              <div className='relative h-[376px] w-[270px] sm:h-[418px] sm:w-[300px]'>
                <div className='absolute left-0 top-0 origin-top-left scale-[1.8] sm:scale-[2]'>
                  <CardRender card={card} />
                </div>
              </div>
            </div>
          ) : (
            <p className='micro-label'>{cardId}</p>
          )}
        </DialogContent>
      </Dialog>
    </span>
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
  playerColors,
  index,
}: IEventEntryProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const rivalAction = getRivalActionEventDetails(event);
  const description = getEventDescription(event, playerNames, t);
  // Walk the rendered description and tint every string child's
  // player-name occurrences. React elements (e.g. <CardReference>
  // for in-log card previews) are kept as-is so the popover/click
  // behavior survives the colorization pass.
  const renderedDescription = colorizeReactNode(
    description,
    playerNames,
    playerColors,
  );

  const kind = classifyEvent(event);
  const kindStyle = ENTRY_KIND_STYLES[kind];

  return (
    <article
      className={cn(
        'group relative grid grid-cols-[16px_1fr_auto] items-start gap-2',
        'rounded-[2px] py-1 pr-1.5',
        // Left rail color codes the kind (main / free / effect / meta).
        // Effect rows are indented further so they read as branches
        // off the trunk action above them.
        'border-l-2',
        kindStyle.rail,
        kindStyle.indent,
        'hover:bg-[oklch(0.16_0.025_260/0.6)] transition-colors',
      )}
      data-testid={`event-entry-${index}`}
      data-kind={kind}
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
          {renderedDescription}
        </p>
        <div className='mt-0.5 flex items-center gap-1.5'>
          <span
            className={cn(
              'inline-flex h-3.5 items-center rounded-[3px] border px-1 font-mono text-[8px] uppercase tracking-[0.16em]',
              kindStyle.badge,
            )}
            data-testid={`event-kind-badge-${index}`}
          >
            {t(kindStyle.badgeKey, { defaultValue: kindStyle.badgeFallback })}
          </span>
          <span className='micro-label opacity-60'>
            {event.level === 'debug'
              ? t('client.event_entry.debug', { defaultValue: 'Debug' })
              : t('client.event_entry.info', { defaultValue: 'Info' })}
          </span>
        </div>
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
