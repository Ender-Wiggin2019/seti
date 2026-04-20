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
  RESOURCE_CHANGE = 'RESOURCE_CHANGE',
  SCORE_CHANGE = 'SCORE_CHANGE',
  SECTOR_COMPLETED = 'SECTOR_COMPLETED',
  ALIEN_DISCOVERED = 'ALIEN_DISCOVERED',
  ROTATION = 'ROTATION',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',
}

export type TGameEvent =
  | {
      type: EGameEventType.ACTION;
      playerId: string;
      action: IMainActionRequest;
    }
  | {
      type: EGameEventType.FREE_ACTION;
      playerId: string;
      action: IFreeActionRequest;
    }
  | {
      type: EGameEventType.INPUT;
      playerId: string;
      response: IInputResponse;
    }
  | {
      type: EGameEventType.RESOURCE_CHANGE;
      playerId: string;
      resource: string;
      delta: number;
    }
  | {
      type: EGameEventType.SCORE_CHANGE;
      playerId: string;
      delta: number;
      source: string;
    }
  | {
      type: EGameEventType.SECTOR_COMPLETED;
      sectorId: string;
      winnerId: string;
    }
  | {
      type: EGameEventType.ALIEN_DISCOVERED;
      alienType: EAlienType;
    }
  | {
      type: EGameEventType.ROTATION;
      discIndex: number;
    }
  | {
      type: EGameEventType.ROUND_END;
      round: number;
    }
  | {
      type: EGameEventType.GAME_END;
      finalScores: Record<string, number>;
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
