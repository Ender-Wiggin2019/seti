import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import type { EResource } from '@seti/common/types/element';
import type { IAnimationBatch } from '@seti/common/types/protocol/animation';
import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import type { IErrorPayload } from '@seti/common/types/protocol/errors';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';

export enum EGameEventType {
  ACTION = 'ACTION',
  FREE_ACTION = 'FREE_ACTION',
  INPUT = 'INPUT',
  UNDO = 'UNDO',
  RESOURCE_CHANGED = 'RESOURCE_CHANGED',
  SCORE_CHANGED = 'SCORE_CHANGED',
  SECTOR_COMPLETED = 'SECTOR_COMPLETED',
  TRACE_MARKED = 'TRACE_MARKED',
  ALIEN_DISCOVERED = 'ALIEN_DISCOVERED',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',
  PROBE_MOVED = 'PROBE_MOVED',
  DISC_ROTATED = 'DISC_ROTATED',
}

export type TGameEventLevel = 'debug' | 'info';

export interface IGameEventBase {
  id: string;
  seq: number;
  turnIndex: number;
  round: number;
  actorId: string | null;
  level: TGameEventLevel;
}

export type TGameEvent =
  | (IGameEventBase & {
      type: EGameEventType.ACTION;
      /** Main-action requests use `IMainActionRequest`; the engine may log string keys (e.g. `CARD_CUSTOM_EFFECT_UNHANDLED`). */
      action: IMainActionRequest | string;
      details?: Record<string, unknown>;
    })
  | (IGameEventBase & {
      type: EGameEventType.FREE_ACTION;
      action: IFreeActionRequest;
      details?: Record<string, unknown>;
    })
  | (IGameEventBase & {
      type: EGameEventType.INPUT;
      response: IInputResponse;
      details?: Record<string, unknown>;
    })
  | (IGameEventBase & {
      type: EGameEventType.UNDO;
      affectedPlayerIds: string[];
    })
  | (IGameEventBase & {
      type: EGameEventType.RESOURCE_CHANGED;
      actorId: string;
      resource: EResource;
      before: number;
      after: number;
    })
  | (IGameEventBase & {
      type: EGameEventType.SCORE_CHANGED;
      actorId: string;
      before: number;
      after: number;
      source: string;
    })
  | (IGameEventBase & {
      type: EGameEventType.SECTOR_COMPLETED;
      sectorId: string;
      winnerId: string;
      details?: Record<string, unknown>;
    })
  | (IGameEventBase & {
      type: EGameEventType.TRACE_MARKED;
      actorId: string;
      traceColor: ETrace;
      alienIndex: number;
      isOverflow: boolean;
      details?: Record<string, unknown>;
    })
  | (IGameEventBase & {
      type: EGameEventType.ALIEN_DISCOVERED;
      alienType: EAlienType;
      alienIndex?: number;
      details?: Record<string, unknown>;
    })
  | (IGameEventBase & {
      type: EGameEventType.ROUND_END;
    })
  | (IGameEventBase & {
      type: EGameEventType.GAME_END;
      finalScores: Record<string, number>;
    })
  | (IGameEventBase & {
      type: EGameEventType.PROBE_MOVED;
      actorId: string;
      probeId: string;
      path: string[];
      publicityGained?: number;
    })
  | (IGameEventBase & {
      type: EGameEventType.DISC_ROTATED;
      ring: 1 | 2 | 3;
      steps: number;
    });

export interface IGameWsEventPayloadMap {
  'game:state': { gameState: IPublicGameState };
  'game:waiting': { playerId: string; input: IPlayerInputModel };
  'game:animation': { batch: IAnimationBatch };
  'game:event': { event: TGameEvent };
  'game:error': IErrorPayload;
  /**
   * Fan-out broadcast sent to every player in a game after an undo
   * completes successfully. Client uses it to drop any pending input
   * UI and, for `affectedPlayerIds`, display a popup ("an opponent
   * undid their turn").
   */
  'game:undoApplied': {
    undoneByPlayerId: string;
    turnIndex: number;
    affectedPlayerIds: string[];
  };
}

export interface IRoomWsEventPayloadMap {
  'room:playerJoined': { playerId: string; playerName: string };
  'room:playerLeft': { playerId: string };
}

export interface IGameWsClientEmitPayloadMap {
  'room:join': { gameId: string };
  'room:leave': { gameId: string };
  'game:action': { gameId: string; action: IMainActionRequest };
  'game:endTurn': { gameId: string };
  'game:freeAction': { gameId: string; action: IFreeActionRequest };
  'game:input': { gameId: string; inputResponse: IInputResponse };
  /**
   * Request to roll the game state back to the start of the current
   * turn. Server validates that the requester is the active player,
   * the turn is not locked, and an in-memory checkpoint exists.
   */
  'game:undo': { gameId: string };
}

export type TGameWsServerEventName =
  | keyof IGameWsEventPayloadMap
  | keyof IRoomWsEventPayloadMap;
export type TGameWsClientEventName = keyof IGameWsClientEmitPayloadMap;
