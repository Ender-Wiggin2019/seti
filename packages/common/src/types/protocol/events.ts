import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import { EAlienType } from '@seti/common/types/protocol/enums';
import type { IErrorPayload } from '@seti/common/types/protocol/errors';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import type { IPlayerInputModel } from '@seti/common/types/protocol/playerInput';

export enum EGameEventType {
  ACTION = 'ACTION',
  FREE_ACTION = 'FREE_ACTION',
  INPUT = 'INPUT',
  UNDO = 'UNDO',
  RESOURCE_CHANGE = 'RESOURCE_CHANGE',
  SCORE_CHANGE = 'SCORE_CHANGE',
  SECTOR_COMPLETED = 'SECTOR_COMPLETED',
  TRACE_MARKED = 'TRACE_MARKED',
  ALIEN_DISCOVERED = 'ALIEN_DISCOVERED',
  ROTATION = 'ROTATION',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',
}

export type TGameEventLevel = 'debug' | 'info';

export type TGameEvent =
  | {
      id?: string;
      type: EGameEventType.ACTION;
      playerId: string;
      /** Main-action requests use `IMainActionRequest`; the engine may log string keys (e.g. `CARD_CUSTOM_EFFECT_UNHANDLED`). */
      action: IMainActionRequest | string;
      details?: Record<string, unknown>;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.FREE_ACTION;
      playerId: string;
      action: IFreeActionRequest;
      details?: Record<string, unknown>;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.INPUT;
      playerId: string;
      response: IInputResponse;
      details?: Record<string, unknown>;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.UNDO;
      playerId: string;
      turnIndex: number;
      affectedPlayerIds: string[];
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.RESOURCE_CHANGE;
      playerId: string;
      resource: string;
      delta: number;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.SCORE_CHANGE;
      playerId: string;
      delta: number;
      source: string;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.SECTOR_COMPLETED;
      sectorId: string;
      winnerId: string;
      details?: Record<string, unknown>;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.TRACE_MARKED;
      playerId: string;
      traceColor: string;
      alienIndex: number;
      isOverflow: boolean;
      details?: Record<string, unknown>;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.ALIEN_DISCOVERED;
      alienType: EAlienType;
      alienIndex?: number;
      details?: Record<string, unknown>;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.ROTATION;
      discIndex: number;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.ROUND_END;
      round: number;
      level?: TGameEventLevel;
      at?: number;
    }
  | {
      id?: string;
      type: EGameEventType.GAME_END;
      finalScores: Record<string, number>;
      level?: TGameEventLevel;
      at?: number;
    };

export interface IGameWsEventPayloadMap {
  'game:state': { gameState: IPublicGameState };
  'game:waiting': { playerId: string; input: IPlayerInputModel };
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
