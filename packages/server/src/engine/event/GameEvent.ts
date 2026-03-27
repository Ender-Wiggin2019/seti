import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';

export type TGameEvent =
  | {
      type: 'ACTION';
      playerId: string;
      action: string;
      details?: Record<string, unknown>;
      at: number;
    }
  | {
      type: 'RESOURCE_CHANGE';
      playerId: string;
      resource: string;
      delta: number;
      at: number;
    }
  | {
      type: 'SCORE_CHANGE';
      playerId: string;
      delta: number;
      source: string;
      at: number;
    }
  | {
      type: 'SECTOR_COMPLETED';
      sectorId: string;
      winnerId: string;
      at: number;
    }
  | {
      type: 'TRACE_MARKED';
      playerId: string;
      traceColor: ETrace;
      alienIndex: number;
      isOverflow: boolean;
      at: number;
    }
  | {
      type: 'ALIEN_DISCOVERED';
      alienType: EAlienType;
      alienIndex: number;
      at: number;
    }
  | {
      type: 'ROTATION';
      discIndex: number;
      at: number;
    }
  | {
      type: 'ROUND_END';
      round: number;
      at: number;
    }
  | {
      type: 'GAME_END';
      finalScores: Record<string, number>;
      at: number;
    };

export function createActionEvent(
  playerId: string,
  action: string,
  details?: Record<string, unknown>,
): TGameEvent {
  return { type: 'ACTION', playerId, action, details, at: Date.now() };
}

export function createTraceMarkedEvent(
  playerId: string,
  traceColor: ETrace,
  alienIndex: number,
  isOverflow: boolean,
): TGameEvent {
  return {
    type: 'TRACE_MARKED',
    playerId,
    traceColor,
    alienIndex,
    isOverflow,
    at: Date.now(),
  };
}

export function createAlienDiscoveredEvent(
  alienType: EAlienType,
  alienIndex: number,
): TGameEvent {
  return {
    type: 'ALIEN_DISCOVERED',
    alienType,
    alienIndex,
    at: Date.now(),
  };
}

export function createRoundEndEvent(round: number): TGameEvent {
  return { type: 'ROUND_END', round, at: Date.now() };
}

export function createGameEndEvent(
  finalScores: Record<string, number>,
): TGameEvent {
  return { type: 'GAME_END', finalScores, at: Date.now() };
}
