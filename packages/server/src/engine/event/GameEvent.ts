import type { EResource } from '@seti/common/types/element';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import {
  EGameEventType,
  type TGameEvent,
  type TGameEventLevel,
} from '@seti/common/types/protocol/events';

export type { TGameEvent } from '@seti/common/types/protocol/events';

export type TGameEventDraft = TGameEvent extends infer TEvent
  ? TEvent extends TGameEvent
    ? Omit<TEvent, 'id' | 'seq' | 'turnIndex' | 'round'>
    : never
  : never;

export interface IEventLogContext {
  turnIndex: number;
  round: number;
}

export function createEventId(sequence: number): string {
  return `event-${sequence.toString(36)}`;
}

function eventMeta<TActorId extends string | null>(
  actorId: TActorId,
  level: TGameEventLevel,
): {
  actorId: TActorId;
  level: TGameEventLevel;
} {
  return { actorId, level };
}

export function createActionEvent(
  playerId: string,
  action: IMainActionRequest | string,
  details?: Record<string, unknown>,
  level: TGameEventLevel = 'info',
): TGameEventDraft {
  return {
    ...eventMeta(playerId, level),
    type: EGameEventType.ACTION,
    action,
    details,
  };
}

export function createFreeActionEvent(
  playerId: string,
  action: IFreeActionRequest,
  details?: Record<string, unknown>,
  level: TGameEventLevel = 'info',
): TGameEventDraft {
  return {
    ...eventMeta(playerId, level),
    type: EGameEventType.FREE_ACTION,
    action,
    details,
  };
}

export function createInputEvent(
  playerId: string,
  response: IInputResponse,
  details?: Record<string, unknown>,
): TGameEventDraft {
  return {
    ...eventMeta(playerId, 'debug'),
    type: EGameEventType.INPUT,
    response,
    details,
  };
}

export function createUndoEvent(
  playerId: string,
  affectedPlayerIds: string[] = [],
): TGameEventDraft {
  return {
    ...eventMeta(playerId, 'info'),
    type: EGameEventType.UNDO,
    affectedPlayerIds,
  };
}

export function createTraceMarkedEvent(
  playerId: string,
  traceColor: ETrace,
  alienIndex: number,
  isOverflow: boolean,
): TGameEventDraft {
  return {
    ...eventMeta(playerId, 'debug'),
    type: EGameEventType.TRACE_MARKED,
    traceColor,
    alienIndex,
    isOverflow,
  };
}

export function createResourceChangeEvent(
  playerId: string,
  resource: EResource,
  before: number,
  after: number,
): TGameEventDraft {
  return {
    ...eventMeta(playerId, 'debug'),
    type: EGameEventType.RESOURCE_CHANGED,
    resource,
    before,
    after,
  };
}

export function createScoreChangeEvent(
  playerId: string,
  before: number,
  after: number,
  source = 'score',
): TGameEventDraft {
  return {
    ...eventMeta(playerId, 'debug'),
    type: EGameEventType.SCORE_CHANGED,
    before,
    after,
    source,
  };
}

export function createProbeMovedEvent(
  playerId: string,
  probeId: string,
  path: string[],
  publicityGained?: number,
): TGameEventDraft {
  return {
    ...eventMeta(playerId, 'info'),
    type: EGameEventType.PROBE_MOVED,
    probeId,
    path,
    ...(publicityGained !== undefined ? { publicityGained } : {}),
  };
}

export function createDiscRotatedEvent(
  ring: 1 | 2 | 3,
  steps: number,
): TGameEventDraft {
  return {
    ...eventMeta(null, 'info'),
    type: EGameEventType.DISC_ROTATED,
    ring,
    steps,
  };
}

export function createAlienDiscoveredEvent(
  alienType: EAlienType,
  alienIndex: number,
): TGameEventDraft {
  return {
    ...eventMeta(null, 'info'),
    type: EGameEventType.ALIEN_DISCOVERED,
    alienType,
    alienIndex,
  };
}

export function createRoundEndEvent(): TGameEventDraft {
  return {
    ...eventMeta(null, 'info'),
    type: EGameEventType.ROUND_END,
  };
}

export function createGameEndEvent(
  finalScores: Record<string, number>,
): TGameEventDraft {
  return {
    ...eventMeta(null, 'info'),
    type: EGameEventType.GAME_END,
    finalScores,
  };
}
