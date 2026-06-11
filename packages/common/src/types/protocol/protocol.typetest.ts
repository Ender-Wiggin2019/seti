import { EResource, ESector } from '@seti/common/types/element';
import {
  EAnimationStepKind,
  EGameEventType,
  EMainAction,
  EPhase,
  EPlayerInputType,
  ETrace,
  type IAnimationBatch,
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
  id: 'event-1',
  seq: 1,
  turnIndex: 1,
  round: 1,
  actorId: 'player-1',
  level: 'info',
  type: EGameEventType.ACTION,
  action: mockMainActionRequest,
};

const mockProbeMovedEvent: TGameEvent = {
  id: 'event-2',
  seq: 2,
  turnIndex: 1,
  round: 1,
  actorId: 'player-1',
  level: 'info',
  type: EGameEventType.PROBE_MOVED,
  probeId: 'probe-1',
  path: ['ring-1-cell-0', 'ring-1-cell-1'],
  publicityGained: 1,
};

const mockTraceMarkedEvent: TGameEvent = {
  id: 'event-3',
  seq: 3,
  turnIndex: 1,
  round: 1,
  actorId: 'player-1',
  level: 'debug',
  type: EGameEventType.TRACE_MARKED,
  traceColor: ETrace.BLUE,
  alienIndex: 0,
  isOverflow: false,
};

const mockAnimationBatch: IAnimationBatch = {
  batchId: 'batch-1',
  actorId: 'player-1',
  turnIndex: 1,
  finalStateVersion: 2,
  steps: [
    {
      kind: EAnimationStepKind.PROBE_MOVE,
      sourceEventId: 'event-2',
      durationMs: 900,
      actorId: 'player-1',
      probeId: 'probe-1',
      path: ['ring-1-cell-0', 'ring-1-cell-1'],
    },
  ],
};

const wsPayload: IGameWsEventPayloadMap['game:event'] = {
  event: mockEvent,
};

const animationPayload: IGameWsEventPayloadMap['game:animation'] = {
  batch: mockAnimationBatch,
};

const _mockGameState: Partial<IPublicGameState> = {
  gameId: 'game-1',
  version: 1,
  phase: EPhase.AWAIT_MAIN_ACTION,
};

void mockInputModel;
void mockInputResponse;
void wsPayload;
void animationPayload;
void mockProbeMovedEvent;
void mockTraceMarkedEvent;
