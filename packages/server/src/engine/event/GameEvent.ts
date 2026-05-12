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

let eventSequence = 0;

export function createEventId(at: number = Date.now()): string {
  eventSequence += 1;
  if (eventSequence > Number.MAX_SAFE_INTEGER - 1) {
    eventSequence = 1;
  }
  return `${at.toString(36)}-${eventSequence.toString(36)}`;
}

function eventTime(): number {
  return Date.now();
}

function eventMeta(level: TGameEventLevel): {
  id: string;
  level: TGameEventLevel;
  at: number;
} {
  const at = eventTime();
  return { id: createEventId(at), level, at };
}

export function createActionEvent(
  playerId: string,
  action: IMainActionRequest | string,
  details?: Record<string, unknown>,
  level: TGameEventLevel = 'info',
): TGameEvent {
  return {
    ...eventMeta(level),
    type: EGameEventType.ACTION,
    playerId,
    action,
    details,
  };
}

export function createFreeActionEvent(
  playerId: string,
  action: IFreeActionRequest,
  details?: Record<string, unknown>,
  level: TGameEventLevel = 'info',
): TGameEvent {
  return {
    ...eventMeta(level),
    type: EGameEventType.FREE_ACTION,
    playerId,
    action,
    details,
  };
}

export function createInputEvent(
  playerId: string,
  response: IInputResponse,
  details?: Record<string, unknown>,
): TGameEvent {
  return {
    ...eventMeta('debug'),
    type: EGameEventType.INPUT,
    playerId,
    response,
    details,
  };
}

export function createUndoEvent(
  playerId: string,
  turnIndex: number,
  affectedPlayerIds: string[] = [],
): TGameEvent {
  return {
    ...eventMeta('info'),
    type: EGameEventType.UNDO,
    playerId,
    turnIndex,
    affectedPlayerIds,
  };
}

export function createTraceMarkedEvent(
  playerId: string,
  traceColor: ETrace,
  alienIndex: number,
  isOverflow: boolean,
): TGameEvent {
  return {
    ...eventMeta('debug'),
    type: EGameEventType.TRACE_MARKED,
    playerId,
    traceColor,
    alienIndex,
    isOverflow,
  };
}

export function createAlienDiscoveredEvent(
  alienType: EAlienType,
  alienIndex: number,
): TGameEvent {
  return {
    ...eventMeta('info'),
    type: EGameEventType.ALIEN_DISCOVERED,
    alienType,
    alienIndex,
  };
}

export function createRoundEndEvent(round: number): TGameEvent {
  return {
    ...eventMeta('info'),
    type: EGameEventType.ROUND_END,
    round,
  };
}

export function createGameEndEvent(
  finalScores: Record<string, number>,
): TGameEvent {
  return {
    ...eventMeta('info'),
    type: EGameEventType.GAME_END,
    finalScores,
  };
}
