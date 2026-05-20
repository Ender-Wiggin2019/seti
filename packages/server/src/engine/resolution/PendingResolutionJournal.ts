import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';

export type TPendingResolutionStep =
  | {
      type: 'MAIN_ACTION';
      playerId: string;
      action: IMainActionRequest;
    }
  | {
      type: 'FREE_ACTION';
      playerId: string;
      action: IFreeActionRequest;
    }
  | {
      type: 'INPUT_RESPONSE';
      playerId: string;
      response: IInputResponse;
    };

export interface IPendingResolutionJournal<TState = unknown> {
  version: 1;
  baseState: TState;
  steps: TPendingResolutionStep[];
}
