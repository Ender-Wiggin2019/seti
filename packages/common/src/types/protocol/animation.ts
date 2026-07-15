import type { EResource } from '@seti/common/types/element';
import type { ETrace } from '@seti/common/types/protocol/enums';

export enum EAnimationStepKind {
  PROBE_MOVE = 'PROBE_MOVE',
  DISC_ROTATE = 'DISC_ROTATE',
  RESOURCE_DELTA = 'RESOURCE_DELTA',
  SCORE_DELTA = 'SCORE_DELTA',
  TRACE_PLACE = 'TRACE_PLACE',
  GENERIC = 'GENERIC',
}

interface IAnimationStepBase {
  kind: EAnimationStepKind;
  sourceEventId: string;
  durationMs: number;
}

export interface IProbeMoveStep extends IAnimationStepBase {
  kind: EAnimationStepKind.PROBE_MOVE;
  actorId: string;
  probeId: string;
  path: string[];
}

export interface IDiscRotateStep extends IAnimationStepBase {
  kind: EAnimationStepKind.DISC_ROTATE;
  ring: 1 | 2 | 3;
  steps: number;
}

export interface IResourceDeltaStep extends IAnimationStepBase {
  kind: EAnimationStepKind.RESOURCE_DELTA;
  actorId: string;
  resource: EResource;
  before: number;
  after: number;
}

export interface IScoreDeltaStep extends IAnimationStepBase {
  kind: EAnimationStepKind.SCORE_DELTA;
  actorId: string;
  before: number;
  after: number;
  source: string;
}

export interface ITracePlaceStep extends IAnimationStepBase {
  kind: EAnimationStepKind.TRACE_PLACE;
  actorId: string;
  traceColor: ETrace;
  alienIndex: number;
  isOverflow: boolean;
}

export interface IGenericStep extends IAnimationStepBase {
  kind: EAnimationStepKind.GENERIC;
}

export type TAnimationStep =
  | IProbeMoveStep
  | IDiscRotateStep
  | IResourceDeltaStep
  | IScoreDeltaStep
  | ITracePlaceStep
  | IGenericStep;

export interface IAnimationBatch {
  batchId: string;
  actorId: string;
  turnIndex: number;
  steps: TAnimationStep[];
  finalStateVersion: number;
}
