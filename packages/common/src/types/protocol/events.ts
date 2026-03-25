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
}

export interface IGameWsClientEmitPayloadMap {
  'game:action': { gameId: string; action: IMainActionRequest };
  'game:freeAction': { gameId: string; action: IFreeActionRequest };
  'game:input': { gameId: string; inputResponse: IInputResponse };
}

export type TGameWsServerEventName = keyof IGameWsEventPayloadMap;
export type TGameWsClientEventName = keyof IGameWsClientEmitPayloadMap;
