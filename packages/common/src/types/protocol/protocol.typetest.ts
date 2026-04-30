import { EResource, ESector } from '@seti/common/types/element';
import {
  EGameEventType,
  EMainAction,
  EPhase,
  EPlayerInputType,
  type IGameWsEventPayloadMap,
  type IInputResponse,
  type IMainActionRequest,
  type IPublicGameState,
  type ISelectSectorInputModel,
  type TGameEvent,
} from '@seti/common/types/protocol';

const mockMainActionRequest: IMainActionRequest = {
  type: EMainAction.SCAN,
  payload: { source: 'typetest' },
};

const mockInputModel: ISelectSectorInputModel = {
  inputId: 'input-1',
  type: EPlayerInputType.SECTOR,
  options: [ESector.BLUE],
};

const mockInputResponse: IInputResponse = {
  type: EPlayerInputType.RESOURCE,
  resource: EResource.CREDIT,
};

const mockEvent: TGameEvent = {
  type: EGameEventType.ACTION,
  playerId: 'player-1',
  action: mockMainActionRequest,
};

const wsPayload: IGameWsEventPayloadMap['game:event'] = {
  event: mockEvent,
};

const _mockGameState: Partial<IPublicGameState> = {
  gameId: 'game-1',
  phase: EPhase.AWAIT_MAIN_ACTION,
};

void mockInputModel;
void mockInputResponse;
void wsPayload;
